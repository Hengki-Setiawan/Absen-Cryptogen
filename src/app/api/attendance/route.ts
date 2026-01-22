import { NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db';
import { getAddressFromCoordinates } from '@/lib/geocoding';

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
        const { studentId, courseId, attendanceDate, status, notes, photoUrl, timestamp, isQr, latitude, longitude } = body;

        // Validate required fields
        // If isQr is true, photoUrl is NOT required
        if (!studentId || !courseId || !attendanceDate || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isQr && !photoUrl) {
            return NextResponse.json({ error: 'Photo is required for manual attendance' }, { status: 400 });
        }

        // Ensure location columns exist (Auto-migration)
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN latitude REAL`); } catch (e) { }
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN longitude REAL`); } catch (e) { }
        try { await db.execute(`ALTER TABLE attendances ADD COLUMN address TEXT`); } catch (e) { }

        // Get Address if location is provided
        let address = null;
        let distanceInfo = '';
        if (latitude && longitude) {
            address = await getAddressFromCoordinates(latitude, longitude);

            // Calculate and format distance from UNM
            const distance = calculateDistance(latitude, longitude, UNM_LAT, UNM_LONG);
            distanceInfo = `[Jarak dari UNM: ${formatDistance(distance)}]`;
        }

        // Insert into attendances table
        // Note: courseId here is actually the SCHEDULE ID from the dropdown.
        // We need to fetch the real `course_id` from the `schedules` table.

        const scheduleResult = await db.execute({
            sql: 'SELECT course_id FROM schedules WHERE id = ?',
            args: [courseId]
        });

        if (scheduleResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
        }

        const realCourseId = scheduleResult.rows[0].course_id;

        // Rate Limiting: Check if student already submitted for this course on this date
        const existingAttendance = await db.execute({
            sql: `SELECT id FROM attendances 
                  WHERE user_id = ? AND schedule_id = ? AND attendance_date = ?`,
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

        await db.execute({
            sql: `INSERT INTO attendances (
        id, user_id, course_id, schedule_id, attendance_date, check_in_time, status, notes, photo_url, latitude, longitude, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                attendanceId,
                studentId,
                realCourseId,
                courseId, // schedule_id
                attendanceDate, // attendance_date from form (Schedule Date)
                serverTimestamp, // check_in_time (Server Time - Secure)
                status,
                finalNotes,
                photoUrl || (isQr ? 'QR_SUBMISSION' : null),
                latitude || null,
                longitude || null,
                address || null
            ]
        });

        return NextResponse.json({ success: true, id: attendanceId, address, distance: distanceInfo });
    } catch (error) {
        console.error('Attendance submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
