import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';

// UNM Parangtambung coordinates
const UNM_LAT = -5.181667;
const UNM_LONG = 119.425278;

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

// Format distance for display
function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, courseId, attendanceDate, status, notes, photoUrl, isQr, latitude, longitude } = body;

        // Validate required fields
        if (!studentId || !courseId || !attendanceDate || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isQr && !photoUrl) {
            return NextResponse.json({ error: 'Photo is required for manual attendance' }, { status: 400 });
        }

        // Calculate distance info (fast, no external API)
        let distanceInfo = '';
        if (latitude && longitude) {
            const distance = calculateDistance(latitude, longitude, UNM_LAT, UNM_LONG);
            distanceInfo = `[Jarak dari UNM: ${formatDistance(distance)}]`;
        }

        // Get schedule's course_id and check for duplicate in a single query
        const scheduleResult = await db.execute({
            sql: 'SELECT course_id FROM schedules WHERE id = ?',
            args: [courseId]
        });

        if (scheduleResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
        }

        const realCourseId = scheduleResult.rows[0].course_id;

        // Rate Limiting: Check if student already submitted
        const existingAttendance = await db.execute({
            sql: `SELECT id FROM attendances WHERE user_id = ? AND schedule_id = ? AND attendance_date = ? LIMIT 1`,
            args: [studentId, courseId, attendanceDate]
        });

        if (existingAttendance.rows.length > 0) {
            return NextResponse.json({
                error: 'Anda sudah absen untuk mata kuliah ini hari ini.'
            }, { status: 429 });
        }

        const attendanceId = generateId();
        const serverTimestamp = new Date().toISOString();

        // Combine notes with distance info
        const finalNotes = distanceInfo
            ? (notes ? `${notes} ${distanceInfo}` : distanceInfo)
            : (notes || '');

        // Insert attendance (skip address for now - will be fetched in background later)
        await db.execute({
            sql: `INSERT INTO attendances (
                id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                studentId,
                realCourseId,
                courseId,
                attendanceDate,
                serverTimestamp,
                status,
                finalNotes,
                photoUrl || (isQr ? 'QR_SUBMISSION' : null),
                latitude || null,
                longitude || null
            ]
        });

        return NextResponse.json({ success: true, id: attendanceId, distance: distanceInfo });
    } catch (error) {
        console.error('Attendance submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
