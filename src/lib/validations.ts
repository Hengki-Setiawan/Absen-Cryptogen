import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});

export const attendanceSchema = z.object({
    studentId: z.string().min(1, 'Student ID wajib diisi'),
    courseId: z.string().min(1, 'Course ID wajib diisi'), // This is actually scheduleId in the client
    attendanceDate: z.string().min(1, 'Tanggal absen wajib diisi'),
    status: z.enum(['hadir', 'izin', 'sakit', 'alpha']),
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
    isQr: z.boolean().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});
