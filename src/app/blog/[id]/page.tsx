'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    category: string;
    author_name: string;
    created_at: string;
};

export default function BlogPostPage() {
    const { id } = useParams();
    const router = useRouter();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/blog/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => setPost(data))
            .catch(() => router.push('/blog'))
            .finally(() => setIsLoading(false));
    }, [id, router]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post?.title,
                text: post?.content.substring(0, 100),
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link disalin ke clipboard!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <main className="max-w-3xl mx-auto px-4 py-12">
                    <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-8"></div>
                    <div className="h-12 w-3/4 bg-slate-200 rounded animate-pulse mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <main className="max-w-3xl mx-auto px-4 py-12">
                <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
                </Link>

                <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <header className="mb-8 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {post.category}
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-slate-500 text-sm font-medium flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">{post.author_name || 'Admin'}</div>
                                    <div className="text-xs text-slate-500">Penulis</div>
                                </div>
                            </div>
                            <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Bagikan">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    <div className="prose prose-slate max-w-none prose-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </div>
                </article>
            </main>
        </div>
    );
}
