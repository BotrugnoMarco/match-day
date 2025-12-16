const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
    const { username, password, email, birth_date, gender, terms_accepted } = req.body;

    if (!username || !password || !email || !birth_date || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!terms_accepted) {
        return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
    }

    // Age check (minimum 13 years old)
    const birthDate = new Date(birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 13) {
        return res.status(400).json({ error: 'You must be at least 13 years old to register.' });
    }

    try {
        // Check if username exists
        const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email exists
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
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
            { expiresIn: '30d' }
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

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const user = users[0];
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await db.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [token, expires, user.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'ssl0.ovh.net', // Default OVH host
            port: process.env.SMTP_PORT || 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'support@botrugno.dev',
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"MatchDay Support" <${process.env.SMTP_USER || 'support@botrugno.dev'}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Password Reset</h3>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link expires in 1 hour.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${email}`);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Fallback for dev: log the link
            console.log(`Fallback: Password reset link for ${email}: ${resetLink}`);
        }

        res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
        }

        const user = users[0];
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
            [passwordHash, user.id]
        );

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
