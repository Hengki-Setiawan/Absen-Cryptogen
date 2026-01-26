import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get Student Details
        const userResult = await db.execute({
            sql: 'SELECT full_name, nim, email FROM users WHERE id = ?',
            args: [id]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const user = userResult.rows[0];

        // 2. Get All Attendance Records for this Student
        const attendanceResult = await db.execute({
            sql: `
        SELECT 
          a.attendance_date,
          a.status,
          a.check_in_time,
          a.notes,
          c.name as course_name,
          c.code as course_code,
          c.semester,
          s.start_time,
          s.end_time,
          s.room
        FROM attendances a
        JOIN courses c ON a.course_id = c.id
        JOIN schedules s ON a.schedule_id = s.id
        WHERE a.user_id = ?
        ORDER BY a.attendance_date DESC
      `,
            args: [id]
        });

        // 3. Build Excel Data
        const data: any[][] = [
            ['Laporan Absensi Mahasiswa'],
            [''],
            ['Nama:', user.full_name],
            ['NIM:', user.nim],
            ['Email:', user.email || '-'],
            [''],
            ['No', 'Tanggal', 'Mata Kuliah', 'Kode', 'Semester', 'Jam', 'Ruangan', 'Status', 'Waktu Absen', 'Catatan']
        ];

        attendanceResult.rows.forEach((record, index) => {
            data.push([
                index + 1,
                new Date(String(record.attendance_date)).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                record.course_name,
                record.course_code,
                record.semester,
                `${record.start_time} - ${record.end_time}`,
                record.room,
                String(record.status).toUpperCase(),
                record.check_in_time ? new Date(String(record.check_in_time)).toLocaleTimeString('id-ID') : '-',
                record.notes || '-'
            ]);
        });

        // 4. Generate Excel File
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Auto-width columns
        const wscols = [
            { wch: 5 },  // No
            { wch: 25 }, // Tanggal
            { wch: 30 }, // Mata Kuliah
            { wch: 10 }, // Kode
            { wch: 10 }, // Semester
            { wch: 15 }, // Jam
            { wch: 10 }, // Ruangan
            { wch: 10 }, // Status
            { wch: 15 }, // Waktu Absen
            { wch: 30 }  // Catatan
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Absensi');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 5. Return Response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Absensi_${user.nim}_${user.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`
            }
        });

    } catch (error) {
        console.error('Error exporting student attendance:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
