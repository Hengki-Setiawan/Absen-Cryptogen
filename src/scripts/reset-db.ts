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

async function reset() {
    console.log('🗑️ Resetting Database...');

    try {
        const { db, initializeDatabase } = await import('../lib/db');

        // Drop tables in reverse order of dependencies
        await db.execute('DROP TABLE IF EXISTS blog_posts');
        await db.execute('DROP TABLE IF EXISTS attendances');
        await db.execute('DROP TABLE IF EXISTS student_courses');
        await db.execute('DROP TABLE IF EXISTS schedules');
        await db.execute('DROP TABLE IF EXISTS courses');
        await db.execute('DROP TABLE IF EXISTS users');

        console.log('✅ All tables dropped.');

        // Re-initialize
        console.log('🚀 Re-initializing Database...');
        const result = await initializeDatabase();

        if (result.success) {
            console.log('✅ Database initialized successfully.');
        } else {
            throw result.error;
        }

    } catch (error) {
        console.error('❌ Reset failed:', error);
    }
}

reset();
