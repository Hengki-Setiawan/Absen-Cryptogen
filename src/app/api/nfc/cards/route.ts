import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Auto-migrate NFC tables if they don't exist
async function ensureNFCTables() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS nfc_cards (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                nim TEXT NOT NULL,
                short_id TEXT UNIQUE NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS nfc_sessions (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                schedule_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                attendance_date TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_cards_user ON nfc_cards(user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_cards_short ON nfc_cards(short_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_nfc_sessions_active ON nfc_sessions(is_active)`);
    } catch (error) {
        console.error('Error ensuring NFC tables:', error);
    }
}

// Generate short random ID (12 characters)
function generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// GET - Mendapatkan daftar kartu NFC
export async function GET(req: NextRequest) {
    try {
        await ensureNFCTables();

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
        await ensureNFCTables();

        const body = await req.json();
        const { userId, nim } = body;

        if (!userId || !nim) {
            return NextResponse.json({ error: 'userId and nim are required' }, { status: 400 });
        }

        // Check if user already has an NFC card
        const existing = await db.execute({
            sql: 'SELECT * FROM nfc_cards WHERE user_id = ?',
            args: [userId]
        });

        if (existing.rows.length > 0) {
            const card = existing.rows[0] as any;
            const domain = process.env.NEXT_PUBLIC_SITE_URL || 'https://absen-cryptogen.vercel.app';
            return NextResponse.json({
                success: true,
                message: 'NFC card already exists',
                nfcUrl: `${domain}/nfc/${card.short_id}`,
                shortId: card.short_id,
                isExisting: true
            });
        }

        // Generate short ID
        const shortId = generateShortId();
        const cardId = `nfc_${Date.now()}`;

        // Insert into database
        await db.execute({
            sql: `INSERT INTO nfc_cards (id, user_id, nim, short_id, is_active) 
                  VALUES (?, ?, ?, ?, 1)`,
            args: [cardId, userId, nim, shortId]
        });

        const domain = process.env.NEXT_PUBLIC_SITE_URL || 'https://absen-cryptogen.vercel.app';
        const nfcUrl = `${domain}/nfc/${shortId}`;

        return NextResponse.json({
            success: true,
            nfcUrl,
            shortId,
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

// PUT - Update status kartu NFC
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
