const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [matchCount] = await db.query('SELECT COUNT(*) as count FROM matches');

        let ticketCount = [{ count: 0 }];
        try {
            [ticketCount] = await db.query('SELECT COUNT(*) as count FROM support_tickets');
        } catch (e) {
            console.log("Support tickets table might not exist yet");
        }

        const [voteCount] = await db.query('SELECT COUNT(*) as count FROM votes');
        const [friendshipCount] = await db.query('SELECT COUNT(*) as count FROM friendships');
        const [participantCount] = await db.query('SELECT COUNT(*) as count FROM participants');
        const [notificationCount] = await db.query('SELECT COUNT(*) as count FROM notifications');

        let reportCount = [{ count: 0 }];
        try {
            [reportCount] = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
        } catch (e) {
            console.log("Reports table might not exist yet");
        }

        res.json({
            users: userCount[0].count,
            matches: matchCount[0].count,
            tickets: ticketCount[0].count,
            votes: voteCount[0].count,
            friendships: friendshipCount[0].count,
            participants: participantCount[0].count,
            notifications: notificationCount[0].count,
            reports: reportCount[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, role, status FROM users ORDER BY id DESC');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};

exports.getMatches = async (req, res) => {
    try {
        const [matches] = await db.query(`
            SELECT m.*, u.username as creator_name 
            FROM matches m 
            LEFT JOIN users u ON m.creator_id = u.id 
            ORDER BY m.date_time DESC
        `);
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching matches' });
    }
};

exports.deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM matches WHERE id = ?', [id]);
        res.json({ message: 'Match deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting match' });
    }
};

exports.getVotes = async (req, res) => {
    try {
        const [votes] = await db.query(`
            SELECT v.*, u1.username as voter_name, u2.username as target_name, m.date_time as match_date
            FROM votes v
            JOIN users u1 ON v.voter_id = u1.id
            JOIN users u2 ON v.target_id = u2.id
            JOIN matches m ON v.match_id = m.id
            ORDER BY v.id DESC
        `);
        res.json(votes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching votes' });
    }
};

exports.deleteVote = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM votes WHERE id = ?', [id]);
        res.json({ message: 'Vote deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting vote' });
    }
};

exports.getFriendships = async (req, res) => {
    try {
        const [friendships] = await db.query(`
            SELECT f.*, u1.username as requester_name, u2.username as addressee_name
            FROM friendships f
            JOIN users u1 ON f.requester_id = u1.id
            JOIN users u2 ON f.addressee_id = u2.id
            ORDER BY f.created_at DESC
        `);
        res.json(friendships);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching friendships' });
    }
};

exports.deleteFriendship = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM friendships WHERE id = ?', [id]);
        res.json({ message: 'Friendship deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting friendship' });
    }
};

exports.getParticipants = async (req, res) => {
    try {
        const [participants] = await db.query(`
            SELECT p.*, u.username, m.date_time as match_date, m.sport_type
            FROM participants p
            JOIN users u ON p.user_id = u.id
            JOIN matches m ON p.match_id = m.id
            ORDER BY p.id DESC
        `);
        res.json(participants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching participants' });
    }
};

exports.deleteParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM participants WHERE id = ?', [id]);
        res.json({ message: 'Participant deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting participant' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const [notifications] = await db.query(`
            SELECT n.*, u.username
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
        `);
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
};
