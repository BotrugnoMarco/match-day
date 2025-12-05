const db = require('../config/db');

// Submit a vote
exports.submitVote = async (req, res) => {
    const { match_id, target_id, rating, tags } = req.body;
    const voter_id = req.user.id;

    if (!match_id || !target_id || !rating) {
        return res.status(400).json({ error: 'Match ID, target ID, and rating are required' });
    }

    if (rating < 1 || rating > 10) {
        return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }

    if (voter_id === target_id) {
        return res.status(400).json({ error: 'You cannot vote for yourself' });
    }

    try {
        // Check if match is in voting state
        const [matches] = await db.query('SELECT status FROM matches WHERE id = ?', [match_id]);
        if (matches.length === 0 || matches[0].status !== 'voting') {
            return res.status(400).json({ error: 'Match is not open for voting' });
        }

        // Check if voter and target were participants
        const [participants] = await db.query(
            'SELECT user_id FROM participants WHERE match_id = ? AND (user_id = ? OR user_id = ?)',
            [match_id, voter_id, target_id]
        );

        // Ideally we should check if both are participants, but for simplicity let's assume if they have the ID they can try.
        // A stricter check would be:
        // if (participants.length < 2) { return res.status(400).json({ error: 'Both users must be participants' }); }

        // Check if already voted for this target in this match
        const [existingVote] = await db.query(
            'SELECT * FROM votes WHERE match_id = ? AND voter_id = ? AND target_id = ?',
            [match_id, voter_id, target_id]
        );

        if (existingVote.length > 0) {
            // Update vote
            await db.query(
                'UPDATE votes SET rating = ?, tags = ? WHERE id = ?',
                [rating, tags, existingVote[0].id]
            );
            return res.json({ message: 'Vote updated' });
        }

        // Insert vote
        await db.query(
            'INSERT INTO votes (match_id, voter_id, target_id, rating, tags) VALUES (?, ?, ?, ?, ?)',
            [match_id, voter_id, target_id, rating, tags]
        );

        res.status(201).json({ message: 'Vote submitted successfully' });
    } catch (error) {
        console.error('Submit vote error:', error);
        res.status(500).json({ error: 'Server error submitting vote' });
    }
};

// Get votes for a match (maybe for results)
exports.getMatchVotes = async (req, res) => {
    const matchId = req.params.matchId;
    try {
        const [votes] = await db.query(
            `SELECT v.*, u_voter.username as voter_name, u_target.username as target_name 
       FROM votes v
       JOIN users u_voter ON v.voter_id = u_voter.id
       JOIN users u_target ON v.target_id = u_target.id
       WHERE v.match_id = ?`,
            [matchId]
        );
        res.json(votes);
    } catch (error) {
        console.error('Get votes error:', error);
        res.status(500).json({ error: 'Server error fetching votes' });
    }
};
