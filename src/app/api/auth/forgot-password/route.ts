import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { nim, full_name } = await request.json();

        if (!nim || !full_name) {
            return NextResponse.json({ error: 'NIM dan Nama Lengkap wajib diisi' }, { status: 400 });
        }

        // Verify user exists
        const userResult = await db.execute({
            sql: 'SELECT id, full_name FROM users WHERE nim = ?',
            args: [nim]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'Data mahasiswa tidak ditemukan' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Verify name matches (case insensitive loose check)
        if (!String(user.full_name).toLowerCase().includes(full_name.toLowerCase())) {
            return NextResponse.json({ error: 'Nama tidak sesuai dengan NIM' }, { status: 400 });
        }

        // Create request
        const id = generateId();
        await db.execute({
            sql: `INSERT INTO password_requests (id, user_id, nim, full_name, status)
            VALUES (?, ?, ?, ?, 'pending')`,
            args: [id, user.id, nim, user.full_name]
        });

        return NextResponse.json({ success: true, message: 'Permintaan reset password terkirim' });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 });
    }
}
