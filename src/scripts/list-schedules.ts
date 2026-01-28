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

async function listSchedules() {
    const { db } = await import('@/lib/db');
    console.log('Listing all schedules...');
    try {
        const result = await db.execute(`
            SELECT s.id, c.name, c.code, s.day, s.start_time 
            FROM schedules s 
            JOIN courses c ON s.course_id = c.id 
            ORDER BY c.name ASC
        `);

        console.log(`Found ${result.rows.length} schedules:`);
        result.rows.forEach(row => {
            console.log(`[${row.name}] (${row.code}) - ${row.day} ${row.start_time} | ID: ${row.id}`);
        });

    } catch (error) {
        console.error('Error listing schedules:', error);
    }
}

listSchedules();
