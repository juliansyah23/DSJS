import { useState } from "react";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { View, AuthUser } from "../types";
import { getInitials } from "../data";

export function Navbar({ view, setView, auth, onLogout }: {
  view: View; setView: (v: View) => void; auth: AuthUser | null; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navItems: { id: View; label: string }[] = [
    { id: "home",  label: "Beranda"      },
    { id: "apply", label: "Ajukan Perizinan"        },
    { id: "track", label: "Lacak Status Permohonan" },
    ...(auth?.role === "admin" ? [{ id: "admin" as View, label: "Admin Panel" }] : []),
  ];

  return (
    <nav className="bg-primary sticky top-0 z-50 shadow-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setView("home")} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-sm tracking-tight">Digital Service Journey</div>
              <div className="text-white/55 text-[10px] tracking-wide">Sistem Perizinan Digital</div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => setView(id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === id ? "bg-white/20 text-white" : "text-white/65 hover:text-white hover:bg-white/10"
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {auth ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div className="text-white text-xs font-semibold leading-tight">{auth.name}</div>
                  <div className="text-white/50 text-[10px] leading-tight">{auth.role === "admin" ? "Administrator" : "Pengguna"}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(auth.name)}
                </div>
                <button onClick={onLogout} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Keluar">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setView("login")} className="text-white/70 hover:text-white text-sm px-3 py-1.5 transition-colors font-medium">Masuk</button>
                <button onClick={() => setView("register")} className="bg-white text-primary text-sm px-4 py-1.5 rounded-lg font-bold hover:bg-blue-50 transition-colors">Daftar</button>
              </>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-primary/95">
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => { setView(id); setOpen(false); }}
              className="block w-full text-left text-white/70 hover:text-white py-2 text-sm font-medium">
              {label}
            </button>
          ))}
          {auth ? (
            <div className="pt-2 border-t border-white/10 mt-2">
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {getInitials(auth.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{auth.name}</div>
                  <div className="text-white/50 text-xs">{auth.role === "admin" ? "Administrator" : "Pengguna"}</div>
                </div>
                <button onClick={() => { onLogout(); setOpen(false); }} className="text-white/60 hover:text-white transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/10 flex gap-2 mt-2">
              <button onClick={() => { setView("login"); setOpen(false); }} className="flex-1 py-2 text-center text-white/70 border border-white/20 rounded-lg text-sm font-medium">Masuk</button>
              <button onClick={() => { setView("register"); setOpen(false); }} className="flex-1 py-2 text-center bg-white text-primary rounded-lg text-sm font-bold">Daftar</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
