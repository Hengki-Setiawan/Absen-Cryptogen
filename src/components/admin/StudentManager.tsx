'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, Save, Loader2, Upload, Camera } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type Student = {
    id: string;
    nim: string;
    full_name: string;
    position: string;
    avatar_url?: string;
    phone?: string;
    instagram?: string;
    email?: string;
};

export default function StudentManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const [formData, setFormData] = useState({
        nim: '',
        full_name: '',
        position: 'Anggota',
        phone: '',
        instagram: '',
        email: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            try {
                const options = {
                    maxSizeMB: 0.2, // 200KB max
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/webp',
                    initialQuality: 0.8,
                };
                const compressedFile = await imageCompression(file, options);
                setAvatarFile(compressedFile);
                setAvatarPreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error('Compression error:', error);
                alert('Gagal memproses gambar');
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let avatarUrl = editingStudent?.avatar_url;

            // Upload Avatar if changed
            if (avatarFile && supabase) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatars/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('attendance-photos')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('attendance-photos')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            }

            const url = '/api/admin/users';
            const method = editingStudent ? 'PUT' : 'POST';
            const body = editingStudent
                ? { ...formData, id: editingStudent.id, avatar_url: avatarUrl }
                : { ...formData, role: 'student', avatar_url: avatarUrl };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            await fetchStudents();
            setIsModalOpen(false);
            setEditingStudent(null);
            resetForm();
        } catch (error) {
            console.error(error);
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

    const resetForm = () => {
        setFormData({ nim: '', full_name: '', position: 'Anggota', phone: '', instagram: '', email: '' });
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const openModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                nim: student.nim,
                full_name: student.full_name,
                position: student.position,
                phone: student.phone || '',
                instagram: student.instagram || '',
                email: student.email || ''
            });
            setAvatarPreview(student.avatar_url || null);
        } else {
            setEditingStudent(null);
            resetForm();
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
                            <th className="p-4 font-semibold text-slate-700">Mahasiswa</th>
                            <th className="p-4 font-semibold text-slate-700">Kontak</th>
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
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0">
                                                {student.avatar_url ? (
                                                    <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                        {student.full_name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{student.full_name}</div>
                                                <div className="text-sm text-slate-500">{student.nim}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {student.phone && <div>WA: {student.phone}</div>}
                                        {student.instagram && <div>IG: {student.instagram}</div>}
                                    </td>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingStudent ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Left Column: Avatar & Basic Info */}
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div
                                            onClick={() => !isCompressing && fileInputRef.current?.click()}
                                            className="w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-blue-500 cursor-pointer relative overflow-hidden group transition-colors"
                                        >
                                            {avatarPreview ? (
                                                <>
                                                    <Image src={avatarPreview} alt="Preview" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera className="w-8 h-8 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    {isCompressing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 mb-1" />}
                                                    <span className="text-xs">Upload Foto</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isCompressing}
                                        />
                                    </div>

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
                                </div>

                                {/* Right Column: Contact Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 border-b pb-2">Kontak & Media Sosial</h4>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Contoh: 08123456789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Username Instagram</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                                            <input
                                                type="text"
                                                value={formData.instagram}
                                                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving || isCompressing}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-6"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Simpan Data
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
