import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
        }

        const result = await db.execute({
            sql: "SELECT id, full_name, role, username FROM users WHERE username = ? AND password = ? AND role = 'admin'",
            args: [username, password]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
        }

        const user = result.rows[0];

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.full_name,
                role: user.role,
                username: user.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
