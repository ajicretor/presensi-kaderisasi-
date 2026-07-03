export interface Peserta {
  id: string; // ID / CARD (e.g. "IX-22.29.01.30052026.001")
  nama: string;
  utusan: string;
  hp: string;
  foto?: string;
  nilai_post_test: number;
  nilai_praktik: number;
  nilai_keaktifan: number;
  status_kelulusan: "LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS";
  no_sertifikat: string;
  izin_menit: number;
  created_at?: string;
  kab_kota?: string; // multi-tenancy
}

export interface Sesi {
  num: number;
  materi: string;
  instruktur: string;
  startTime: string; // e.g. "08:00"
  duration: number; // minutes
  maxLate: number; // minutes
  toiletLimit: number; // minutes
  active: boolean;
  kab_kota?: string; // multi-tenancy
}

export interface Presensi {
  id: string; // Reference back to Peserta.id (e.g. "IX-...")
  nama: string;
  utusan: string;
  materi: string;
  waktu: string; // Date string format
  status: "Tepat Waktu" | "Terlambat";
  sesi: number;
  created_at?: string;
  kab_kota?: string; // multi-tenancy
}

export interface Tim {
  username: string;
  nama: string;
  role: "Admin" | "Operator" | "SuperAdmin"; // Added SuperAdmin role
  password?: string;
  permissions: string[]; // ["dash", "scan", "sesi", "peserta", "rekap", "kelulusan"]
  kab_kota?: string; // multi-tenancy (empty/null for global superadmin)
  is_superadmin?: boolean; // explicit superadmin flag
}

export interface Branding {
  appName: string;
  organisasi: string;
  cabang: string;
  totalSesi: number;
  logo: string; // SVG or HTML
  themeColor: "emerald" | "navy" | "indigo" | "rose" | "amber";
  delegationType?: string; // e.g. "PAC", "PC", "Kabupaten", "Kota", etc.
  kab_kota?: string; // multi-tenancy
}

export interface SystemState {
  peserta: Peserta[];
  presensi: Presensi[];
  sesi: Sesi[];
  tim: Tim[];
  activeSesiId: number;
  branding: Branding;
}
