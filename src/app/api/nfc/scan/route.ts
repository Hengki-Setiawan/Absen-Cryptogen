import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
// import { getAddressFromCoordinates } from '@/lib/geocoding'; - REMOVED

// POST - Process NFC card scan (auto-login + auto-attend)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { shortId, latitude, longitude } = body;

        if (!shortId) {
            return NextResponse.json({ error: 'Short ID is required' }, { status: 400 });
        }

        // Ensure location columns exist (Auto-migration)
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN latitude REAL`); } catch (e) { }
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN longitude REAL`); } catch (e) { }
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN address TEXT`); } catch (e) { }

        // Get Address if location is provided - REMOVED
        let address = null;
        // if (latitude && longitude) {
        //     address = await getAddressFromCoordinates(latitude, longitude);
        // }

        // Find NFC card by short ID
        const cardResult = await db.execute({
            sql: `SELECT nc.*, u.id as user_id, u.full_name, u.nim, u.username, u.role
                  FROM nfc_cards nc
                  JOIN users u ON nc.user_id = u.id
                  WHERE nc.short_id = ? AND nc.is_active = 1`,
            args: [shortId]
        });

        if (cardResult.rows.length === 0) {
            return NextResponse.json({ error: 'Kartu NFC tidak valid atau tidak aktif' }, { status: 404 });
        }

        const card = cardResult.rows[0] as any;
        const student = {
            id: card.user_id,
            name: card.full_name,
            nim: card.nim,
            username: card.username,
            role: card.role
        };

        // Get all active NFC sessions
        const sessionsResult = await db.execute({
            sql: `SELECT ns.*, s.day, s.start_time, c.name as course_name
                  FROM nfc_sessions ns
                  JOIN schedules s ON ns.schedule_id = s.id
                  JOIN courses c ON ns.course_id = c.id
                  WHERE ns.is_active = 1 
                  AND datetime(ns.expires_at) > datetime('now')`,
            args: []
        });

        const attendanceResults: any[] = [];

        // Process attendance for each active session
        for (const session of sessionsResult.rows as any[]) {
            try {
                // Check if already attended
                const existingAttendance = await db.execute({
                    sql: `SELECT * FROM attendances 
                          WHERE user_id = ? 
                          AND schedule_id = ? 
                          AND attendance_date = ?`,
                    args: [student.id, session.schedule_id, session.attendance_date]
                });

                if (existingAttendance.rows.length > 0) {
                    attendanceResults.push({
                        course: session.course_name,
                        schedule: `${session.day} ${session.start_time}`,
                        status: 'already',
                        message: 'Sudah absen sebelumnya'
                    });
                    continue;
                }

                // Record attendance
                const attendanceId = generateId();
                await db.execute({
                    sql: `INSERT INTO attendances (id, user_id, course_id, schedule_id, status, attendance_date, check_in_time)
                          VALUES (?, ?, ?, ?, 'hadir', ?, datetime('now'))`,
                    args: [attendanceId, student.id, session.course_id, session.schedule_id, session.attendance_date]
                });

                attendanceResults.push({
                    course: session.course_name,
                    schedule: `${session.day} ${session.start_time}`,
                    status: 'success',
                    message: 'Absensi berhasil dicatat'
                });
            } catch (error) {
                console.error('Error recording attendance:', error);
                attendanceResults.push({
                    course: session.course_name,
                    schedule: `${session.day} ${session.start_time}`,
                    status: 'error',
                    message: 'Gagal mencatat absensi'
                });
            }
        }

        return NextResponse.json({
            success: true,
            student,
            attendanceResults,
            hasActiveSessions: sessionsResult.rows.length > 0,
            address
        });
    } catch (error: any) {
        console.error('Error processing NFC scan:', error);
        return NextResponse.json({
            error: 'Failed to process NFC scan',
            details: error.message
        }, { status: 500 });
    }
}
