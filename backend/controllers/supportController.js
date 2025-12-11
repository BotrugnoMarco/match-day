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

exports.getAllTickets = async (req, res) => {
    // Check if user is admin (assuming middleware sets req.user.role or similar, 
    // but for now we'll just check if the user exists and maybe rely on a separate admin middleware later.
    // Ideally, this route should be protected by an admin check middleware.)

    try {
        const [tickets] = await db.query(`
            SELECT t.*, u.username, u.email 
            FROM support_tickets t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        `);
        res.json(tickets);
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ error: 'Server error fetching tickets' });
    }
};

exports.replyToTicket = async (req, res) => {
    const { ticketId } = req.params;
    const { response, status } = req.body;

    if (!response) {
        return res.status(400).json({ error: 'Response message is required' });
    }

    try {
        await db.query(
            'UPDATE support_tickets SET admin_response = ?, status = ? WHERE id = ?',
            [response, status || 'closed', ticketId]
        );
        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Reply ticket error:', error);
        res.status(500).json({ error: 'Server error updating ticket' });
    }
};
