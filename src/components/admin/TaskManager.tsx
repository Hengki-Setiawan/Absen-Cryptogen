'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, Loader2 } from 'lucide-react';

type Task = {
    id: string;
    course_id: string;
    title: string;
    description: string;
    deadline: string;
    course_name: string;
    course_code: string;
};

type Course = {
    id: string;
    name: string;
    code: string;
};

export default function TaskManager() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ courseId: '', title: '', description: '', deadline: '' });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setIsLoading(true);
        try {
            const [tasksRes, schedulesRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/schedules')
            ]);
            const tasksData = await tasksRes.json();
            const schedulesData = await schedulesRes.json();

            setTasks(tasksData);
            // Extract unique courses from schedules
            const uniqueCourses = schedulesData.reduce((acc: Course[], s: any) => {
                if (!acc.find(c => c.name === s.course)) {
                    acc.push({ id: s.course_id, name: s.course, code: s.course });
                }
                return acc;
            }, []);
            setCourses(uniqueCourses);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/tasks/${editingId}` : '/api/tasks';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed');

            setShowForm(false);
            setEditingId(null);
            setFormData({ courseId: '', title: '', description: '', deadline: '' });
            fetchData();
        } catch (error) {
            alert('Gagal menyimpan tugas');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (task: Task) => {
        setFormData({
            courseId: task.course_id || '',
            title: task.title,
            description: task.description || '',
            deadline: task.deadline || ''
        });
        setEditingId(task.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus tugas ini?')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Manajemen Tugas</h3>
                    <p className="text-sm text-slate-500">Total {tasks.length} tugas</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ courseId: '', title: '', description: '', deadline: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> Tambah Tugas
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">{editingId ? 'Edit Tugas' : 'Tambah Tugas'}</h4>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Mata Kuliah</label>
                                <select
                                    value={formData.courseId}
                                    onChange={e => setFormData(p => ({ ...p, courseId: e.target.value }))}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">-- Pilih Mata Kuliah --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Tugas *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full p-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full p-2 border rounded-lg"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deadline</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">Memuat...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Belum ada tugas</div>
            ) : (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-700">{task.title}</h4>
                                    {task.course_name && (
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.course_name}</span>
                                    )}
                                    {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                                    {task.deadline && (
                                        <p className="text-xs text-red-500 mt-1">⏰ Deadline: {task.deadline}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(task)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
