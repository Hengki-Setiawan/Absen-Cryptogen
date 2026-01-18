import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get the attendance record to find photo URL
        const result = await db.execute({
            sql: 'SELECT photo_url FROM attendances WHERE id = ?',
            args: [id]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
        }

        const photoUrl = result.rows[0].photo_url as string | null;

        // 2. Delete photo from Supabase if exists
        if (photoUrl) {
            const path = photoUrl.split('/attendance-photos/')[1];
            if (path) {
                await supabase.storage.from('attendance-photos').remove([path]);
            }
        }

        // 3. Delete from Turso database
        await db.execute({
            sql: 'DELETE FROM attendances WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete attendance error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
