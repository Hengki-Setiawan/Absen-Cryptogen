import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build Query
        let sql = `
            SELECT 
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
                c.name as course_name
            FROM attendances a
            JOIN users u ON a.user_id = u.id
            JOIN courses c ON a.course_id = c.id
        `;

        const args: any[] = [];

        if (startDate && endDate) {
            sql += ' WHERE a.attendance_date BETWEEN ? AND ?';
            args.push(startDate, endDate);
        }

        sql += ' ORDER BY a.attendance_date DESC, a.check_in_time DESC';

        const result = await db.execute({ sql, args });
        const attendances = result.rows;

        if (attendances.length === 0) {
            return NextResponse.json({ error: 'No data found for this period' }, { status: 404 });
        }

        // Build Excel Data
        const exportData = attendances.map((a: any, index: number) => {
            let method = 'Manual (Foto)';
            if (a.photo_url === 'NFC_SCAN') method = 'NFC Card';
            else if (a.photo_url === 'QR_SUBMISSION') method = 'QR Code';

            const checkInDate = new Date(a.check_in_time);

            return {
                'No': index + 1,
                'Tanggal': a.attendance_date,
                'Waktu': checkInDate.toLocaleTimeString('id-ID'),
                'NIM': a.nim,
                'Nama Mahasiswa': a.student_name,
                'Mata Kuliah': a.course_name,
                'Metode': method,
                'Status': a.status?.toUpperCase(),
                'Keterangan': a.notes || '-',
                'Lokasi': a.address || '-',
                'Maps': a.latitude && a.longitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '-'
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-width columns
        const wscols = [
            { wch: 5 },  // No
            { wch: 12 }, // Tanggal
            { wch: 10 }, // Waktu
            { wch: 15 }, // NIM
            { wch: 30 }, // Nama
            { wch: 25 }, // Matkul
            { wch: 15 }, // Metode
            { wch: 10 }, // Status
            { wch: 20 }, // Keterangan
            { wch: 30 }, // Lokasi
            { wch: 40 }  // Maps
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Semua');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Rekap_Absensi_All_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
