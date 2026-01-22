import { db } from '@/lib/db';

export interface ChatContext {
    schedules: string;
    tasks: string;
    currentDate: string;
    currentDay: string;
}

// Days mapping for Indonesian to English
const dayMap: { [key: string]: string } = {
    'Senin': 'Monday',
    'Selasa': 'Tuesday',
    'Rabu': 'Wednesday',
    'Kamis': 'Thursday',
    'Jumat': 'Friday',
    'Sabtu': 'Saturday',
    'Minggu': 'Sunday'
};

export async function getChatContext(): Promise<ChatContext> {
    const now = new Date();
    const indonesianDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Makassar' }).format(now);
    const currentDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Makassar'
    }).format(now);

    // Fetch schedules with course info
    let schedulesText = 'Tidak ada jadwal tersedia.';
    try {
        const schedulesResult = await db.execute(`
            SELECT 
                s.day, s.start_time, s.end_time, s.room, s.type, s.meeting_link,
                c.name as course_name, c.code as course_code, c.lecturer
            FROM schedules s
            JOIN courses c ON s.course_id = c.id
            ORDER BY 
                CASE s.day 
                    WHEN 'Senin' THEN 1 
                    WHEN 'Selasa' THEN 2 
                    WHEN 'Rabu' THEN 3 
                    WHEN 'Kamis' THEN 4 
                    WHEN 'Jumat' THEN 5 
                    WHEN 'Sabtu' THEN 6 
                END,
                s.start_time
        `);

        if (schedulesResult.rows.length > 0) {
            const schedulesByDay: { [key: string]: string[] } = {};

            for (const row of schedulesResult.rows) {
                const day = row.day as string;
                if (!schedulesByDay[day]) {
                    schedulesByDay[day] = [];
                }
                const typeInfo = row.type === 'online' ? `Online${row.meeting_link ? ` (${row.meeting_link})` : ''}` : `Offline di ${row.room}`;
                schedulesByDay[day].push(
                    `- ${row.start_time}-${row.end_time}: ${row.course_name} (${row.course_code}) oleh ${row.lecturer} [${typeInfo}]`
                );
            }

            schedulesText = Object.entries(schedulesByDay)
                .map(([day, items]) => `${day}:\n${items.join('\n')}`)
                .join('\n\n');
        }
    } catch (error) {
        console.error('Error fetching schedules for chatbot:', error);
    }

    // Fetch tasks
    let tasksText = 'Tidak ada tugas aktif.';
    try {
        const tasksResult = await db.execute(`
            SELECT 
                t.title, t.description, t.deadline,
                c.name as course_name
            FROM tasks t
            JOIN courses c ON t.course_id = c.id
            WHERE t.deadline >= date('now')
            ORDER BY t.deadline ASC
            LIMIT 20
        `);

        if (tasksResult.rows.length > 0) {
            tasksText = tasksResult.rows.map((row) => {
                const deadline = new Date(row.deadline as string);
                const formattedDeadline = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Makassar'
                }).format(deadline);
                return `- ${row.title} (${row.course_name}): Deadline ${formattedDeadline}${row.description ? ` - ${row.description}` : ''}`;
            }).join('\n');
        }
    } catch (error) {
        console.error('Error fetching tasks for chatbot:', error);
    }

    return {
        schedules: schedulesText,
        tasks: tasksText,
        currentDate,
        currentDay: indonesianDay
    };
}

export function buildSystemPrompt(context: ChatContext): string {
    return `Kamu adalah asisten AI untuk Cryptgen Class 2023, kelas Bisnis Digital di Universitas Negeri Makassar (UNM).

INFORMASI PENTING:
- Hari ini: ${context.currentDate}
- Lokasi kampus: UNM Parangtambung, Makassar

JADWAL KULIAH:
${context.schedules}

TUGAS AKTIF:
${context.tasks}

ATURAN:
1. Jawab dalam Bahasa Indonesia dengan ramah dan membantu.
2. Gunakan informasi di atas untuk menjawab pertanyaan tentang jadwal dan tugas.
3. JANGAN PERNAH memberikan informasi password, data pribadi mahasiswa, atau informasi sensitif lainnya.
4. Jika ditanya tentang password atau data sensitif, tolak dengan sopan dan jelaskan bahwa informasi tersebut tidak dapat dibagikan.
5. Jika tidak tahu jawabannya, katakan dengan jujur.
6. Berikan jawaban yang singkat dan jelas.`;
}
