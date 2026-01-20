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
    console.log('Starting migration for Blog and Contacts...');
    try {
        // 1. Create blog_posts table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id TEXT PRIMARY KEY,
                author_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                cover_image TEXT,
                category TEXT DEFAULT 'pengumuman' CHECK (category IN ('pengumuman', 'artikel', 'kegiatan')),
                is_published INTEGER DEFAULT 0,
                published_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)`);
        console.log('Created blog_posts table.');

        // 2. Add instagram column to users table
        try {
            await db.execute(`ALTER TABLE users ADD COLUMN instagram TEXT`);
            console.log('Added instagram column to users table.');
        } catch (e: any) {
            if (e.message.includes('duplicate column name')) {
                console.log('Column instagram already exists.');
            } else {
                console.error('Error adding instagram column:', e);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
