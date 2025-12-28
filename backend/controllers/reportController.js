const db = require('../config/db');

exports.createReport = async (req, res) => {
    const { reported_user_id, match_id, reason, description } = req.body;
    const reporter_id = req.user.id;

    if (!reported_user_id || !reason) {
        return res.status(400).json({ error: 'Reported user and reason are required' });
    }

    if (parseInt(reported_user_id) === parseInt(reporter_id)) {
        return res.status(400).json({ error: 'You cannot report yourself' });
    }

    try {
        await db.query(
            'INSERT INTO reports (reporter_id, reported_user_id, match_id, reason, description) VALUES (?, ?, ?, ?, ?)',
            [reporter_id, reported_user_id, match_id || null, reason, description || '']
        );

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Server error creating report' });
    }
};
