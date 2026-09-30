import { AuthUser, ServiceType } from "./types";
import { Activity, Briefcase, Building } from "lucide-react";
import locations from "./locations.json";

export const DEMO_ACCOUNTS: (AuthUser & { password: string })[] = [
  { email: "user@dsj.go.id",  password: "demo123",  name: "Rival Adrian",  role: "user"  },
  { email: "admin@dsj.go.id", password: "admin123", name: "ADMIN DSJS", role: "admin" },
];

export function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export interface LocationCity {
  name: string;
  districts: Record<string, string[]>;
}

/** Dataset wilayah lokal. Sumber: https://github.com/ibnux/data-indonesia */
export const locationData: Record<string, LocationCity[]> = locations as unknown as Record<string, LocationCity[]>;

export const provinces = Object.keys(locationData);
export const cities = [...new Set(Object.values(locationData).flat().map(city => city.name))];
export const districts = [...new Set(Object.values(locationData).flat().flatMap(city => Object.keys(city.districts)))];
export const villages = [...new Set(Object.values(locationData).flat().flatMap(city => Object.values(city.districts).flat()))];

export function citiesForProvince(province: string) {
  return locationData[province]?.map(city => city.name) ?? [];
}

export function districtsForCity(province: string, city: string) {
  return locationData[province]?.find(item => item.name === city)?.districts ?? {};
}

export function villagesForDistrict(province: string, city: string, district: string) {
  return districtsForCity(province, city)[district] ?? [];
}

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
