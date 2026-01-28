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

// import { db } from '@/lib/db'; // Dynamic import needed

async function checkAttendance() {
    const { db } = await import('@/lib/db');
    console.log('Checking attendance for A. Sifa Ramadani...');
    try {
        // Find user first
        const userResult = await db.execute({
            sql: "SELECT id, full_name, nim FROM users WHERE full_name LIKE '%Sifa%'",
            args: []
        });

        if (userResult.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('User found:', user);

        // Check attendances
        const attendanceResult = await db.execute({
            sql: `
                SELECT a.id, a.status, a.attendance_date, c.name as course_name, a.created_at
                FROM attendances a
                JOIN courses c ON a.course_id = c.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC
            `,
            args: [user.id]
        });

        console.log(`Found ${attendanceResult.rows.length} attendance records:`);
        attendanceResult.rows.forEach(row => {
            console.log(row);
        });

    } catch (error) {
        console.error('Error checking attendance:', error);
    }
}

checkAttendance();
