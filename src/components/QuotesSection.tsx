'use client';

import { useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';

interface QuoteData {
    content: string;
    author: string;
}

// Local quotes - no network dependency, works offline
const quotes: QuoteData[] = [
    { content: "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.", author: "Nelson Mandela" },
    { content: "Belajar tidak pernah membuat pikiran lelah.", author: "Leonardo da Vinci" },
    { content: "Masa depan adalah milik mereka yang percaya pada keindahan impian mereka.", author: "Eleanor Roosevelt" },
    { content: "Sukses adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", author: "Colin Powell" },
    { content: "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan.", author: "Steve Jobs" },
    { content: "Jangan pernah berhenti bermimpi, karena mimpi hari ini adalah kenyataan esok hari.", author: "APJ Abdul Kalam" },
    { content: "Kesuksesan bukanlah akhir, kegagalan bukanlah fatal: yang terpenting adalah keberanian untuk terus melangkah.", author: "Winston Churchill" },
    { content: "Ilmu itu lebih baik daripada harta. Ilmu menjaga engkau dan engkau menjaga harta.", author: "Ali bin Abi Thalib" },
    { content: "Hidup ini seperti sepeda. Agar tetap seimbang, kamu harus terus bergerak.", author: "Albert Einstein" },
    { content: "Investasi terbaik adalah investasi dalam ilmu pengetahuan.", author: "Benjamin Franklin" },
    { content: "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas.", author: "Henry Ford" },
    { content: "Orang yang tidak pernah melakukan kesalahan adalah orang yang tidak pernah mencoba sesuatu yang baru.", author: "Albert Einstein" },
];

// Get random quote
const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];

export default function QuotesSection() {
    const [quote, setQuote] = useState<QuoteData>(getRandomQuote);

    const nextQuote = () => {
        // Get a different quote
        let newQuote = getRandomQuote();
        while (newQuote.content === quote.content && quotes.length > 1) {
            newQuote = getRandomQuote();
        }
        setQuote(newQuote);
    };

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
                        &ldquo;{quote.content}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <cite className="text-sm font-semibold text-amber-700 not-italic">
                        — {quote.author}
                    </cite>

                    {/* Refresh Button */}
                    <div className="mt-3">
                        <button
                            onClick={nextQuote}
                            className="inline-flex items-center gap-2 text-xs text-amber-600 hover:text-amber-800 transition-colors"
                            title="Ganti Quote"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Quote Lain
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}


