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

async function checkAfifah() {
    const { db } = await import('@/lib/db');
    console.log('Checking user Afifah...');

    // 1. Find User
    const userResult = await db.execute({
        sql: "SELECT id, full_name, nim FROM users WHERE full_name LIKE '%Afifah%'",
        args: []
    });

    if (userResult.rows.length === 0) {
        console.log('❌ User Afifah NOT found!');
        return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', user);

    // 2. Check Attendance Today
    const attendanceResult = await db.execute({
        sql: `
            SELECT a.id, c.name as course, a.attendance_date, a.created_at, a.photo_url
            FROM attendances a
            JOIN courses c ON a.course_id = c.id
            WHERE a.user_id = ? AND a.attendance_date = '2026-01-28'
        `,
        args: [user.id]
    });

    if (attendanceResult.rows.length === 0) {
        console.log('❌ No attendance found for Afifah today.');
    } else {
        console.log(`✅ Found ${attendanceResult.rows.length} attendance records:`);
        attendanceResult.rows.forEach(row => console.log(row));
    }
}

checkAfifah();
