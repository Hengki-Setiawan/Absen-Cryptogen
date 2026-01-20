import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, courseId, attendanceDate, status, notes, photoUrl, timestamp } = body;

        // Validate required fields
        if (!studentId || !courseId || !attendanceDate || !status || !photoUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert into attendances table
        // Note: courseId here is actually the SCHEDULE ID from the dropdown.
        // We need to fetch the real `course_id` from the `schedules` table.

        const scheduleResult = await db.execute({
            sql: 'SELECT course_id FROM schedules WHERE id = ?',
            args: [courseId]
        });

        if (scheduleResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
        }

        const realCourseId = scheduleResult.rows[0].course_id;
        const attendanceId = generateId();

        await db.execute({
            sql: `INSERT INTO attendances (
        id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                studentId,
                realCourseId,
                courseId, // schedule_id
                attendanceDate, // attendance_date from form
                timestamp, // check_in_time
                status,
                notes || '',
                photoUrl
            ]
        });

        return NextResponse.json({ success: true, id: attendanceId });
    } catch (error) {
        console.error('Attendance submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
