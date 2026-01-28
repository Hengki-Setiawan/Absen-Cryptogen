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

async function fetchIds() {
    const { db } = await import('@/lib/db');
    try {
        const student = await db.execute("SELECT id FROM users WHERE role = 'student' LIMIT 1");
        const schedule = await db.execute("SELECT id, course_id FROM schedules LIMIT 1");

        console.log('Valid Student ID:', student.rows[0]?.id);
        console.log('Valid Schedule ID:', schedule.rows[0]?.id);
        console.log('Valid Course ID:', schedule.rows[0]?.course_id);
    } catch (error) {
        console.error('Error fetching IDs:', error);
    }
}

fetchIds();
