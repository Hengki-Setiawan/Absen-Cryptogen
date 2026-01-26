import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch user details
        const userResult = await db.execute({
            sql: 'SELECT id, full_name, nim FROM users WHERE id = ?',
            args: [id]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Fetch attendance stats
        const statsResult = await db.execute({
            sql: `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
          SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
          SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
          SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
        FROM attendances 
        WHERE user_id = ?
      `,
            args: [id]
        });

        const stats = statsResult.rows[0];

        // Fetch attendance history
        const historyResult = await db.execute({
            sql: `
        SELECT 
          a.id,
          a.attendance_date,
          a.status,
          a.notes,
          a.check_in_time,
          c.name as course_name,
          s.start_time,
          s.end_time
        FROM attendances a
        JOIN courses c ON a.course_id = c.id
        JOIN schedules s ON a.schedule_id = s.id
        WHERE a.user_id = ?
        ORDER BY a.attendance_date DESC
      `,
            args: [id]
        });

        return NextResponse.json({
            user,
            stats: {
                total: Number(stats.total),
                hadir: Number(stats.hadir),
                izin: Number(stats.izin),
                sakit: Number(stats.sakit),
                alpha: Number(stats.alpha)
            },
            history: historyResult.rows
        });

    } catch (error) {
        console.error('Error fetching student attendance:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
