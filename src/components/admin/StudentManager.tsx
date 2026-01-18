'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Save, Loader2 } from 'lucide-react';

type Student = {
    id: string;
    nim: string;
    full_name: string;
    position: string;
    avatar_url?: string;
};

export default function StudentManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({ nim: '', full_name: '', position: 'Anggota' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    async function fetchStudents() {
        try {
            const res = await fetch('/api/admin/users?role=student');
            const data = await res.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = '/api/admin/users';
            const method = editingStudent ? 'PUT' : 'POST';
            const body = editingStudent
                ? { ...formData, id: editingStudent.id }
                : { ...formData, role: 'student' };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchStudents();
            setIsModalOpen(false);
            setEditingStudent(null);
            setFormData({ nim: '', full_name: '', position: 'Anggota' });
        } catch (error) {
            alert('Gagal menyimpan data');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus mahasiswa ini?')) return;
        try {
            await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            fetchStudents();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const openModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            setFormData({ nim: student.nim, full_name: student.full_name, position: student.position });
        } else {
            setEditingStudent(null);
            setFormData({ nim: '', full_name: '', position: 'Anggota' });
        }
        setIsModalOpen(true);
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nim.includes(searchTerm)
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari mahasiswa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tambah
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Nama</th>
                            <th className="p-4 font-semibold text-slate-700">NIM</th>
                            <th className="p-4 font-semibold text-slate-700">Jabatan</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center">Memuat...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada data</td></tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{student.full_name}</td>
                                    <td className="p-4 text-slate-600">{student.nim}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.position === 'Anggota' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {student.position}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(student)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student.id)}
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
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingStudent ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">NIM</label>
                                <input
                                    type="text"
                                    value={formData.nim}
                                    onChange={e => setFormData({ ...formData, nim: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jabatan</label>
                                <select
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Anggota">Anggota</option>
                                    <option value="Ketua Kelas">Ketua Kelas</option>
                                    <option value="Wakil Ketua">Wakil Ketua</option>
                                    <option value="Sekretaris">Sekretaris</option>
                                    <option value="Bendahara">Bendahara</option>
                                </select>
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
