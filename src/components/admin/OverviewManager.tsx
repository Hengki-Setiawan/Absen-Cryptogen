'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Loader2, RefreshCw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

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

    // Date filter state
    const [filterType, setFilterType] = useState<'all' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchAttendances = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/attendances');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setAttendances(data);
            // Auto-expand first date
            if (data.length > 0) {
                setExpandedDates(new Set([data[0].attendance_date]));
            }
        } catch (error) {
            console.error('Error fetching attendances:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
    }, [fetchAttendances]);

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
            const exportData = attendances.map((a, index) => ({
                'No': index + 1,
                'Tanggal': a.attendance_date,
                'Waktu': a.check_in_time,
                'NIM': a.nim,
                'Nama Mahasiswa': a.student_name,
                'Mata Kuliah': a.course_name,
                'Status': a.status,
                'Keterangan': a.notes || '-'
            }));

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
            const exportData = items.map((a, index) => ({
                'No': index + 1,
                'NIM': a.nim,
                'Nama Mahasiswa': a.student_name,
                'Waktu Absen': a.check_in_time,
                'Status': a.status?.toUpperCase() || 'HADIR',
                'Keterangan': a.notes || '-'
            }));

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
                    <p className="text-sm text-slate-500">Total {filteredAttendances.length} data (dari {attendances.length})</p>
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
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={runCleanup} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        <Trash2 className="w-4 h-4" /> Cleanup
                    </button>
                    <button onClick={fetchAttendances} disabled={isLoading} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button onClick={handleExportExcel} disabled={isExporting || attendances.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Export Excel
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">Memuat...</div>
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
                                                                    <div className="font-medium text-sm">{a.student_name}</div>
                                                                    <div className="text-xs text-slate-500">{a.nim} • {a.check_in_time}</div>
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
        </div>
    );
}
