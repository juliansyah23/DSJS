import { ServiceType } from "./types";

/**
 * Data jenis perizinan (sumber: detail.json — SIMPONIE Kota Tangerang Selatan).
 * File `perizinan.json` dihasilkan oleh `npm run perizinan:build` (scripts/build-perizinan.mjs).
 */

export type PermitLink = { label: string; href: string };
export type PermitLine = { text: string; links?: PermitLink[] };
export type PermitSyaratItem = { text: string; status: string; links?: PermitLink[] };
export type PermitSyaratGroup = { peruntukan: string; jenisPermohonan: string; items: PermitSyaratItem[] };

export type PermitType = {
  value: string;
  name: string;
  url: string;
  daftarUrl: string;
  output: string;
  masaBerlaku: string;
  biaya: string;
  deskripsi: PermitLine[];
  dasarHukum: PermitLine[];
  prosedur: PermitLine[];
  syarat: PermitSyaratGroup[];
};

/** Jenis layanan yang wajib memilih jenis perizinan turunan dari detail.json. */
export const PERMIT_SERVICES: ServiceType[] = ["sip"];

export const needsPermitType = (service: ServiceType | null | undefined): boolean =>
  !!service && PERMIT_SERVICES.includes(service);

/** Key yang disimpan di form_data draft / permohonan. */
export const PERMIT_FIELDS = { value: "permitTypeValue", name: "permitTypeName" } as const;

/** Jenis perizinan yang tersedia pada formulir SIP. */
export const ALLOWED_PERMIT_TYPE_VALUES = ["128", "263", "264", "267", "269", "279", "449"] as const;

let cache: Promise<PermitType[]> | null = null;

/** Dimuat secara lazy (file cukup besar) dan di-cache setelah pemanggilan pertama. */
export function loadPermitTypes(): Promise<PermitType[]> {
  if (!cache) {
    cache = import("./perizinan.json")
      .then(m => (m.default as unknown as PermitType[]).filter(permit =>
        ALLOWED_PERMIT_TYPE_VALUES.includes(permit.value as typeof ALLOWED_PERMIT_TYPE_VALUES[number])
      ))
      .catch(e => { cache = null; throw e; });
  }
  return cache;
}