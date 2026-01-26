import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        // 1. Get Course Details
        const courseResult = await db.execute({
            sql: 'SELECT name, code, semester FROM courses WHERE id = ?',
            args: [courseId]
        });

        if (courseResult.rows.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const course = courseResult.rows[0] as unknown as { name: string; code: string; semester: string };

        // 2. Get All Students Enrolled in the Course
        const studentsResult = await db.execute({
            sql: `
        SELECT u.id, u.nim, u.full_name
        FROM users u
        JOIN student_courses sc ON u.id = sc.user_id
        WHERE sc.course_id = ?
        ORDER BY u.nim ASC
      `,
            args: [courseId]
        });
        const students = studentsResult.rows;

        // 3. Get All Schedules/Meetings for this Course (to determine columns)
        // We want all dates where attendance has been recorded or scheduled
        // For simplicity, let's get all unique attendance dates for this course
        const datesResult = await db.execute({
            sql: `
        SELECT DISTINCT attendance_date 
        FROM attendances 
        WHERE course_id = ? 
        ORDER BY attendance_date ASC
      `,
            args: [courseId]
        });
        const dates = datesResult.rows.map(r => String(r.attendance_date));

        if (dates.length === 0) {
            return NextResponse.json({ error: 'No attendance data found for this course' }, { status: 404 });
        }

        // 4. Get All Attendance Records
        const attendanceResult = await db.execute({
            sql: `
        SELECT user_id, attendance_date, status
        FROM attendances
        WHERE course_id = ?
      `,
            args: [courseId]
        });

        // Create a lookup map: userId -> date -> status
        const attendanceMap: Record<string, Record<string, string>> = {};
        attendanceResult.rows.forEach(row => {
            const uid = String(row.user_id);
            const date = String(row.attendance_date);
            if (!attendanceMap[uid]) attendanceMap[uid] = {};
            attendanceMap[uid][date] = String(row.status);
        });

        // 5. Build Excel Data
        // Header Row 1: Course Info
        const data: any[][] = [
            ['Mata Kuliah:', course.name],
            ['Kode:', course.code],
            ['Semester:', course.semester],
            [''], // Empty row
            ['No', 'NIM', 'Nama Mahasiswa', ...dates.map(d => new Date(d).toLocaleDateString('id-ID'))] // Header columns
        ];

        // Data Rows
        students.forEach((student, index) => {
            const row = [
                index + 1,
                student.nim,
                student.full_name,
                ...dates.map(date => {
                    const status = attendanceMap[String(student.id)]?.[date];
                    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
                })
            ];
            data.push(row);
        });

        // 6. Generate Excel File
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Auto-width columns
        const wscols = [
            { wch: 5 },  // No
            { wch: 15 }, // NIM
            { wch: 30 }, // Name
            ...dates.map(() => ({ wch: 12 })) // Date columns
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 7. Return Response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Absensi_${course.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`
            }
        });

    } catch (error) {
        console.error('Error exporting attendance:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
