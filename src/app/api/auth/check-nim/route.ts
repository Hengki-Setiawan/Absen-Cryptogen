import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const nim = searchParams.get('nim');

        if (!nim) {
            return NextResponse.json({ error: 'NIM required' }, { status: 400 });
        }

        const result = await db.execute({
            sql: "SELECT full_name, password FROM users WHERE nim = ?",
            args: [nim]
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return NextResponse.json({
                exists: true,
                full_name: user.full_name,
                is_registered: !!user.password // True if password is set
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error('Check NIM error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
