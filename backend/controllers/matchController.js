const db = require('../config/db');
const notificationController = require('./notificationController');

// Create a new match
exports.createMatch = async (req, res) => {
    const { date_time, location, sport_type, price_total, max_players } = req.body;
    const creator_id = req.user.id;

    if (!date_time || !sport_type) {
        return res.status(400).json({ error: 'Date and sport type are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO matches (date_time, location, sport_type, price_total, max_players, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
            [date_time, location, sport_type, price_total, max_players || 10, creator_id]
        );

        // Emit socket event
        const io = req.app.get('io');
        io.emit('match_created', {
            id: result.insertId,
            date_time,
            location,
            sport_type,
            price_total,
            max_players: max_players || 10,
            status: 'open',
            creator_id
        });

        res.status(201).json({ message: 'Match created successfully', matchId: result.insertId });
    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({ error: 'Server error creating match' });
    }
};

// Get all matches
exports.getAllMatches = async (req, res) => {
    try {
        const [matches] = await db.query('SELECT * FROM matches ORDER BY date_time DESC');
        res.json(matches);
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Server error fetching matches' });
    }
};

// Get match by ID with participants
exports.getMatchById = async (req, res) => {
    const matchId = req.params.id;
    try {
        const [matches] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const [participants] = await db.query(
            `SELECT p.*, u.username, u.avatar_url, u.skill_rating 
       FROM participants p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.match_id = ?`,
            [matchId]
        );

        const match = matches[0];
        match.participants = participants;

        res.json(match);
    } catch (error) {
        console.error('Get match error:', error);
        res.status(500).json({ error: 'Server error fetching match details' });
    }
};

// Join a match
exports.joinMatch = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id; // From authMiddleware
    const { team, status } = req.body; // Optional: team preference, status (maybe/confirmed)

    try {
        // Check if match exists and is open
        const [matches] = await db.query('SELECT status, max_players FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        if (matches[0].status !== 'open') {
            return res.status(400).json({ error: 'Match is not open for registration' });
        }

        const maxPlayers = matches[0].max_players || 10;

        // Check if user is already a participant
        const [existing] = await db.query(
            'SELECT * FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );

        let newStatus = status || 'confirmed';

        // Check for waitlist if confirming
        if (newStatus === 'confirmed') {
            const [counts] = await db.query(
                "SELECT COUNT(*) as count FROM participants WHERE match_id = ? AND status = 'confirmed'",
                [matchId]
            );
            if (counts[0].count >= maxPlayers) {
                // If user is already confirmed, keep them confirmed
                // If user is not confirmed (new or was maybe/waitlist), put them in waitlist
                if (!existing.length || existing[0].status !== 'confirmed') {
                    newStatus = 'waitlist';
                }
            }
        }

        if (existing.length > 0) {
            // Update existing participation
            await db.query(
                'UPDATE participants SET status = ?, team = ? WHERE id = ?',
                [newStatus, team || null, existing[0].id]
            );

            const io = req.app.get('io');
            io.emit('match_updated', { matchId });

            return res.json({ message: newStatus === 'waitlist' ? 'Added to waitlist' : 'Participation updated', status: newStatus });
        }

        // Insert new participant
        await db.query(
            'INSERT INTO participants (match_id, user_id, team, status) VALUES (?, ?, ?, ?)',
            [matchId, userId, team || null, newStatus]
        );

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.status(201).json({ message: newStatus === 'waitlist' ? 'Added to waitlist' : 'Joined match successfully', status: newStatus });
    } catch (error) {
        console.error('Join match error:', error);
        res.status(500).json({ error: 'Server error joining match' });
    }
};

// Leave a match
exports.leaveMatch = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if match exists and is open
        const [matches] = await db.query('SELECT status FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        if (matches[0].status !== 'open') {
            return res.status(400).json({ error: 'Cannot leave a match that is not open' });
        }

        // Remove participant
        const [result] = await db.query(
            'DELETE FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'You are not a participant of this match' });
        }

        // Check if there is someone in the waitlist to promote
        const [waitlist] = await db.query(
            "SELECT * FROM participants WHERE match_id = ? AND status = 'waitlist' ORDER BY id ASC LIMIT 1",
            [matchId]
        );

        if (waitlist.length > 0) {
            // Promote first person in waitlist
            await db.query(
                "UPDATE participants SET status = 'confirmed' WHERE id = ?",
                [waitlist[0].id]
            );
            
            // Notify promoted user
            await notificationController.createNotification(
                waitlist[0].user_id, 
                'A spot opened up! You have been promoted from waitlist to confirmed.', 
                'success', 
                matchId
            );
        }

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.json({ message: 'Left match successfully' });
    } catch (error) {
        console.error('Leave match error:', error);
        res.status(500).json({ error: 'Server error leaving match' });
    }
};

// Update match status (Admin/Creator only - simplified to just authenticated for now)
exports.updateMatchStatus = async (req, res) => {
    const matchId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['open', 'locked', 'finished', 'voting'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Check if user is creator
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Allow if user is creator OR if creator_id is null (legacy matches) allow anyone or maybe restrict to admin? 
        // For now, let's enforce creator check only if creator_id exists.
        if (matches[0].creator_id && matches[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Only the match creator can update status' });
        }

        await db.query('UPDATE matches SET status = ? WHERE id = ?', [status, matchId]);

        const io = req.app.get('io');
        io.emit('match_updated', { matchId, status });

        // Notify participants about status change
        if (status === 'voting' || status === 'finished') {
            const [participants] = await db.query(
                'SELECT user_id FROM participants WHERE match_id = ?',
                [matchId]
            );

            const message = status === 'voting'
                ? 'Voting has started for your match!'
                : 'Match finished! Check out the results.';

            for (const p of participants) {
                await notificationController.createNotification(p.user_id, message, 'info', matchId);
            }
        }

        // If match is finished, update skill ratings
        if (status === 'finished') {
            // Find all users who received votes in this match
            const [votedUsers] = await db.query(
                'SELECT DISTINCT target_id FROM votes WHERE match_id = ?',
                [matchId]
            );

            for (const user of votedUsers) {
                const userId = user.target_id;
                // Calculate average rating for this user across ALL matches
                const [avgResult] = await db.query(
                    'SELECT AVG(rating) as avgRating FROM votes WHERE target_id = ?',
                    [userId]
                );

                if (avgResult.length > 0 && avgResult[0].avgRating) {
                    const newRating = parseFloat(avgResult[0].avgRating).toFixed(2);
                    await db.query(
                        'UPDATE users SET skill_rating = ? WHERE id = ?',
                        [newRating, userId]
                    );
                }
            }
        }

        res.json({ message: 'Match status updated' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

// Get matches for the current user
exports.getUserMatches = async (req, res) => {
    const userId = req.user.id;
    try {
        const [matches] = await db.query(
            `SELECT m.*, p.status as participation_status 
             FROM matches m 
             JOIN participants p ON m.id = p.match_id 
             WHERE p.user_id = ? 
             ORDER BY m.date_time DESC`,
            [userId]
        );
        res.json(matches);
    } catch (error) {
        console.error('Get user matches error:', error);
        res.status(500).json({ error: 'Server error fetching user matches' });
    }
};

// Generate balanced teams
exports.generateTeams = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if user is creator
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        if (matches[0].creator_id && matches[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Only the match creator can generate teams' });
        }

        // Get confirmed participants with skill rating
        const [participants] = await db.query(
            `SELECT p.id, p.user_id, u.skill_rating 
             FROM participants p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.match_id = ? AND p.status = 'confirmed'`,
            [matchId]
        );

        if (participants.length < 2) {
            return res.status(400).json({ error: 'Not enough participants to generate teams' });
        }

        // Sort by skill rating descending
        participants.sort((a, b) => b.skill_rating - a.skill_rating);

        const teamA = [];
        const teamB = [];
        let skillA = 0;
        let skillB = 0;

        // Greedy distribution to balance teams
        for (const p of participants) {
            if (skillA <= skillB) {
                teamA.push(p);
                skillA += parseFloat(p.skill_rating || 6.0); // Default 6.0 if null
            } else {
                teamB.push(p);
                skillB += parseFloat(p.skill_rating || 6.0);
            }
        }

        // Update database
        for (const p of teamA) {
            await db.query('UPDATE participants SET team = ? WHERE id = ?', ['Team A', p.id]);
        }
        for (const p of teamB) {
            await db.query('UPDATE participants SET team = ? WHERE id = ?', ['Team B', p.id]);
        }

        // Notify participants
        for (const p of participants) {
            await notificationController.createNotification(p.user_id, 'Teams have been generated for your match!', 'info', matchId);
        }

        res.json({
            message: 'Teams generated successfully',
            stats: {
                teamA_count: teamA.length,
                teamA_skill: skillA,
                teamB_count: teamB.length,
                teamB_skill: skillB
            }
        });
    } catch (error) {
        console.error('Generate teams error:', error);
        res.status(500).json({ error: 'Server error generating teams' });
    }
};
