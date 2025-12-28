require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const filter = require('leo-profanity');

// Configure profanity filter (English + Italian)
const englishWords = filter.list();
filter.loadDictionary('it');
filter.add(englishWords);

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const voteRoutes = require('./routes/voteRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const friendRoutes = require('./routes/friendRoutes');
const supportRoutes = require('./routes/supportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = express();

// Trust proxy (necessario per Nginx e rate limiting corretto)
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In produzione, specifica l'URL del frontend
        methods: ["GET", "POST"]
    }
});

// Configurazione Redis Adapter per Socket.io (solo se REDIS_HOST è definito)
if (process.env.REDIS_HOST) {
    (async () => {
        try {
            const pubClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` });
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            console.log('✅ Redis Adapter configurato con successo');
        } catch (err) {
            console.error('❌ Errore connessione Redis:', err);
        }
    })();
}

// Make io accessible to our router
app.set('io', io);

const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Set security headers with cross-origin allowed for images

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // Limit each IP to 3000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

// Test Database Connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected successfully', solution: rows[0].solution });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to MatchDay API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);

    // Multer Error Handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
    }
    if (err.message === 'Not an image! Please upload an image.') {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    });

    socket.on('join_match_room', (matchId, callback) => {
        const roomName = `match_${matchId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined ${roomName}`);
        if (typeof callback === 'function') {
            callback({ status: 'joined', room: roomName });
        }
    });

    socket.on('leave_match_room', (matchId) => {
        socket.leave(`match_${matchId}`);
        console.log(`Socket ${socket.id} left match_${matchId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
