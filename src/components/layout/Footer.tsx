import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Linkedin, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="relative w-10 h-10">
                                <Image src="/logo.png" alt="Cryptgen Logo" fill className="object-contain" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Cryptgen</h3>
                                <p className="text-xs text-slate-400">Generation 2023</p>
                            </div>
                        </Link>
                        <p className="text-sm text-slate-400 mb-4">
                            Kelas Bisnis Digital angkatan 2023 Universitas Negeri Makassar.
                        </p>
                        <div className="flex items-center gap-2">
                            {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Menu */}
                    <div>
                        <h4 className="font-semibold mb-4">Menu</h4>
                        <ul className="space-y-2">
                            {['Beranda', 'Jadwal Kuliah', 'Mahasiswa', 'Isi Absen'].map((item, i) => {
                                const href = item === 'Beranda' ? '/' :
                                    item === 'Isi Absen' ? '/absen' :
                                        item === 'Jadwal Kuliah' ? '/jadwal' :
                                            `/${item.toLowerCase().replace(' ', '-')}`;
                                return (
                                    <li key={i}>
                                        <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                                            {item}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Akademik */}
                    <div>
                        <h4 className="font-semibold mb-4">Akademik</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://unm.ac.id" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1">
                                    Website UNM <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a href="https://feb.unm.ac.id" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1">
                                    FEB UNM <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Kontak */}
                    <div>
                        <h4 className="font-semibold mb-4">Kontak</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-slate-400">
                                <MapPin className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                                Kampus UNM Gunungsari, Makassar
                            </li>
                            <li>
                                <a href="mailto:cryptgen2023@gmail.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                    cryptgen2023@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="tel:+6281234567890" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    <Phone className="w-4 h-4 text-blue-400" />
                                    +62 812 3456 7890
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                        <p>&copy; {new Date().getFullYear()} Cryptgen Generation 2023. All rights reserved.</p>
                        <p>
                            Made with ❤️ by{' '}
                            <Link href="/admin" className="hover:text-slate-300 transition-colors cursor-default">
                                Bisnis Digital UNM
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
