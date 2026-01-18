import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute(`
      SELECT t.*, c.name as course_name, c.code as course_code
      FROM tasks t
      LEFT JOIN courses c ON t.course_id = c.id
      ORDER BY t.deadline ASC
    `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { courseId, title, description, deadline } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const id = generateId();
        await db.execute({
            sql: 'INSERT INTO tasks (id, course_id, title, description, deadline) VALUES (?, ?, ?, ?, ?)',
            args: [id, courseId || null, title, description || '', deadline || null]
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
