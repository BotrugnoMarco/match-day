const db = require('../config/db');

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
        const [users] = await db.query('SELECT id, username, avatar_url, role, status, preferred_number FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [skills] = await db.query('SELECT sport_type, rating FROM user_skills WHERE user_id = ?', [userId]);

        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const completeSkills = sports.map(sport => {
            const found = skills.find(s => s.sport_type === sport);
            return found ? found : { sport_type: sport, rating: 6.0 };
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
    const { username, email, birth_date, gender, status, preferred_number } = req.body;

    try {
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

        // Build dynamic query
        let fields = [];
        let values = [];

        if (username) { fields.push('username = ?'); values.push(username); }
        if (email) { fields.push('email = ?'); values.push(email); }
        if (birth_date) { fields.push('birth_date = ?'); values.push(birth_date); }
        if (gender) { fields.push('gender = ?'); values.push(gender); }
        if (status) { fields.push('status = ?'); values.push(status); }
        if (preferred_number !== undefined) { fields.push('preferred_number = ?'); values.push(preferred_number); }

        if (fields.length === 0) {
            return res.json({ message: 'No changes to update' });
        }

        values.push(userId);

        await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

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
        // Matches Played
        const [matchesResult] = await db.query(
            `SELECT COUNT(*) as count FROM participants 
             WHERE user_id = ? AND status = 'confirmed'`,
            [userId]
        );
        const matchesPlayed = matchesResult[0].count;

        // Matches Won
        const [winsResult] = await db.query(
            `SELECT COUNT(*) as count 
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
               AND m.winner = p.team`,
            [userId]
        );
        const matchesWon = winsResult[0].count;

        // MVP Count (based on tags containing 'MVP')
        const [mvpResult] = await db.query(
            `SELECT COUNT(*) as count FROM votes 
             WHERE target_id = ? AND tags LIKE '%MVP%'`,
            [userId]
        );
        const mvpCount = mvpResult[0].count;

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
            matchesPlayed,
            matchesWon,
            mvpCount,
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
                    result = 'loss';
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
        const [users] = await db.query('SELECT id, username, avatar_url, role, status FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [skills] = await db.query('SELECT sport_type, rating FROM user_skills WHERE user_id = ?', [userId]);

        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const completeSkills = sports.map(sport => {
            const found = skills.find(s => s.sport_type === sport);
            return found ? found : { sport_type: sport, rating: 6.0 };
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
        // Matches Played
        const [matchesResult] = await db.query(
            `SELECT COUNT(*) as count FROM participants 
             WHERE user_id = ? AND status = 'confirmed'`,
            [userId]
        );
        const matchesPlayed = matchesResult[0].count;

        // Matches Won
        const [winsResult] = await db.query(
            `SELECT COUNT(*) as count 
             FROM matches m
             JOIN participants p ON m.id = p.match_id
             WHERE p.user_id = ? 
               AND p.status = 'confirmed'
               AND m.status = 'finished'
               AND m.winner = p.team`,
            [userId]
        );
        const matchesWon = winsResult[0].count;

        // MVP Count (based on tags containing 'MVP')
        const [mvpResult] = await db.query(
            `SELECT COUNT(*) as count FROM votes 
             WHERE target_id = ? AND tags LIKE '%MVP%'`,
            [userId]
        );
        const mvpCount = mvpResult[0].count;

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
            matchesPlayed,
            matchesWon,
            mvpCount,
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
                    result = 'loss';
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
            `SELECT id, username, avatar_url, status 
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
