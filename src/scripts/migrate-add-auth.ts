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
    console.log('🔄 Running migration: Add username and password to users...');

    try {
        const { db } = await import('../lib/db');

        // Add username column
        try {
            await db.execute(`ALTER TABLE users ADD COLUMN username TEXT`);
            console.log('✅ Added username column.');

            // Add UNIQUE index
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
            console.log('✅ Added unique index for username.');
        } catch (e: any) {
            if (e.message?.includes('duplicate column')) {
                console.log('⚠️ username column exists.');
                // Ensure index exists even if column exists
                try {
                    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
                    console.log('✅ Verified unique index for username.');
                } catch (idxErr) {
                    console.error('Error creating index:', idxErr);
                }
            }
            else console.error('Error adding username:', e);
        }

        // Add password column
        try {
            await db.execute(`ALTER TABLE users ADD COLUMN password TEXT`);
            console.log('✅ Added password column.');
        } catch (e: any) {
            if (e.message?.includes('duplicate column')) console.log('⚠️ password column exists.');
            else console.error('Error adding password:', e);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrate();
