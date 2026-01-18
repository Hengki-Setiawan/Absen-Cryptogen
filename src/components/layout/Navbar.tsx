'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Home, Calendar, ClipboardCheck, Users } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/jadwal', label: 'Jadwal', icon: Calendar },
    { href: '/mahasiswa', label: 'Mahasiswa', icon: Users },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative w-10 h-10">
                            <Image
                                src="/logo.png"
                                alt="Cryptgen Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Cryptgen</h1>
                            <p className="text-[10px] text-slate-500 -mt-1">Generation 2023</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            href="/absen"
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            Isi Absen
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="lg:hidden py-4 border-t border-slate-200">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="my-2 border-slate-200" />
                            <Link
                                href="/absen"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 mx-4 py-3 rounded-lg bg-blue-500 text-white font-medium"
                            >
                                <ClipboardCheck className="w-5 h-5" />
                                Isi Absen
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
