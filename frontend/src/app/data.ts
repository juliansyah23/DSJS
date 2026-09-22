import { AuthUser, ServiceType } from "./types";
import { Activity, Briefcase, Building } from "lucide-react";

export const DEMO_ACCOUNTS: (AuthUser & { password: string })[] = [
  { email: "user@dsj.go.id",  password: "demo123",  name: "Rival Adrian",  role: "user"  },
  { email: "admin@dsj.go.id", password: "admin123", name: "ADMIN DSJS", role: "admin" },
];

export function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export const provinces = ["DKI Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur","Banten","DI Yogyakarta","Bali","Sumatera Utara","Sulawesi Selatan","Kalimantan Timur"];
export const cities    = ["Bandung","Surabaya","Bekasi","Tangerang","Depok","Semarang","Makassar","Medan","Palembang","Malang"];
export const districts = ["Coblong","Cicendo","Cibeunying Kidul","Sukajadi","Bandung Wetan","Sumur Bandung","Antapani","Arcamanik","Cidadap","Cinambo"];
export const villages  = ["Dago","Lebak Siliwangi","Cipaganti","Sekeloa","Lebakgede","Cigadung","Sadang Serang","Neglasari","Sukaluyu","Sukaraja"];

export const MOCK_APPLICATIONS = [
  {
    id: "DSJ-2024-0312",
    type: "Izin Lembaga Kursus dan Pelatihan",
    submitted: "12 Mar 2024",
    current: 4,
    stages: [
      { label: "Permohonan Diterima",  date: "12 Mar 2024", done: true  },
      { label: "Verifikasi Dokumen",   date: "14 Mar 2024", done: true  },
      { label: "Review Teknis",        date: "18 Mar 2024", done: true  },
      { label: "Persetujuan Pejabat",  date: "21 Mar 2024", done: true  },
      { label: "SK Diterbitkan",       date: null,          done: false },
    ],
  },
  {
    id: "DSJ-2024-0187",
    type: "Izin Usaha Mikro Kecil (IUMK)",
    submitted: "27 Jan 2024",
    current: 5,
    stages: [
      { label: "Permohonan Diterima",  date: "27 Jan 2024", done: true },
      { label: "Verifikasi Dokumen",   date: "29 Jan 2024", done: true },
      { label: "Review Teknis",        date: "02 Feb 2024", done: true },
      { label: "Persetujuan Pejabat",  date: "07 Feb 2024", done: true },
      { label: "SK Diterbitkan",       date: "10 Feb 2024", done: true },
    ],
  },
];

export const SERVICE_META: Record<ServiceType, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  sip:   { label: "Surat Ijin Praktek (SIP)",    icon: Activity,  color: "text-blue-700",    bg: "bg-blue-50",    desc: "Izin praktik bagi tenaga kesehatan dan profesional" },
  oss:   { label: "Perijinan Berusaha (OSS RBA)", icon: Briefcase, color: "text-emerald-700", bg: "bg-emerald-50", desc: "Perizinan berbasis risiko via Online Single Submission" },
  simbg: { label: "SIMBG",                        icon: Building,  color: "text-orange-700",  bg: "bg-orange-50",  desc: "Izin mendirikan dan memanfaatkan bangunan gedung" },
};
