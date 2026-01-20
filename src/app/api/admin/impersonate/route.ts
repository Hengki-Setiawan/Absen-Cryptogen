import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Fetch user details (excluding password)
        const result = await db.execute({
            sql: "SELECT id, full_name, role, username, nim FROM users WHERE id = ?",
            args: [userId]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = result.rows[0];

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
        console.error('Impersonation error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
