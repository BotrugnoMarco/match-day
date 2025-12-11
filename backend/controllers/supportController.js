const db = require('../config/db');

exports.createTicket = async (req, res) => {
    const { subject, message, category } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO support_tickets (user_id, subject, message, category) VALUES (?, ?, ?, ?)',
            [userId, subject, message, category || 'other']
        );

        res.status(201).json({ message: 'Ticket created successfully', ticketId: result.insertId });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Server error creating ticket' });
    }
};

exports.getUserTickets = async (req, res) => {
    const userId = req.user.id;
    try {
        const [tickets] = await db.query(
            'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(tickets);
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ error: 'Server error fetching tickets' });
    }
};
