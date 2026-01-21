import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAddressFromCoordinates } from '@/lib/geocoding';

export async function POST() {
    try {
        // 1. Find records with coordinates but NO address
        const result = await db.execute(`
            SELECT id, latitude, longitude 
            FROM attendances 
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL 
            AND (address IS NULL OR address = '')
            LIMIT 20
        `);

        const records = result.rows;
        let updatedCount = 0;

        for (const record of records) {
            const lat = record.latitude as number;
            const lon = record.longitude as number;

            // Add a small delay to respect Nominatim rate limits (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const address = await getAddressFromCoordinates(lat, lon);

            if (address) {
                await db.execute({
                    sql: `UPDATE attendances SET address = ? WHERE id = ?`,
                    args: [address, record.id]
                });
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            updatedCount,
            remaining: records.length - updatedCount
        });

    } catch (error) {
        console.error('Backfill error:', error);
        return NextResponse.json({ error: 'Failed to backfill addresses' }, { status: 500 });
    }
}
