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

exports.getReports = async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT r.*, 
                   u1.username as reporter_name, u1.avatar_url as reporter_avatar,
                   u2.username as reported_name, u2.avatar_url as reported_avatar,
                   m.date_time as match_date, m.sport_type
            FROM reports r
            JOIN users u1 ON r.reporter_id = u1.id
            JOIN users u2 ON r.reported_user_id = u2.id
            LEFT JOIN matches m ON r.match_id = m.id
            ORDER BY r.created_at DESC
        `);
        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Server error fetching reports' });
    }
};

exports.updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Report status updated' });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ error: 'Server error updating report' });
    }
};
