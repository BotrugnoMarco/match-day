const db = require('../config/db');

async function up() {
    try {
        console.log('Adding role column to user_skills table...');
        await db.query("ALTER TABLE user_skills ADD COLUMN role VARCHAR(50) DEFAULT NULL");
        console.log('Column added successfully.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
            process.exit(0);
        }
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

up();
