import { createClient } from '@libsql/client';

// Turso Database Client
// Configure with your Turso database URL and auth token
const tursoUrl = process.env.TURSO_DATABASE_URL || '';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || '';

export const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nim TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
        username TEXT UNIQUE,
        password TEXT,
        avatar_url TEXT,
        phone TEXT,
        instagram TEXT,
        position TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        lecturer TEXT NOT NULL,
        credits INTEGER DEFAULT 3,
        semester TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Schedules table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room TEXT NOT NULL,
        type TEXT DEFAULT 'offline' CHECK (type IN ('offline', 'online')),
        meeting_link TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // Student Courses (enrollment) table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS student_courses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id)
      )
    `);

    // Attendances table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        schedule_id TEXT NOT NULL,
        attendance_date TEXT NOT NULL,
        check_in_time TEXT NOT NULL,
        status TEXT DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
        notes TEXT,
        photo_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      )
    `);

    // Blog Posts table
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

    // Password Requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nim TEXT NOT NULL,
        full_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tasks table
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

    // Create indexes for better performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_attendances_user ON attendances(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_attendances_course ON attendances(course_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(attendance_date)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_student_courses_user ON student_courses(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)`);

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}
