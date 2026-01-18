'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Save, Loader2 } from 'lucide-react';

type Schedule = {
    id: string;
    course_name: string;
    lecturer: string;
    code: string;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    type: 'offline' | 'online';
};

export default function ScheduleManager() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [formData, setFormData] = useState({
        course_name: '',
        lecturer: '',
        code: '',
        day: 'Senin',
        start_time: '',
        end_time: '',
        room: '',
        type: 'offline'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    async function fetchSchedules() {
        try {
            const res = await fetch('/api/admin/courses');
            const data = await res.json();
            setSchedules(data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = '/api/admin/courses';
            const method = editingSchedule ? 'PUT' : 'POST';
            const body = editingSchedule
                ? { ...formData, id: editingSchedule.id }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchSchedules();
            setIsModalOpen(false);
            setEditingSchedule(null);
            resetForm();
        } catch (error) {
            alert('Gagal menyimpan data');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
        try {
            await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
            fetchSchedules();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const resetForm = () => {
        setFormData({
            course_name: '',
            lecturer: '',
            code: '',
            day: 'Senin',
            start_time: '',
            end_time: '',
            room: '',
            type: 'offline'
        });
    };

    const openModal = (schedule?: Schedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                course_name: schedule.course_name,
                lecturer: schedule.lecturer,
                code: schedule.code,
                day: schedule.day,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                room: schedule.room,
                type: schedule.type as any
            });
        } else {
            setEditingSchedule(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-700">Daftar Jadwal Kuliah</h3>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tambah Jadwal
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Hari/Jam</th>
                            <th className="p-4 font-semibold text-slate-700">Mata Kuliah</th>
                            <th className="p-4 font-semibold text-slate-700">Ruangan</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center">Memuat...</td></tr>
                        ) : schedules.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada jadwal</td></tr>
                        ) : (
                            schedules.map(schedule => (
                                <tr key={schedule.id} className="hover:bg-slate-50">
                                    <td className="p-4 text-sm">
                                        <div className="font-medium">{schedule.day}</div>
                                        <div className="text-slate-500">{schedule.start_time} - {schedule.end_time}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium">{schedule.course_name}</div>
                                        <div className="text-xs text-slate-500">{schedule.lecturer}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${schedule.type === 'online' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            {schedule.room}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(schedule)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Mata Kuliah</label>
                                <input
                                    type="text"
                                    value={formData.course_name}
                                    onChange={e => setFormData({ ...formData, course_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Dosen Pengampu</label>
                                <input
                                    type="text"
                                    value={formData.lecturer}
                                    onChange={e => setFormData({ ...formData, lecturer: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hari</label>
                                    <select
                                        value={formData.day}
                                        onChange={e => setFormData({ ...formData, day: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipe</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="offline">Offline</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jam Mulai</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jam Selesai</label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ruangan / Link</label>
                                <input
                                    type="text"
                                    value={formData.room}
                                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Contoh: R. 301 atau Zoom Link"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Simpan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
