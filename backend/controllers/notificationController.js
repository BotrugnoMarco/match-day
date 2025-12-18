const db = require('../config/db');
const { admin, initialized: firebaseInitialized } = require('../config/firebase');

// Register FCM Token
exports.registerToken = async (req, res) => {
    const userId = req.user.id;
    const { token, device_type } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // Insert or Update (on duplicate key)
        await db.query(
            `INSERT INTO user_fcm_tokens (user_id, token, device_type) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
            [userId, token, device_type || 'web']
        );
        res.json({ message: 'Token registered successfully' });
    } catch (error) {
        console.error('Register token error:', error);
        res.status(500).json({ error: 'Server error registering token' });
    }
};

// Get notifications for the current user
exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Server error updating notification' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.id;

    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Server error updating notifications' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found or not authorized' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        await db.query(
            'DELETE FROM notifications WHERE user_id = ?',
            [userId]
        );
        res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ error: 'Server error deleting notifications' });
    }
};

// Helper function to create a notification (internal use)
exports.createNotification = async (userId, message, type = 'info', relatedMatchId = null, io = null) => {
    try {
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, message, type, related_match_id) VALUES (?, ?, ?, ?)',
            [userId, message, type, relatedMatchId]
        );

        // 1. Send via Socket.io (In-App Realtime)
        if (io) {
            io.to(`user_${userId}`).emit('notification', {
                id: result.insertId,
                user_id: userId,
                message,
                type,
                related_match_id: relatedMatchId,
                is_read: 0,
                created_at: new Date()
            });
        }

        // 2. Send via Firebase Cloud Messaging (Push Notification)
        if (firebaseInitialized) {
            const [tokens] = await db.query('SELECT token FROM user_fcm_tokens WHERE user_id = ?', [userId]);

            if (tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.token);

                // Tenta di parsare il messaggio se è un JSON (per le traduzioni)
                let bodyText = message;
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.key) {
                        // Fallback semplice in italiano se il messaggio è una chiave di traduzione
                        // In un sistema ideale, dovremmo sapere la lingua dell'utente
                        if (parsed.key === 'notifications.match_invite') {
                            const dateObj = new Date(parsed.params.date);
                            // Formato numerico neutro: DD/MM HH:mm (es. 12/12 14:30)
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const hours = String(dateObj.getHours()).padStart(2, '0');
                            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                            const dateStr = !isNaN(dateObj) ? `${day}/${month} ${hours}:${minutes}` : parsed.params.date;

                            bodyText = `${parsed.params.inviter} ti ha invitato a una partita il ${dateStr}`;
                        } else if (parsed.key === 'notifications.friend_request' || parsed.key === 'notifications.friend_request_new') {
                            bodyText = `Hai ricevuto una nuova richiesta di amicizia`;
                        } else if (parsed.key === 'notifications.friend_accepted' || parsed.key === 'notifications.friend_request_accepted') {
                            bodyText = `La tua richiesta di amicizia è stata accettata`;
                        } else if (parsed.key === 'notifications.match_joined') {
                            bodyText = `${parsed.params.username} si è unito alla partita`;
                        } else if (parsed.key === 'notifications.match_left') {
                            bodyText = `${parsed.params.username} ha lasciato la partita`;
                        } else if (parsed.key === 'notifications.waitlist_promoted') {
                            bodyText = `Sei stato promosso dalla lista d'attesa!`;
                        } else if (parsed.key === 'notifications.voting_started') {
                            bodyText = `Le votazioni per la partita sono aperte`;
                        } else if (parsed.key === 'notifications.match_finished') {
                            bodyText = `La partita è terminata`;
                        } else if (parsed.key === 'notifications.teams_generated') {
                            bodyText = `Le squadre sono state generate`;
                        } else if (parsed.key === 'notifications.join_approved') {
                            bodyText = `La tua richiesta di partecipazione è stata approvata`;
                        } else if (parsed.key === 'notifications.join_declined') {
                            bodyText = `La tua richiesta di partecipazione è stata rifiutata`;
                        } else if (parsed.key === 'notifications.match_cancelled') {
                            bodyText = `La partita è stata cancellata`;
                        } else if (parsed.key === 'notifications.match_updated') {
                            bodyText = `La partita è stata aggiornata`;
                        } else {
                            bodyText = "Hai una nuova notifica su MatchDay!";
                        }
                    }
                } catch (e) {
                    // Se non è JSON, usa il messaggio così com'è
                    bodyText = message;
                }

                const payload = {
                    notification: {
                        title: 'MatchDay',
                        body: bodyText,
                    },
                    data: {
                        type: type,
                        related_match_id: relatedMatchId ? relatedMatchId.toString() : '',
                        url: relatedMatchId ? `/matches/${relatedMatchId}` : '/notifications'
                    }
                };

                // Send to all user's devices
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: fcmTokens,
                    notification: payload.notification,
                    data: payload.data
                });

                // Optional: Cleanup invalid tokens
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(fcmTokens[idx]);
                        }
                    });
                    if (failedTokens.length > 0) {
                        // Remove invalid tokens from DB
                        await db.query('DELETE FROM user_fcm_tokens WHERE token IN (?)', [failedTokens]);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Create notification error:', error);
    }
};
