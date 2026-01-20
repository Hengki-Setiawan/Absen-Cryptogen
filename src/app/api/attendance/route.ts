import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, courseId, attendanceDate, status, notes, photoUrl, timestamp, isQr } = body;

        // Validate required fields
        // If isQr is true, photoUrl is NOT required
        if (!studentId || !courseId || !attendanceDate || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isQr && !photoUrl) {
            return NextResponse.json({ error: 'Photo is required for manual attendance' }, { status: 400 });
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

        // Rate Limiting: Check if student already submitted for this course on this date
        const existingAttendance = await db.execute({
            sql: `SELECT id FROM attendances 
                  WHERE user_id = ? AND schedule_id = ? AND attendance_date = ?`,
            args: [studentId, courseId, attendanceDate]
        });

        if (existingAttendance.rows.length > 0) {
            return NextResponse.json({
                error: 'Anda sudah absen untuk mata kuliah ini hari ini.'
            }, { status: 429 });
        }

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
                photoUrl || (isQr ? 'QR_SUBMISSION' : null)
            ]
        });

        return NextResponse.json({ success: true, id: attendanceId });
    } catch (error) {
        console.error('Attendance submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
