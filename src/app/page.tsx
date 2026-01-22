import Image from 'next/image';
import Link from 'next/link';
import { Users, Calendar, ClipboardCheck, ArrowRight, Sparkles } from 'lucide-react';
import QuotesSection from '@/components/QuotesSection';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Bisnis Digital UNM 2023
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Selamat Datang di{' '}
                <span className="gradient-text">Cryptgen</span>
                <br />
                Generation 2023
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8">
                Portal resmi kelas Bisnis Digital Universitas Negeri Makassar.
                Isi kehadiran kuliahmu dengan mudah dan cepat di sini.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  href="/absen"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Isi Absen Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/jadwal"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Lihat Jadwal
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                <Image
                  src="/logo.png"
                  alt="Cryptgen Generation 2023"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <QuotesSection />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '30+', label: 'Mahasiswa Aktif' },
              { value: '8', label: 'Mata Kuliah' },
              { value: '100%', label: 'Semangat Belajar' },
              { value: '2023', label: 'Angkatan' },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Fitur <span className="gradient-text">Utama</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Akses cepat untuk kebutuhan perkuliahan
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: ClipboardCheck, title: 'Isi Absensi', desc: 'Form absensi online dengan upload bukti foto', href: '/absen', color: 'bg-green-500' },
              { icon: Calendar, title: 'Jadwal Kuliah', desc: 'Cek jadwal mata kuliah mingguan', href: '/jadwal', color: 'bg-purple-500' },
              { icon: Users, title: 'Daftar Mahasiswa', desc: 'Lihat data teman sekelas', href: '/mahasiswa', color: 'bg-blue-500' },
            ].map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group p-6 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sudah Waktunya Kuliah?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Jangan lupa isi absen sebelum perkuliahan dimulai.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/absen"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            >
              <ClipboardCheck className="w-5 h-5" />
              Isi Absen Sekarang
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
