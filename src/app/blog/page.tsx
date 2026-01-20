'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, Megaphone, FileText, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    category: 'pengumuman' | 'artikel' | 'kegiatan';
    author_name: string;
    created_at: string;
};

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/blog?published=true')
            .then(res => res.json())
            .then(data => setPosts(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'pengumuman':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Pengumuman</span>;
            case 'kegiatan':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Kegiatan</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Artikel</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Blog & Pengumuman</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Informasi terbaru seputar kegiatan kelas, pengumuman akademik, dan artikel menarik.
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-slate-200"></div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Belum ada postingan</h3>
                        <p className="text-slate-500">Cek kembali nanti untuk update terbaru.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        {getCategoryBadge(post.category)}
                                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                                        <Link href={`/blog/${post.id}`}>{post.title}</Link>
                                    </h2>

                                    <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                                        {post.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <User className="w-3 h-3" />
                                            {post.author_name || 'Admin'}
                                        </div>
                                        <Link href={`/blog/${post.id}`} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                            Baca <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
