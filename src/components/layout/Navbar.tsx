'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Home, Calendar, ClipboardCheck, Users, BookOpen, Megaphone } from 'lucide-react';
import Clock from '../Clock';
import LiveClassBadge from '../LiveClassBadge';

const navLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/jadwal', label: 'Jadwal', icon: Calendar },
    { href: '/tugas', label: 'Tugas', icon: BookOpen },
    { href: '/blog', label: 'Info', icon: Megaphone },
    { href: '/mahasiswa', label: 'Mahasiswa', icon: Users },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const session = localStorage.getItem('user_session');
        if (session) {
            setUser(JSON.parse(session));
        }
    }, []);

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

                    {/* Clock & CTA Button */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Clock />

                        {user ? (
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                                <div className="text-right hidden xl:block">
                                    <div className="text-sm font-bold text-slate-700">{user.name}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">{user.role}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Ingin logout?')) {
                                            localStorage.removeItem('user_session');
                                            setUser(null);
                                            window.location.href = '/login';
                                        }
                                    }}
                                    className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                                    title="Logout"
                                >
                                    <Users className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Login
                            </Link>
                        )}

                        {user && (
                            <Link
                                href="/absen"
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
                            >
                                <ClipboardCheck className="w-4 h-4" />
                                Isi Absen
                            </Link>
                        )}
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
                            {user && (
                                <Link
                                    href="/absen"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 mx-4 py-3 rounded-lg bg-blue-500 text-white font-medium"
                                >
                                    <ClipboardCheck className="w-5 h-5" />
                                    Isi Absen
                                </Link>
                            )}

                            {user ? (
                                <button
                                    onClick={() => {
                                        if (confirm('Ingin logout?')) {
                                            localStorage.removeItem('user_session');
                                            setUser(null);
                                            window.location.href = '/login';
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 mx-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium text-sm"
                                >
                                    Logout ({user.name})
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 mx-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-sm"
                                >
                                    Login Akun
                                </Link>
                            )}
                            <div className="mx-4 mt-2 flex justify-center">
                                <Clock />
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            <LiveClassBadge />
        </header>
    );
}
