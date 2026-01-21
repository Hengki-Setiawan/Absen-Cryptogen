import { db } from '../lib/db';

async function migrateNFCTables() {
    try {
        console.log('Starting NFC tables migration...');

        // Create nfc_cards table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS nfc_cards (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                nim TEXT NOT NULL,
                nfc_url TEXT UNIQUE NOT NULL,
                is_active INTEGER DEFAULT 1,
                assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ nfc_cards table created');

        // Create nfc_sessions table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS nfc_sessions (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                schedule_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                attendance_date TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ nfc_sessions table created');

        // Create indexes
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_cards_user ON nfc_cards(user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_cards_nim ON nfc_cards(nim)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_sessions_active ON nfc_sessions(is_active)`);
        console.log('✓ Indexes created');

        console.log('✅ NFC tables migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
migrateNFCTables()
    .then(() => {
        console.log('Migration script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
