import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : '';
};

const tursoUrl = getEnv('TURSO_DATABASE_URL');
const tursoAuthToken = getEnv('TURSO_AUTH_TOKEN');

if (!tursoUrl || !tursoAuthToken) {
    console.error('Missing Turso credentials');
    process.exit(1);
}

const db = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
});

async function migrate() {
    console.log('Starting migration for tasks table...');
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                deadline TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_course ON tasks(course_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
