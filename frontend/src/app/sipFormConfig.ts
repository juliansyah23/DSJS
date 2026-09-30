// ─── Per-permit form configuration (SIP service) ─────────────────────────────
// Keyed by permitTypeValue (e.g. "128" | "267"). Used by ApplyPage to render
// Tahap 4 (Data Permohonan) and Tahap 5 (Upload Berkas) per selected permit type.

export type PermitFieldType = "text" | "date" | "select" | "textarea" | "file" | "number" | "radio" | "checkbox";

/** Satuan di samping input angka — string biasa ("m", "m²") atau dropdown ("Rasio"). */
export type PermitFieldUnit = string | { type: "select"; placeholder?: string; options?: string[] };

export interface PermitField {
  id: string;
  label: string;
  type: PermitFieldType;
  /** Wajib diisi (opsional, default false). */
  required?: boolean;
  options?: string[];
  /** Placeholder; defaults to the label when omitted. */
  placeholder?: string;
  /** Catatan kecil di bawah label. */
  note?: string;
  /** Nilai awal (mis. select dengan default). */
  defaultValue?: string;
  /** Nilai minimum untuk type number. */
  min?: number;
  /** Satuan di samping input number. */
  unit?: PermitFieldUnit;
  /** accept file, default "application/pdf". */
  accept?: string;
  /** Batas ukuran file (MB), default 5. */
  maxSizeMB?: number;
}

/** Syarat tampil untuk seksi (dinamis). */
export interface PermitVisibleIf {
  field: string;
  equals: string;
}

export interface PermitSection {
  title: string;
  fields: PermitField[];
  visibleIf?: PermitVisibleIf;
  /** Blok info di bawah field. */
  info?: string[];
}

export interface PermitFileLabel {
  /** Stable key, e.g. OSS requirement id. */
  id: string;
  label: string;
  /** "Wajib" | "Tentatif" — both are required before submit; badge differs. */
  status: string;
  note?: string;
  /** Downloadable template URL. */
  link?: string;
  /** Sub-item description list shown under the label. */
  items?: string[];
}

export interface PermitFormConfig {
  sections: PermitSection[];
  files: PermitFileLabel[];
  /** Blok info di bawah seluruh form Tahap 4 (opsional). */
  info?: string[];
}

const SIP_OPTIONS = ["SIP KESATU", "SIP KEDUA", "SIP KETIGA"];
const YES_NO_OPTIONS = ["Ya", "Tidak"];
const STR_COPY_OPTIONS = ["01", "02", "03"];
const PRACTICE_PLACE_OPTIONS = [
  "Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium",
  "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan",
  "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha",
];
const PROFESSION_OPTIONS = [
  "Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi",
  "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi",
  "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional",
  "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik",
];
const CORRECTION_OPTIONS = [
  "Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik",
  "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik",
];

const SIP_267: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "sipKeberapa", label: "SIP keberapa", type: "select", required: true, options: SIP_OPTIONS },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan (Pilih Ya atau Tidak)", type: "select", required: true, options: YES_NO_OPTIONS },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: STR_COPY_OPTIONS },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        {
          id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true,
          options: PRACTICE_PLACE_OPTIONS,
        },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true, placeholder: "contoh: Senin - Jumat" },
        {
          id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true,
          options: PROFESSION_OPTIONS,
        },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "text", required: true, placeholder: "contoh: 08:00" },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "text", required: true, placeholder: "contoh: 14:00" },
        { id: "hariPraktikShift2", label: "Hari Praktik Shift 2", type: "text", required: false },
        { id: "jamMulaiShift2", label: "Jam mulai Praktik Kerja Shift 2", type: "text", required: false, placeholder: "contoh: 14:00" },
        { id: "jamSelesaiShift2", label: "Jam Selesai Praktik Kerja Shift 2", type: "text", required: false, placeholder: "contoh: 20:00" },
        { id: "hariPraktikShift3", label: "Hari Praktik Shift 3", type: "text", required: false },
        { id: "jamMulaiShift3", label: "Jam mulai Praktik Kerja Shift 3", type: "text", required: false, placeholder: "contoh: 20:00" },
        { id: "jamSelesaiShift3", label: "Jam Selesai Praktik Kerja Shift 3", type: "text", required: false, placeholder: "contoh: 08:00" },
        { id: "pasFoto", label: "Pas Foto Berwarna 4x6 (jpg atau png)", type: "file", required: false, note: "jpg atau png, maks 5 MB" },
        { id: "jabatan", label: "Jabatan", type: "text", required: true },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: false },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: false },
        { id: "pendidikan", label: "Pendidikan", type: "textarea", required: true },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false,
          options: CORRECTION_OPTIONS,
        },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1922", label: "Ijazah Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1979", label: "SIP ke 1 dan atau SIP ke 2 yang dimiliki dan masih berlaku", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1919", label: "Bukti Kepesertaan BPJS Kesehatan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1930", label: "KTP asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1961", label: "STR Salinan (yang masih memiliki masa berlaku) dan STR seumur hidup", status: "Wajib", note: "PDF, maks 5 MB" },
    {
      id: "1969", label: "Bagi pemohon yang sudah memiliki SIP dengan tempat praktik di instansi atau fasyankes Pemerintah, Wajib melampirkan:", status: "Tentatif", note: "PDF, maks 5 MB",
      items: ["Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Pemerintah", "Surat Pernyataan bermaterai bahwa Tenaga Medis dan Tenaga Kesehatan bukan PNS atau PPPK di instansi/Fasilitas Pelayanan Kesehatan Pemerintah; dan / atau", "SK Jabatan Fungsional bagi PNS atau PPPK"],
    },
    { id: "1976", label: "Bagi pemohon yang memiliki SIP berpraktik di Fasyankes Swasta dan akan mengajukan permohonan SIP untuk berpraktik di Instansi atau Fasyankes Pemerintah, wajib melampirkan: Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Swasta", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
  ],
};

const SIP_128: PermitFormConfig = {
  sections: [
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true, note: "Khusus Praktik Dokter isi dengan nama lengkap beserta gelar sesuai REKOMENDASI" },
        { id: "tempatTanggalLahir", label: "Tempat dan Tanggal Lahir", type: "text", required: true },
        { id: "namaTempatPraktik", label: "Nama Tempat Praktik", type: "text", required: true },
        { id: "alamatTempatPraktik", label: "Alamat Tempat Praktik", type: "textarea", required: true },
      ],
    },
  ],
  files: [
    { id: "1743", label: "Surat Permohonan SIP DRH", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1rFt1s1Rc2g36BULiM6vNvKWdO-duxReW/edit?usp=sharing&ouid=115429334505613240710&rtpof=true&sd=true" },
    { id: "128", label: "KTP/Passpor Pemohon/Direktur/Penanggung jawab", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "132", label: "NPWP Pribadi (Perseorangan) atau NPWP Badan Hukum (Jika Perusahaan atau Yayasan)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1738", label: "Scan Pas Foto berwarna ukuran 4x6 (empat kali enam)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "864", label: "Scan Ijazah Dokter Hewan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1744", label: "Scan Sertifikat Kompetensi Dokter Hewan yang diterbitkan organisasi profesi kedokteran hewan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1776", label: "Surat Rekomendasi dari Organisasi Profesi Kedokteran Hewan Cabang Setempat (PDHI Cabang Banten II)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "322", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar", status: "Wajib", note: "PDF, maks 5 MB", link: "https://drive.google.com/file/d/1-_0NH5JDLeC4g4_rIuCQLZ_RhNrPqrnH/view" },
  ],
};

const SIP_449: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "sipKeberapa", label: "SIP keberapa", type: "select", required: true, options: SIP_OPTIONS },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan", type: "select", required: true, options: YES_NO_OPTIONS },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true },
        { id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true, options: ["Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium", "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan", "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha"] },
        { id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true, options: ["Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi", "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi", "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional", "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik"] },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: ["01", "02", "03"] },
        { id: "pendidikan", label: "Pendidikan", type: "textarea", required: true },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: false },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: false },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false, options: ["Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik", "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik"] },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1961", label: "STR Salinan (yang masih memiliki masa berlaku) dan STR seumur hidup", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1930", label: "KTP asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1919", label: "Bukti Kepesertaan BPJS Kesehatan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1922", label: "Ijazah Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1969", label: "Bagi pemohon yang sudah memiliki SIP dengan tempat praktik di instansi atau fasyankes Pemerintah, Wajib melampirkan:", status: "Tentatif", note: "PDF, maks 5 MB", items: ["Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Pemerintah", "Surat Pernyataan bermaterai bahwa Tenaga Medis dan Tenaga Kesehatan bukan PNS atau PPPK di instansi/Fasilitas Pelayanan Kesehatan Pemerintah; dan / atau", "SK Jabatan Fungsional bagi PNS atau PPPK"] },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
  ],
};

const SIP_269: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "sipKeberapa", label: "SIP keberapa", type: "select", required: true, options: ["SIP KESATU", "SIP KEDUA", "SIP KETIGA"] },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan", type: "select", required: true, options: ["Ya", "Tidak"] },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "pendidikan", label: "Pendidikan", type: "textarea", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: ["01", "02", "03"] },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true, options: ["Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium", "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan", "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha"] },
        { id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true, options: ["Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi", "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi", "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional", "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik"] },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "hariPraktikShift2", label: "Hari Praktik Shift 2", type: "text", required: false },
        { id: "jamMulaiShift2", label: "Jam mulai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "jamSelesaiShift2", label: "Jam Selesai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "hariPraktikShift3", label: "Hari Praktik Shift 3", type: "text", required: false },
        { id: "jamMulaiShift3", label: "Jam mulai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "jamSelesaiShift3", label: "Jam Selesai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "pasFoto", label: "Pas Foto Berwarna 4x6 (jpg atau png)", type: "file", required: false, note: "jpg atau png" },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: false },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: false },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false, options: ["Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik", "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik"] },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1961", label: "STR Salinan (yang masih memiliki masa berlaku) dan STR seumur hidup", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1930", label: "KTP asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1919", label: "Bukti Kepesertaan BPJS Kesehatan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1922", label: "Ijazah Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1969", label: "Bagi pemohon yang sudah memiliki SIP dengan tempat praktik di instansi atau fasyankes Pemerintah, Wajib melampirkan:", status: "Tentatif", note: "PDF, maks 5 MB", items: ["Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Pemerintah", "Surat Pernyataan bermaterai bahwa Tenaga Medis dan Tenaga Kesehatan bukan PNS atau PPPK di instansi/Fasilitas Pelayanan Kesehatan Pemerintah; dan / atau", "SK Jabatan Fungsional bagi PNS atau PPPK"] },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
  ],
};

const SIP_279: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "sipKeberapa", label: "SIP keberapa", type: "select", required: true, options: ["SIP KESATU", "SIP KEDUA", "SIP KETIGA"] },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan", type: "select", required: true, options: ["Ya", "Tidak"] },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true, options: ["Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi", "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi", "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional", "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik"] },
        { id: "pendidikan", label: "Pendidikan", type: "textarea", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: ["01", "02", "03"] },
        { id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true, options: ["Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium", "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan", "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha"] },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "hariPraktikShift2", label: "Hari Praktik Shift 2", type: "text", required: false },
        { id: "jamMulaiShift2", label: "Jam mulai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "jamSelesaiShift2", label: "Jam Selesai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "hariPraktikShift3", label: "Hari Praktik Shift 3", type: "text", required: false },
        { id: "jamMulaiShift3", label: "Jam mulai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "jamSelesaiShift3", label: "Jam Selesai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "pasFoto", label: "Pas Foto Berwarna 4x6 (jpg atau png)", type: "file", required: false, note: "jpg atau png" },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: false },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: false },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false, options: ["Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik", "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik"] },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1938", label: "SIP Lama Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1900", label: "Surat Tanda Registrasi (STR) Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "2090", label: "Satuan Kecukupan Profesi (SKP) dari aplikasi skp.kemkes.go.id", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "1976", label: "Bagi pemohon yang memiliki SIP berpraktik di Fasyankes Swasta dan akan mengajukan permohonan SIP untuk berpraktik di Instansi atau Fasyankes Pemerintah, wajib melampirkan: Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Swasta", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
    { id: "1969", label: "Bagi pemohon yang sudah memiliki SIP dengan tempat praktik di instansi atau fasyankes Pemerintah, Wajib melampirkan:", status: "Tentatif", note: "PDF, maks 5 MB", items: ["Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Pemerintah", "Surat Pernyataan bermaterai bahwa Tenaga Medis dan Tenaga Kesehatan bukan PNS atau PPPK di instansi/Fasilitas Pelayanan Kesehatan Pemerintah; dan / atau", "SK Jabatan Fungsional bagi PNS atau PPPK"] },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1980", label: "SK Pencabutan SIP Lama", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "1967", label: "Surat Izin Operasional Fasyankes yang diterbitkan melalui sistem OSS atau sistem SIMPONIE", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "1975", label: "Surat Pernyataan Kecukupan SKP", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://drive.google.com/file/d/1ORP__R4m4ofA7ShcaMBy8jPVdJZq6Acd/view?usp=sharing" },
  ],
};

const SIP_263: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan", type: "select", required: true, options: ["Ya", "Tidak"] },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true, note: "Khusus Praktik Dokter isi dengan nama lengkap beserta gelar sesuai REKOMENDASI" },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: false },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "sipKeBerapa", label: "SIP Ke Berapa", type: "select", required: true, options: ["SIP KESATU", "SIP KEDUA", "SIP KETIGA"] },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "jenisPendidikan", label: "Jenis Pendidikan", type: "text", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: ["01", "02", "03"] },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true, options: ["Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium", "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan", "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha"] },
        { id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true, options: ["Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi", "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi", "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional", "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik"] },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "hariPraktikShift2", label: "Hari Praktik Shift 2", type: "text", required: false },
        { id: "jamMulaiShift2", label: "Jam mulai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "jamSelesaiShift2", label: "Jam Selesai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "hariPraktikShift3", label: "Hari Praktik Shift 3", type: "text", required: false },
        { id: "jamMulaiShift3", label: "Jam mulai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "jamSelesaiShift3", label: "Jam Selesai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "pasFoto", label: "Pas Foto Berwarna 4x6 (jpg atau png)", type: "file", required: false, note: "jpg atau png" },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: false },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false, options: ["Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik", "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik"] },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1938", label: "SIP Lama Asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1919", label: "Bukti Kepesertaan BPJS Kesehatan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1988", label: "Bukti Satuan Kecukupan Profesi (SKP) dari aplikasi skp.kemkes.go.id", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1975", label: "Surat Pernyataan Kecukupan SKP", status: "Wajib", note: "PDF, maks 5 MB", link: "https://drive.google.com/file/d/1ORP__R4m4ofA7ShcaMBy8jPVdJZq6Acd/view?usp=sharing" },
    { id: "1961", label: "STR Salinan (yang masih memiliki masa berlaku) dan STR seumur hidup", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1976", label: "Bagi pemohon yang memiliki SIP berpraktik di Fasyankes Swasta dan akan mengajukan permohonan SIP untuk berpraktik di Instansi atau Fasyankes Pemerintah, wajib melampirkan: Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Swasta", status: "Tentatif", note: "PDF, maks 5 MB" },
    { id: "1969", label: "Bagi pemohon yang sudah memiliki SIP dengan tempat praktik di instansi atau fasyankes Pemerintah, Wajib melampirkan:", status: "Tentatif", note: "PDF, maks 5 MB", items: ["Surat persetujuan dari Atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasilitas Pelayanan Kesehatan Pemerintah", "Surat Pernyataan bermaterai bahwa Tenaga Medis dan Tenaga Kesehatan bukan PNS atau PPPK di instansi/Fasilitas Pelayanan Kesehatan Pemerintah; dan / atau", "SK Jabatan Fungsional bagi PNS atau PPPK"] },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
  ],
};

const SIP_264: PermitFormConfig = {
  sections: [
    {
      title: "DATA UMUM",
      fields: [
        { id: "nomorKtp", label: "Nomor KTP", type: "text", required: true },
        { id: "sipKeBerapa", label: "SIP Ke Berapa", type: "select", required: true, options: ["SIP KESATU", "SIP KEDUA", "SIP KETIGA"] },
        { id: "bpjsKetenagakerjaan", label: "Kepesertaan BPJS Ketenagakerjaan", type: "select", required: true, options: ["Ya", "Tidak"] },
      ],
    },
    {
      title: "DATA TAMPIL DI SK",
      fields: [
        { id: "namaPemohon", label: "Nama Pemohon", type: "text", required: true, note: "Khusus Praktik Dokter isi dengan nama lengkap beserta gelar sesuai REKOMENDASI" },
        { id: "tempatLahir", label: "Tempat Lahir", type: "text", required: true },
        { id: "tanggalLahir", label: "Tanggal Lahir", type: "date", required: true },
        { id: "alamatPemohon", label: "Alamat Pemohon", type: "textarea", required: true },
        { id: "jenisPendidikan", label: "Jenis Pendidikan", type: "text", required: true },
        { id: "nomorStr", label: "Nomor STR", type: "text", required: true },
        { id: "nomorSerkomSkp", label: "Nomor serkom atau surat keterangan pemenuhan SKP", type: "text", required: true },
        { id: "tempatPraktik", label: "Tempat Praktik", type: "text", required: true },
        { id: "untukPraktik", label: "Untuk Praktik", type: "select", required: true, options: ["Dokter Umum", "Dokter Spesialis", "Dokter Gigi", "Perawat", "Perawat Gigi", "Bidan", "Penataan Anestesi", "Apoteker", "Tenaga Kefarmasian", "Ahli Lab. Medik", "Radiografer", "Fisioterapis", "Optisien", "Tenaga Gizi", "Sanitarian", "Elektromedis", "Terapis Wicara", "Okupasi Terapis", "Tenaga Kesehatan Tradisional", "Penyehat Tradisional", "Rekam Medis", "Ortotis Prostetis", "Psikologi Klinis", "Teknisi Kardiovaskuler", "Fisika Medik"] },
        { id: "strSalinanKe", label: "STR Salinan Ke", type: "select", required: true, options: ["01", "02", "03"] },
        { id: "jenisTempatPraktik", label: "Jenis Tempat Praktik", type: "select", required: true, options: ["Rumah Sakit", "Puskesmas", "Klinik", "Balai Pengobatan", "Pribadi", "Apotek", "Laboratorium", "Produsen sediaan Farmasi dan Alat Kesehatan", "Distributor Sediaan Farmasi dan Alat Kesehatan", "Fasilitas pelayanan kefarmasian", "Fasilitas lain yang telah memiliki perizinan berusaha"] },
        { id: "hariPraktikShift1", label: "Hari Praktik Shift 1", type: "text", required: true },
        { id: "jamMulaiShift1", label: "Jam mulai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "jamSelesaiShift1", label: "Jam Selesai Praktik Kerja Shift 1", type: "number", required: true },
        { id: "hariPraktikShift2", label: "Hari Praktik Shift 2", type: "text", required: false },
        { id: "jamMulaiShift2", label: "Jam mulai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "jamSelesaiShift2", label: "Jam Selesai Praktik Kerja Shift 2", type: "number", required: false },
        { id: "hariPraktikShift3", label: "Hari Praktik Shift 3", type: "text", required: false },
        { id: "jamMulaiShift3", label: "Jam mulai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "jamSelesaiShift3", label: "Jam Selesai Praktik Kerja Shift 3", type: "number", required: false },
        { id: "pasFoto", label: "Pas Foto Berwarna 4x6 (jpg atau png)", type: "file", required: false, note: "jpg atau png" },
        { id: "tanggalSkTerbit", label: "Tanggal SK Terbit", type: "date", required: true },
        { id: "nomorSkSipLama", label: "Nomor SK SIP Lama", type: "textarea", required: true },
        { id: "masaBerlakuStr", label: "Masa Berlaku STR", type: "date", required: true },
        { id: "jenisPerbaikan", label: "Jenis Perbaikan", type: "select", required: false, options: ["Nama", "Tempat/Tanggal Lahir", "Alamat", "Nomor STR", "SIP Ke", "Nama Tempat Praktik", "Alamat Tempat Praktik", "Nama profesi", "Hari Praktik", "Masa Berlaku SIP", "Jam Praktik"] },
      ],
    },
  ],
  files: [
    { id: "1924", label: "Surat Pernyataan Bermaterai cukup (Rp10.000,00) yang menyatakan bahwa Data dan Dokumen yang diserahkan adalah Sah dan Benar beserta jadwal praktik", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1MG29wVISgOEl1twGghxs5Kem789eSWAb/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1963", label: "Tangkapan layar aplikasi SISDMK dari Fasyankes yang menunjukkan nama pemohon bahwa sudah terdaftar pada aplikasi tersebut", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1962", label: "Surat Keterangan bekerja dari Pimpinan Fasyankes", status: "Wajib", note: "PDF, maks 5 MB", link: "https://docs.google.com/document/d/1IzEIEIIYZLDSG3GeLuG4Spy-yy2k1Z_Q/edit?usp=sharing&ouid=102646153344722454936&rtpof=true&sd=true" },
    { id: "1979", label: "SIP ke 1 dan atau SIP ke 2 yang dimiliki dan masih berlaku", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1967", label: "Surat Izin Operasional Fasyankes yang diterbitkan melalui sistem OSS atau sistem SIMPONIE", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1965", label: "Pas Foto Berwarna Terbaru Berlatar Belakang Merah (format jpg)", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1919", label: "Bukti Kepesertaan BPJS Kesehatan", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1930", label: "KTP asli", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "1961", label: "STR Salinan (yang masih memiliki masa berlaku) dan STR seumur hidup", status: "Wajib", note: "PDF, maks 5 MB" },
    { id: "2098", label: "Bagi pemohon yang memiliki SIP aktif dan akan mengajukan permohonan SIP (baik di instansi/Fasyankes Pemerintah maupun Swasta), wajib melampirkan:", status: "Wajib", note: "PDF, maks 5 MB", items: ["Bagi pemohon NON-ASN: Surat persetujuan dari atasan langsung bagi Tenaga Medis dan Tenaga Kesehatan yang bekerja pada instansi/Fasyankes Pemerintah maupun swasta", "ATAU bagi pemohon ASN: Surat persetujuan dari atasan langsung di instansi Pemerintah asal; dan SK Jabatan Fungsional ASN (PNS atau PPPK) yang berlaku"] },
    { id: "2033", label: "Tanda Bukti Kepesertaan BPJS Ketenagakerjaan. Jika Belum Menjadi Peserta Silahkan Daftar", status: "Tentatif", note: "PDF, maks 5 MB", link: "https://bpjstk.co/ptsptangsel" },
  ],
};

// ─── SIMBG (satu form tetap, tanpa dropdown jenis izin) ─────────────────────────
const SIMBG: PermitFormConfig = {
  sections: [
    {
      title: "Data Intensitas Pemanfaatan Ruang",
      fields: [
        { id: "nomorDokumenIzinPemanfaatanRuang", label: "Nomor Dokumen Izin Pemanfaatan Ruang", type: "text", required: true },
        { id: "gsb", label: "Garis Sempadan Bangunan (GSB)", type: "number", min: 0, unit: "m", required: true },
        { id: "kdb", label: "Koefisien Dasar Bangunan (KDB)", type: "number", min: 0, unit: { type: "select", placeholder: "Rasio" }, required: true },
        { id: "klb", label: "Koefisien Lantai Bangunan (KLB)", type: "number", min: 0, unit: { type: "select", placeholder: "Rasio" }, required: true },
        { id: "kdh", label: "Koefisien Dasar Hijau (KDH)", type: "number", min: 0, unit: { type: "select", placeholder: "Rasio" }, required: true },
      ],
    },
    {
      title: "Berapa jumlah bukti kepemilikan tanah pada lokasi bangunan Anda?",
      fields: [
        { id: "jumlahBuktiKepemilikanTanah", label: "Berapa jumlah bukti kepemilikan tanah pada lokasi bangunan Anda?", type: "number", min: 0, required: true },
      ],
    },
    {
      title: "Bangunan gedung ini dimiliki oleh?",
      fields: [
        { id: "kepemilikanBangunanGedung", label: "Bangunan gedung ini dimiliki oleh?", type: "select", defaultValue: "Perorangan", options: ["Perorangan", "Badan Usaha", "Pemerintah"], required: true },
      ],
    },
    {
      title: "Apakah Anda akan menggunakan desain prototipe yang disediakan?",
      fields: [
        { id: "gunakanDesainPrototipe", label: "Apakah Anda akan menggunakan desain prototipe yang disediakan?", type: "radio", options: ["Ya", "Tidak"], required: true },
      ],
    },
    {
      title: "Data Bangunan:",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Ya" },
      fields: [
        { id: "jumlahUnitDibangun", label: "Jumlah Unit yang dibangun", type: "number", min: 0, required: true },
        { id: "latitudeBangunan", label: "Titik Koordinat Latitude Bangunan", type: "text", required: true },
        { id: "longitudeBangunan", label: "Titik Koordinat Longitude Bangunan", type: "text", required: true },
        { id: "jumlahPenghuni", label: "Jumlah Penghuni", type: "number", min: 0, required: true },
        { id: "gambarPetaLokasiBangunan", label: "Gambar Peta Lokasi Bangunan", type: "file", accept: "image/*,application/pdf", maxSizeMB: 100 },
      ],
      info: [
        "Titik koordinat bangunan merupakan lokasi bangunan yang akan berdiri ditandai dengan posisi garis lintang (Latitude) dan garis bujur (Longitude) di atas peta.",
        "Data titik koordinat bangunan diperoleh melalui GPS (Global Positioning System) atau layanan peta digital (contoh: google maps).",
      ],
    },
    {
      title: "Silahkan pilih desain prototipe berikut",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Ya" },
      fields: [
        { id: "desainPrototipe", label: "Silahkan pilih desain prototipe berikut", type: "select", required: true, options: [
          "Rumah Tinggal Sederhana Tipe 36 (PP No. 16 Tahun 2021)",
          "Rumah Tinggal Sederhana Tipe 54 (PP No. 16 Tahun 2021)",
          "Rumah Tinggal Sederhana Tipe 72 (PP No. 16 Tahun 2021)",
          "Rumah Tinggal Sederhana Tipe 22 Alternatif 1 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 30 Alternatif 1 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 30 Alternatif 2 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 32 Alternatif 1 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 32 Alternatif 2 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 36 Alternatif 1 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 36 Alternatif 2 (Kepmen PUPR No: 2947/KPTS/2024)",
          "Rumah Tinggal Sederhana Tipe 36 Alternatif 3 (Kepmen PUPR No: 2947/KPTS/2024)",
          "SPBU Mikro 3 (Tiga) Kilo Liter (Pertashop) (Kepmen PUPR No: 05/KPTS/M/2022)",
          "SPPG Tipe I (Kepmen PU No. 628 KPTS/M/2025)",
          "SPPG Tipe II (Kepmen PU No. 628 KPTS/M/2025)",
          "SPPG Tipe III (Kepmen PU No. 628 KPTS/M/2025)",
          "Koperasi Desa/Kelurahan Merah Putih (Kepmen PU No. 1342 KPTS/M/2025)",
        ] },
      ],
    },
    {
      title: "Apakah Bangunan Anda akan digunakan lebih dari 5 Tahun?",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Tidak" },
      fields: [
        { id: "penggunaanBangunanLebihDari5Tahun", label: "Apakah Bangunan Anda akan digunakan lebih dari 5 Tahun?", type: "radio", required: true, options: ["Ya, Lebih dari 5 tahun", "Tidak, Kurang dari 5 tahun"] },
      ],
    },
    {
      title: "Bangunan Anda akan digunakan sebagai..",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Tidak" },
      fields: [
        { id: "fungsiBangunan", label: "Bangunan Anda akan digunakan sebagai..", type: "checkbox", required: true, options: [
          "Fungsi Hunian", "Fungsi Usaha", "Fungsi Keagamaan", "Fungsi Usaha (UMKM)", "Fungsi Sosial Budaya", "Bangunan Prasarana",
        ] },
      ],
    },
    {
      title: "Subfungsi Bangunan",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Tidak" },
      fields: [
        { id: "kategoriBangunan", label: "Apa kategori Bangunan Anda?", type: "radio", required: true, options: [
          "Rumah Tinggal Deret", "Rumah Tinggal Deret (MBR)", "Rumah Tinggal Tunggal", "Rumah Tinggal Tunggal (MBR)", "Rumah Susun", "Rumah Susun (MBR)",
        ] },
      ],
      info: ["sub fungsi"],
    },
    {
      title: "Apakah Bangunan Anda memiliki basemen?",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Tidak" },
      fields: [
        { id: "memilikiBasemen", label: "Apakah Bangunan Anda memiliki basemen?", type: "radio", required: true, options: ["Memiliki", "Tidak Memiliki"] },
      ],
    },
    {
      title: "Data Bangunan:",
      visibleIf: { field: "gunakanDesainPrototipe", equals: "Tidak" },
      fields: [
        { id: "namaBangunan", label: "Nama Bangunan", type: "text", required: true },
        { id: "luasTotalBangunanPerUnit", label: "Luas Total Bangunan Per Unit (Selain Basemen)", type: "number", min: 0, unit: "m²", required: true },
        { id: "tinggiBangunan", label: "Tinggi Bangunan", type: "number", min: 0, unit: "m", required: true },
        { id: "jumlahLantai", label: "Jumlah Lantai", type: "text", required: true },
        { id: "luasLapisBasemen", label: "Luas Lapis Basemen", type: "number", min: 0 },
        { id: "jumlahLapisBasemen", label: "Jumlah Lapis Basemen", type: "text" },
        { id: "jumlahUnit", label: "Jumlah Unit", type: "number", min: 0, required: true },
        { id: "estimasiJumlahPenghuni", label: "Estimasi Jumlah Penghuni", type: "number", min: 0, required: true },
        { id: "latitudeBangunan", label: "Titik Koordinat Latitude Bangunan", type: "text", required: true },
        { id: "longitudeBangunan", label: "Titik Koordinat Longitude Bangunan", type: "text", required: true },
        { id: "gambarPetaLokasiBangunan", label: "Gambar Peta Lokasi Bangunan", type: "file", accept: "image/*,application/pdf", maxSizeMB: 100 },
      ],
      info: [
        "Titik koordinat bangunan merupakan lokasi bangunan yang akan berdiri ditandai dengan posisi garis lintang (Latitude) dan garis bujur (Longitude) di atas peta.",
        "Data titik koordinat bangunan diperoleh melalui GPS (Global Positioning System) atau layanan peta digital (contoh: google maps).",
      ],
    },
  ],
  files: [],
  info: [
    "Dokumen Izin Pemanfaatan Ruang paling sedikit memuat KDB, KLB, KDH, dan GSB yang dijadikan sebagai acuan dalam perencanaan bangunan.",
    "Koefisien Dasar Bangunan (KDB) adalah koefisien perbandingan antara luas lantai dasar bangunan dengan luas persil/kaveling.",
    "Koefisien Lantai Bangunan (KLB) adalah koefisien perbandingan antara luas seluruh lantai bangunan dan luas persil/kaveling.",
    "Koefisien Dasar Hijau (KDH) adalah angka persentase perbandingan antara luas seluruh ruang terbuka di luar bangunan gedung yang diperuntukkan bagi pertamanan/penghijauan dengan luas persil/kaveling.",
    "Garis Sempadan Bangunan (GSB) adalah jarak minimum antara garis pagar terhadap dinding bangunan terdepan.",
  ],
};

// ─── OSS RBA (Perizinan Berusaha Berbasis Risiko) — Tahap 4 = Data Usaha ────────
const OSS: PermitFormConfig = {
  sections: [
    {
      title: "Data Usaha",
      fields: [
        { id: "namaUsaha", label: "Nama Usaha", type: "text", required: true },
        { id: "nib", label: "Nomor Induk Berusaha (NIB)", type: "text", note: "Kosongkan jika belum memiliki NIB" },
        { id: "skalaUsaha", label: "Skala Usaha", type: "select", required: true, options: ["Usaha Mikro", "Usaha Kecil", "Usaha Menengah", "Usaha Besar"] },
        { id: "tingkatRisiko", label: "Tingkat Risiko (RBA)", type: "select", required: true, options: ["Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi"] },
        { id: "kbli", label: "Kode KBLI", type: "text", required: true, note: "Contoh: 47111 — perdagangan eceran berbagai macam barang" },
        { id: "deskripsiKegiatanUsaha", label: "Deskripsi Kegiatan Usaha", type: "textarea", required: true },
        { id: "jumlahTenagaKerja", label: "Jumlah Tenaga Kerja", type: "number", min: 0 },
        { id: "modalUsaha", label: "Modal Usaha / Nilai Investasi", type: "number", min: 0, unit: "Rp" },
        { id: "npwpUsaha", label: "NPWP Usaha", type: "text" },
        { id: "teleponUsaha", label: "Telepon Usaha", type: "text" },
        { id: "emailUsaha", label: "Email Usaha", type: "text" },
        { id: "alamatUsaha", label: "Alamat Usaha", type: "textarea", required: true },
      ],
    },
  ],
  files: [],
  info: [
    "Perizinan Berusaha Berbasis Risiko (OSS RBA) menggunakan klasifikasi KBLI dan tingkat risiko untuk menentukan jenis perizinan yang diterbitkan.",
    "KBLI adalah Klasifikasi Baku Lapangan Usaha Indonesia (5 digit) yang sesuai dengan kegiatan usaha Anda.",
    "Tingkat risiko menentukan output perizinan: NIB (risiko rendah), Sertifikat Standar (menengah), atau Izin (tinggi).",
  ],
};

export const SIP_FORM_CONFIG: Record<string, PermitFormConfig> = {
  "128": SIP_128,
  "263": SIP_263,
  "264": SIP_264,
  "267": SIP_267,
  "269": SIP_269,
  "279": SIP_279,
  "449": SIP_449,
  "simbg": SIMBG,
  "oss": OSS,
};