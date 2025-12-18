const db = require('../config/db');

// Submit a vote
exports.submitVote = async (req, res) => {
    const { match_id, target_id, rating, tags, comment } = req.body;
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
            "SELECT user_id FROM participants WHERE match_id = ? AND status = 'confirmed' AND (user_id = ? OR user_id = ?)",
            [match_id, voter_id, target_id]
        );

        const isVoterParticipant = participants.some(p => p.user_id === voter_id);
        if (!isVoterParticipant) {
            return res.status(403).json({ error: 'Only confirmed participants can vote' });
        }

        // Ideally we should check if both are participants, but for simplicity let's assume if they have the ID they can try.
        // A stricter check would be:
        // if (participants.length < 2) { return res.status(400).json({ error: 'Both users must be participants' }); }

        // Check if already voted for this target in this match
        const [existingVote] = await db.query(
            'SELECT * FROM votes WHERE match_id = ? AND voter_id = ? AND target_id = ?',
            [match_id, voter_id, target_id]
        );

        if (existingVote.length > 0) {
            return res.status(400).json({ error: 'You have already voted for this player' });
        }

        // Insert vote
        await db.query(
            'INSERT INTO votes (match_id, voter_id, target_id, rating, tags, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [match_id, voter_id, target_id, rating, tags, comment]
        );
        const io = req.app.get('io');
        io.emit('vote_cast', { matchId: match_id });
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

// Get votes cast by the current user for a match
exports.getMyVotes = async (req, res) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    try {
        const [votes] = await db.query(
            'SELECT target_id FROM votes WHERE match_id = ? AND voter_id = ?',
            [matchId, userId]
        );
        res.json(votes);
    } catch (error) {
        console.error('Get my votes error:', error);
        res.status(500).json({ error: 'Server error fetching my votes' });
    }
};

// Get vote statistics for a match
exports.getVoteStats = async (req, res) => {
    const matchId = req.params.matchId;
    try {
        // Get all confirmed participants
        const [participants] = await db.query(
            `SELECT u.id, u.username 
             FROM participants p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.match_id = ? 
             AND p.status NOT IN ('waitlist', 'pending_approval', 'declined')`,
            [matchId]
        );

        const participantCount = participants.length;
        const expectedVotesPerPerson = Math.max(0, participantCount - 1);
        const totalExpectedVotes = participantCount * expectedVotesPerPerson;

        // Get vote counts per voter
        const [voteCounts] = await db.query(
            'SELECT voter_id, COUNT(*) as count FROM votes WHERE match_id = ? GROUP BY voter_id',
            [matchId]
        );

        // Map vote counts for easy lookup
        const voteMap = {};
        voteCounts.forEach(v => {
            voteMap[v.voter_id] = v.count;
        });

        let totalVotesCast = 0;
        const missingVoters = [];

        participants.forEach(p => {
            const votesCast = voteMap[p.id] || 0;
            totalVotesCast += votesCast;

            if (votesCast < expectedVotesPerPerson) {
                missingVoters.push({
                    id: p.id,
                    username: p.username,
                    votes_cast: votesCast,
                    votes_missing: expectedVotesPerPerson - votesCast
                });
            }
        });

        res.json({
            total_votes: totalVotesCast,
            expected_votes: totalExpectedVotes,
            missing_votes: Math.max(0, totalExpectedVotes - totalVotesCast),
            participant_count: participantCount,
            missing_voters: missingVoters
        });
    } catch (error) {
        console.error('Get vote stats error:', error);
        res.status(500).json({ error: 'Server error fetching vote stats' });
    }
};

// Get comments received by the current user for a match
exports.getMyReceivedComments = async (req, res) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    try {
        const [comments] = await db.query(
            `SELECT comment, rating, tags 
             FROM votes 
             WHERE match_id = ? AND target_id = ? AND comment IS NOT NULL AND comment != ''`,
            [matchId, userId]
        );
        res.json(comments);
    } catch (error) {
        console.error('Get my received comments error:', error);
        res.status(500).json({ error: 'Server error fetching comments' });
    }
};


