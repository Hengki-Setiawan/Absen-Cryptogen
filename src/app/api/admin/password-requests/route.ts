import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute("SELECT * FROM password_requests WHERE status = 'pending' ORDER BY created_at DESC");
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { requestId, action, newPassword } = await request.json(); // action: 'approve' | 'reject'

        if (!requestId || !action) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        if (action === 'reject') {
            await db.execute({
                sql: "UPDATE password_requests SET status = 'rejected' WHERE id = ?",
                args: [requestId]
            });
            return NextResponse.json({ success: true });
        }

        if (action === 'approve') {
            if (!newPassword) return NextResponse.json({ error: 'New password required' }, { status: 400 });

            // Get user_id from request
            const reqResult = await db.execute({
                sql: "SELECT user_id FROM password_requests WHERE id = ?",
                args: [requestId]
            });

            if (reqResult.rows.length === 0) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
            const userId = reqResult.rows[0].user_id;

            // Update user password
            await db.execute({
                sql: "UPDATE users SET password = ? WHERE id = ?",
                args: [newPassword, userId]
            });

            // Mark request as completed
            await db.execute({
                sql: "UPDATE password_requests SET status = 'completed' WHERE id = ?",
                args: [requestId]
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Password request action error:', error);
        return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
    }
}
