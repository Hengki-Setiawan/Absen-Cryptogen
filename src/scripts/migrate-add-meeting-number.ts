import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.trim().startsWith('#')) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function migrate() {
    console.log('🔄 Running migration: Add meeting_number to attendances...');

    try {
        const { db } = await import('../lib/db');

        // Check if column exists (naive check by trying to select it, or just alter table and ignore error)
        // SQLite ALTER TABLE ADD COLUMN is safe to run? 
        // Let's just try to run it.

        await db.execute(`ALTER TABLE attendances ADD COLUMN meeting_number INTEGER DEFAULT 1`);

        console.log('✅ Migration successful: meeting_number column added.');
    } catch (error: unknown) {
        const err = error as { message: string };
        if (err.message && err.message.includes('duplicate column name')) {
            console.log('⚠️ Column meeting_number already exists. Skipping.');
        } else {
            console.error('❌ Migration failed:', error);
        }
    }
}

migrate();
