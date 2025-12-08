const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add email column
        try {
            await db.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE");
            console.log('Added email column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('email column already exists');
            } else {
                console.error('Error adding email column:', e);
            }
        }

        // Add birth_date column
        try {
            await db.query("ALTER TABLE users ADD COLUMN birth_date DATE");
            console.log('Added birth_date column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('birth_date column already exists');
            } else {
                console.error('Error adding birth_date column:', e);
            }
        }

        // Add gender column
        try {
            await db.query("ALTER TABLE users ADD COLUMN gender ENUM('M', 'F', 'Other')");
            console.log('Added gender column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('gender column already exists');
            } else {
                console.error('Error adding gender column:', e);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
