import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.trim().startsWith('#')) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function migrate() {
    console.log('🔧 Adding tasks and site_content tables...');

    try {
        const { db } = await import('../lib/db');

        // Create tasks table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                course_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                deadline DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id)
            )
        `);
        console.log('✅ tasks table created.');

        // Create site_content table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS site_content (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                type TEXT DEFAULT 'text'
            )
        `);
        console.log('✅ site_content table created.');

        // Seed default site content
        const defaults = [
            { key: 'hero_title', value: 'Cryptgen Generation 2023', type: 'text' },
            { key: 'hero_subtitle', value: 'Bisnis Digital UNM', type: 'text' },
            { key: 'hero_description', value: 'Website resmi kelas Bisnis Digital angkatan 2023, Universitas Negeri Makassar.', type: 'text' },
            { key: 'footer_text', value: '© 2023 Cryptgen Generation. Bisnis Digital UNM.', type: 'text' },
        ];

        for (const item of defaults) {
            try {
                const { generateId } = await import('../lib/db');
                await db.execute({
                    sql: 'INSERT INTO site_content (id, key, value, type) VALUES (?, ?, ?, ?)',
                    args: [generateId(), item.key, item.value, item.type]
                });
            } catch (e: any) {
                if (!e.message?.includes('UNIQUE')) console.error(e.message);
            }
        }
        console.log('✅ Default content seeded.');

    } catch (error: any) {
        console.error('❌ Migration error:', error.message);
    }
}

migrate();
