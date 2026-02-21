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

async function fixPasswords() {
    const { db } = await import('@/lib/db');
    console.log('Force resetting all student passwords to their NIM (plaintext)...');
    try {
        // Get all students
        const result = await db.execute("SELECT id, nim FROM users WHERE role = 'student'");

        console.log(`Found ${result.rows.length} students. Updating to plaintext NIM...`);

        let count = 0;
        for (const row of result.rows) {
            const nim = row.nim as string;
            if (!nim) continue;

            // Raw NIM without hashing
            await db.execute({
                sql: "UPDATE users SET password = ? WHERE id = ?",
                args: [nim, row.id]
            });
            count++;
        }

        console.log(`✅ ${count} passwords forcefully set to plaintext NIM.`);
    } catch (error) {
        console.error('Error fixing passwords:', error);
    }
}

fixPasswords();
