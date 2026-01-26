'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertCircle, Calendar, Download, Loader2 } from 'lucide-react';

type AttendanceStats = {
    total: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
};

type AttendanceRecord = {
    id: string;
    attendance_date: string;
    status: string;
    notes: string;
    check_in_time: string;
    course_name: string;
    start_time: string;
    end_time: string;
};

type Student = {
    id: string;
    full_name: string;
    nim: string;
};

interface StudentAttendanceModalProps {
    studentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function StudentAttendanceModal({ studentId, isOpen, onClose }: StudentAttendanceModalProps) {
    const [student, setStudent] = useState<Student | null>(null);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchData();
        }
    }, [isOpen, studentId]);

    async function fetchData() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${studentId}/attendance`);
            if (res.ok) {
                const data = await res.json();
                setStudent(data.user);
                setStats(data.stats);
                setHistory(data.history);
            }
        } catch (error) {
            console.error('Error fetching student attendance:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await fetch(`/api/admin/export/student/${studentId}`);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Absensi_${student?.nim}_${student?.full_name}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Gagal mengunduh data absensi');
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Detail Absensi Mahasiswa</h3>
                        {student && (
                            <p className="text-slate-500 mt-1">
                                {student.full_name} <span className="mx-2">•</span> {student.nim}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-semibold">Hadir</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-800">{stats?.hadir || 0}</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                        <Clock className="w-5 h-5" />
                                        <span className="font-semibold">Izin</span>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-800">{stats?.izin || 0}</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-semibold">Sakit</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-800">{stats?.sakit || 0}</div>
                                </div>
                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-red-700 mb-2">
                                        <X className="w-5 h-5" />
                                        <span className="font-semibold">Alpha</span>
                                    </div>
                                    <div className="text-2xl font-bold text-red-800">{stats?.alpha || 0}</div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
                                >
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Export Excel
                                </button>
                            </div>

                            {/* History Table */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" /> Riwayat Kehadiran
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-4 font-semibold text-slate-700">Tanggal</th>
                                                <th className="p-4 font-semibold text-slate-700">Mata Kuliah</th>
                                                <th className="p-4 font-semibold text-slate-700">Status</th>
                                                <th className="p-4 font-semibold text-slate-700">Waktu Absen</th>
                                                <th className="p-4 font-semibold text-slate-700">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                                        Belum ada data absensi
                                                    </td>
                                                </tr>
                                            ) : (
                                                history.map((record) => (
                                                    <tr key={record.id} className="hover:bg-slate-50">
                                                        <td className="p-4">
                                                            {new Date(record.attendance_date).toLocaleDateString('id-ID', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="p-4 font-medium">{record.course_name}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                                                                ${record.status === 'hadir' ? 'bg-green-100 text-green-700' :
                                                                    record.status === 'izin' ? 'bg-yellow-100 text-yellow-700' :
                                                                        record.status === 'sakit' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-red-100 text-red-700'
                                                                }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-600">
                                                            {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('id-ID') : '-'}
                                                        </td>
                                                        <td className="p-4 text-slate-600 max-w-xs truncate">
                                                            {record.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
