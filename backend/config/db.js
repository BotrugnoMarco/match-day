require('dotenv').config();
const mysql = require('mysql2/promise');

// AGGIUNGI QUESTO LOG
console.log("Tentativo di connessione al DB con:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
    // Non stampiamo la password per sicurezza
});

console.log("--- DB CONFIG DEBUG ---");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("-----------------------");

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'match_day',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00' // Treat data as UTC to avoid automatic conversions
});

module.exports = pool;
