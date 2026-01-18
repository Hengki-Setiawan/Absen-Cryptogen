'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, RefreshCw } from 'lucide-react';

type SiteContent = {
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    footer_text: string;
    [key: string]: string;
};

export default function ContentManager() {
    const [content, setContent] = useState<SiteContent>({
        hero_title: '',
        hero_subtitle: '',
        hero_description: '',
        footer_text: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchContent();
    }, []);

    async function fetchContent() {
        setIsLoading(true);
        try {
            const res = await fetch('/api/site-content');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setContent(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/site-content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });

            if (!res.ok) throw new Error('Failed');
            setMessage('✅ Konten berhasil disimpan!');
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage('❌ Gagal menyimpan konten');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Memuat...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Manajemen Konten</h3>
                    <p className="text-sm text-slate-500">Edit teks dan konten website</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchContent}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-6">
                <div className="border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-700 mb-4">🏠 Homepage Hero</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Judul Utama</label>
                            <input
                                type="text"
                                value={content.hero_title || ''}
                                onChange={e => setContent(p => ({ ...p, hero_title: e.target.value }))}
                                className="w-full p-2 border rounded-lg"
                                placeholder="Cryptgen Generation 2023"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Subjudul</label>
                            <input
                                type="text"
                                value={content.hero_subtitle || ''}
                                onChange={e => setContent(p => ({ ...p, hero_subtitle: e.target.value }))}
                                className="w-full p-2 border rounded-lg"
                                placeholder="Bisnis Digital UNM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Deskripsi</label>
                            <textarea
                                value={content.hero_description || ''}
                                onChange={e => setContent(p => ({ ...p, hero_description: e.target.value }))}
                                className="w-full p-2 border rounded-lg"
                                rows={3}
                                placeholder="Website resmi kelas Bisnis Digital..."
                            />
                        </div>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-700 mb-4">📝 Footer</h4>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teks Footer</label>
                        <input
                            type="text"
                            value={content.footer_text || ''}
                            onChange={e => setContent(p => ({ ...p, footer_text: e.target.value }))}
                            className="w-full p-2 border rounded-lg"
                            placeholder="© 2023 Cryptgen Generation"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
