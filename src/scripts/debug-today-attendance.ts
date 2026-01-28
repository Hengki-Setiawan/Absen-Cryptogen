import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.trim().startsWith('#')) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function debugToday() {
    const { db } = await import('@/lib/db');
    console.log('Listing ALL attendance for 2026-01-28...');
    try {
        const result = await db.execute(`
            SELECT 
                a.id, 
                u.full_name, 
                c.name as course, 
                a.attendance_date, 
                a.created_at,
                a.photo_url
            FROM attendances a
            JOIN users u ON a.user_id = u.id
            JOIN courses c ON a.course_id = c.id
            WHERE a.attendance_date = '2026-01-28'
            ORDER BY a.created_at DESC
        `);

        console.log(`Found ${result.rows.length} records:`);
        result.rows.forEach(row => {
            console.log(`[${row.created_at}] ${row.full_name} - ${row.course} (${row.photo_url})`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugToday();
