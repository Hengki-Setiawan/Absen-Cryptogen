import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.execute('SELECT * FROM site_content ORDER BY key ASC');
        // Convert to key-value object
        const content: Record<string, string> = {};
        result.rows.forEach((row: any) => {
            content[row.key] = row.value;
        });
        return NextResponse.json(content);
    } catch (error) {
        console.error('Failed to fetch site content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();

        for (const [key, value] of Object.entries(body)) {
            await db.execute({
                sql: 'UPDATE site_content SET value = ? WHERE key = ?',
                args: [value as string, key]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update site content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
