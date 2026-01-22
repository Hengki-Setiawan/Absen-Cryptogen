'use client';

import { useState, useEffect } from 'react';
import { Quote, RefreshCw } from 'lucide-react';

interface QuoteData {
    content: string;
    author: string;
}

// Fallback quotes - used for instant display
const fallbackQuotes: QuoteData[] = [
    { content: "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.", author: "Nelson Mandela" },
    { content: "Belajar tidak pernah membuat pikiran lelah.", author: "Leonardo da Vinci" },
    { content: "Masa depan adalah milik mereka yang percaya pada keindahan impian mereka.", author: "Eleanor Roosevelt" },
    { content: "Sukses adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", author: "Colin Powell" },
    { content: "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan.", author: "Steve Jobs" },
    { content: "Jangan pernah berhenti bermimpi, karena mimpi hari ini adalah kenyataan esok hari.", author: "APJ Abdul Kalam" },
    { content: "Kesuksesan bukanlah akhir, kegagalan bukanlah fatal: yang terpenting adalah keberanian untuk terus melangkah.", author: "Winston Churchill" },
    { content: "Ilmu itu lebih baik daripada harta. Ilmu menjaga engkau dan engkau menjaga harta.", author: "Ali bin Abi Thalib" },
];

// Get random fallback quote
const getRandomFallback = () => fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

export default function QuotesSection() {
    // Start with fallback immediately - no loading state
    const [quote, setQuote] = useState<QuoteData>(getRandomFallback);
    const [isFetching, setIsFetching] = useState(false);

    const fetchQuote = async () => {
        setIsFetching(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch('https://api.quotable.io/random', {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setQuote({ content: data.content, author: data.author });
        } catch (error) {
            // Use fallback quote on error
            setQuote(getRandomFallback());
        } finally {
            setIsFetching(false);
        }
    };

    // Only fetch once on mount, no auto-rotate (for performance)
    useEffect(() => {
        // Lazy fetch after initial render
        const timer = setTimeout(fetchQuote, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="py-6 bg-gradient-to-r from-amber-50 to-orange-50 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200/30 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-200/30 rounded-full translate-x-12 translate-y-12"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center">
                    {/* Quote Icon */}
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full mb-3">
                        <Quote className="w-5 h-5 text-amber-600" />
                    </div>

                    {/* Quote Content */}
                    <blockquote className="text-lg sm:text-xl font-medium text-slate-700 italic mb-3 leading-relaxed">
                        "{quote.content}"
                    </blockquote>

                    {/* Author */}
                    <cite className="text-sm font-semibold text-amber-700 not-italic">
                        — {quote.author}
                    </cite>

                    {/* Refresh Button */}
                    <div className="mt-3">
                        <button
                            onClick={fetchQuote}
                            disabled={isFetching}
                            className="inline-flex items-center gap-2 text-xs text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50"
                            title="Ganti Quote"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                            {isFetching ? 'Memuat...' : 'Quote Lain'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

