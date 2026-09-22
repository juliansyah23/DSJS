import type { AdminUser, ApiApplication } from "../app/api";

/** Bentuk baris tabel permohonan yang dipakai UI admin. */
export type AppRow = {
  id: number;
  code: string;
  name: string;
  service: string;
  type: ApiApplication["service_type"];
  status: ApiApplication["status"];
  date: string;
  officer: string;
  stages: ApiApplication["stages"];
};

/** Bentuk kartu pengguna yang dipakai UI admin. */
export type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: AdminUser["role"];
  status: "active" | "inactive";
  verified: boolean;
  joined: string;
  apps: number;
};

/** Format tanggal ISO → "12 Jan 2024". Aman terhadap nilai kosong/invalid. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function toAppRow(app: ApiApplication): AppRow {
  return {
    id: app.id,
    code: app.code,
    name: app.applicant_name || app.company_name || "Tanpa nama",
    service: app.service_label,
    type: app.service_type,
    status: app.status,
    date: formatDate(app.submitted_at),
    officer: app.officer?.name ?? "Belum ditugaskan",
    stages: app.stages ?? [],
  };
}

export function toUserRow(user: AdminUser): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "—",
    role: user.role,
    status: user.is_active ? "active" : "inactive",
    verified: user.email_verified,
    joined: formatDate(user.created_at),
    apps: user.applications_count ?? 0,
  };
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
