import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ensure columns exist (Auto-migration for Admin View)
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN latitude REAL`); } catch (e) { }
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN longitude REAL`); } catch (e) { }
    try { await db.execute(`ALTER TABLE attendances ADD COLUMN address TEXT`); } catch (e) { }

    const result = await db.execute(`
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
        c.code as course_code
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      ORDER BY a.attendance_date DESC, a.check_in_time DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch attendances:', error);
    return NextResponse.json({ error: 'Failed to fetch attendances' }, { status: 500 });
  }
}
