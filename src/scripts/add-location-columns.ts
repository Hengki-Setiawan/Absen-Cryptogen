import { db } from '@/lib/db';

async function migrate() {
    console.log('Migrating database to add location columns...');
    try {
        // Add latitude and longitude columns to attendances table
        await db.execute(`ALTER TABLE attendances ADD COLUMN latitude REAL`);
        await db.execute(`ALTER TABLE attendances ADD COLUMN longitude REAL`);
        console.log('✅ Added latitude and longitude columns to attendances table');
    } catch (error: any) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️ Columns already exist, skipping...');
        } else {
            console.error('❌ Migration failed:', error);
        }
    }
}

migrate();
