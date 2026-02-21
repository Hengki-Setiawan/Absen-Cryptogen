import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

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

        // 2. Get Students from attendance records (not from enrollment table)
        let studentsQuery = `
        SELECT DISTINCT u.id, u.nim, u.full_name
        FROM users u
        JOIN attendances a ON u.id = a.user_id
        WHERE a.course_id = ?
      `;
        const studentsArgs: any[] = [courseId];

        if (startDate && endDate) {
            studentsQuery += ' AND a.attendance_date BETWEEN ? AND ?';
            studentsArgs.push(startDate, endDate);
        }

        studentsQuery += ' ORDER BY u.nim ASC';

        const studentsResult = await db.execute({
            sql: studentsQuery,
            args: studentsArgs
        });
        const students = studentsResult.rows;

        // 3. Get Attendance Dates (Filtered)
        let dateQuery = 'SELECT DISTINCT attendance_date FROM attendances WHERE course_id = ?';
        const dateArgs: any[] = [courseId];

        if (startDate && endDate) {
            dateQuery += ' AND attendance_date BETWEEN ? AND ?';
            dateArgs.push(startDate, endDate);
        }

        dateQuery += ' ORDER BY attendance_date ASC';

        const datesResult = await db.execute({
            sql: dateQuery,
            args: dateArgs
        });
        const dates = datesResult.rows.map(r => String(r.attendance_date));

        if (dates.length === 0) {
            return NextResponse.json({ error: 'No attendance data found for this period' }, { status: 404 });
        }

        // 4. Get Attendance Records (Filtered)
        let attQuery = `
        SELECT a.user_id, a.attendance_date, a.check_in_time, a.status, a.notes, a.photo_url, a.latitude, a.longitude, a.address, u.nim, u.full_name as student_name
        FROM attendances a
        JOIN users u ON a.user_id = u.id
        WHERE a.course_id = ?
      `;
        const attArgs: any[] = [courseId];

        if (startDate && endDate) {
            attQuery += ' AND attendance_date BETWEEN ? AND ?';
            attArgs.push(startDate, endDate);
        }

        const attendanceResult = await db.execute({
            sql: attQuery,
            args: attArgs
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

        // --- Sheet 1: Matriks Kehadiran ---
        const wsMatriks = XLSX.utils.aoa_to_sheet(data);

        // Auto-width columns for Matriks
        const wscolsMatriks = [
            { wch: 5 },  // No
            { wch: 15 }, // NIM
            { wch: 30 }, // Name
            ...dates.map(() => ({ wch: 12 })) // Date columns
        ];
        wsMatriks['!cols'] = wscolsMatriks;

        XLSX.utils.book_append_sheet(wb, wsMatriks, 'Matriks Kehadiran');

        // --- Sheet 2: Data Lengkap ---
        const completeData = attendanceResult.rows.map((row: any, index: number) => {
            let method = 'Manual (Foto)';
            if (row.photo_url === 'NFC_SCAN') method = 'NFC Card';
            else if (row.photo_url === 'QR_SUBMISSION') method = 'QR Code';

            const checkInDate = new Date(row.check_in_time);

            return {
                'No': index + 1,
                'Tanggal': String(row.attendance_date),
                'Waktu': checkInDate.toLocaleTimeString('id-ID'),
                'NIM': String(row.nim),
                'Nama Mahasiswa': String(row.student_name),
                'Metode': method,
                'Status': String(row.status).toUpperCase(),
                'Keterangan': row.notes || '-',
                'Lokasi': row.address || '-',
                'Maps': row.latitude && row.longitude ? `https://www.google.com/maps?q=${row.latitude},${row.longitude}` : '-'
            };
        });

        if (completeData.length > 0) {
            const wsLengkap = XLSX.utils.json_to_sheet(completeData);
            const wscolsLengkap = [
                { wch: 5 },  // No
                { wch: 12 }, // Tanggal
                { wch: 10 }, // Waktu
                { wch: 15 }, // NIM
                { wch: 30 }, // Nama
                { wch: 15 }, // Metode
                { wch: 10 }, // Status
                { wch: 20 }, // Keterangan
                { wch: 30 }, // Lokasi
                { wch: 40 }  // Maps
            ];
            wsLengkap['!cols'] = wscolsLengkap;
            XLSX.utils.book_append_sheet(wb, wsLengkap, 'Data Lengkap');
        }

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
