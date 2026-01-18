import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        let query = 'SELECT id, nim, full_name, role, username, position, avatar_url FROM users';
        const args: any[] = [];

        if (role) {
            query += ' WHERE role = ?';
            args.push(role);
        }

        query += ' ORDER BY full_name ASC';

        const result = await db.execute({ sql: query, args });
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nim, full_name, role, username, password, position, avatar_url } = body;

        // Basic validation
        if (!full_name || !role) {
            return NextResponse.json({ error: 'Nama dan Role wajib diisi' }, { status: 400 });
        }

        const id = generateId();

        await db.execute({
            sql: `INSERT INTO users (id, nim, email, full_name, role, username, password, position, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                nim || null,
                `${id}@placeholder.com`, // Dummy email if not provided
                full_name,
                role,
                username || null,
                password || null,
                position || 'Anggota',
                avatar_url || null
            ]
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, nim, full_name, username, password, position, avatar_url } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        let query = 'UPDATE users SET full_name = ?, position = ?';
        const args: any[] = [full_name, position];

        if (nim !== undefined) {
            query += ', nim = ?';
            args.push(nim);
        }
        if (username !== undefined) {
            query += ', username = ?';
            args.push(username);
        }
        if (password) {
            query += ', password = ?';
            args.push(password);
        }
        if (avatar_url !== undefined) {
            query += ', avatar_url = ?';
            args.push(avatar_url);
        }

        query += ' WHERE id = ?';
        args.push(id);

        await db.execute({ sql: query, args });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.execute({
            sql: 'DELETE FROM users WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
