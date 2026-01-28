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
    console.log('Env loaded from .env.local');
    console.log('TURSO_DATABASE_URL exists:', !!process.env.TURSO_DATABASE_URL);
    console.log('TURSO_AUTH_TOKEN exists:', !!process.env.TURSO_AUTH_TOKEN);
} else {
    console.log('.env.local NOT FOUND at:', envPath);
}

// import { db, generateId } from '@/lib/db'; // Removed static import

async function testInsert() {
    const { db, generateId } = await import('@/lib/db'); // Dynamic import
    console.log('Testing DB Insert...');
    try {
        const attendanceId = generateId();
        const studentId = '57ddf2d5-f934-4169-bae1-b52264e677dc';
        const courseId = '36b3a482-300e-40a8-9456-48f178193cec';
        const scheduleId = '1e6a0a54-5cdc-43d4-8600-a1720e017186';
        const attendanceDate = '2026-01-28';
        const serverTimestamp = new Date().toISOString();
        const status = 'hadir';
        const notes = 'Test insert';
        const photoUrl = 'test-url';

        // We might need to insert dummy user/course/schedule first if FKs are enforced
        // But let's try raw insert first to see the error

        console.log('Attempting insert...');
        await db.execute({
            sql: `INSERT INTO attendances (
                id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                studentId,
                courseId,
                scheduleId,
                attendanceDate,
                serverTimestamp,
                status,
                notes,
                photoUrl
            ]
        });
        console.log('✅ Insert successful!');
    } catch (error: any) {
        console.error('❌ Insert failed:', error);
        console.error('Error details:', error.message);
    }
}

testInsert();
