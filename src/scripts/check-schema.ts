import { db } from '@/lib/db';

async function checkSchema() {
    console.log('Checking schema...');
    try {
        // SQLite/LibSQL specific query to get table info
        const result = await db.execute("PRAGMA table_info(attendances)");
        console.log('Columns in attendances table:');
        for (const row of result.rows) {
            console.log(`- ${row.name} (${row.type})`);
        }
    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkSchema();
