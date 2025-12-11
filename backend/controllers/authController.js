const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, password, email, birth_date, gender, terms_accepted } = req.body;

    if (!username || !password || !email || !birth_date || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!terms_accepted) {
        return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
    }

    try {
        // Check if user already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (username, password_hash, email, birth_date, gender, terms_accepted_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [username, passwordHash, email, birth_date, gender]
        );

        const userId = result.insertId;
        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];

        // Initialize default skills
        for (const sport of sports) {
            await db.query(
                'INSERT INTO user_skills (user_id, sport_type, rating) VALUES (?, ?, ?)',
                [userId, sport, 6.0]
            );
        }

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Find user
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get skills
        const [skills] = await db.query('SELECT sport_type, rating FROM user_skills WHERE user_id = ?', [user.id]);

        // Ensure default skills if missing (fallback)
        const sports = ['soccer', 'volleyball', 'padel', 'tennis'];
        const completeSkills = sports.map(sport => {
            const found = skills.find(s => s.sport_type === sport);
            return found ? found : { sport_type: sport, rating: 6.0 };
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                avatar_url: user.avatar_url,
                skills: completeSkills
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login', details: error.message });
    }
};
