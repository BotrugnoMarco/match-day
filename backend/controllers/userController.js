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
        const [users] = await db.query('SELECT id, username, avatar_url, skill_rating, role FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
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

        // MVP Count (based on tags containing 'MVP')
        const [mvpResult] = await db.query(
            `SELECT COUNT(*) as count FROM votes 
             WHERE target_id = ? AND tags LIKE '%MVP%'`,
            [userId]
        );
        const mvpCount = mvpResult[0].count;

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
            mvpCount,
            recentRatings
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
};
