// ========================================
// TYPE DEFINITIONS FOR CRYPTGEN CLASS
// ========================================

// User / Mahasiswa
export interface User {
    id: string;
    nim: string;
    email: string;
    full_name: string;
    role: 'admin' | 'student';
    avatar_url?: string;
    phone?: string;
    position?: string; // Ketua, Wakil, Bendahara, Sekretaris, Anggota
    created_at: string;
}

// Mata Kuliah
export interface Course {
    id: string;
    code: string;
    name: string;
    lecturer: string;
    credits: number;
    semester: string;
    description?: string;
    is_active: boolean;
}

// Jadwal Perkuliahan
export interface Schedule {
    id: string;
    course_id: string;
    day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    room: string;
    type: 'offline' | 'online';
    meeting_link?: string;
}

// Schedule with course details (joined)
export interface ScheduleWithCourse extends Schedule {
    course: Course;
}

// Mahasiswa enrolled in a course
export interface StudentCourse {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string;
}

// StudentCourse with details
export interface StudentCourseWithDetails extends StudentCourse {
    course: Course;
    user: User;
}

// Attendance Status
export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

// Absensi
export interface Attendance {
    id: string;
    user_id: string;
    course_id: string;
    schedule_id: string;
    attendance_date: string;
    check_in_time: string;
    status: AttendanceStatus;
    notes?: string;
    photo_url?: string;
    created_at: string;
}

// Attendance with details (joined)
export interface AttendanceWithDetails extends Attendance {
    user: User;
    course: Course;
    schedule: Schedule;
}

// Blog Post
export interface BlogPost {
    id: string;
    author_id: string;
    title: string;
    content: string;
    cover_image?: string;
    category: 'pengumuman' | 'artikel' | 'kegiatan';
    is_published: boolean;
    published_at?: string;
    created_at: string;
}

// BlogPost with author
export interface BlogPostWithAuthor extends BlogPost {
    author: User;
}

// Class Organization Structure
export interface ClassOrganization {
    name: string;
    position: string;
    nim?: string;
    avatar_url?: string;
}

// Dashboard Stats
export interface DashboardStats {
    totalStudents: number;
    totalCourses: number;
    totalBlogPosts: number;
    todayAttendance: number;
    weeklyAttendanceRate: number;
}

// Attendance Summary by Course
export interface AttendanceSummary {
    course_id: string;
    course_name: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    total: number;
    percentage: number;
}

// Calendar Event for FullCalendar
export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    extendedProps?: {
        course_id: string;
        room: string;
        type: 'offline' | 'online';
        lecturer: string;
        meeting_link?: string;
    };
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Pagination
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Form States
export interface FormState {
    isLoading: boolean;
    error: string | null;
    success: boolean;
}

// Filter Options
export interface AttendanceFilters {
    course_id?: string;
    status?: AttendanceStatus;
    date_from?: string;
    date_to?: string;
    user_id?: string;
}

export interface BlogFilters {
    category?: 'pengumuman' | 'artikel' | 'kegiatan';
    is_published?: boolean;
    search?: string;
}

// Export Format
export type ExportFormat = 'excel' | 'pdf';

// Notification
export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
}
