const db = require('../config/db');
const filter = require('leo-profanity');

exports.getMatchMessages = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if user is participant or admin
        // Allow reading chat if user is part of the match or admin
        // Or maybe just if they can view the match details? 
        // Usually chat is private to participants.

        const [participants] = await db.query(
            "SELECT status FROM participants WHERE match_id = ? AND user_id = ?",
            [matchId, userId]
        );

        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);

        const isParticipant = participants.length > 0 && participants[0].status !== 'declined';
        const isCreator = matches.length > 0 && matches[0].creator_id === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isParticipant && !isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [messages] = await db.query(
            `SELECT m.*, u.username, u.avatar_url 
             FROM match_chat_messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.match_id = ? 
             ORDER BY m.created_at ASC`,
            [matchId]
        );

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
};

exports.postMessage = async (req, res) => {
    const matchId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
        return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
    }

    // Filter profanity
    const cleanedMessage = filter.clean(message);

    try {
        // Check permissions (must be participant/creator/admin)
        const [participants] = await db.query(
            "SELECT status FROM participants WHERE match_id = ? AND user_id = ?",
            [matchId, userId]
        );
        const [matches] = await db.query('SELECT creator_id FROM matches WHERE id = ?', [matchId]);

        const isParticipant = participants.length > 0 && participants[0].status !== 'declined';
        const isCreator = matches.length > 0 && matches[0].creator_id === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isParticipant && !isCreator && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [result] = await db.query(
            'INSERT INTO match_chat_messages (match_id, user_id, message) VALUES (?, ?, ?)',
            [matchId, userId, cleanedMessage]
        );

        const newMessageId = result.insertId;

        // Fetch the full message with user details to emit
        const [newMessages] = await db.query(
            `SELECT m.*, u.username, u.avatar_url 
             FROM match_chat_messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.id = ?`,
            [newMessageId]
        );

        const messageData = newMessages[0];

        const io = req.app.get('io');
        io.to(`match_${matchId}`).emit('chat_message', messageData);

        res.status(201).json(messageData);
    } catch (error) {
        console.error('Post message error:', error);
        res.status(500).json({ error: 'Server error posting message' });
    }
};
