const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add max_players to matches
        try {
            await db.query("ALTER TABLE matches ADD COLUMN max_players INT DEFAULT 10;");
            console.log('Added max_players to matches.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('max_players already exists.');
            } else {
                console.error('Error adding max_players:', e);
            }
        }

        // Modify participants status enum
        try {
            await db.query("ALTER TABLE participants MODIFY COLUMN status ENUM('confirmed', 'declined', 'maybe', 'waitlist') DEFAULT 'maybe';");
            console.log('Updated participants status enum.');
        } catch (e) {
            console.error('Error updating participants status:', e);
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
