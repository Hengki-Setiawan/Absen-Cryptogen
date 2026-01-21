import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

// GET - Mendapatkan sesi NFC yang aktif
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isActive = searchParams.get('active');

        let query = `
            SELECT ns.*, s.course_id, c.name as course_name, s.day, s.start_time, s.room
            FROM nfc_sessions ns
            JOIN schedules s ON ns.schedule_id = s.id
            JOIN courses c ON ns.course_id = c.id
        `;

        if (isActive === 'true') {
            query += ` WHERE ns.is_active = 1 AND datetime(ns.expires_at) > datetime('now')`;
        }

        query += ` ORDER BY ns.created_at DESC`;

        const result = await db.execute(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching NFC sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch NFC sessions' }, { status: 500 });
    }
}

// POST - Membuat sesi NFC baru
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { adminId, scheduleId, courseId, attendanceDate, expiresInHours = 24 } = body;

        if (!adminId || !scheduleId || !courseId || !attendanceDate) {
            return NextResponse.json({
                error: 'adminId, scheduleId, courseId, and attendanceDate are required'
            }, { status: 400 });
        }

        // Deactivate any existing active sessions for the same schedule and date
        await db.execute({
            sql: `UPDATE nfc_sessions 
                  SET is_active = 0 
                  WHERE schedule_id = ? AND attendance_date = ? AND is_active = 1`,
            args: [scheduleId, attendanceDate]
        });

        // Create new session
        const sessionId = generateId();
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

        await db.execute({
            sql: `INSERT INTO nfc_sessions 
                  (id, admin_id, schedule_id, course_id, attendance_date, is_active, expires_at) 
                  VALUES (?, ?, ?, ?, ?, 1, ?)`,
            args: [sessionId, adminId, scheduleId, courseId, attendanceDate, expiresAt]
        });

        return NextResponse.json({
            success: true,
            sessionId,
            expiresAt
        });
    } catch (error) {
        console.error('Error creating NFC session:', error);
        return NextResponse.json({ error: 'Failed to create NFC session' }, { status: 500 });
    }
}

// PUT - Update/deaktivasi sesi NFC
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, isActive } = body;

        if (!sessionId || isActive === undefined) {
            return NextResponse.json({ error: 'sessionId and isActive are required' }, { status: 400 });
        }

        await db.execute({
            sql: 'UPDATE nfc_sessions SET is_active = ? WHERE id = ?',
            args: [isActive ? 1 : 0, sessionId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating NFC session:', error);
        return NextResponse.json({ error: 'Failed to update NFC session' }, { status: 500 });
    }
}

// DELETE - Hapus sesi NFC
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        await db.execute({
            sql: 'DELETE FROM nfc_sessions WHERE id = ?',
            args: [sessionId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting NFC session:', error);
        return NextResponse.json({ error: 'Failed to delete NFC session' }, { status: 500 });
    }
}
