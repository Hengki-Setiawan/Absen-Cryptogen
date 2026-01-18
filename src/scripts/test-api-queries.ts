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

async function testQueries() {
    console.log('🧪 Testing Database Queries...');

    try {
        const { db } = await import('../lib/db');

        // Test 1: Fetch Students
        console.log('\n1. Fetching Students...');
        const students = await db.execute('SELECT id, nim, full_name, position, avatar_url FROM users WHERE role = "student" ORDER BY full_name ASC');
        console.log(`✅ Success! Found ${students.rows.length} students.`);
    } catch (error: any) {
        console.error('❌ Failed to fetch students:', error.message);
    }

    try {
        const { db } = await import('../lib/db');

        // Test 2: Fetch Schedules
        console.log('\n2. Fetching Schedules...');
        const schedules = await db.execute(`
      SELECT 
        s.id,
        c.name as course,
        c.lecturer,
        s.day,
        s.start_time as startTime,
        s.end_time as endTime,
        s.room,
        s.type,
        s.meeting_link
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
    `);
        console.log(`✅ Success! Found ${schedules.rows.length} schedules.`);
    } catch (error: any) {
        console.error('❌ Failed to fetch schedules:', error.message);
    }
}

testQueries();
