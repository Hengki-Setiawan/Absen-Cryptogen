'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, Loader2, Megaphone, FileText, Calendar } from 'lucide-react';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    category: 'pengumuman' | 'artikel' | 'kegiatan';
    is_published: number;
    author_id: string;
    author_name?: string;
    created_at: string;
};

type User = {
    id: string;
    full_name: string;
};

export default function BlogManager() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'pengumuman',
        authorId: '',
        isPublished: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setIsLoading(true);
        try {
            const [postsRes, usersRes] = await Promise.all([
                fetch('/api/blog'),
                fetch('/api/data') // Reusing data API to get students/users
            ]);
            const postsData = await postsRes.json();
            const usersData = await usersRes.json();

            setPosts(postsData);
            setUsers(usersData.students); // Assuming students are the users
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
            const url = editingId ? `/api/blog/${editingId}` : '/api/blog';
            const method = editingId ? 'PUT' : 'POST';

            const body = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                is_published: formData.isPublished,
                authorId: formData.authorId
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed');

            setShowForm(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            alert('Gagal menyimpan postingan');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            category: 'pengumuman',
            authorId: users[0]?.id || '',
            isPublished: true
        });
    };

    const handleEdit = (post: BlogPost) => {
        setFormData({
            title: post.title,
            content: post.content,
            category: post.category as any,
            authorId: post.author_id,
            isPublished: post.is_published === 1
        });
        setEditingId(post.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus postingan ini?')) return;
        try {
            await fetch(`/api/blog/${id}`, { method: 'DELETE' });
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'pengumuman': return <Megaphone className="w-4 h-4 text-blue-500" />;
            case 'kegiatan': return <Calendar className="w-4 h-4 text-green-500" />;
            default: return <FileText className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Manajemen Blog & Pengumuman</h3>
                    <p className="text-sm text-slate-500">Total {posts.length} postingan</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> Buat Postingan
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">{editingId ? 'Edit Postingan' : 'Buat Postingan Baru'}</h4>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="pengumuman">Pengumuman</option>
                                        <option value="kegiatan">Kegiatan</option>
                                        <option value="artikel">Artikel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Penulis</label>
                                    <select
                                        value={formData.authorId}
                                        onChange={e => setFormData(p => ({ ...p, authorId: e.target.value }))}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">-- Pilih Penulis --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Judul</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full p-2 border rounded-lg"
                                    required
                                    placeholder="Contoh: Jadwal UTS Semester 2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Konten</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                                    className="w-full p-2 border rounded-lg font-mono text-sm"
                                    rows={10}
                                    required
                                    placeholder="Tulis isi pengumuman di sini..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPublished"
                                    checked={formData.isPublished}
                                    onChange={e => setFormData(p => ({ ...p, isPublished: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">Publikasikan Langsung</label>
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
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Belum ada postingan</div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <div key={post.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            {getCategoryIcon(post.category)}
                                            {post.category}
                                        </span>
                                        {post.is_published === 0 && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">Draft</span>
                                        )}
                                        <span className="text-xs text-slate-400">
                                            {new Date(post.created_at).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-lg">{post.title}</h4>
                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{post.content}</p>
                                    <p className="text-xs text-slate-400 mt-2">Oleh: {post.author_name || 'Unknown'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(post)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
