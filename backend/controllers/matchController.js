const db = require('../config/db');
const notificationController = require('./notificationController');

// Create a new match
exports.createMatch = async (req, res) => {
    const { date_time, location, sport_type, price_total, max_players, is_covered, has_showers, is_private, access_code, duration } = req.body;
    const creator_id = req.user.id;

    if (!date_time || !sport_type) {
        return res.status(400).json({ error: 'Date and sport type are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO matches (date_time, location, sport_type, price_total, max_players, is_covered, has_showers, is_private, access_code, duration, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [date_time, location, sport_type, price_total, max_players || 10, is_covered || false, has_showers || false, is_private || false, access_code || null, duration || 60, creator_id]
        );

        // Automatically add creator as participant and admin
        await db.query(
            'INSERT INTO participants (match_id, user_id, status, is_admin) VALUES (?, ?, ?, ?)',
            [result.insertId, creator_id, 'confirmed', true]
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
            is_covered: is_covered || false,
            has_showers: has_showers || false,
            is_private: is_private || false,
            duration: duration || 60,
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
        const [matches] = await db.query(`
            SELECT m.*, u.username as creator_username, u.avatar_url as creator_avatar,
            (SELECT COUNT(*) FROM participants p WHERE p.match_id = m.id AND p.status = 'confirmed') as participants_count
            FROM matches m 
            JOIN users u ON m.creator_id = u.id 
            WHERE m.status != 'finished'
            ORDER BY m.date_time ASC
        `);
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
        const [matches] = await db.query(`
            SELECT m.*, u.username as creator_username, u.avatar_url as creator_avatar 
            FROM matches m 
            JOIN users u ON m.creator_id = u.id 
            WHERE m.id = ?
        `, [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const match = matches[0];

        // Check friendship if user is logged in
        if (req.user) {
            const userId = req.user.id;
            if (userId !== match.creator_id) {
                const [friendship] = await db.query(
                    'SELECT * FROM friendships WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = "accepted"',
                    [userId, match.creator_id, match.creator_id, userId]
                );
                match.is_friend = friendship.length > 0;
            }
        }

        const [participants] = await db.query(
            `SELECT p.*, u.username, u.avatar_url, u.status as user_status, u.birth_date, u.preferred_number, COALESCE(us.rating, 6.0) as skill_rating 
       FROM participants p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN user_skills us ON u.id = us.user_id AND us.sport_type = ?
       WHERE p.match_id = ?`,
            [match.sport_type, matchId]
        );

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
    const { team, status, access_code } = req.body; // Optional: team preference, status (maybe/confirmed), access_code

    try {
        // Check if match exists and is open
        const [matches] = await db.query('SELECT status, max_players, is_private, access_code, creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const match = matches[0];

        if (match.status !== 'open') {
            return res.status(400).json({ error: 'Match is not open for registration' });
        }

        let newStatus = status || 'confirmed';

        // Private match logic
        if (match.is_private && userId !== match.creator_id) {
            // Check if friend
            const [friendship] = await db.query(
                'SELECT * FROM friendships WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = "accepted"',
                [userId, match.creator_id, match.creator_id, userId]
            );
            const isFriend = friendship.length > 0;

            // Check access code
            const isCodeCorrect = access_code && access_code === match.access_code;

            // If code is provided, it MUST be correct
            if (access_code && !isCodeCorrect) {
                return res.status(403).json({ error: 'Invalid access code' });
            }

            if (!isFriend && !isCodeCorrect) {
                // Requesting to join
                newStatus = 'pending_approval';
            }
        } const maxPlayers = match.max_players || 10;

        // Check if user is already a participant
        const [existing] = await db.query(
            'SELECT * FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );

        // Check for waitlist if confirming (and not pending approval)
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
            // Don't downgrade status if already confirmed
            if (existing[0].status === 'confirmed' && newStatus === 'pending_approval') {
                newStatus = 'confirmed';
            }

            // Update existing participation
            await db.query(
                'UPDATE participants SET status = ?, team = ? WHERE id = ?',
                [newStatus, team || null, existing[0].id]
            );

            const io = req.app.get('io');
            io.emit('match_updated', { matchId });

            return res.json({ message: newStatus === 'waitlist' ? 'Added to waitlist' : (newStatus === 'pending_approval' ? 'Request sent' : 'Participation updated'), status: newStatus });
        }

        // Insert new participant
        let assignedTeam = team || null;

        // If joining as confirmed, check if teams are already generated and assign to the smaller team
        if (newStatus === 'confirmed' && !assignedTeam) {
            const [teamParticipants] = await db.query(
                "SELECT team FROM participants WHERE match_id = ? AND status = 'confirmed' AND team IS NOT NULL",
                [matchId]
            );

            if (teamParticipants.length > 0) {
                const countA = teamParticipants.filter(p => p.team === 'A').length;
                const countB = teamParticipants.filter(p => p.team === 'B').length;

                if (countA < countB) {
                    assignedTeam = 'A';
                } else if (countB < countA) {
                    assignedTeam = 'B';
                }
            }
        }

        await db.query(
            'INSERT INTO participants (match_id, user_id, team, status) VALUES (?, ?, ?, ?)',
            [matchId, userId, assignedTeam, newStatus]
        );

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.status(201).json({ message: newStatus === 'waitlist' ? 'Added to waitlist' : (newStatus === 'pending_approval' ? 'Request sent' : 'Joined match successfully'), status: newStatus });
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
            let assignedTeam = null;

            // Check if teams are generated to assign the promoted user
            const [teamParticipants] = await db.query(
                "SELECT team FROM participants WHERE match_id = ? AND status = 'confirmed' AND team IS NOT NULL",
                [matchId]
            );

            if (teamParticipants.length > 0) {
                const countA = teamParticipants.filter(p => p.team === 'A').length;
                const countB = teamParticipants.filter(p => p.team === 'B').length;

                if (countA < countB) {
                    assignedTeam = 'A';
                } else if (countB < countA) {
                    assignedTeam = 'B';
                }
            }

            // Promote first person in waitlist
            await db.query(
                "UPDATE participants SET status = 'confirmed', team = ? WHERE id = ?",
                [assignedTeam, waitlist[0].id]
            );

            // Notify promoted user
            await notificationController.createNotification(
                waitlist[0].user_id,
                JSON.stringify({ key: 'notifications.waitlist_promoted' }),
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
    const { status, winner } = req.body;
    const userId = req.user.id;

    if (!['open', 'locked', 'finished', 'voting'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Check if user is creator or admin
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === userId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only match admins can update status' });
        }

        if (winner) {
            await db.query('UPDATE matches SET status = ?, winner = ? WHERE id = ?', [status, winner, matchId]);
        } else {
            await db.query('UPDATE matches SET status = ? WHERE id = ?', [status, matchId]);
        }

        const io = req.app.get('io');
        io.emit('match_updated', { matchId, status, winner });

        // Notify participants about status change
        if (status === 'voting' || status === 'finished') {
            const [participants] = await db.query(
                'SELECT user_id FROM participants WHERE match_id = ?',
                [matchId]
            );

            const message = status === 'voting'
                ? JSON.stringify({ key: 'notifications.voting_started' })
                : JSON.stringify({ key: 'notifications.match_finished' });

            for (const p of participants) {
                await notificationController.createNotification(p.user_id, message, 'info', matchId);
            }
        }

        // If match is finished, update skill ratings
        if (status === 'finished') {
            const [matchInfo] = await db.query('SELECT sport_type FROM matches WHERE id = ?', [matchId]);
            const sportType = matchInfo[0].sport_type;

            // Find all users who received votes in this match
            const [votedUsers] = await db.query(
                'SELECT DISTINCT target_id FROM votes WHERE match_id = ?',
                [matchId]
            );

            for (const user of votedUsers) {
                const userId = user.target_id;
                // Calculate average rating for this user across ALL matches of this sport
                const [avgResult] = await db.query(
                    `SELECT AVG(v.rating) as avgRating 
                     FROM votes v 
                     JOIN matches m ON v.match_id = m.id 
                     WHERE v.target_id = ? AND m.sport_type = ?`,
                    [userId, sportType]
                );

                if (avgResult.length > 0 && avgResult[0].avgRating) {
                    const newRating = parseFloat(avgResult[0].avgRating).toFixed(2);
                    await db.query(
                        `INSERT INTO user_skills (user_id, sport_type, rating) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE rating = ?`,
                        [userId, sportType, newRating, newRating]
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
            `SELECT m.*, p.status as participation_status, u.username as creator_username, u.avatar_url as creator_avatar,
             (SELECT COUNT(*) FROM participants p2 WHERE p2.match_id = m.id AND p2.status = 'confirmed') as participants_count
             FROM matches m 
             JOIN participants p ON m.id = p.match_id 
             JOIN users u ON m.creator_id = u.id
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

// Get matches created by friends
exports.getFriendsMatches = async (req, res) => {
    const userId = req.user.id;
    try {
        const [matches] = await db.query(
            `SELECT m.*, u.username as creator_username, u.avatar_url as creator_avatar,
             (SELECT COUNT(*) FROM participants p WHERE p.match_id = m.id AND p.status = 'confirmed') as participants_count
             FROM matches m 
             JOIN users u ON m.creator_id = u.id 
             JOIN friendships f ON (f.requester_id = u.id AND f.addressee_id = ?) OR (f.addressee_id = u.id AND f.requester_id = ?)
             WHERE f.status = 'accepted' AND m.status != 'finished'
             ORDER BY m.date_time ASC`,
            [userId, userId]
        );
        res.json(matches);
    } catch (error) {
        console.error('Get friends matches error:', error);
        res.status(500).json({ error: 'Server error fetching friends matches' });
    }
};

// Generate balanced teams
exports.generateTeams = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if user is creator or admin
        const [matches] = await db.query('SELECT creator_id, sport_type FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === userId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only match admins can generate teams' });
        }

        // Get confirmed participants with skill rating
        const [participants] = await db.query(
            `SELECT p.id, p.user_id, COALESCE(us.rating, 6.0) as skill_rating 
             FROM participants p 
             JOIN users u ON p.user_id = u.id 
             LEFT JOIN user_skills us ON u.id = us.user_id AND us.sport_type = ?
             WHERE p.match_id = ? AND p.status = 'confirmed'`,
            [matches[0].sport_type, matchId]
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
            await db.query('UPDATE participants SET team = ? WHERE id = ?', ['A', p.id]);
        }
        for (const p of teamB) {
            await db.query('UPDATE participants SET team = ? WHERE id = ?', ['B', p.id]);
        }

        // Notify participants
        for (const p of participants) {
            await notificationController.createNotification(p.user_id, JSON.stringify({ key: 'notifications.teams_generated' }), 'info', matchId);
        }

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

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

// Move player to a specific team
exports.movePlayer = async (req, res) => {
    const matchId = req.params.id;
    const { userId, team } = req.body; // team should be 'A' or 'B'
    const adminId = req.user.id;

    try {
        // Check if match exists and user is creator or admin
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, adminId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === adminId);

        if (!isAdmin) return res.status(403).json({ error: 'Only admins can move players' });

        if (!['A', 'B'].includes(team)) {
            return res.status(400).json({ error: 'Invalid team. Must be A or B' });
        }

        // Update participant team
        await db.query('UPDATE participants SET team = ? WHERE match_id = ? AND user_id = ?', [team, matchId, userId]);

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.json({ message: 'Player moved successfully' });
    } catch (error) {
        console.error('Move player error:', error);
        res.status(500).json({ error: 'Server error moving player' });
    }
};

// Update post-match availability
exports.updatePostMatchStatus = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;
    const { post_match } = req.body;

    try {
        // Check if user is a participant
        const [participant] = await db.query(
            'SELECT id FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );

        if (participant.length === 0) {
            return res.status(403).json({ error: 'You are not a participant of this match' });
        }

        await db.query(
            'UPDATE participants SET post_match = ? WHERE id = ?',
            [post_match, participant[0].id]
        );

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.json({ message: 'Post-match status updated' });
    } catch (error) {
        console.error('Update post-match status error:', error);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

// Invite a user to a match
exports.inviteUser = async (req, res) => {
    const matchId = req.params.id;
    const { userId } = req.body; // The ID of the user to invite
    const inviterId = req.user.id;

    try {
        // Check if match exists
        const [matches] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const match = matches[0];

        // Check if user exists
        const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const invitedUser = users[0];

        // Get inviter username
        const [inviters] = await db.query('SELECT username FROM users WHERE id = ?', [inviterId]);
        const inviterName = inviters[0].username;

        // Create notification
        const message = JSON.stringify({
            key: 'notifications.match_invite',
            params: {
                inviter: inviterName,
                date: new Date(match.date_time).toISOString()
            }
        });
        const io = req.app.get('io');
        await notificationController.createNotification(userId, message, 'invite', matchId, io);

        res.json({ message: `Invitation sent to ${invitedUser.username}` });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Server error sending invitation' });
    }
};

// Toggle payment status
exports.togglePaymentStatus = async (req, res) => {
    const matchId = req.params.id;
    const { userId } = req.body; // The participant ID to toggle
    const requesterId = req.user.id;

    try {
        // Check if requester is the creator or admin
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, requesterId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === requesterId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only match admins can update payment status' });
        }

        // Get current status
        const [participant] = await db.query(
            'SELECT id, has_paid FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );

        if (participant.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const newStatus = !participant[0].has_paid;

        await db.query(
            'UPDATE participants SET has_paid = ? WHERE id = ?',
            [newStatus, participant[0].id]
        );

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.json({ message: 'Payment status updated', has_paid: newStatus });
    } catch (error) {
        console.error('Toggle payment status error:', error);
        res.status(500).json({ error: 'Server error updating payment status' });
    }
};

// Approve join request
exports.approveJoinRequest = async (req, res) => {
    const matchId = req.params.id;
    const { userId } = req.body; // User to approve
    const adminId = req.user.id;

    try {
        // Check if match exists and user is creator or admin
        const [matches] = await db.query('SELECT creator_id, max_players FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, adminId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === adminId);

        if (!isAdmin) return res.status(403).json({ error: 'Only admins can approve requests' });

        const maxPlayers = matches[0].max_players;

        // Check participant status
        const [participant] = await db.query('SELECT * FROM participants WHERE match_id = ? AND user_id = ?', [matchId, userId]);
        if (participant.length === 0) return res.status(404).json({ error: 'Request not found' });
        if (participant[0].status !== 'pending_approval') return res.status(400).json({ error: 'User is not pending approval' });

        // Check capacity
        const [counts] = await db.query("SELECT COUNT(*) as count FROM participants WHERE match_id = ? AND status = 'confirmed'", [matchId]);
        let newStatus = 'confirmed';
        if (counts[0].count >= maxPlayers) {
            newStatus = 'waitlist';
        }

        let assignedTeam = participant[0].team;

        if (newStatus === 'confirmed') {
            const [teamParticipants] = await db.query(
                "SELECT team FROM participants WHERE match_id = ? AND status = 'confirmed' AND team IS NOT NULL",
                [matchId]
            );

            if (teamParticipants.length > 0) {
                const countA = teamParticipants.filter(p => p.team === 'A').length;
                const countB = teamParticipants.filter(p => p.team === 'B').length;

                if (countA < countB) {
                    assignedTeam = 'A';
                } else if (countB < countA) {
                    assignedTeam = 'B';
                }
            }
        }

        await db.query('UPDATE participants SET status = ?, team = ? WHERE id = ?', [newStatus, assignedTeam, participant[0].id]);

        // Notify user
        const io = req.app.get('io');
        await notificationController.createNotification(userId, JSON.stringify({ key: 'notifications.join_approved', params: { matchId } }), 'success', matchId, io);
        io.emit('match_updated', { matchId });

        res.json({ message: 'Request approved', status: newStatus });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ error: 'Server error approving request' });
    }
};

// Reject join request
exports.rejectJoinRequest = async (req, res) => {
    const matchId = req.params.id;
    const { userId } = req.body;
    const adminId = req.user.id;

    try {
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, adminId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === adminId);

        if (!isAdmin) return res.status(403).json({ error: 'Only admins can reject requests' });

        // Delete participation
        await db.query('DELETE FROM participants WHERE match_id = ? AND user_id = ? AND status = "pending_approval"', [matchId, userId]);

        // Notify user
        const io = req.app.get('io');
        await notificationController.createNotification(userId, JSON.stringify({ key: 'notifications.join_declined', params: { matchId } }), 'error', matchId, io);
        io.emit('match_updated', { matchId });

        res.json({ message: 'Request rejected' });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Server error rejecting request' });
    }
};

// Delete a match
exports.deleteMatch = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if match exists and user is creator
        const [matches] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        if (matches[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Only the creator can delete the match' });
        }

        // Get participants to notify
        const [participants] = await db.query('SELECT user_id FROM participants WHERE match_id = ? AND user_id != ?', [matchId, userId]);

        // Delete match (cascade will delete participants, votes, etc. if configured, otherwise we might need to delete manually. 
        // init.sql says ON DELETE CASCADE for participants, votes, notifications(related_match_id set null))
        // Wait, notifications related_match_id is SET NULL. So notifications stay but link is gone.
        // We want to send NEW notifications about deletion.

        const io = req.app.get('io');

        // Notify participants
        for (const p of participants) {
            await notificationController.createNotification(
                p.user_id,
                JSON.stringify({
                    key: 'notifications.match_cancelled',
                    params: {
                        matchId,
                        sportType: matches[0].sport_type,
                        date: new Date(matches[0].date_time).toISOString()
                    }
                }),
                'warning',
                null,
                io
            );
        }

        await db.query('DELETE FROM matches WHERE id = ?', [matchId]);

        io.emit('match_deleted', { matchId });

        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Delete match error:', error);
        res.status(500).json({ error: 'Server error deleting match' });
    }
};

// Update match details
exports.updateMatch = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;
    const { date_time, location, sport_type, price_total, max_players, is_covered, has_showers, is_private, access_code, duration } = req.body;

    try {
        // Check if match exists and user is creator or admin
        const [matches] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, userId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === userId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only match admins can edit the match' });
        }

        // Update match
        await db.query(
            'UPDATE matches SET date_time = ?, location = ?, sport_type = ?, price_total = ?, max_players = ?, is_covered = ?, has_showers = ?, is_private = ?, access_code = ?, duration = ? WHERE id = ?',
            [date_time, location, sport_type, price_total, max_players, is_covered, has_showers, is_private, access_code, duration || 60, matchId]
        );

        // Get participants to notify
        const [participants] = await db.query('SELECT user_id FROM participants WHERE match_id = ? AND user_id != ?', [matchId, userId]);

        const io = req.app.get('io');

        // Notify participants
        for (const p of participants) {
            await notificationController.createNotification(
                p.user_id,
                JSON.stringify({ key: 'notifications.match_updated', params: { matchId } }),
                'info',
                matchId,
                io
            );
        }

        io.emit('match_updated', { matchId });

        res.json({ message: 'Match updated successfully' });
    } catch (error) {
        console.error('Update match error:', error);
        res.status(500).json({ error: 'Server error updating match' });
    }
};

// Update player positions (formation)
exports.updatePlayerPositions = async (req, res) => {
    const matchId = req.params.id;
    const { positions } = req.body; // Array of { userId, x, y }
    const adminId = req.user.id;

    try {
        // Check if match exists and user is creator or admin
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, adminId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (matches[0].creator_id === adminId);

        if (!isAdmin) return res.status(403).json({ error: 'Only admins can update formation' });

        // Update positions
        for (const pos of positions) {
            await db.query(
                'UPDATE participants SET x_pos = ?, y_pos = ? WHERE match_id = ? AND user_id = ?',
                [pos.x, pos.y, matchId, pos.userId]
            );
        }

        const io = req.app.get('io');
        io.emit('match_updated', { matchId });

        res.json({ message: 'Formation updated successfully' });
    } catch (error) {
        console.error('Update formation error:', error);
        res.status(500).json({ error: 'Server error updating formation' });
    }
};

exports.setCaptain = async (req, res) => {
    const matchId = req.params.id;
    const { userId, team } = req.body; // userId of the new captain, team 'A' or 'B'
    const requesterId = req.user.id;

    try {
        // Check if user is creator or admin
        const [match] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (match.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [adminCheck] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, requesterId]
        );
        const isAdmin = (adminCheck.length > 0 && adminCheck[0].is_admin) || (match[0].creator_id === requesterId);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only match admins can set captains' });
        }

        // Reset captain for this team in this match
        if (team) {
            await db.query('UPDATE participants SET is_captain = FALSE WHERE match_id = ? AND team = ?', [matchId, team]);
        } else {
            await db.query('UPDATE participants SET is_captain = FALSE WHERE match_id = ? AND team IS NULL', [matchId]);
        }

        // Set new captain if userId is provided (if null, just clears captain)
        if (userId) {
            await db.query('UPDATE participants SET is_captain = TRUE WHERE match_id = ? AND user_id = ?', [matchId, userId]);
        }

        res.json({ message: 'Captain updated' });
    } catch (error) {
        console.error('Set captain error:', error);
        res.status(500).json({ error: 'Server error setting captain' });
    }
};

exports.toggleMatchAdmin = async (req, res) => {
    const matchId = req.params.id;
    const { targetUserId } = req.body;
    const requesterId = req.user.id;

    try {
        // Check if requester is admin
        const [match] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);
        if (match.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [requester] = await db.query(
            'SELECT is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, requesterId]
        );

        const isRequesterAdmin = (requester.length > 0 && requester[0].is_admin) || (match[0].creator_id === requesterId);

        if (!isRequesterAdmin) {
            return res.status(403).json({ error: 'Only admins can manage admin roles' });
        }

        // Check if target user is a participant
        const [target] = await db.query(
            'SELECT id, is_admin FROM participants WHERE match_id = ? AND user_id = ?',
            [matchId, targetUserId]
        );

        if (target.length === 0) {
            return res.status(404).json({ error: 'User is not a participant' });
        }

        // Prevent removing admin status from the creator
        if (targetUserId === match[0].creator_id) {
            return res.status(403).json({ error: 'Cannot remove admin status from the match creator' });
        }

        const newAdminStatus = !target[0].is_admin;

        await db.query(
            'UPDATE participants SET is_admin = ? WHERE id = ?',
            [newAdminStatus, target[0].id]
        );

        res.json({ message: 'Admin status updated', is_admin: newAdminStatus });

    } catch (error) {
        console.error('Toggle admin error:', error);
        res.status(500).json({ error: 'Server error toggling admin status' });
    }
};
