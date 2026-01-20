import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await db.execute({
            sql: `
                SELECT b.*, u.full_name as author_name, u.avatar_url as author_avatar
                FROM blog_posts b
                LEFT JOIN users u ON b.author_id = u.id
                WHERE b.id = ?
            `,
            args: [id]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, content, category, is_published } = body;

        await db.execute({
            sql: `UPDATE blog_posts SET title = ?, content = ?, category = ?, is_published = ? WHERE id = ?`,
            args: [title, content, category, is_published ? 1 : 0, id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.execute({
            sql: `DELETE FROM blog_posts WHERE id = ?`,
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
