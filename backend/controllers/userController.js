const db = require('../config/db');
const filter = require('leo-profanity');

exports.getSupporters = async (req, res) => {
    try {
        const [supporters] = await db.query('SELECT id, username, avatar_url FROM users WHERE is_supporter = TRUE ORDER BY username ASC');
        res.json(supporters);
    } catch (error) {
        console.error('Get supporters error:', error);
        res.status(500).json({ error: 'Server error fetching supporters' });
    }
};

exports.uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    // Construct the URL. Assuming server runs on localhost:3000 or configured domain
    // For now, we'll store the relative path or full URL. 
    // Let's store the relative path and handle the base URL in frontend or return full URL here.
    // Better to return the path that can be appended to base URL.
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    try {
        await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);

        // Return the new user object or just the url
        res.json({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Server error uploading avatar' });
    }
};

exports.getProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.query('SELECT id, username, email, birth_date, gender, avatar_url, role, status, preferred_number, preferred_foot, preferred_hand, is_supporter, zen_mode FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [skills] = await db.query('SELECT sport_type, rating, role FROM user_skills WHERE user_id = ?', [userId]);

        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const completeSkills = sports.map(sport => {
            const found = skills.find(s => s.sport_type === sport);
            return found ? found : { sport_type: sport, rating: 6.0, role: null };
        });

        const user = users[0];
        user.skills = completeSkills;

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, email, birth_date, gender, status, preferred_number, preferred_foot, preferred_hand, skills, zen_mode } = req.body;

    try {
        if (username && filter.check(username)) {
            return res.status(400).json({ error: 'Username contains inappropriate language' });
        }

        // Check if username or email already exists (if changed)
        if (username || email) {
            const [existing] = await db.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username, email, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username or email already taken' });
            }
        }

        // Update main user fields
        const updates = [];
        const values = [];

        if (username) { updates.push('username = ?'); values.push(username); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (birth_date) { updates.push('birth_date = ?'); values.push(birth_date); }
        if (gender) { updates.push('gender = ?'); values.push(gender); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (preferred_number !== undefined) { updates.push('preferred_number = ?'); values.push(preferred_number); }
        if (preferred_foot) { updates.push('preferred_foot = ?'); values.push(preferred_foot); }
        if (preferred_hand) { updates.push('preferred_hand = ?'); values.push(preferred_hand); }
        if (zen_mode !== undefined) { updates.push('zen_mode = ?'); values.push(zen_mode); }

        if (updates.length > 0) {
            values.push(userId);
            await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        // Update Skills (Roles)
        if (skills && Array.isArray(skills)) {
            for (const skill of skills) {
                if (skill.sport_type && skill.role) {
                    // Check if skill exists
                    const [existingSkill] = await db.query(
                        'SELECT id FROM user_skills WHERE user_id = ? AND sport_type = ?',
                        [userId, skill.sport_type]
                    );

                    if (existingSkill.length > 0) {
                        try {
                            await db.query(
                                'UPDATE user_skills SET role = ? WHERE id = ?',
                                [skill.role, existingSkill[0].id]
                            );
                        } catch (err) {
                            if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
                        }
                    } else {
                        try {
                            await db.query(
                                'INSERT INTO user_skills (user_id, sport_type, role) VALUES (?, ?, ?)',
                                [userId, skill.sport_type, skill.role]
                            );
                        } catch (err) {
                            if (err.code === 'ER_BAD_FIELD_ERROR') {
                                await db.query(
                                    'INSERT INTO user_skills (user_id, sport_type) VALUES (?, ?)',
                                    [userId, skill.sport_type]
                                );
                            } else {
                                throw err;
                            }
                        }
                    }
                }
            }
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};



exports.deleteAccount = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error deleting account' });
    }
};

exports.exportData = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. User Profile
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        // 2. Skills
        const [skills] = await db.query('SELECT * FROM user_skills WHERE user_id = ?', [userId]);

        // 3. Matches Participated
        const [matches] = await db.query(`
            SELECT m.*, p.team, p.status as participation_status 
            FROM matches m 
            JOIN participants p ON m.id = p.match_id 
            WHERE p.user_id = ?
        `, [userId]);

        // 4. Votes Received
        const [votesReceived] = await db.query('SELECT * FROM votes WHERE target_id = ?', [userId]);

        // 5. Votes Given
        const [votesGiven] = await db.query('SELECT * FROM votes WHERE voter_id = ?', [userId]);

        const exportData = {
            profile: user[0],
            skills: skills,
            matches: matches,
            votes_received: votesReceived,
            votes_given: votesGiven,
            exported_at: new Date()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=user_data_${userId}.json`);
        res.json(exportData);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ error: 'Server error exporting data' });
    }
};

exports.getUserStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Matches Played by Sport
        const [matchesResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
             GROUP BY m.sport_type`,
            [userId]
        );

        // Matches Won by Sport
        const [winsResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
               AND m.winner = p.team
             GROUP BY m.sport_type`,
            [userId]
        );

        // MVP Count by Sport
        const [mvpResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ? AND p.is_mvp = TRUE
             GROUP BY m.sport_type`,
            [userId]
        );

        // Goals and Assists by Sport
        const [statsResult] = await db.query(
            `SELECT m.sport_type, SUM(p.goals) as total_goals, SUM(p.assists) as total_assists 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ?
             GROUP BY m.sport_type`,
            [userId]
        );

        // Aggregate stats
        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const statsBySport = {};
        let totalMatches = 0;
        let totalWins = 0;
        let totalMvp = 0;
        let totalGoals = 0;
        let totalAssists = 0;

        sports.forEach(sport => {
            const matches = matchesResult.find(r => r.sport_type === sport)?.count || 0;
            const wins = winsResult.find(r => r.sport_type === sport)?.count || 0;
            const mvp = mvpResult.find(r => r.sport_type === sport)?.count || 0;
            const goals = parseInt(statsResult.find(r => r.sport_type === sport)?.total_goals || 0);
            const assists = parseInt(statsResult.find(r => r.sport_type === sport)?.total_assists || 0);

            statsBySport[sport] = {
                matchesPlayed: matches,
                matchesWon: wins,
                mvpCount: mvp,
                goals: goals,
                assists: assists
            };

            totalMatches += matches;
            totalWins += wins;
            totalMvp += mvp;
            totalGoals += goals;
            totalAssists += assists;
        });

        // Get all tags
        const [tagsResult] = await db.query(
            `SELECT tags FROM votes WHERE target_id = ? AND tags IS NOT NULL AND tags != ''`,
            [userId]
        );

        const tagCounts = {};
        tagsResult.forEach(row => {
            if (row.tags) {
                // Split by comma in case of multiple tags (legacy support)
                const tags = row.tags.split(',').map(t => t.trim()).filter(t => t);
                tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Convert to array for frontend
        const tagsList = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);

        // Recent Ratings
        const [recentRatings] = await db.query(
            `SELECT v.rating, m.date_time, m.sport_type 
             FROM votes v 
             JOIN matches m ON v.match_id = m.id 
             WHERE v.target_id = ? 
             ORDER BY m.date_time DESC 
             LIMIT 5`,
            [userId]
        );

        res.json({
            matchesPlayed: totalMatches,
            matchesWon: totalWins,
            mvpCount: totalMvp,
            totalGoals: totalGoals,
            totalAssists: totalAssists,
            statsBySport,
            tags: tagsList,
            recentRatings
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
};

exports.getMatchHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const [history] = await db.query(
            `SELECT 
                m.id, 
                m.date_time, 
                m.location, 
                m.sport_type,
                m.winner,
                p.team as user_team,
                AVG(v.rating) as avg_rating,
                COUNT(v.id) as vote_count,
                GROUP_CONCAT(v.tags) as tags
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             LEFT JOIN votes v ON m.id = v.match_id AND v.target_id = ?
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
             GROUP BY m.id
             ORDER BY m.date_time DESC`,
            [userId, userId]
        );

        // Clean up tags (remove nulls and duplicates if needed)
        const cleanedHistory = history.map(match => {
            let tagList = [];
            if (match.tags) {
                tagList = match.tags.split(',').filter(t => t && t.trim() !== '');
            }

            let result = 'draw';
            if (match.winner && match.user_team) {
                if (match.winner === 'Draw') {
                    result = 'draw';
                } else if (match.winner === match.user_team) {
                    result = 'win';
                } else {
                    result = 'lost';
                }
            }

            return {
                ...match,
                avg_rating: match.avg_rating ? parseFloat(match.avg_rating).toFixed(1) : null,
                tags: [...new Set(tagList)], // Unique tags
                result
            };
        });

        res.json(cleanedHistory);
    } catch (error) {
        console.error('Get match history error:', error);
        res.status(500).json({ error: 'Server error fetching match history' });
    }
};

exports.getUserProfileById = async (req, res) => {
    const userId = req.params.id;
    try {
        const [users] = await db.query('SELECT id, username, avatar_url, role, status, preferred_number, preferred_foot, preferred_hand, is_supporter, zen_mode FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [skills] = await db.query('SELECT sport_type, rating, role FROM user_skills WHERE user_id = ?', [userId]);

        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const completeSkills = sports.map(sport => {
            const found = skills.find(s => s.sport_type === sport);
            return found ? found : { sport_type: sport, rating: 6.0, role: null };
        });

        const user = users[0];
        user.skills = completeSkills;

        res.json(user);
    } catch (error) {
        console.error('Get profile by id error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

exports.getUserStatsById = async (req, res) => {
    const userId = req.params.id;
    try {
        // Matches Played by Sport
        const [matchesResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
             GROUP BY m.sport_type`,
            [userId]
        );

        // Matches Won by Sport
        const [winsResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
               AND m.winner = p.team
             GROUP BY m.sport_type`,
            [userId]
        );

        // MVP Count by Sport
        const [mvpResult] = await db.query(
            `SELECT m.sport_type, COUNT(*) as count 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ? AND p.is_mvp = TRUE
             GROUP BY m.sport_type`,
            [userId]
        );

        // Goals and Assists by Sport
        const [statsResult] = await db.query(
            `SELECT m.sport_type, SUM(p.goals) as total_goals, SUM(p.assists) as total_assists 
             FROM participants p
             JOIN matches m ON p.match_id = m.id
             WHERE p.user_id = ?
             GROUP BY m.sport_type`,
            [userId]
        );

        // Aggregate stats
        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const statsBySport = {};
        let totalMatches = 0;
        let totalWins = 0;
        let totalMvp = 0;
        let totalGoals = 0;
        let totalAssists = 0;

        sports.forEach(sport => {
            const matches = matchesResult.find(r => r.sport_type === sport)?.count || 0;
            const wins = winsResult.find(r => r.sport_type === sport)?.count || 0;
            const mvp = mvpResult.find(r => r.sport_type === sport)?.count || 0;
            const goals = parseInt(statsResult.find(r => r.sport_type === sport)?.total_goals || 0);
            const assists = parseInt(statsResult.find(r => r.sport_type === sport)?.total_assists || 0);

            statsBySport[sport] = {
                matchesPlayed: matches,
                matchesWon: wins,
                mvpCount: mvp,
                goals: goals,
                assists: assists
            };

            totalMatches += matches;
            totalWins += wins;
            totalMvp += mvp;
            totalGoals += goals;
            totalAssists += assists;
        });

        // Get all tags
        const [tagsResult] = await db.query(
            `SELECT tags FROM votes WHERE target_id = ? AND tags IS NOT NULL AND tags != ''`,
            [userId]
        );

        const tagCounts = {};
        tagsResult.forEach(row => {
            if (row.tags) {
                const tags = row.tags.split(',').map(t => t.trim()).filter(t => t);
                tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Convert to array for frontend
        const tagsList = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);

        // Recent Ratings
        const [recentRatings] = await db.query(
            `SELECT v.rating, m.date_time, m.sport_type 
             FROM votes v 
             JOIN matches m ON v.match_id = m.id 
             WHERE v.target_id = ? 
             ORDER BY m.date_time DESC 
             LIMIT 5`,
            [userId]
        );

        res.json({
            matchesPlayed: totalMatches,
            matchesWon: totalWins,
            mvpCount: totalMvp,
            totalGoals: totalGoals,
            totalAssists: totalAssists,
            statsBySport,
            tags: tagsList,
            recentRatings
        });
    } catch (error) {
        console.error('Get user stats by id error:', error);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
};

exports.getUserHistoryById = async (req, res) => {
    const userId = req.params.id;
    try {
        const [history] = await db.query(
            `SELECT 
                m.id, 
                m.date_time, 
                m.location, 
                m.sport_type,
                m.winner,
                p.team as user_team,
                AVG(v.rating) as avg_rating,
                COUNT(v.id) as vote_count,
                GROUP_CONCAT(v.tags) as tags
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             LEFT JOIN votes v ON m.id = v.match_id AND v.target_id = ?
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
             GROUP BY m.id
             ORDER BY m.date_time DESC`,
            [userId, userId]
        );

        // Clean up tags (remove nulls and duplicates if needed)
        const cleanedHistory = history.map(match => {
            let tagList = [];
            if (match.tags) {
                tagList = match.tags.split(',').filter(t => t && t.trim() !== '');
            }

            let result = 'draw';
            if (match.winner && match.user_team) {
                if (match.winner === 'Draw') {
                    result = 'draw';
                } else if (match.winner === match.user_team) {
                    result = 'win';
                } else {
                    result = 'lost';
                }
            }

            return {
                ...match,
                avg_rating: match.avg_rating ? parseFloat(match.avg_rating).toFixed(1) : null,
                tags: [...new Set(tagList)], // Unique tags
                result
            };
        });

        res.json(cleanedHistory);
    } catch (error) {
        console.error('Get match history by id error:', error);
        res.status(500).json({ error: 'Server error fetching match history' });
    }
};

exports.updateStatus = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.body;

    if (!['available', 'injured', 'unavailable'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        res.json({ message: 'Status updated successfully', status });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

exports.searchUsers = async (req, res) => {
    const query = req.query.q;
    const userId = req.user.id;

    if (!query) {
        return res.json([]);
    }

    try {
        const [users] = await db.query(
            `SELECT id, username, avatar_url, status, is_supporter, role 
             FROM users 
             WHERE username LIKE ? AND id != ?
             LIMIT 10`,
            [`%${query}%`, userId]
        );
        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Server error searching users' });
    }
};
