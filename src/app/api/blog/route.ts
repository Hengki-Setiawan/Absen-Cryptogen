import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const publishedOnly = searchParams.get('published') === 'true';

        let query = `
            SELECT b.*, u.full_name as author_name, u.avatar_url as author_avatar
            FROM blog_posts b
            LEFT JOIN users u ON b.author_id = u.id
        `;

        if (publishedOnly) {
            query += ` WHERE b.is_published = 1`;
        }

        query += ` ORDER BY b.created_at DESC`;

        const result = await db.execute(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content, category, authorId } = body;

        if (!title || !content || !authorId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = generateId();
        await db.execute({
            sql: `INSERT INTO blog_posts (id, author_id, title, content, category, is_published, created_at) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            args: [id, authorId, title, content, category || 'pengumuman']
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
