import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility untuk merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format tanggal ke bahasa Indonesia
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Format waktu
export function formatTime(time: string): string {
    return time.slice(0, 5); // HH:MM
}

// Format tanggal pendek
export function formatDateShort(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// Capitalize first letter
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generate initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Get attendance status color
export function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'hadir':
            return 'badge-success';
        case 'izin':
            return 'badge-warning';
        case 'sakit':
            return 'badge-info';
        case 'alpha':
            return 'badge-error';
        default:
            return 'badge-info';
    }
}

// Get attendance status label
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        hadir: 'Hadir',
        izin: 'Izin',
        sakit: 'Sakit',
        alpha: 'Alpha',
    };
    return labels[status.toLowerCase()] || status;
}

// Get day name in Indonesian
export function getDayName(day: number): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[day];
}

// Check if class is currently active based on schedule
export function isClassActive(
    day: string,
    startTime: string,
    endTime: string
): boolean {
    const now = new Date();
    const currentDay = getDayName(now.getDay());

    if (day !== currentDay) return false;

    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= startTime && currentTime <= endTime;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Validate NIM format (adjust based on UNM format)
export function validateNIM(nim: string): boolean {
    // Assuming NIM is 10-15 digits
    return /^\d{10,15}$/.test(nim);
}

// File size formatter
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Calculate attendance percentage
export function calculateAttendancePercentage(
    hadir: number,
    total: number
): number {
    if (total === 0) return 0;
    return Math.round((hadir / total) * 100);
}
