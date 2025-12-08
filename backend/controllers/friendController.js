const db = require('../config/db');
const notificationController = require('./notificationController');

// Send a friend request
exports.sendRequest = async (req, res) => {
    const requester_id = req.user.id;
    const { addressee_id } = req.body;

    if (requester_id == addressee_id) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    try {
        // Check if request already exists
        const [existing] = await db.query(
            'SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
            [requester_id, addressee_id, addressee_id, requester_id]
        );

        if (existing.length > 0) {
            if (existing[0].status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            }
            if (existing[0].status === 'pending') {
                return res.status(400).json({ error: 'Friend request already pending' });
            }
            // If rejected, we might allow resending, but for now let's say "Request previously rejected" or just update it to pending
            // Let's update to pending if it was rejected
            await db.query(
                'UPDATE friendships SET status = ?, requester_id = ?, addressee_id = ? WHERE id = ?',
                ['pending', requester_id, addressee_id, existing[0].id]
            );
            const io = req.app.get('io');
            await notificationController.createNotification(addressee_id, 'You have a new friend request!', 'info', null, io);
            return res.json({ message: 'Friend request sent' });
        }

        await db.query(
            'INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, ?)',
            [requester_id, addressee_id, 'pending']
        );

        const io = req.app.get('io');
        await notificationController.createNotification(addressee_id, 'You have a new friend request!', 'info', null, io);

        res.status(201).json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Server error sending request' });
    }
};

// Accept friend request
exports.acceptRequest = async (req, res) => {
    const userId = req.user.id;
    const requestId = req.params.id; // This is the friendship ID, or we can use requester_id

    try {
        // Verify the request is for this user
        const [request] = await db.query(
            'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
            [requestId, userId, 'pending']
        );

        if (request.length === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        await db.query('UPDATE friendships SET status = ? WHERE id = ?', ['accepted', requestId]);

        await notificationController.createNotification(request[0].requester_id, 'Your friend request was accepted!', 'success', null);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Server error accepting request' });
    }
};

// Reject friend request
exports.rejectRequest = async (req, res) => {
    const userId = req.user.id;
    const requestId = req.params.id;

    try {
        const [request] = await db.query(
            'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
            [requestId, userId, 'pending']
        );

        if (request.length === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        await db.query('UPDATE friendships SET status = ? WHERE id = ?', ['rejected', requestId]);

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ error: 'Server error rejecting request' });
    }
};

// Get all friends
exports.getFriends = async (req, res) => {
    const userId = req.user.id;

    try {
        const [friends] = await db.query(
            `SELECT u.id, u.username, u.avatar_url, u.status, u.birth_date 
             FROM friendships f
             JOIN users u ON (f.requester_id = u.id OR f.addressee_id = u.id)
             WHERE (f.requester_id = ? OR f.addressee_id = ?) 
             AND f.status = 'accepted' 
             AND u.id != ?`,
            [userId, userId, userId]
        );

        res.json(friends);
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Server error fetching friends' });
    }
};

// Get pending requests (received)
exports.getPendingRequests = async (req, res) => {
    const userId = req.user.id;

    try {
        const [requests] = await db.query(
            `SELECT f.id, u.id as requester_id, u.username, u.avatar_url 
             FROM friendships f
             JOIN users u ON f.requester_id = u.id
             WHERE f.addressee_id = ? AND f.status = 'pending'`,
            [userId]
        );

        res.json(requests);
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Server error fetching requests' });
    }
};

// Get friendship status with a specific user
exports.getFriendshipStatus = async (req, res) => {
    const userId = req.user.id;
    const targetId = req.params.userId;

    try {
        const [friendship] = await db.query(
            'SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
            [userId, targetId, targetId, userId]
        );

        if (friendship.length === 0) {
            return res.json({ status: 'none' });
        }

        const f = friendship[0];
        let status = f.status;

        // If pending, clarify direction
        if (status === 'pending') {
            status = f.requester_id === userId ? 'sent' : 'received';
        }

        res.json({ status, id: f.id });
    } catch (error) {
        console.error('Get friendship status error:', error);
        res.status(500).json({ error: 'Server error fetching status' });
    }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    try {
        const [result] = await db.query(
            'DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
            [userId, friendId, friendId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Friendship not found' });
        }

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Server error removing friend' });
    }
};
