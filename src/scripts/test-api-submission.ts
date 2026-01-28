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

async function testApiSubmission() {
    const { db } = await import('@/lib/db');
    console.log('Testing API submission logic...');

    // 1. Get User
    const userResult = await db.execute("SELECT id FROM users WHERE full_name LIKE '%Sifa%'");
    const user = userResult.rows[0];
    if (!user) throw new Error('User not found');
    console.log('User ID:', user.id);

    // 2. Get GIS Schedule
    const scheduleId = '0a16e926-b07a-44fa-b782-054489e80ed3'; // GIS ID from list-schedules.ts
    const scheduleResult = await db.execute({
        sql: "SELECT id, course_id FROM schedules WHERE id = ?",
        args: [scheduleId]
    });
    const schedule = scheduleResult.rows[0];
    if (!schedule) throw new Error('Schedule not found');
    console.log('Schedule ID:', schedule.id);
    console.log('Course ID:', schedule.course_id);

    // 3. Simulate Payload
    const payload = {
        studentId: user.id,
        courseId: schedule.id, // Frontend sends scheduleId as courseId
        attendanceDate: '2026-01-28',
        status: 'hadir',
        notes: 'Test Script Submission GIS',
        photoUrl: 'QR_SUBMISSION',
        isQr: true
    };

    console.log('Payload:', payload);

    // 4. Simulate API Logic (Direct DB calls to verify logic)
    try {
        // Check duplicate
        const existing = await db.execute({
            sql: `SELECT id FROM attendances WHERE user_id = ? AND schedule_id = ? AND attendance_date = ? LIMIT 1`,
            args: [payload.studentId, payload.courseId, payload.attendanceDate]
        });

        if (existing.rows.length > 0) {
            console.log('❌ Duplicate found! Attendance already exists.');
            return;
        }

        // Insert
        const attendanceId = 'test-' + Date.now();
        await db.execute({
            sql: `INSERT INTO attendances (
                id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                payload.studentId,
                schedule.course_id,
                payload.courseId,
                payload.attendanceDate,
                new Date().toISOString(),
                payload.status,
                payload.notes,
                payload.photoUrl
            ]
        });

        console.log('✅ Insert successful! ID:', attendanceId);

    } catch (error) {
        console.error('❌ Error during simulation:', error);
    }
}

testApiSubmission();
