import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Shield, FileText, LayoutDashboard, Search, AlertTriangle,
  CheckCircle, Menu, X, ArrowUpRight, TrendingUp, Calendar, Users,
  Settings, LogOut, ChevronDown, Filter, RefreshCw, ChevronRight,
  MoreVertical, Clock, Eye, Download, UserCheck, UserX,
  Lock, Globe, Bell, Mail, Phone, Save, Trash2, Plus, Edit2,
  Activity, ArrowLeft,
} from "lucide-react";
import { View, AuthUser } from "../app/types";
import { Badge, ChartTip } from "../app/components/shared";
import { api, ApiError, type AdminUser, type ApiApplication } from "../app/api";
import {
  getInitials,
  toAppRow,
  toUserRow,
  formatDate,
  type AppRow,
  type UserRow,
} from "./adapters";
import {
  messageOf,
  useAdminApplications,
  useAdminAuditLogs,
  useAdminNotifications,
  useAdminStats,
  useAdminUsers,
  useDebounced,
} from "./hooks";
import { BlockSkeleton, EmptyState, ErrorState, TableSkeleton } from "./states";
import { ApplicationDetail } from "./ApplicationDetail";
import { UserEditor } from "./UserEditor";
import { AccountSettings } from "./AccountSettings";

// ── Design constants ───────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Barlow', 'Inter', sans-serif";
const FONT_CONDENSED = "'Barlow Condensed', 'Barlow', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ── Shared primitives ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-700 uppercase tracking-[0.12em] text-muted-foreground" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-border rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function PanelHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div>
        <h3 className="text-sm font-700 text-foreground" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{title}</h3>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// ── Stat card variants ─────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaLabel, accent }: {
  label: string; value: string; delta: string; deltaLabel: string; accent: string;
}) {
  return (
    <Panel>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[11px] font-700 text-muted-foreground uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>
            {label}
          </span>
          <span className={`text-[10px] font-700 px-2 py-0.5 rounded-md ${accent}`} style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>
            {delta}
          </span>
        </div>
        <div className="text-3xl font-900 text-foreground tabular-nums leading-none" style={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>
          {value}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">{deltaLabel}</div>
      </div>
    </Panel>
  );
}

// ── Page: Dashboard ────────────────────────────────────────────────────────────
function PageDashboard({ colorBlind }: { colorBlind?: boolean }) {
  const [period, setPeriod] = useState("30");

  const { data: stats, loading, error, refresh } = useAdminStats(Number(period));

  // Palet ramah buta warna: hindari merah/hijau berdampingan.
  const approvedColor = colorBlind ? "#0284c7" : "#22c55e";
  const dangerColor   = colorBlind ? "#ea580c" : "#ef4444";

  const CB_PALETTE: Record<string, string> = {
    approved: "#0284c7", processing: "#6366f1", review: "#f59e0b", rejected: "#ea580c", pending: "#f59e0b",
  };

  // API mengirim {name,color,status,value}; UI chart memakai {n,v,c}.
  const pieData = useMemo(
    () =>
      stats.status_distribution.map((slice) => ({
        n: slice.name,
        v: slice.value,
        c: colorBlind ? CB_PALETTE[slice.status] ?? slice.color : slice.color,
      })),
    [stats.status_distribution, colorBlind],
  );

  const monthlyApps    = stats.monthly_apps;
  const processingTime = stats.processing_time;
  const bottlenecks    = stats.bottlenecks;
  const summary        = stats.summary;

  const successRate = summary.total > 0 ? (summary.approved / summary.total) * 100 : 0;

  const numberID = (n: number) => n.toLocaleString("id-ID");

  if (error) {
    return (
      <Panel>
        <ErrorState message={error} onRetry={refresh} />
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period + live row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1 shadow-sm">
          {[["7","7 Hari"],["30","30 Hari"],["90","3 Bulan"],["365","Tahun"]] .map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-600 transition-all ${period === v ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              style={{ fontFamily: FONT_DISPLAY, fontWeight: period === v ? 700 : 600 }}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-600 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Muat ulang statistik"
            className="p-2 bg-white border border-border rounded-lg hover:bg-secondary transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4-col stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <BlockSkeleton key={i} height={104} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Pengguna"       value={numberID(summary.users)}      delta="akun"  deltaLabel="terdaftar"              accent="text-blue-700 bg-blue-50"   />
          <StatCard label="Total Permohonan"     value={numberID(summary.total)}      delta={`${period}h`} deltaLabel="periode terpilih" accent="text-primary bg-secondary"  />
          <StatCard label="Sedang Diproses"      value={numberID(summary.processing)} delta="!SLA"  deltaLabel="perlu segera diproses"  accent="text-amber-700 bg-amber-50" />
          <StatCard label="Tingkat Keberhasilan" value={`${successRate.toFixed(1).replace(".", ",")}%`} delta={numberID(summary.approved)} deltaLabel="permohonan disetujui" accent={colorBlind ? "text-sky-700 bg-sky-50" : "text-emerald-700 bg-emerald-50"} />
        </div>
      )}

      {/* Main chart row: 8/4 split */}
      <div className="grid grid-cols-12 gap-4">
        {/* Trend area chart */}
        <Panel className="col-span-12 xl:col-span-8">
          <PanelHead
            title="Tren Permohonan 2024"
            sub="Jumlah masuk vs. disetujui per bulan"
            right={
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-accent inline-block" />Total masuk</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ backgroundColor: approvedColor }} />Disetujui</span>
                </div>
                <div className="relative">
                  <select className="text-[11px] border border-border rounded-lg px-2.5 py-1.5 bg-white text-foreground focus:outline-none appearance-none pr-6">
                    <option>Semua Layanan</option>
                    <option>SIP</option><option>OSS RBA</option><option>SIMBG</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            }
          />
          <div className="px-6 py-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyApps} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="apps" name="Total" stroke="#2563EB" strokeWidth={2} fill="#2563EB" fillOpacity={0.07} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#2563EB" }} />
                <Area type="monotone" dataKey="approved" name="Disetujui" stroke={approvedColor} strokeWidth={2} fill={approvedColor} fillOpacity={0.07} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: approvedColor }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Pie + legend */}
        <Panel className="col-span-12 xl:col-span-4 flex flex-col">
          <PanelHead title="Distribusi Status" sub="Sebaran dari seluruh permohonan" />
          <div className="flex-1 px-6 py-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={2} dataKey="v" stroke="none">
                  {pieData.map(e => <Cell key={e.n} fill={e.c} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v.toLocaleString("id-ID"), ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {pieData.map(({ n, v, c }) => {
                const total = pieData.reduce((s, d) => s + d.v, 0);
                const pct = Math.round((v / total) * 100);
                return (
                  <div key={n} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: c }} />
                    <span className="text-xs text-muted-foreground flex-1">{n}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }} />
                      </div>
                      <span className="text-xs font-700 text-foreground tabular-nums w-7 text-right" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* Second chart row: 6/6 */}
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 lg:col-span-6">
          <PanelHead title="Waktu Proses per Layanan" sub="Rata-rata hari · target ≤ 10 hari" />
          <div className="px-6 py-5">
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={processingTime} barSize={18} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="service" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="days" name="Hari" radius={[4, 4, 0, 0]}>
                  {processingTime.map(e => (
                    <Cell key={e.service} fill={
                      colorBlind
                        ? e.days > 10 ? "#ea580c" : e.days > 8 ? "#f59e0b" : "#2563EB"
                        : e.days > 10 ? "#ef4444" : e.days > 8 ? "#f59e0b" : "#2563EB"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="col-span-12 lg:col-span-6">
          <PanelHead title="Bottleneck Tahapan" sub="Perbandingan realisasi vs. target waktu proses" />
          <div className="px-6 py-5 space-y-5">
            {bottlenecks.map(({ stage, avg, target }) => {
              const over = avg > target;
              const pct  = Math.min((avg / (target * 2)) * 100, 100);
              const barColor = over ? (colorBlind ? "#ea580c" : "#ef4444") : (colorBlind ? "#0284c7" : "#22c55e");
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-600 text-foreground" style={{ fontFamily: FONT_BODY, fontWeight: 600 }}>{stage}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground">Target {target}h</span>
                      <span className="font-700 tabular-nums" style={{ fontFamily: FONT_MONO, fontWeight: 700, color: barColor }}>
                        {avg}h {over ? "▲" : "✓"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Recent apps table */}
      <RecentApplications />
    </div>
  );
}

/** Tabel permohonan terbaru pada halaman dashboard — 7 entri teratas dari API. */
function RecentApplications() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, loading, error, refresh } = useAdminApplications({ per_page: 7, page: 1 });
  const rows = useMemo(() => data.applications.map(toAppRow), [data.applications]);

  return (
    <Panel>
      <PanelHead
        title="Permohonan Terbaru"
        sub="Pengajuan yang baru masuk ke sistem"
        right={
          <button
            onClick={refresh}
            className="flex items-center gap-1 text-xs font-600 text-accent hover:text-blue-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Muat Ulang <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableSkeleton rows={5} cols={7} />
          </table>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="Belum ada permohonan" hint="Permohonan yang masuk akan tampil di sini." />
      ) : (
        <>
          <AppTable apps={rows} onSelect={app => setSelectedId(app.id)} />
          {selectedId !== null && <ApplicationDetail key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onSaved={refresh} />}
          <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary/20">
            <span className="text-[11px] text-muted-foreground">
              Menampilkan {rows.length} dari {data.pagination.total.toLocaleString("id-ID")} permohonan
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}

// ── Reusable app table ────────────────────────────────────────────────────────
function AppTable({ apps, onSelect }: { apps: AppRow[]; onSelect?: (app: AppRow) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontFamily: FONT_BODY }}>
        <thead>
          <tr className="border-b border-border bg-secondary/25">
            {["No. Permohonan","Pemohon","Layanan","Status","Tgl. Masuk","Petugas",""].map((h, i) => (
              <th key={i} className="text-left px-6 py-3 whitespace-nowrap">
                <span className="text-[10px] font-700 text-muted-foreground uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {apps.map(app => (
            <tr key={app.id} className="hover:bg-secondary/20 transition-colors group">
              <td className="px-6 py-3.5">
                <span className="text-xs font-500 text-accent tabular-nums" style={{ fontFamily: FONT_MONO, fontWeight: 500 }}>{app.code}</span>
              </td>
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-800 flex-shrink-0" style={{ fontWeight: 800 }}>
                    {getInitials(app.name)}
                  </div>
                  <span className="text-sm font-500 text-foreground whitespace-nowrap" style={{ fontWeight: 500 }}>{app.name}</span>
                </div>
              </td>
              <td className="px-6 py-3.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap max-w-[180px] block truncate">{app.service}</span>
              </td>
              <td className="px-6 py-3.5 whitespace-nowrap"><Badge status={app.status} /></td>
              <td className="px-6 py-3.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{app.date}</span>
              </td>
              <td className="px-6 py-3.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{app.officer}</span>
              </td>
              <td className="px-6 py-3.5 w-16">
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onSelect?.(app)}
                    aria-label={`Lihat detail ${app.code}`}
                    className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-accent" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><MoreVertical className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ total, current, onChange }: { total: number; current: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors">‹</button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-600 transition-colors ${p === current ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"}`}
          style={{ fontWeight: 600 }}>{p}</button>
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors">›</button>
    </div>
  );
}

// ── Page: Permohonan ──────────────────────────────────────────────────────────
function PagePermohonan({ colorBlind }: { colorBlind?: boolean }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Debounce agar ketikan tidak memicu request per karakter.
  const debouncedSearch = useDebounced(search, 400);

  // Reset ke halaman 1 setiap kali filter/pencarian berubah agar tidak
  // tersangkut di halaman kosong (mis. hal. 5 pada hasil yang hanya 1 halaman).
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, serviceFilter]);

  const { data, loading, error, refresh } = useAdminApplications({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as ApiApplication["status"]),
    service_type: serviceFilter === "all" ? undefined : (serviceFilter as ApiApplication["service_type"]),
    per_page: perPage,
    page,
  });

  // Statistik global (independen dari filter) untuk kartu ringkasan.
  const { data: stats, refresh: refreshStats } = useAdminStats(365);

  const rows = useMemo(() => data.applications.map(toAppRow), [data.applications]);
  const { current_page: currentPage, last_page: totalPages, total } = data.pagination;

  const byStatus = (status: string) =>
    stats.status_distribution.find((s) => s.status === status)?.value ?? 0;

  const statRows = [
    { label: "Total Masuk", val: stats.summary.total,      c: "#2563EB" },
    { label: "Disetujui",   val: stats.summary.approved,   c: colorBlind ? "#0284c7" : "#22c55e" },
    { label: "Diproses",    val: stats.summary.processing, c: "#f59e0b" },
    { label: "Ditolak",     val: stats.summary.rejected,   c: colorBlind ? "#ea580c" : "#ef4444" },
  ];

  const counts = {
    all: stats.summary.total,
    approved: byStatus("approved"),
    review: byStatus("review"),
    pending: byStatus("pending"),
    rejected: byStatus("rejected"),
  };

  /** Unduh hasil filter saat ini sebagai CSV (di sisi klien). */
  const exportCsv = () => {
    const header = ["No. Permohonan", "Pemohon", "Layanan", "Status", "Tgl. Masuk", "Petugas"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...rows.map((r) => [r.code, r.name, r.service, r.status, r.date, r.officer].map(escape).join(",")),
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `permohonan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-800 text-foreground" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800 }}>Manajemen Permohonan</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola seluruh permohonan izin yang masuk ke sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={rows.length === 0} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-border text-xs font-600 text-muted-foreground hover:bg-secondary transition-colors shadow-sm disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-700 hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Permohonan Baru
          </button>
        </div>
      </div>

      {/* 4-stat band */}
      <div className="grid grid-cols-4 gap-0 bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        {statRows.map(({ label, val, c }, i) => (
          <div key={label} className={`px-6 py-4 ${i < 3 ? "border-r border-border" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-[11px] font-700 text-muted-foreground uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>{label}</span>
            </div>
            <div className="text-3xl font-900 text-foreground tabular-nums" style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, color: c }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Panel className="p-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1 bg-secondary rounded-lg px-3.5 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama pemohon atau nomor permohonan..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full" style={{ fontFamily: FONT_BODY }} />
          </div>
          <div className="flex gap-2">
            {[
              { val: serviceFilter, set: (v: string) => { setServiceFilter(v); setPage(1); }, opts: [["all","Semua Layanan"],["sip","SIP"],["oss","OSS RBA"],["simbg","SIMBG"]] },
            ].map(({ val, set, opts }, i) => (
              <div key={i} className="relative">
                <select value={val} onChange={e => set(e.target.value)}
                  className="text-xs border border-border rounded-lg px-3.5 py-2 bg-white text-foreground focus:outline-none appearance-none pr-8 h-full cursor-pointer">
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          {[["all","Semua"],["approved","Disetujui"],["review","Review"],["pending","Pending"],["rejected","Ditolak"]].map(([k,l]) => {
            const cnt = counts[k as keyof typeof counts] ?? counts.all;
            return (
              <button key={k} onClick={() => { setStatusFilter(k); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all border ${
                  statusFilter === k ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`} style={{ fontWeight: 600, fontFamily: FONT_BODY }}>
                {l}
                <span className={`text-[10px] font-800 px-1.5 py-0.5 rounded ${statusFilter === k ? "bg-white/20" : "bg-secondary"}`} style={{ fontWeight: 800 }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        {error && <ErrorState message={error} onRetry={refresh} />}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: FONT_BODY }}>
            <thead>
              <tr className="border-b border-border bg-secondary/25">
                {["No. Permohonan","Pemohon","Layanan","Status","Tgl. Masuk","Petugas","Aksi"].map((h, i) => (
                  <th key={i} className="text-left px-6 py-3 whitespace-nowrap">
                    <span className="text-[10px] font-700 text-muted-foreground uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? <TableSkeleton rows={perPage} cols={7} />
                : rows.length === 0
                ? <tr><td colSpan={7} className="px-6 py-14 text-center text-sm text-muted-foreground">Tidak ada data yang cocok dengan filter.</td></tr>
                : rows.map(app => (
                  <tr key={app.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-500 text-accent tabular-nums" style={{ fontFamily: FONT_MONO, fontWeight: 500 }}>{app.code}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-800 flex-shrink-0" style={{ fontWeight: 800 }}>
                          {getInitials(app.name)}
                        </div>
                        <span className="text-sm font-500 text-foreground whitespace-nowrap">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 max-w-[180px]">
                      <span className="text-xs text-muted-foreground block truncate">{app.service}</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap"><Badge status={app.status} /></td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{app.date}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{app.officer}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedId(app.id)} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors" title="Detail dan proses" aria-label={`Detail ${app.code}`}><Eye className="h-3.5 w-3.5 text-accent" /></button>
                        <button onClick={() => setSelectedId(app.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Lihat dokumen untuk diunduh" aria-label={`Dokumen ${app.code}`}><Download className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 border-t border-border bg-secondary/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {total === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, total)} dari {total.toLocaleString("id-ID")} permohonan
          </span>
          <Pagination total={totalPages} current={currentPage} onChange={setPage} />
        </div>
      </Panel>
      {selectedId !== null && <ApplicationDetail key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onSaved={() => { refresh(); refreshStats(); }} />}
    </div>
  );
}

// ── Page: Pengguna ─────────────────────────────────────────────────────────────
function PagePengguna() {
  const [editor, setEditor] = useState<{ user?: AdminUser; readOnly?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const debouncedSearch = useDebounced(search, 400);

  const { data, loading, error, refresh } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter === "all" ? undefined : (roleFilter as AdminUser["role"]),
    status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive"),
  });

  const filtered = useMemo(() => data.map(toUserRow), [data]);

  // Endpoint users tidak berpaginasi, jadi statistik dihitung dari hasil terfilter.
  const stat = (fn: (u: UserRow) => boolean) => filtered.filter(fn).length;

  /** Aktif ⇄ nonaktif. Optimistis dihindari: tunggu server lalu refresh. */
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleActive = async (user: UserRow) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      await api.updateAdminUser(user.id, { is_active: user.status !== "active" });
      refresh();
    } catch (err) {
      setActionError(messageOf(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-800 text-foreground" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800 }}>Manajemen Pengguna</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola akun pengguna dan hak akses sistem</p>
        </div>
        <button onClick={() => setEditor({})} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-700 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Tambah Pengguna
        </button>
      </div>

      {/* Stat band */}
      <div className="grid grid-cols-4 gap-0 bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        {[
          { label: "Total Pengguna",    val: stat(() => true),                    Icon: Users,     c: "#2563EB" },
          { label: "Aktif",             val: stat(u => u.status === "active"),    Icon: UserCheck, c: "#22c55e" },
          { label: "Administrator",     val: stat(u => u.role === "admin"),       Icon: Shield,    c: "#8b5cf6" },
          { label: "Blm. Verifikasi",   val: stat(u => !u.verified),             Icon: UserX,     c: "#f59e0b" },
        ].map(({ label, val, Icon, c }, i) => (
          <div key={label} className={`px-6 py-4 flex items-center gap-4 ${i < 3 ? "border-r border-border" : ""}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c + "18" }}>
              <Icon className="h-5 w-5" style={{ color: c }} />
            </div>
            <div>
              <div className="text-2xl font-900 tabular-nums text-foreground" style={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>{val}</div>
              <div className="text-[10px] font-700 text-muted-foreground uppercase tracking-[0.08em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Panel className="p-4 flex gap-3">
        <div className="flex items-center gap-2 flex-1 bg-secondary rounded-lg px-3.5 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau ID pengguna..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full" style={{ fontFamily: FONT_BODY }} />
        </div>
        {[
          { val: roleFilter,   set: setRoleFilter,   opts: [["all","Semua Peran"],["user","Pemohon"],["admin","Admin"]] },
          { val: statusFilter, set: setStatusFilter, opts: [["all","Semua Status"],["active","Aktif"],["inactive","Nonaktif"]] },
        ].map(({ val, set, opts }, i) => (
          <div key={i} className="relative">
            <select value={val} onChange={e => set(e.target.value)}
              className="text-xs border border-border rounded-lg px-3.5 py-2 bg-white text-foreground focus:outline-none appearance-none pr-8 h-full cursor-pointer">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        ))}
      </Panel>

      {/* User grid — 3 column on desktop */}
      {actionError && (
        <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-600 text-red-700">
          {actionError}
        </div>
      )}

      {error ? (
        <Panel><ErrorState message={error} onRetry={refresh} /></Panel>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <BlockSkeleton key={i} height={210} />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(u => (
          <Panel key={u.id}>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-800 text-sm flex-shrink-0 ${
                  u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"
                }`} style={{ fontWeight: 800 }}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-700 text-foreground truncate" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{u.name}</div>
                      <div className="text-[11px] text-muted-foreground font-500 truncate" style={{ fontFamily: FONT_MONO, fontWeight: 500 }}>{u.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-700 px-2 py-0.5 rounded border ${u.role === "admin" ? "text-purple-700 bg-purple-50 border-purple-200" : "text-blue-700 bg-blue-50 border-blue-200"}`}
                        style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>
                        {u.role === "admin" ? "Admin" : "Pemohon"}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className={`text-[10px] font-600 ${u.status === "active" ? "text-emerald-700" : "text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                          {u.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-muted-foreground mb-4 pl-0.5">
                <div className="flex items-center gap-2"><Phone className="h-3 w-3 flex-shrink-0" />{u.phone}</div>
                <div className="flex items-center gap-2"><Calendar className="h-3 w-3 flex-shrink-0" />Bergabung {u.joined}</div>
                {u.role === "user" && <div className="flex items-center gap-2"><FileText className="h-3 w-3 flex-shrink-0" />{u.apps} permohonan diajukan</div>}
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-border">
                {u.verified
                  ? <span className="flex items-center gap-1 text-[10px] font-600 text-emerald-700" style={{ fontWeight: 600 }}><CheckCircle className="h-3 w-3" />Terverifikasi</span>
                  : <span className="flex items-center gap-1 text-[10px] font-600 text-amber-600" style={{ fontWeight: 600 }}><AlertTriangle className="h-3 w-3" />Belum verifikasi</span>
                }
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    disabled={busyId === u.id}
                    aria-label={u.status === "active" ? `Nonaktifkan ${u.name}` : `Aktifkan ${u.name}`}
                    className="px-2 py-1 rounded-lg text-[10px] font-700 hover:bg-secondary transition-colors disabled:opacity-50"
                    style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}
                  >
                    {busyId === u.id ? "…" : u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => setEditor({ user: data.find(user => user.id === u.id) })} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors" aria-label={`Ubah ${u.name}`}><Edit2 className="h-3.5 w-3.5 text-accent" /></button>
                  <button onClick={() => setEditor({ user: data.find(user => user.id === u.id), readOnly: true })} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" aria-label={`Lihat ${u.name}`}><Eye className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok dengan filter.</div>
        )}
      </div>
      )}
      {editor && <UserEditor {...editor} onClose={() => setEditor(null)} onSaved={refresh} />}
    </div>
  );
}

// ── Page: Audit Log ───────────────────────────────────────────────────────────
function PageAuditLog() {
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { data, loading, error, refresh } = useAdminAuditLogs(perPage, page);
  const { audit_logs: logs, pagination } = data;

  const entityName = (type: string | null) => type?.split("\\").pop() || "Sistem";
  const changeCount = (before: Record<string, unknown> | null, after: Record<string, unknown> | null) =>
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]).size;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Keamanan & Kepatuhan</SectionLabel>
          <h2 className="text-xl font-800 text-foreground mt-1" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800 }}>Audit Log</h2>
          <p className="text-xs text-muted-foreground mt-1">Riwayat aktivitas administratif yang tercatat oleh sistem.</p>
        </div>
        <button onClick={refresh} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-border text-xs font-600 text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors shadow-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Muat Ulang
        </button>
      </div>

      <Panel>
        {error ? <ErrorState message={error} onRetry={refresh} /> : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: FONT_BODY }}>
              <thead><tr className="border-b border-border bg-secondary/25">
                {["Waktu", "Aktor", "Aksi", "Objek", "Perubahan", "Alamat IP"].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 whitespace-nowrap"><span className="text-[10px] font-700 text-muted-foreground uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>{heading}</span></th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loading ? <TableSkeleton rows={8} cols={6} /> : logs.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState title="Belum ada aktivitas" hint="Aktivitas administratif akan tercatat di sini." /></td></tr>
                ) : logs.map((log) => {
                  const changes = changeCount(log.before, log.after);
                  return <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap"><div className="text-xs font-600 text-foreground">{formatDate(log.created_at)}</div><div className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div></td>
                    <td className="px-5 py-3.5 text-xs text-foreground">{log.user_id ? `Pengguna #${log.user_id}` : "Sistem"}</td>
                    <td className="px-5 py-3.5"><span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-700 uppercase tracking-wide">{log.action}</span></td>
                    <td className="px-5 py-3.5"><div className="text-xs font-600 text-foreground">{entityName(log.auditable_type)}</div>{log.auditable_id && <div className="text-[10px] text-muted-foreground mt-0.5">ID #{log.auditable_id}</div>}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{changes ? `${changes} atribut` : "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap" style={{ fontFamily: FONT_MONO }}>{log.ip_address ?? "—"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        {!error && !loading && pagination.total > 0 && <div className="px-5 py-3.5 border-t border-border bg-secondary/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{(pagination.current_page - 1) * perPage + 1}–{Math.min(pagination.current_page * perPage, pagination.total)} dari {pagination.total.toLocaleString("id-ID")} aktivitas</span>
          <Pagination total={pagination.last_page} current={pagination.current_page} onChange={setPage} />
        </div>}
      </Panel>
    </div>
  );
}

// ── Page: Pengaturan ───────────────────────────────────────────────────────────
function PagePengaturan({ auth }: { auth: AuthUser }) {
  return <AccountSettings />;
}

// ── Access denied ─────────────────────────────────────────────────────────────
function AccessDenied({ setView }: { setView: (v: View) => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-900 text-foreground mb-2" style={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}>Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Halaman ini hanya untuk Administrator DSJ. Gunakan akun admin untuk melanjutkan.
        </p>
        <button onClick={() => setView("login")} className="w-full py-2.5 bg-primary text-white rounded-xl font-700 text-sm hover:bg-primary/90 transition-colors shadow-md" style={{ fontWeight: 700 }}>
          Masuk sebagai Admin DSJ
        </button>
        <button onClick={() => setView("home")} className="w-full mt-2 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}

// ── Main AdminDashboard ────────────────────────────────────────────────────────
export function AdminDashboard({ setView, auth, onLogout, colorBlind }: {
  setView: (v: View) => void;
  auth: AuthUser | null;
  onLogout: () => void;
  colorBlind?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  if (!auth || auth.role !== "admin") return <AccessDenied setView={setView} />;

  const navItems = [
    { id: "dashboard",    Icon: LayoutDashboard, label: "Dashboard"  },
    { id: "applications", Icon: FileText,        label: "Permohonan" },
    { id: "users",        Icon: Users,           label: "Pengguna"   },
    { id: "audit",        Icon: Activity,        label: "Audit Log"  },
    { id: "settings",     Icon: Settings,        label: "Pengaturan" },
  ];

  const pageLabel: Record<string, string> = {
    dashboard: "Dashboard", applications: "Permohonan", users: "Pengguna", audit: "Audit Log", settings: "Pengaturan",
  };

  const initials = getInitials(auth.name);

  return (
    <>
      {/* Scrollbar suppression */}
      <style>{`
        .admin-scroll::-webkit-scrollbar { display: none; }
        .admin-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="h-screen overflow-hidden bg-background flex" style={{ fontFamily: FONT_BODY }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:h-screen lg:flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "linear-gradient(180deg, #0e2044 0%, #162d5a 60%, #1a3566 100%)" }}>

          {/* Brand */}
          <div className="px-5 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}>
                <Shield className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="text-white font-800 text-sm leading-tight" style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: "0.01em" }}>DSJ Admin</div>
                <div className="text-white/40 text-[10px] font-600 uppercase tracking-[0.1em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 600 }}>Panel Administrasi</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px mb-4" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            <div className="px-3 mb-2">
              <span className="text-[9px] font-700 text-white/25 uppercase tracking-[0.16em]" style={{ fontFamily: FONT_CONDENSED, fontWeight: 700 }}>Menu Utama</span>
            </div>
            {navItems.map(({ id, Icon, label }) => {
              const active = activeNav === id;
              return (
                <button key={id} onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-600 transition-all relative ${
                    active ? "text-white" : "text-white/45 hover:text-white/80 hover:bg-white/5"
                  }`} style={{ fontWeight: 600 }}>
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-white/70" />
                  )}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    active ? "bg-white/15" : ""
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-5 h-px mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* User info */}
          <div className="px-4 pb-5">
            <div className="rounded-xl px-3 py-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-800 text-xs flex-shrink-0" style={{ fontWeight: 800 }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-700 truncate" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{auth.name}</div>
                <div className="text-white/35 text-[10px] truncate" style={{ fontFamily: FONT_MONO }}>Admin DSJ</div>
              </div>
              <button onClick={() => { onLogout(); setView("home"); }} title="Keluar"
                className="p-1.5 text-white/30 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all flex-shrink-0">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="bg-white border-b border-border sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-4 px-6 h-14">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-500">Admin</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-700 text-foreground" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{pageLabel[activeNav]}</span>
              </div>

              <div className="flex-1" />

              {/* Right slot */}
              <div className="flex items-center gap-2.5">
                {activeNav === "dashboard" && (
                  <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3.5 py-2 w-52">
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <input placeholder="Cari permohonan..."
                      className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full" />
                  </div>
                )}
                <button onClick={() => setView("home")}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-600 text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors"
                  style={{ fontWeight: 600 }}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Beranda
                </button>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-800 text-xs flex-shrink-0" style={{ fontWeight: 800 }}>
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto admin-scroll p-5 lg:p-6">
            {activeNav === "dashboard"    && <PageDashboard    colorBlind={colorBlind} />}
            {activeNav === "applications" && <PagePermohonan   colorBlind={colorBlind} />}
            {activeNav === "users"        && <PagePengguna />}
            {activeNav === "audit"        && <PageAuditLog />}
            {activeNav === "settings"     && <PagePengaturan   auth={auth} />}
          </main>
        </div>
      </div>
    </>
  );
}
