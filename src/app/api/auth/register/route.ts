import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { nim, full_name, password } = await request.json();

        if (!nim || !full_name || !password) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if NIM already exists
        const existingUserResult = await db.execute({
            sql: 'SELECT id, password FROM users WHERE nim = ?',
            args: [nim]
        });

        if (existingUserResult.rows.length > 0) {
            const user = existingUserResult.rows[0];

            // If password exists, account is already claimed
            if (user.password) {
                return NextResponse.json({ error: 'NIM sudah terdaftar' }, { status: 400 });
            }

            // If password is null, this is a pre-registered user claiming their account
            // Update their info
            await db.execute({
                sql: `UPDATE users SET full_name = ?, password = ?, username = ?, email = ? WHERE id = ?`,
                args: [
                    full_name,
                    hashedPassword,
                    nim, // Set username to NIM
                    `${nim}@student.unm.ac.id`, // Default email
                    user.id
                ]
            });

            return NextResponse.json({ success: true, id: user.id, message: 'Akun berhasil diaktifkan' });
        }

        // New User Registration
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
                hashedPassword
            ]
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message || 'Gagal mendaftar' }, { status: 500 });
    }
}
