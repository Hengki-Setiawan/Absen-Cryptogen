import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Fetch Students with position and avatar
        const studentsResult = await db.execute("SELECT id, nim, full_name, position, avatar_url, phone, instagram, email FROM users WHERE role = 'student' ORDER BY full_name ASC");

        // Fetch Courses (Legacy support for Absen page, but we can also use this for Jadwal if needed)
        const coursesResult = await db.execute('SELECT s.id, c.name, c.code, s.day, s.start_time, s.end_time FROM schedules s JOIN courses c ON s.course_id = c.id ORDER BY s.day ASC, s.start_time ASC');

        return NextResponse.json({
            students: studentsResult.rows,
            courses: coursesResult.rows
        });
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({
            error: 'Failed to fetch data',
            message: error?.message || 'Unknown error',
            code: error?.code,
            cause: error?.cause?.message,
            name: error?.name,
            tursoUrl: process.env.TURSO_DATABASE_URL ? 'SET' : 'NOT SET',
            tursoToken: process.env.TURSO_AUTH_TOKEN ? `SET (${process.env.TURSO_AUTH_TOKEN?.substring(0, 20)}...)` : 'NOT SET'
        }, { status: 500 });
    }
}
