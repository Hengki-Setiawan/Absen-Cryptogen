'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Loader2, RefreshCw, Trash2, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronNext } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/Skeleton';

type Attendance = {
    id: string;
    attendance_date: string;
    check_in_time: string;
    status: string;
    notes: string;
    photo_url: string;
    nim: string;
    student_name: string;
    course_name: string;
    course_code: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    schedule_start?: string;
    schedule_end?: string;
};

type GroupedData = {
    [date: string]: {
        [course: string]: Attendance[];
    };
};

export default function OverviewManager() {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<string | null>(null);
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Date filter state
    const [filterType, setFilterType] = useState<'all' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Course filter for export
    const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [isCourseExporting, setIsCourseExporting] = useState(false);

    const fetchAttendances = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/attendances?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const responseData = await res.json();

            // Handle both old array format (fallback) and new pagination format
            const data = Array.isArray(responseData) ? responseData : responseData.data;
            const pagination = !Array.isArray(responseData) ? responseData.pagination : null;

            setAttendances(data);

            if (pagination) {
                setTotalPages(pagination.totalPages);
                setTotalRecords(pagination.total);
            }

            // Auto-expand first date
            if (data.length > 0) {
                setExpandedDates(new Set([data[0].attendance_date]));
            }
        } catch (error) {
            console.error('Error fetching attendances:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    const runCleanup = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/cleanup', { method: 'POST' });
            const data = await res.json();
            if (data.deletedCount > 0) {
                setCleanupResult(`✓ ${data.deletedCount} foto lama dihapus`);
                setTimeout(() => setCleanupResult(null), 5000);
                fetchAttendances();
            } else {
                setCleanupResult('✓ Tidak ada foto yang perlu dihapus');
                setTimeout(() => setCleanupResult(null), 3000);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }, [fetchAttendances]);

    useEffect(() => {
        fetchAttendances();
        // Fetch courses for dropdown
        fetch('/api/courses').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setCourses(data);
        }).catch(console.error);
    }, [fetchAttendances]);

    const handleCourseExport = async () => {


        setIsCourseExporting(true);
        try {
            let url = '';
            let filename = '';

            // Determine API Endpoint based on selection
            if (!selectedCourseId || selectedCourseId === 'all') {
                url = '/api/admin/export/all';
                filename = 'Rekap_Absensi_Semua.xlsx';
            } else {
                url = `/api/admin/export/attendance?courseId=${selectedCourseId}`;
                const course = courses.find(c => c.id === selectedCourseId);
                filename = `Rekap_${course?.name || 'Course'}.xlsx`;
            }

            // Add date filters if custom is selected
            // Add date filters
            const params = new URLSearchParams();

            if (filterType === 'custom' && startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            } else if (filterType === 'week') {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                params.append('startDate', weekAgo.toISOString().split('T')[0]);
                params.append('endDate', today.toISOString().split('T')[0]);
            } else if (filterType === 'month') {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                params.append('startDate', monthAgo.toISOString().split('T')[0]);
                params.append('endDate', today.toISOString().split('T')[0]);
            }

            // Append params to URL
            if (url.includes('?')) {
                url += '&' + params.toString();
            } else {
                url += '?' + params.toString();
            }

            const res = await fetch(url);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Export failed');
            }

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error('Export error:', error);
            alert('Gagal export: ' + error.message);
        } finally {
            setIsCourseExporting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus data absensi ini? Foto juga akan dihapus dari storage.')) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/attendances/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setAttendances(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            alert('Gagal menghapus data');
        } finally {
            setDeletingId(null);
        }
    };

    const handleExportExcel = () => {
        setIsExporting(true);
        try {
            const exportData = attendances.map((a, index) => {
                // Determine Method
                let method = 'Manual (Foto)';
                if (a.photo_url === 'NFC_SCAN') method = 'NFC Card';
                else if (a.photo_url === 'QR_SUBMISSION') method = 'QR Code';

                const checkInDate = new Date(a.check_in_time);

                return {
                    'No': index + 1,
                    'Jadwal Kuliah': a.attendance_date, // Tanggal sesuai jadwal
                    'Tanggal Scan': checkInDate.toLocaleDateString('id-ID'), // Tanggal aktual absen
                    'Jam Scan': checkInDate.toLocaleTimeString('id-ID'), // Jam aktual absen
                    'NIM': a.nim,
                    'Nama Mahasiswa': a.student_name,
                    'Mata Kuliah': a.course_name,
                    'Metode': method,
                    'Status': a.status,
                    'Keterangan': a.notes || '-',
                    'Lokasi': a.address || '-',
                    'Maps Link': a.latitude && a.longitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '-'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

            const fileName = `Absensi_Cryptgen_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            alert('Gagal export Excel');
        } finally {
            setIsExporting(false);
        }
    };

    // Export specific course on specific date
    const handleExportCourse = (date: string, courseName: string, items: Attendance[]) => {
        try {
            const exportData = items.map((a, index) => {
                // Determine Method
                let method = 'Manual (Foto)';
                if (a.photo_url === 'NFC_SCAN') method = 'NFC Card';
                else if (a.photo_url === 'QR_SUBMISSION') method = 'QR Code';

                return {
                    'No': index + 1,
                    'NIM': a.nim,
                    'Nama Mahasiswa': a.student_name,
                    'Waktu Absen': a.check_in_time,
                    'Metode': method,
                    'Status': a.status?.toUpperCase() || 'HADIR',
                    'Keterangan': a.notes || '-',
                    'Lokasi': a.address || '-',
                    'Maps Link': a.latitude && a.longitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '-'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

            // Clean course name for filename
            const cleanCourseName = courseName.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Absensi_${cleanCourseName}_${date}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            alert('Gagal export Excel');
        }
    };

    // Filter attendances by date range
    const getFilteredAttendances = () => {
        if (filterType === 'all') return attendances;

        const today = new Date();
        let start: Date, end: Date;

        if (filterType === 'week') {
            start = new Date(today);
            start.setDate(today.getDate() - 7);
            end = today;
        } else if (filterType === 'month') {
            start = new Date(today);
            start.setMonth(today.getMonth() - 1);
            end = today;
        } else {
            // custom
            start = startDate ? new Date(startDate) : new Date(0);
            end = endDate ? new Date(endDate) : new Date();
        }

        return attendances.filter(a => {
            const date = new Date(a.attendance_date);
            return date >= start && date <= end;
        });
    };

    const filteredAttendances = getFilteredAttendances();

    // Group data by date then course
    const groupedData: GroupedData = filteredAttendances.reduce((acc, item) => {
        const date = item.attendance_date;
        const course = item.course_name;

        if (!acc[date]) acc[date] = {};
        if (!acc[date][course]) acc[date][course] = [];
        acc[date][course].push(item);

        return acc;
    }, {} as GroupedData);

    const toggleDate = (date: string) => {
        setExpandedDates(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    const toggleCourse = (key: string) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const [isBackfilling, setIsBackfilling] = useState(false);

    const handleBackfill = async () => {
        setIsBackfilling(true);
        try {
            const res = await fetch('/api/admin/backfill-addresses', { method: 'POST' });
            const data = await res.json();
            if (data.updatedCount > 0) {
                setCleanupResult(`✓ ${data.updatedCount} lokasi berhasil diperbarui!`);
                setTimeout(() => setCleanupResult(null), 5000);
                fetchAttendances();
            } else {
                setCleanupResult('✓ Semua data lokasi sudah lengkap');
                setTimeout(() => setCleanupResult(null), 3000);
            }
        } catch (error) {
            alert('Gagal memperbarui lokasi');
        } finally {
            setIsBackfilling(false);
        }
    };

    return (
        <div>
            {cleanupResult && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    {cleanupResult}
                </div>
            )}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Rekap Absensi</h3>
                    <p className="text-sm text-slate-500">Total {totalRecords} data (Halaman {page} dari {totalPages})</p>
                </div>

                <div className="w-full md:w-auto flex flex-wrap gap-2 mb-2 md:mb-0">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">Semua Waktu</option>
                        <option value="week">7 Hari Terakhir</option>
                        <option value="month">30 Hari Terakhir</option>
                        <option value="custom">Pilih Tanggal</option>
                    </select>

                    {filterType === 'custom' && (
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                            <span className="self-center">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                    )}

                    {/* Course Selection for Export */}
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
                    >
                        <option value="all">Semua Mata Kuliah</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.code} - {course.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleCourseExport}
                        disabled={isCourseExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isCourseExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        {(!selectedCourseId || selectedCourseId === 'all') ? 'Export Semua' : 'Export Matkul'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={handleBackfill} disabled={isBackfilling} className="flex items-center gap-2 px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                        <RefreshCw className={`w-4 h-4 ${isBackfilling ? 'animate-spin' : ''}`} /> {isBackfilling ? 'Memperbarui...' : 'Update Lokasi'}
                    </button>
                    <button onClick={runCleanup} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        <Trash2 className="w-4 h-4" /> Cleanup
                    </button>
                    <button onClick={fetchAttendances} disabled={isLoading} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>

                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-5 h-5 rounded-full" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : attendances.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Belum ada data absensi</div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(groupedData).sort((a, b) => b[0].localeCompare(a[0])).map(([date, courses]) => (
                        <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleDate(date)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedDates.has(date) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    <span className="font-bold text-slate-700">{date}</span>
                                    <span className="text-sm text-slate-500">({Object.values(courses).flat().length} absensi)</span>
                                </div>
                            </button>

                            {expandedDates.has(date) && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(courses).map(([course, items]) => {
                                        const courseKey = `${date}-${course}`;
                                        return (
                                            <div key={courseKey} className="border border-slate-100 rounded-lg overflow-hidden">
                                                <div className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                                                    <button
                                                        onClick={() => toggleCourse(courseKey)}
                                                        className="flex items-center gap-2 flex-1"
                                                    >
                                                        {expandedCourses.has(courseKey) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                        <span className="font-medium text-blue-600">{course}</span>
                                                        <span className="text-xs text-slate-500">({items.length} siswa)</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportCourse(date, course, items)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                        title={`Export ${course} - ${date}`}
                                                    >
                                                        <FileSpreadsheet className="w-3 h-3" />
                                                        Export
                                                    </button>
                                                </div>

                                                {expandedCourses.has(courseKey) && (
                                                    <div className="divide-y divide-slate-100">
                                                        {items.map(a => (
                                                            <div key={a.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                                        {a.student_name}
                                                                        {(() => {
                                                                            if (!a.schedule_start) return null;

                                                                            // Calculate Lateness
                                                                            // check_in_time is ISO string (UTC or Server Time)
                                                                            // attendance_date is YYYY-MM-DD
                                                                            // schedule_start is HH:mm

                                                                            // Create Date objects
                                                                            const checkIn = new Date(a.check_in_time);

                                                                            // Construct Schedule Date
                                                                            // Assuming attendance_date is correct date
                                                                            const scheduleDate = new Date(a.attendance_date + 'T' + a.schedule_start);

                                                                            // Adjust for Timezone if needed?
                                                                            // If check_in_time is UTC, and scheduleDate is local...
                                                                            // Let's assume both are comparable or check difference

                                                                            // Better approach: Get HH:mm from checkIn and compare with schedule_start
                                                                            // But this fails if late into next day.

                                                                            // Let's use the full date comparison
                                                                            // We need to know the timezone of the server/user.
                                                                            // Assuming WITA (UTC+8) for schedule times.

                                                                            // Hack: Treat checkIn as if it's in the same timezone context
                                                                            // checkIn.toLocaleString('en-US', { timeZone: 'Asia/Makassar' })

                                                                            const checkInWita = new Date(checkIn.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
                                                                            const scheduleWita = new Date(a.attendance_date + 'T' + a.schedule_start);

                                                                            // Calculate diff in minutes
                                                                            const diffMs = checkInWita.getTime() - scheduleWita.getTime();
                                                                            const diffMins = Math.floor(diffMs / 60000);

                                                                            if (diffMins > 0) {
                                                                                let lateText = '';
                                                                                if (diffMins > 1440) lateText = `> 1 hari`;
                                                                                else if (diffMins >= 60) lateText = `${Math.floor(diffMins / 60)} jam ${diffMins % 60} mnt`;
                                                                                else lateText = `${diffMins} mnt`;

                                                                                // "Kalau telat 1-2 jam tidak apa apa"
                                                                                // Severity check: > 120 mins (2 hours) is Red, otherwise Yellow
                                                                                const isSevere = diffMins > 120;
                                                                                const badgeClass = isSevere
                                                                                    ? "bg-red-100 text-red-600 border-red-200"
                                                                                    : "bg-yellow-100 text-yellow-700 border-yellow-200";

                                                                                return (
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                                                                        Telat {lateText}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {a.nim} • {new Date(a.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                        {a.schedule_start && <span className="text-slate-400 ml-1">(Jadwal: {a.schedule_start})</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'hadir' ? 'bg-green-100 text-green-700' :
                                                                        a.status === 'izin' ? 'bg-yellow-100 text-yellow-700' :
                                                                            a.status === 'sakit' ? 'bg-blue-100 text-blue-700' :
                                                                                'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {a.status?.toUpperCase() || 'HADIR'}
                                                                    </span>
                                                                    {a.photo_url && (
                                                                        <a href={a.photo_url} target="_blank" className="text-blue-600 hover:underline text-xs">Foto</a>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDelete(a.id)}
                                                                        disabled={deletingId === a.id}
                                                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                                        title="Hapus"
                                                                    >
                                                                        {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600">
                    Halaman {page} dari {totalPages}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                    <ChevronNext className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
