import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { nim, full_name, password } = await request.json();

        if (!nim || !full_name || !password) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
        }

        // Check if NIM already exists
        const existingUser = await db.execute({
            sql: 'SELECT id FROM users WHERE nim = ?',
            args: [nim]
        });

        if (existingUser.rows.length > 0) {
            return NextResponse.json({ error: 'NIM sudah terdaftar' }, { status: 400 });
        }

        const id = generateId();
        const username = nim; // Default username is NIM

        await db.execute({
            sql: `INSERT INTO users (id, nim, email, full_name, role, username, password)
            VALUES (?, ?, ?, ?, 'student', ?, ?)`,
            args: [
                id,
                nim,
                `${nim}@student.unm.ac.id`, // Default email placeholder
                full_name,
                username,
                password
            ]
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message || 'Gagal mendaftar' }, { status: 500 });
    }
}
