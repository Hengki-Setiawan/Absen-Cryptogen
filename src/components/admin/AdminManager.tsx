'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';

type Admin = {
    id: string;
    full_name: string;
    username: string;
    role: string;
};

export default function AdminManager() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', username: '', password: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    async function fetchAdmins() {
        try {
            const res = await fetch('/api/admin/users?role=admin');
            const data = await res.json();
            setAdmins(data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role: 'admin' }),
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchAdmins();
            setIsModalOpen(false);
            setFormData({ full_name: '', username: '', password: '' });
        } catch (error) {
            alert('Gagal menyimpan admin');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus admin ini?')) return;
        try {
            await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            fetchAdmins();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-700">Daftar Admin</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tambah Admin
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Nama</th>
                            <th className="p-4 font-semibold text-slate-700">Username</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={3} className="p-8 text-center">Memuat...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-500">Tidak ada admin</td></tr>
                        ) : (
                            admins.map(admin => (
                                <tr key={admin.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{admin.full_name}</td>
                                    <td className="p-4 text-slate-600">{admin.username}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Hapus Admin"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
                            <h3 className="text-xl font-bold">Tambah Admin Baru</h3>
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
                                <label className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Simpan Admin
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
