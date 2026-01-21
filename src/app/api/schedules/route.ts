import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute(`
      SELECT 
        s.id,
        s.course_id,
        c.name as course,
        c.lecturer,
        s.day,
        s.start_time as startTime,
        s.end_time as endTime,
        s.room,
        s.type,
        s.meeting_link
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      ORDER BY 
        CASE s.day
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
          ELSE 7
        END,
        s.start_time ASC
    `);

        // Map color based on index or random (consistent per course)
        const schedules = result.rows.map((row, index) => ({
            ...row,
            color: getGradient(index)
        }));

        return NextResponse.json(schedules);
    } catch (error) {
        console.error('Schedules error:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

function getGradient(index: number): string {
    const gradients = [
        'bg-blue-500',
        'bg-purple-500',
        'bg-green-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-cyan-500',
        'bg-indigo-500',
        'bg-rose-500',
    ];
    return gradients[index % gradients.length];
}
