import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

// POST - Mencatat absensi via NFC
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { nfcToken } = body;

        if (!nfcToken) {
            return NextResponse.json({ error: 'NFC token is required' }, { status: 400 });
        }

        // Decode NFC token
        let tokenData;
        try {
            const decoded = Buffer.from(nfcToken, 'base64').toString('utf-8');
            tokenData = JSON.parse(decoded);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid NFC token' }, { status: 400 });
        }

        const { userId, nim } = tokenData;

        // Verify NFC card exists and is active
        const cardResult = await db.execute({
            sql: 'SELECT * FROM nfc_cards WHERE user_id = ? AND nim = ? AND is_active = 1',
            args: [userId, nim]
        });

        if (cardResult.rows.length === 0) {
            return NextResponse.json({ error: 'NFC card not found or inactive' }, { status: 404 });
        }

        // Get active NFC session
        const sessionResult = await db.execute({
            sql: `SELECT * FROM nfc_sessions 
                  WHERE is_active = 1 
                  AND datetime(expires_at) > datetime('now')
                  ORDER BY created_at DESC LIMIT 1`
        });

        if (sessionResult.rows.length === 0) {
            return NextResponse.json({ error: 'No active NFC session found' }, { status: 404 });
        }

        const session: any = sessionResult.rows[0];

        // Check if already attended
        const existingAttendance = await db.execute({
            sql: `SELECT * FROM attendances 
                  WHERE user_id = ? 
                  AND course_id = ? 
                  AND attendance_date = ?`,
            args: [userId, session.course_id, session.attendance_date]
        });

        if (existingAttendance.rows.length > 0) {
            return NextResponse.json({
                error: 'Already attended for this session',
                attendance: existingAttendance.rows[0]
            }, { status: 400 });
        }

        // Get user info
        const userResult = await db.execute({
            sql: 'SELECT * FROM users WHERE id = ?',
            args: [userId]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user: any = userResult.rows[0];

        // Create attendance record
        const attendanceId = generateId();
        const checkInTime = new Date().toISOString();

        await db.execute({
            sql: `INSERT INTO attendances 
                  (id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url) 
                  VALUES (?, ?, ?, ?, ?, ?, 'hadir', 'NFC Attendance', 'NFC_SUBMISSION')`,
            args: [
                attendanceId,
                userId,
                session.course_id,
                session.schedule_id,
                session.attendance_date,
                checkInTime
            ]
        });

        return NextResponse.json({
            success: true,
            attendanceId,
            student: {
                name: user.full_name,
                nim: user.nim
            },
            session: {
                courseId: session.course_id,
                date: session.attendance_date
            }
        });
    } catch (error) {
        console.error('Error recording NFC attendance:', error);
        return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }
}
