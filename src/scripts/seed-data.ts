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

// === EXACT 44 STUDENTS FROM USER ===
const students = [
    { nim: '220907502011', name: 'KEZIA ABIGAIL SALONG TANGKELANGI' },
    { nim: '220907502014', name: 'DIVANO ANUGRAH' },
    { nim: '220907502054', name: 'AULIA MUGNI SHAFIRA' },
    { nim: '220907502060', name: 'ATIQAH FAKHIRAH MUZAKKIR' },
    { nim: '220907502071', name: 'MUH KHAIRAN ISNAN' },
    { nim: '220907502080', name: 'HANY MELYANI PUTRI' },
    { nim: '230907500014', name: 'MUHAMMAD AL SYAUQI IFTIKHAR' },
    { nim: '230907500021', name: 'NUR AISYAH' },
    { nim: '230907500023', name: 'JESIKA PALEPONG' },
    { nim: '230907500024', name: 'KAYLA NETHANIA SAID' },
    { nim: '230907500025', name: "UMNIATUL ULA'" },
    { nim: '230907500026', name: 'IIT FEBRIANTY IRWAN PUTRI' },
    { nim: '230907500027', name: 'NUR AKMA' },
    { nim: '230907500028', name: 'AMALIA NURUL JANNAH' },
    { nim: '230907500029', name: 'JELSI NASA' },
    { nim: '230907500030', name: 'VENILIANI SANGNGIN' },
    { nim: '230907501026', name: 'ANDI ASHRAF HAK BISYU' },
    { nim: '230907501033', name: 'AHMAD AQIIL FARRAS' },
    { nim: '230907501034', name: 'MUTHIAH ADIBAH' },
    { nim: '230907501035', name: 'MADE RIZAL APRILIAN' },
    { nim: '230907501036', name: 'AFIFAH QONITA MUHARANI' },
    { nim: '230907501037', name: 'MUHAMMAD WILDAN RUSLY' },
    { nim: '230907501038', name: 'NISFALAH ZAHRAH RAHMADANI' },
    { nim: '230907501039', name: 'SITI NURHALIZA ADHANI ASRULLAH' },
    { nim: '230907501040', name: 'HUSAYN KHALILURRAHIM IRFAN' },
    { nim: '230907501041', name: 'MOHAMMAD AFIAT WARGABOJO' },
    { nim: '230907501042', name: 'ARDIYANSA' },
    { nim: '230907501043', name: 'HENGKI SETIAWAN' },
    { nim: '230907501044', name: 'SHASY DUE MAHARDIKA' },
    { nim: '230907501047', name: 'NICHOLAS JECSON' },
    { nim: '230907501048', name: 'NIGEL TRIFOSA SARAPANG ALLORANTE' },
    { nim: '230907502029', name: 'ZAHRA MEIFTA AMALIA' },
    { nim: '230907502030', name: 'NIA RATDANI' },
    { nim: '230907502031', name: 'MUH TAUFIK H' },
    { nim: '230907502032', name: 'ARNISYAH' },
    { nim: '230907502033', name: 'AHMAD ZAKI AL AFIF' },
    { nim: '230907502034', name: 'RAYHAN KUTANA' },
    { nim: '230907502035', name: 'ZULFADLY SYAHPAHLEVI MANGUTERENG' },
    { nim: '230907502036', name: 'AHMAD ARIF HIDAYAT' },
    { nim: '230907502037', name: 'FADYAH PUTRI AMELIAH' },
    { nim: '230907502038', name: 'KAUZAKI' },
    { nim: '230907502039', name: 'ARHAM FATURRAHMAN' },
    { nim: '230907502040', name: 'AL FIRA DAMAYANTI' },
    { nim: '230907502041', name: 'RAISYAH ALIEF KAZRAJ' }
];

// === EXACT SCHEDULE FROM USER ===
const schedules = [
    // SENIN
    { course: 'AE', code: 'AE', day: 'Senin', start: '15:30', end: '18:00', room: 'Online', type: 'online' },

    // SELASA
    { course: 'DRM', code: 'DRM', day: 'Selasa', start: '09:40', end: '12:10', room: 'Bd 202', type: 'offline' },
    { course: 'System Thinking', code: 'ST', day: 'Selasa', start: '15:30', end: '18:00', room: 'Online', type: 'online' },

    // RABU
    { course: 'SIMBIDI (DS)', code: 'DS', day: 'Rabu', start: '13:00', end: '15:30', room: 'Bd 204', type: 'offline' },
    { course: 'Smart City', code: 'SC', day: 'Rabu', start: '07:10', end: '09:40', room: 'Online', type: 'online' },
    { course: 'Big Data', code: 'BD', day: 'Rabu', start: '09:40', end: '12:10', room: 'Online', type: 'online' },

    // KAMIS
    { course: 'GIS', code: 'GIS', day: 'Kamis', start: '09:40', end: '12:10', room: 'Bu 211', type: 'offline' },

    // JUMAT
    { course: 'Supply Chain', code: 'SCM', day: 'Jumat', start: '09:40', end: '12:10', room: 'Online', type: 'online' },
    { course: 'Machine Learning', code: 'ML', day: 'Jumat', start: '13:00', end: '15:30', room: 'Bd 204', type: 'offline' }
];

async function seed() {
    console.log('🌱 Seeding Data (44 Students + 9 Schedules)...');

    try {
        const { db, generateId } = await import('../lib/db');

        // Seed Students
        console.log('Inserting 44 Students...');
        for (const s of students) {
            const id = generateId();
            try {
                await db.execute({
                    sql: `INSERT INTO users (id, nim, email, full_name, role, position) 
                          VALUES (?, ?, ?, ?, 'student', 'Anggota')`,
                    args: [id, s.nim, `${s.nim}@student.unm.ac.id`, s.name]
                });
            } catch (e: any) {
                if (!e.message?.includes('UNIQUE')) console.error(`Failed to insert ${s.name}:`, e.message);
            }
        }

        // Seed Schedules
        console.log('Inserting 9 Schedules...');
        for (const s of schedules) {
            const courseId = generateId();

            // Insert Course
            try {
                await db.execute({
                    sql: `INSERT INTO courses (id, code, name, lecturer, semester) VALUES (?, ?, ?, ?, '5')`,
                    args: [courseId, s.code, s.course, 'Dosen Pengampu']
                });
            } catch (e: any) {
                if (e.message?.includes('UNIQUE')) {
                    console.log(`Course ${s.course} already exists.`);
                    continue;
                }
                console.error(`Failed to insert course ${s.course}:`, e.message);
                continue;
            }

            // Insert Schedule
            const scheduleId = generateId();
            await db.execute({
                sql: `INSERT INTO schedules (id, course_id, day, start_time, end_time, room, type)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [scheduleId, courseId, s.day, s.start, s.end, s.room, s.type]
            });
        }

        console.log('✅ Seeding completed: 44 students + 9 schedules.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seed();
