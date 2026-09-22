import { Shield, FileText, TrendingUp, Layers, Activity, Briefcase, Building, ArrowRight, Lock, Zap, Mail, Phone, Globe, Clock } from "lucide-react";
import { View, AuthUser } from "../app/types";

export function HomePage({ setView, auth }: { setView: (v: View) => void; auth: AuthUser | null }) {
  const stats = [
    { label: "Total Permohonan", value: "2.741", icon: FileText, bg: "bg-blue-100", ico: "text-blue-600" },
    { label: "Tingkat Persetujuan", value: "87,3%", icon: TrendingUp, bg: "bg-emerald-100", ico: "text-emerald-600" },
    { label: "Rata-rata Proses", value: "8,2 Hari", icon: Clock, bg: "bg-amber-100", ico: "text-amber-600" },
    { label: "Jenis Layanan", value: "3", icon: Layers, bg: "bg-purple-100", ico: "text-purple-600" },
  ];

  const services = [
    {
      icon: Activity,
      title: "Surat Ijin Praktek (SIP)",
      desc: "Izin praktik bagi tenaga kesehatan dan profesional lainnya sesuai regulasi yang berlaku.",
      bg: "bg-blue-50", ico: "text-blue-700",
      badge: "Tersedia",
    },
    {
      icon: Briefcase,
      title: "Perijinan Berusaha (OSS RBA)",
      desc: "Perizinan berbasis risiko melalui sistem Online Single Submission untuk berbagai skala usaha.",
      bg: "bg-emerald-50", ico: "text-emerald-700",
      badge: "Tersedia",
    },
    {
      icon: Building,
      title: "SIMBG",
      desc: "Sistem Informasi Manajemen Bangunan Gedung untuk pengurusan izin mendirikan dan memanfaatkan bangunan.",
      bg: "bg-orange-50", ico: "text-orange-700",
      badge: "Tersedia",
    },
  ];

  const steps = [
    { num: "01", title: "Buat Akun", desc: "Daftarkan diri Anda dan verifikasi email untuk mengakses layanan perizinan digital." },
    { num: "02", title: "Isi Formulir", desc: "Lengkapi formulir permohonan dengan data diri, lokasi, dan informasi usaha secara bertahap." },
    { num: "03", title: "Unggah Dokumen", desc: "Unggah dokumen persyaratan yang diperlukan sesuai jenis izin yang diajukan." },
    { num: "04", title: "Lacak Status Permohonan", desc: "Lacak perkembangan permohonan Anda secara real-time dan terima notifikasi progres." },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-blue-800 to-blue-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-7">
              <Zap className="h-3.5 w-3.5 text-yellow-300" />
              <span>Sistem Perizinan Digital Terpadu</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-tight mb-6 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Digital Service<br />
              <span className="text-blue-300">Journey Simulator</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-4 max-w-lg">
              Aplikasi simulasi berbasis skenario yang dikembangkan untuk mendukung proses evaluasi dan redesign layanan publik digital.
            </p>
            <p className="text-sm text-white/55 leading-relaxed mb-10 max-w-lg">
              Simulator ini memodelkan interaksi antara karakteristik pengguna, alur layanan, serta kondisi operasional layanan guna menghasilkan informasi mengenai kinerja layanan, potensi bottleneck, dan rekomendasi perbaikan yang dapat digunakan sebagai dasar pengambilan keputusan oleh pengelola layanan publik.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => auth ? setView("apply") : setView("login")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-xl shadow-black/20"
              >
                Ajukan Perizinan Sekarang <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("track")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/25 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition-all"
              >
                Pantau Permohonan Saya
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, bg, ico }) => (
              <div key={label} className="flex items-center gap-3.5 p-3 rounded-xl bg-background/60">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${ico}`} />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Layanan Perizinan</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">Pilih jenis layanan perizinan yang Anda butuhkan dan mulai proses pengajuan secara digital hari ini</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {services.map(({ icon: Icon, title, desc, bg, ico, badge }) => (
            <button
              key={title}
              onClick={() => auth ? setView("apply") : setView("login")}
              className="group p-6 bg-white rounded-2xl border border-border hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 hover:border-accent/25 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${ico}`} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">{badge}</span>
              </div>
              <h3 className="font-bold text-foreground mb-1.5 group-hover:text-accent transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              <div className="mt-5 flex items-center gap-1 text-accent text-xs font-semibold">
                {auth ? "Ajukan Sekarang" : "Login untuk Mengajukan"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
        {!auth && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            <Lock className="inline h-3 w-3 mr-1 mb-0.5" />
            Anda perlu <button onClick={() => setView("login")} className="text-accent font-semibold hover:underline">masuk</button> atau <button onClick={() => setView("register")} className="text-accent font-semibold hover:underline">daftar</button> untuk mengajukan permohonan izin.
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-primary/4 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cara Pengajuan</h2>
            <p className="text-muted-foreground text-sm">Proses pengajuan izin yang mudah dan terstruktur dalam empat langkah sederhana</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} className="relative flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-lg shadow-primary/30">
                  {num}
                </div>
                <h3 className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-12 w-[calc(100%-3rem)] h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-10 lg:p-14 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl font-extrabold mb-3 relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Siap Mengajukan Permohonan?</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto text-sm leading-relaxed relative">Daftarkan akun Anda dan nikmati kemudahan layanan perizinan digital tanpa antre — cepat, transparan, dan dapat dipantau kapan saja.</p>
          <div className="flex flex-wrap justify-center gap-3 relative">
            <button onClick={() => setView("register")} className="px-8 py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-xl shadow-black/20">
              Daftar Gratis
            </button>
            <button onClick={() => setView("login")} className="px-8 py-3 bg-white/10 border border-white/25 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors">
              Sudah Punya Akun? Masuk
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Digital Service Journey</span>
              </div>
              <p className="text-xs leading-relaxed">Sistem perizinan digital terpadu untuk pelayanan publik yang lebih baik, transparan, dan efisien.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Layanan Utama</h4>
              <ul className="space-y-1.5 text-xs">
                {["Surat Ijin Praktek (SIP)", "Perijinan Berusaha (OSS RBA)", "SIMBG"].map(s => (
                  <li key={s}><button className="hover:text-white transition-colors">{s}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Kontak Kami</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-400" /> layanan@dsj.go.id</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-400" /> (021) 500-1234</div>
                <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-blue-400" /> www.dsj.go.id</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center text-xs">
            © 2024 Digital Service Journey — Pemerintah Daerah. Seluruh hak cipta dilindungi undang-undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
