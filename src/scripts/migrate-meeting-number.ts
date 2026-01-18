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
    console.log('🔧 Adding meeting_number column...');

    try {
        const { db } = await import('../lib/db');

        await db.execute('ALTER TABLE attendances ADD COLUMN meeting_number INTEGER');
        console.log('✅ Column added successfully.');
    } catch (error: any) {
        if (error.message?.includes('duplicate column')) {
            console.log('ℹ️ Column already exists.');
        } else {
            console.error('❌ Migration failed:', error.message);
        }
    }
}

migrate();
