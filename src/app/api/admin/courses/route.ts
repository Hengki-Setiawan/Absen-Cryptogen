import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute(`
      SELECT 
        s.id, s.day, s.start_time, s.end_time, s.room, s.type,
        c.id as course_id, c.name as course_name, c.lecturer, c.code
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      ORDER BY s.day, s.start_time
    `);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { course_name, lecturer, code, day, start_time, end_time, room, type } = body;

        // 1. Create or Find Course
        let courseId = generateId();

        // Check if course exists by code or name
        const existingCourse = await db.execute({
            sql: "SELECT id FROM courses WHERE code = ? OR name = ?",
            args: [code || course_name, course_name]
        });

        if (existingCourse.rows.length > 0) {
            courseId = existingCourse.rows[0].id as string;
        } else {
            await db.execute({
                sql: "INSERT INTO courses (id, name, code, lecturer, semester) VALUES (?, ?, ?, ?, ?)",
                args: [courseId, course_name, code || course_name.substring(0, 3).toUpperCase(), lecturer, '1']
            });
        }

        // 2. Create Schedule
        const scheduleId = generateId();
        await db.execute({
            sql: `INSERT INTO schedules (id, course_id, day, start_time, end_time, room, type, meeting_link)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [scheduleId, courseId, day, start_time, end_time, room, type, body.meeting_link || null]
        });

        return NextResponse.json({ success: true, id: scheduleId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create schedule' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, course_name, lecturer, day, start_time, end_time, room, type } = body;

        // Get course_id from schedule
        const scheduleRes = await db.execute({
            sql: "SELECT course_id FROM schedules WHERE id = ?",
            args: [id]
        });

        if (scheduleRes.rows.length === 0) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        const courseId = scheduleRes.rows[0].course_id;

        // Update Course
        await db.execute({
            sql: "UPDATE courses SET name = ?, lecturer = ? WHERE id = ?",
            args: [course_name, lecturer, courseId]
        });

        // Update Schedule
        await db.execute({
            sql: "UPDATE schedules SET day = ?, start_time = ?, end_time = ?, room = ?, type = ?, meeting_link = ? WHERE id = ?",
            args: [day, start_time, end_time, room, type, body.meeting_link || null, id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute({
            sql: 'DELETE FROM schedules WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
