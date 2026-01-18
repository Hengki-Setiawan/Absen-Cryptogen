import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute(`
      SELECT 
        a.id,
        u.full_name as student_name,
        u.nim as student_nim,
        c.name as course_name,
        a.status,
        a.photo_url,
        a.check_in_time,
        a.notes,
        a.meeting_number
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      ORDER BY a.check_in_time DESC
    `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Admin logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
