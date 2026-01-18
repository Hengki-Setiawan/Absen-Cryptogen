import fs from 'fs';
import path from 'path';

// Manually load .env.local since we are running this script directly with tsx
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim();
            if (trimmedKey && !trimmedKey.startsWith('#')) {
                process.env[trimmedKey] = trimmedValue;
            }
        }
    });
} else {
    console.warn('Warning: .env.local file not found!');
}

async function main() {
    console.log('Initializing database schema...');
    console.log('Turso URL:', process.env.TURSO_DATABASE_URL ? 'Set' : 'Not Set');

    try {
        // Dynamic import to ensure env vars are loaded first
        const { initializeDatabase } = await import('../lib/db');

        const result = await initializeDatabase();
        if (result.success) {
            console.log('✅ Database initialized successfully!');
        } else {
            console.error('❌ Failed to initialize database:', result.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

main();
