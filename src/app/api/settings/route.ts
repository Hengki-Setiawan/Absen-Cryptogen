import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Ensure settings table exists
async function ensureSettingsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS site_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        // Table might already exist
    }
}

// Default settings
const DEFAULT_SETTINGS = {
    require_location: 'true'
};

// GET - Fetch settings
export async function GET() {
    try {
        await ensureSettingsTable();

        const result = await db.execute('SELECT key, value FROM site_settings');

        // Merge with defaults
        const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
        for (const row of result.rows) {
            settings[row.key as string] = row.value as string;
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST - Update a setting
export async function POST(request: NextRequest) {
    try {
        await ensureSettingsTable();

        const { key, value } = await request.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
        }

        // Upsert the setting
        await db.execute({
            sql: `INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
            args: [key, String(value)]
        });

        return NextResponse.json({ success: true, key, value });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
