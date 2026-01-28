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

// import { db } from '@/lib/db'; // Dynamic import needed
import bcrypt from 'bcryptjs';

async function fixPasswords() {
    const { db } = await import('@/lib/db');
    console.log('Fixing student passwords...');
    try {
        // Get all students with null passwords
        const result = await db.execute("SELECT id, nim FROM users WHERE role = 'student' AND password IS NULL");

        console.log(`Found ${result.rows.length} students with missing passwords.`);

        for (const row of result.rows) {
            const nim = row.nim as string;
            // Default password is NIM
            const hashedPassword = await bcrypt.hash(nim, 10);

            await db.execute({
                sql: "UPDATE users SET password = ? WHERE id = ?",
                args: [hashedPassword, row.id]
            });
            console.log(`Updated password for NIM: ${nim}`);
        }

        console.log('✅ All passwords updated.');
    } catch (error) {
        console.error('Error fixing passwords:', error);
    }
}

fixPasswords();
