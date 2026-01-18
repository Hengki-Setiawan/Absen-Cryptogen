import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

async function seedAdmin() {
    console.log('🌱 Seeding Admin User...');

    try {
        const { db } = await import('../lib/db');

        // Check if admin exists
        const existing = await db.execute({
            sql: "SELECT * FROM users WHERE username = ?",
            args: ['admin123']
        });

        if (existing.rows.length > 0) {
            console.log('⚠️ Admin user already exists.');
            // Update password just in case
            await db.execute({
                sql: "UPDATE users SET password = ?, role = 'admin' WHERE username = ?",
                args: ['bisdig23feb', 'admin123']
            });
            console.log('✅ Admin password updated.');
            return;
        }

        // Insert Admin
        await db.execute({
            sql: `INSERT INTO users (id, nim, email, full_name, role, username, password, position) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                uuidv4(),
                'admin',
                'admin@cryptgen.com',
                'Super Admin',
                'admin',
                'admin123',
                'bisdig23feb',
                'Administrator'
            ]
        });

        console.log('✅ Admin user created successfully.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedAdmin();
