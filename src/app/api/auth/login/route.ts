import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: (validation.error as any).errors[0].message }, { status: 400 });
        }

        const { username, password } = validation.data;

        const result = await db.execute({
            sql: "SELECT id, full_name, role, username, nim, password FROM users WHERE username = ? OR nim = ? OR email = ?",
            args: [username, username, username]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password as string);

        if (!isValid) {
            // Fallback for legacy plaintext passwords (temporary migration)
            if (password === user.password) {
                // Auto-hash the password for next time
                const newHash = await bcrypt.hash(password, 10);
                await db.execute({
                    sql: "UPDATE users SET password = ? WHERE id = ?",
                    args: [newHash, user.id]
                });
            } else {
                return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.full_name,
                role: user.role,
                username: user.username,
                nim: user.nim
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
