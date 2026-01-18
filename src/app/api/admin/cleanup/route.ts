import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (for deletion)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
    try {
        // 1. Find photos older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const result = await db.execute({
            sql: `SELECT id, photo_url FROM attendances WHERE check_in_time < ? AND photo_url IS NOT NULL`,
            args: [twentyFourHoursAgo]
        });

        const logsToClean = result.rows;
        let deletedCount = 0;

        for (const log of logsToClean) {
            if (log.photo_url) {
                // Extract path from URL
                // URL format: https://.../storage/v1/object/public/attendance-photos/folder/filename
                const photoUrl = log.photo_url as string;
                const path = photoUrl.split('/attendance-photos/')[1];

                if (path) {
                    const { error } = await supabase.storage
                        .from('attendance-photos')
                        .remove([path]);

                    if (!error) {
                        // Update DB to remove photo_url but keep record
                        await db.execute({
                            sql: `UPDATE attendances SET photo_url = NULL WHERE id = ?`,
                            args: [log.id]
                        });
                        deletedCount++;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, deletedCount });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
