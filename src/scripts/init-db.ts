import { initializeDatabase } from '../lib/db';

async function init() {
    console.log('🚀 Initializing Database...');
    const result = await initializeDatabase();
    if (result.success) {
        console.log('✅ Database initialized successfully.');
    } else {
        console.error('❌ Database initialization failed:', result.error);
    }
}

init();
