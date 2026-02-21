import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Ensure columns exist (Auto-migration for Admin View)
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN latitude REAL`); } catch (e) { }
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN longitude REAL`); } catch (e) { }
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN address TEXT`); } catch (e) { }

    const search = searchParams.get('search') || '';

    let whereClause = '';
    const searchArgs: any[] = [];

    if (search) {
      whereClause = `
          WHERE u.full_name LIKE ? 
          OR u.nim LIKE ? 
          OR a.status LIKE ? 
          OR c.name LIKE ?
        `;
      const pattern = `%${search}%`;
      searchArgs.push(pattern, pattern, pattern, pattern);
    }

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM attendances a 
        JOIN users u ON a.user_id = u.id 
        JOIN courses c ON a.course_id = c.id 
        ${whereClause}
    `;
    const countResult = await db.execute({ sql: countQuery, args: searchArgs });
    const total = countResult.rows[0].total as number;

    const queryArgs = [...searchArgs, limit, offset];

    const result = await db.execute({
      sql: `
      SELECT 
        a.id,
        a.attendance_date,
        a.check_in_time,
        a.status,
        a.notes,
        a.photo_url,
        a.latitude,
        a.longitude,
        a.address,
        u.nim,
        u.full_name as student_name,
        c.name as course_name,
        c.code as course_code,
        s.start_time as schedule_start,
        s.end_time as schedule_end
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN schedules s ON a.schedule_id = s.id
      ${whereClause}
      ORDER BY a.attendance_date DESC, a.check_in_time DESC
      LIMIT ? OFFSET ?
    `,
      args: queryArgs
    });

    return NextResponse.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch attendances:', error);
    return NextResponse.json({ error: 'Failed to fetch attendances' }, { status: 500 });
  }
}
