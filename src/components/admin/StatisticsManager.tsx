'use client';

import { useState, useEffect, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Download, FileSpreadsheet } from 'lucide-react';

type StatData = {
    totalAttendances: number;
    statusCounts: { status: string; count: number }[];
    courseCounts: { course_name: string; count: number }[];
    topStudents: { student_name: string; count: number }[];
};

export default function StatisticsManager() {
    const [stats, setStats] = useState<StatData | null>(null);
    const [stats, setStats] = useState<StatData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/statistics');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }, []);

    useEffect(() => {
        useEffect(() => {
            fetchStats();
            fetchCourses();
        }, [fetchStats, fetchCourses]);
    }, [fetchStats]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hadir': return 'bg-green-500';
            case 'izin': return 'bg-yellow-500';
            case 'sakit': return 'bg-blue-500';
            default: return 'bg-red-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'hadir': return <CheckCircle className="w-4 h-4" />;
            case 'izin': return <Clock className="w-4 h-4" />;
            case 'sakit': return <AlertCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handleExport = async () => {
        if (!selectedCourseId) {
            alert('Pilih mata kuliah terlebih dahulu');
            return;
        }

        setIsExporting(true);
        try {
            const res = await fetch(`/api/admin/export/attendance?courseId=${selectedCourseId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Export failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const course = courses.find(c => c.id === selectedCourseId);
            a.download = `Absensi_${course?.name || 'Course'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error('Export error:', error);
            alert('Gagal export data: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Memuat statistik...</div>;
    }

    if (!stats) {
        return <div className="text-center py-12 text-slate-500">Gagal memuat data</div>;
    }

    const maxCourseCount = Math.max(...stats.courseCounts.map(c => c.count), 1);
    const maxStudentCount = Math.max(...stats.topStudents.map(s => s.count), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Dashboard Statistik</h3>
                    <p className="text-sm text-slate-500">Ringkasan data absensi</p>
                </div>
                <div className="flex gap-2">
                    {/* Export Section */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 mr-2">
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="text-sm border-none outline-none bg-transparent w-40"
                        >
                            <option value="">Pilih Matkul...</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !selectedCourseId}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                            Export
                        </button>
                    </div>

                    <button
                        onClick={async () => {
                            if (!confirm('Hapus bukti absen lama (>24 jam)? Foto profil aman.')) return;
                            try {
                                const res = await fetch('/api/cron/cleanup', { method: 'POST' });
                                const data = await res.json();
                                alert(`Selesai! ${data.deletedCount} file dihapus.`);
                            } catch (e) {
                                alert('Gagal membersihkan storage.');
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Cleanup
                    </button>
                    <button onClick={fetchStats} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-sm opacity-90">Total Absensi</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalAttendances}</div>
                </div>

                {stats.statusCounts.map(({ status, count }) => (
                    <div key={status} className={`${getStatusColor(status)} text-white p-4 rounded-xl`}>
                        <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(status)}
                            <span className="text-sm opacity-90 capitalize">{status || 'Unknown'}</span>
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Per Course Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Absensi per Mata Kuliah
                    </h4>
                    <div className="space-y-3">
                        {stats.courseCounts.map(({ course_name, count }) => (
                            <div key={course_name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="truncate">{course_name}</span>
                                    <span className="font-medium">{count}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(count / maxCourseCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.courseCounts.length === 0 && (
                            <p className="text-center text-slate-400 py-4">Belum ada data</p>
                        )}
                    </div>
                </div>

                {/* Top Students */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Top 5 Mahasiswa Terrajin
                    </h4>
                    <div className="space-y-3">
                        {stats.topStudents.map(({ student_name, count }, index) => (
                            <div key={student_name} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-slate-400' :
                                        index === 2 ? 'bg-amber-600' : 'bg-slate-300'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm truncate">{student_name}</div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(count / maxStudentCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-600">{count}x</span>
                            </div>
                        ))}
                        {stats.topStudents.length === 0 && (
                            <p className="text-center text-slate-400 py-4">Belum ada data</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
