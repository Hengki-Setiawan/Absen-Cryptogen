import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function GET() {
    const result = await initializeDatabase();
    return NextResponse.json(result);
}
