import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
import { attendanceSchema } from '@/lib/validations';

// UNM Parangtambung coordinates - REMOVED
// const UNM_LAT = -5.181667;
// const UNM_LONG = 119.425278;

// Distance calculation functions - REMOVED

export async function POST(request: Request) {
    let body;
    try {
        body = await request.json();
        const validation = attendanceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: (validation.error as any).errors[0].message }, { status: 400 });
        }

        // Rename courseId to scheduleId for clarity, as the client sends scheduleId in this field
        const { studentId, courseId: scheduleId, attendanceDate, status, notes, photoUrl, isQr, latitude, longitude } = validation.data;

        if (!isQr && !photoUrl) {
            return NextResponse.json({ error: 'Photo is required for manual attendance' }, { status: 400 });
        }

        // Calculate distance info (fast, no external API) - REMOVED
        let distanceInfo = '';
        // if (latitude && longitude) {
        //     const distance = calculateDistance(latitude, longitude, UNM_LAT, UNM_LONG);
        //     distanceInfo = `[Jarak dari UNM: ${formatDistance(distance)}]`;
        // }

        // Get schedule's course_id and check for duplicate in a single query
        const scheduleResult = await db.execute({
            sql: 'SELECT course_id FROM schedules WHERE id = ?',
            args: [scheduleId]
        });

        if (scheduleResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
        }

        const realCourseId = scheduleResult.rows[0].course_id;

        // Rate Limiting: Check if student already submitted
        const existingAttendance = await db.execute({
            sql: `SELECT id FROM attendances WHERE user_id = ? AND schedule_id = ? AND attendance_date = ? LIMIT 1`,
            args: [studentId, scheduleId, attendanceDate]
        });

        if (existingAttendance.rows.length > 0) {
            return NextResponse.json({
                error: 'Anda sudah absen untuk mata kuliah ini hari ini.'
            }, { status: 429 });
        }

        const attendanceId = generateId();
        const serverTimestamp = new Date().toISOString();

        // Combine notes with distance info
        const finalNotes = distanceInfo
            ? (notes ? `${notes} ${distanceInfo}` : distanceInfo)
            : (notes || '');

        // Insert attendance (skip address for now - will be fetched in background later)
        await db.execute({
            sql: `INSERT INTO attendances (
                id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                studentId,
                realCourseId,
                scheduleId,
                attendanceDate,
                serverTimestamp,
                status,
                finalNotes,
                photoUrl || (isQr ? 'QR_SUBMISSION' : 'MANUAL_SUBMISSION_NO_PHOTO') // Fallback to ensure not null
            ]
        });

        return NextResponse.json({ success: true, id: attendanceId, distance: distanceInfo });
    } catch (error: any) {
        console.error('Attendance submission error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            code: error.code,
            details: error.toString(),
            stack: error.stack,
            receivedBody: body || 'body not parsed'
        }, { status: 500 });
    }
}
