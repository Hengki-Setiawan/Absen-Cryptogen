import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

// GET - Mendapatkan daftar kartu NFC
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        let query = `
            SELECT nc.*, u.full_name, u.nim 
            FROM nfc_cards nc
            JOIN users u ON nc.user_id = u.id
        `;

        if (userId) {
            query += ` WHERE nc.user_id = ?`;
            const result = await db.execute({ sql: query, args: [userId] });
            return NextResponse.json(result.rows);
        }

        const result = await db.execute(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching NFC cards:', error);
        return NextResponse.json({ error: 'Failed to fetch NFC cards' }, { status: 500 });
    }
}

// POST - Generate NFC link untuk mahasiswa
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, nim } = body;

        console.log('NFC Card Generation Request:', { userId, nim });

        if (!userId || !nim) {
            return NextResponse.json({ error: 'userId and nim are required' }, { status: 400 });
        }

        // Check if user already has an NFC card
        const existing = await db.execute({
            sql: 'SELECT * FROM nfc_cards WHERE user_id = ?',
            args: [userId]
        });

        if (existing.rows.length > 0) {
            return NextResponse.json({
                error: 'User already has an NFC card',
                card: existing.rows[0]
            }, { status: 400 });
        }

        // Generate unique NFC URL
        const cardId = generateId();
        const nfcToken = Buffer.from(JSON.stringify({
            userId,
            nim,
            cardId,
            timestamp: Date.now()
        })).toString('base64');

        const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const nfcUrl = `${domain}/nfc-attend?token=${nfcToken}`;

        console.log('Generated NFC URL:', nfcUrl);

        // Insert into database
        await db.execute({
            sql: `INSERT INTO nfc_cards (id, user_id, nim, nfc_url, is_active) 
                  VALUES (?, ?, ?, ?, 1)`,
            args: [cardId, userId, nim, nfcUrl]
        });

        console.log('NFC Card created successfully:', cardId);

        return NextResponse.json({
            success: true,
            nfcUrl,
            cardId
        });
    } catch (error: any) {
        console.error('Error creating NFC card:', error);
        return NextResponse.json({
            error: 'Failed to create NFC card',
            details: error.message
        }, { status: 500 });
    }
}

// PUT - Update status kartu NFC (activate/deactivate)
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { cardId, isActive } = body;

        if (!cardId || isActive === undefined) {
            return NextResponse.json({ error: 'cardId and isActive are required' }, { status: 400 });
        }

        await db.execute({
            sql: 'UPDATE nfc_cards SET is_active = ? WHERE id = ?',
            args: [isActive ? 1 : 0, cardId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating NFC card:', error);
        return NextResponse.json({ error: 'Failed to update NFC card' }, { status: 500 });
    }
}

// DELETE - Hapus kartu NFC
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cardId = searchParams.get('id');

        if (!cardId) {
            return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
        }

        await db.execute({
            sql: 'DELETE FROM nfc_cards WHERE id = ?',
            args: [cardId]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting NFC card:', error);
        return NextResponse.json({ error: 'Failed to delete NFC card' }, { status: 500 });
    }
}
