import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Total attendances
        const totalResult = await db.execute('SELECT COUNT(*) as total FROM attendances');
        const totalAttendances = Number(totalResult.rows[0]?.total) || 0;

        // Count by status
        const statusResult = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM attendances 
            GROUP BY status 
            ORDER BY count DESC
        `);
        const statusCounts = statusResult.rows.map(row => ({
            status: String(row.status || 'hadir'),
            count: Number(row.count)
        }));

        // Count by course
        const courseResult = await db.execute(`
            SELECT c.name as course_name, COUNT(*) as count 
            FROM attendances a
            JOIN courses c ON a.course_id = c.id
            GROUP BY c.name 
            ORDER BY count DESC
            LIMIT 10
        `);
        const courseCounts = courseResult.rows.map(row => ({
            course_name: String(row.course_name),
            count: Number(row.count)
        }));

        // Top 5 students
        const studentResult = await db.execute(`
            SELECT u.full_name as student_name, COUNT(*) as count 
            FROM attendances a
            JOIN users u ON a.user_id = u.id
            WHERE a.status = 'hadir'
            GROUP BY u.full_name 
            ORDER BY count DESC
            LIMIT 5
        `);
        const topStudents = studentResult.rows.map(row => ({
            student_name: String(row.student_name),
            count: Number(row.count)
        }));

        return NextResponse.json({
            totalAttendances,
            statusCounts,
            courseCounts,
            topStudents
        });
    } catch (error) {
        console.error('Statistics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
