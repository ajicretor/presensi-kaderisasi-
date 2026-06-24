import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Peserta, Sesi, Presensi, Tim, Branding } from './types';
import { safeStorage } from './utils/storage';

// Check local storage for dynamic connection keys first, otherwise fallback to Vite env variables
let cachedSupabaseClient: SupabaseClient | null = null;

export function getSupabaseKeys() {
  const customUrl = safeStorage.getItem('SIANSOR_SUPABASE_URL');
  const customKey = safeStorage.getItem('SIANSOR_SUPABASE_KEY');
  const meta = (import.meta as any);
  
  const envUrl = (meta.env ? (meta.env.VITE_SUPABASE_URL as string) : '') || (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_URL as string) : '') || '';
  const envKey = (meta.env ? (meta.env.VITE_SUPABASE_ANON_KEY as string) : '') || (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_ANON_KEY as string) : '') || '';

  return {
    url: customUrl || envUrl,
    key: customKey || envKey,
    isCustom: !!(customUrl && customKey),
    isEnv: !!envUrl && !!envKey
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseKeys();
  
  if (!url || !key) {
    return null;
  }

  if (!cachedSupabaseClient) {
    try {
      cachedSupabaseClient = createClient(url, key);
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }

  return cachedSupabaseClient;
}

export function resetSupabaseClient() {
  cachedSupabaseClient = null;
}

// SQL Schema for User reference
export const SUPABASE_SQL_SCHEMA = `-- COPY DAN JALANKAN DI SQL EDITOR SUPABASE ANDA:

-- 1. Tabel Peserta
CREATE TABLE IF NOT EXISTS peserta (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  utusan TEXT NOT NULL,
  hp TEXT NOT NULL,
  foto TEXT,
  nilai_post_test INTEGER DEFAULT 0,
  nilai_praktik INTEGER DEFAULT 0,
  nilai_keaktifan INTEGER DEFAULT 0,
  status_kelulusan TEXT DEFAULT 'TIDAK LULUS',
  no_sertifikat TEXT DEFAULT '',
  izin_menit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Sesi
CREATE TABLE IF NOT EXISTS sesi (
  num INTEGER PRIMARY KEY,
  materi TEXT NOT NULL,
  instruktur TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  duration INTEGER DEFAULT 90,
  "maxLate" INTEGER DEFAULT 10,
  "toiletLimit" INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT false
);

-- 3. Tabel Presensi
CREATE TABLE IF NOT EXISTS presensi (
  db_id BIGSERIAL PRIMARY KEY,
  id TEXT NOT NULL, -- Refers to peserta.id
  nama TEXT NOT NULL,
  utusan TEXT NOT NULL,
  materi TEXT NOT NULL,
  waktu TEXT NOT NULL,
  status TEXT NOT NULL,
  sesi INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Tim (Manajemen Operator)
CREATE TABLE IF NOT EXISTS tim (
  username TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  password TEXT NOT NULL,
  permissions TEXT[] NOT NULL
);

-- 5. Tabel Branding (Konfigurasi Global)
CREATE TABLE IF NOT EXISTS branding (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "appName" TEXT NOT NULL,
  organisasi TEXT NOT NULL,
  cabang TEXT NOT NULL,
  "totalSesi" INTEGER DEFAULT 14,
  logo TEXT NOT NULL,
  "themeColor" TEXT NOT NULL DEFAULT 'emerald',
  "delegationType" TEXT DEFAULT 'PAC'
);

-- Seed defaults for testing
INSERT INTO tim (username, nama, role, password, permissions)
VALUES 
  ('admin', 'Administrator Wilayah', 'Admin', 'admin', ARRAY['dash', 'peserta', 'kelulusan', 'scan', 'sesi', 'rekap']),
  ('operator1', 'Operator Lapangan 01', 'Operator', 'operator1', ARRAY['dash', 'scan', 'rekap']),
  ('operator2', 'Operator Kelas 02', 'Operator', 'operator2', ARRAY['dash', 'sesi'])
ON CONFLICT (username) DO NOTHING;

INSERT INTO branding (id, "appName", organisasi, cabang, "totalSesi", logo, "themeColor")
VALUES (1, 'SI-ANSOR PRO v7.0', 'PC GP ANSOR KABUPATEN BOGOR', 'KABUPATEN BOGOR', 14, '<svg class="w-8 h-8" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 40 C30 40, 55 35, 60 35 C65 35, 90 40, 90 40 C90 40, 93 72, 60 92 C27 72, 30 40, 30 40 Z" stroke="#1E70CD" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 55 L58 71 L86 43" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M52 45 L74 23" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" /><path d="M72 23 H86 V37" stroke="#1E70CD" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" /><path d="M51 64 L58 71 L66 63" stroke="#4FAF3C" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /></svg>', 'emerald')
ON CONFLICT (id) DO NOTHING;

-- 6. Nonaktifkan Row Level Security (RLS) pada semua tabel agar sinkronisasi real-time anon-key dapat berjalan sukses
ALTER TABLE peserta DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesi DISABLE ROW LEVEL SECURITY;
ALTER TABLE presensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE tim DISABLE ROW LEVEL SECURITY;
ALTER TABLE branding DISABLE ROW LEVEL SECURITY;

-- 7. Tabel Rekap Kelulusan
CREATE TABLE IF NOT EXISTS rekap_kelulusan (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  utusan TEXT NOT NULL,
  total_hadir_menit INTEGER DEFAULT 0,
  persentase_kehadiran INTEGER DEFAULT 0,
  izin_menit INTEGER DEFAULT 0,
  evaluasi_sistem TEXT,
  no_sertifikat TEXT DEFAULT '',
  status_kelulusan TEXT DEFAULT 'TIDAK LULUS',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE rekap_kelulusan DISABLE ROW LEVEL SECURITY;
`;

// Supabase fetching utilities with fallback behavior
export async function syncPeserta(data: Peserta[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let allOk = true;
    for (const p of data) {
      const { error } = await client.from('peserta').upsert({
        id: p.id,
        nama: p.nama,
        utusan: p.utusan,
        hp: p.hp,
        foto: p.foto,
        nilai_post_test: p.nilai_post_test,
        nilai_praktik: p.nilai_praktik,
        nilai_keaktifan: p.nilai_keaktifan,
        status_kelulusan: p.status_kelulusan,
        no_sertifikat: p.no_sertifikat,
        izin_menit: p.izin_menit
      });
      if (error) {
        console.error("Error upserting peserta:", error);
        allOk = false;
      }
    }
    return allOk;
  } catch (e) {
    console.error("Supabase peserta sync error:", e);
    return false;
  }
}

export async function deletePesertaFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('peserta').delete().eq('id', id);
    return !error;
  } catch(e) {
    return false;
  }
}

export async function syncSesi(data: Sesi[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let allOk = true;
    for (const s of data) {
      const { error } = await client.from('sesi').upsert({
        num: s.num,
        materi: s.materi,
        instruktur: s.instruktur,
        startTime: s.startTime,
        duration: s.duration,
        maxLate: s.maxLate,
        toiletLimit: s.toiletLimit,
        active: s.active
      });
      if (error) {
        console.error("Error upserting sesi:", error);
        allOk = false;
      }
    }
    return allOk;
  } catch (e) {
    console.error("Supabase sesi sync error:", e);
    return false;
  }
}

export async function deleteSesiFromSupabase(num: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('sesi').delete().eq('num', num);
    return !error;
  } catch(e) {
    return false;
  }
}

export async function syncPresensi(data: Presensi[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Delete old presensi logs and insert new ones to maintain perfect state
    // Or do dynamic reconciliation
    const { error: delError } = await client.from('presensi').delete().neq('id', 'CONCRETE_PLACEHOLDER_IMPROVEMENT');
    if (delError) {
      console.error("Error clearing presensi table:", delError);
      return false;
    }

    if (data.length > 0) {
      const dbRows = data.map(p => ({
        id: p.id,
        nama: p.nama,
        utusan: p.utusan,
        materi: p.materi,
        waktu: p.waktu,
        status: p.status,
        sesi: p.sesi
      }));
      const { error } = await client.from('presensi').insert(dbRows);
      if (error) {
        console.error("Error bulk inserting presensi:", error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error("Supabase presensi sync error:", e);
    return false;
  }
}

export async function syncTim(data: Tim[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let allOk = true;
    for (const t of data) {
      const { error } = await client.from('tim').upsert({
        username: t.username,
        nama: t.nama,
        role: t.role,
        password: t.password || '',
        permissions: t.permissions
      });
      if (error) {
        console.error("Error upserting tim:", error);
        allOk = false;
      }
    }
    return allOk;
  } catch (e) {
    console.error("Supabase tim sync error:", e);
    return false;
  }
}

export async function deleteTimFromSupabase(username: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tim').delete().eq('username', username);
    return !error;
  } catch(e) {
    return false;
  }
}

export async function syncBranding(branding: Branding): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Dynamically query the branding table first to detect active column casing (e.g. appName vs appname)
    const { data: existingBranding } = await client.from('branding').select('*').eq('id', 1).maybeSingle();
    
    const upsertData: any = { id: 1 };
    
    if (existingBranding) {
      const dbKeys = Object.keys(existingBranding);
      
      // appName vs appname
      if (dbKeys.includes('appName')) {
        upsertData.appName = branding.appName;
      } else if (dbKeys.includes('appname')) {
        upsertData.appname = branding.appName;
      } else {
        upsertData.appName = branding.appName;
      }

      // organisasi
      upsertData.organisasi = branding.organisasi;
      
      // cabang
      upsertData.cabang = branding.cabang;

      // totalSesi vs totalsesi
      if (dbKeys.includes('totalSesi')) {
        upsertData.totalSesi = branding.totalSesi;
      } else if (dbKeys.includes('totalsesi')) {
        upsertData.totalsesi = branding.totalSesi;
      } else {
        upsertData.totalSesi = branding.totalSesi;
      }

      // logo
      upsertData.logo = branding.logo;

      // themeColor vs themecolor
      if (dbKeys.includes('themeColor')) {
        upsertData.themeColor = branding.themeColor;
      } else if (dbKeys.includes('themecolor')) {
        upsertData.themecolor = branding.themeColor;
      } else {
        upsertData.themeColor = branding.themeColor;
      }

      // delegationType vs delegationtype
      if (dbKeys.includes('delegationType')) {
        upsertData.delegationType = branding.delegationType || 'PAC';
      } else if (dbKeys.includes('delegationtype')) {
        upsertData.delegationtype = branding.delegationType || 'PAC';
      } else {
        upsertData.delegationType = branding.delegationType || 'PAC';
      }
    } else {
      // If table is completely empty, try default camelCase
      upsertData.appName = branding.appName;
      upsertData.organisasi = branding.organisasi;
      upsertData.cabang = branding.cabang;
      upsertData.totalSesi = branding.totalSesi;
      upsertData.logo = branding.logo;
      upsertData.themeColor = branding.themeColor;
      upsertData.delegationType = branding.delegationType || 'PAC';
    }

    const { error } = await client.from('branding').upsert(upsertData);
    if (error) {
      console.error("Error upserting branding to Supabase:", error);
      
      // Fallback: If camelCase columns failed on empty table, try lowercase fallback
      if (!existingBranding) {
        const fallbackData = {
          id: 1,
          appname: branding.appName,
          organisasi: branding.organisasi,
          cabang: branding.cabang,
          totalsesi: branding.totalSesi,
          logo: branding.logo,
          themecolor: branding.themeColor,
          delegationtype: branding.delegationType || 'PAC'
        };
        const { error: err2 } = await client.from('branding').upsert(fallbackData);
        if (err2) {
          console.error("Fallback lowercase upsert failed:", err2);
          return false;
        }
        return true;
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception syncing branding to Supabase:", e);
    return false;
  }
}

export async function fetchAllFromSupabase(): Promise<any> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [
      resPeserta,
      resSesi,
      resPresensi,
      resTim,
      resBranding
    ] = await Promise.all([
      client.from('peserta').select('*'),
      client.from('sesi').select('*').order('num', { ascending: true }),
      client.from('presensi').select('*'),
      client.from('tim').select('*'),
      client.from('branding').select('*').eq('id', 1).maybeSingle()
    ]);

    // Check if any query returned an error (such as invalid API keys or missing table/relation)
    const errors = [resPeserta.error, resSesi.error, resPresensi.error, resTim.error, resBranding.error].filter(Boolean);
    if (errors.length > 0) {
      console.warn("Supabase queries returned errors:", errors);

      const hasAuthError = errors.some((err: any) => 
        err.message?.toLowerCase().includes('apikey') || 
        err.message?.toLowerCase().includes('invalid') ||
        err.message?.toLowerCase().includes('jwt') ||
        err.status === 401 ||
        err.status === 403 ||
        err.code === 'PGRST111'
      );
      
      const hasMissingTableError = errors.some((err: any) => 
        err.code === '42P01' || 
        (err.message?.toLowerCase().includes('relation') && err.message?.toLowerCase().includes('does not exist'))
      );

      if (hasAuthError) {
        return { errorType: 'auth', errors };
      }
      
      return { errorType: 'schema', errors };
    }

    const peserta = resPeserta.data;
    const sesi = resSesi.data;
    const presensi = resPresensi.data;
    const tim = resTim.data;
    const branding = resBranding.data;

    return {
      peserta: peserta || [],
      sesi: sesi || [],
      presensi: (presensi || []).map(p => ({
        id: p.id,
        nama: p.nama,
        utusan: p.utusan,
        materi: p.materi,
        waktu: p.waktu,
        status: p.status as "Tepat Waktu" | "Terlambat",
        sesi: p.sesi
      })),
      tim: (tim || []).map(t => ({
        username: t.username,
        nama: t.nama,
        role: t.role as "Admin" | "Operator",
        password: t.password,
        permissions: t.permissions || []
      })),
      branding: branding ? {
        appName: branding.appName || branding.appname || 'SI-ANSOR PRO v7.0',
        organisasi: branding.organisasi || '',
        cabang: branding.cabang || '',
        totalSesi: branding.totalSesi !== undefined ? branding.totalSesi : (branding.totalsesi !== undefined ? branding.totalsesi : 14),
        logo: branding.logo,
        themeColor: (branding.themeColor || branding.themecolor || 'emerald') as "emerald" | "navy" | "indigo" | "rose" | "amber",
        delegationType: branding.delegationType || branding.delegationtype || 'PAC'
      } : null
    };
  } catch (e) {
    console.error("Failed to fetch all data from Supabase:", e);
    return null;
  }
}

export async function deleteRekapKelulusanFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('rekap_kelulusan').delete().eq('id', id);
    return !error;
  } catch (e) {
    console.error("Error deleting rekap_kelulusan:", e);
    return false;
  }
}

export async function syncRekapKelulusan(data: {
  id: string;
  nama: string;
  utusan: string;
  total_hadir_menit: number;
  persentase_kehadiran: number;
  izin_menit: number;
  evaluasi_sistem: string;
  no_sertifikat: string;
  status_kelulusan: string;
}[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let allOk = true;
    for (const r of data) {
      const { error } = await client.from('rekap_kelulusan').upsert({
        id: r.id,
        nama: r.nama,
        utusan: r.utusan,
        total_hadir_menit: r.total_hadir_menit,
        persentase_kehadiran: r.persentase_kehadiran,
        izin_menit: r.izin_menit,
        evaluasi_sistem: r.evaluasi_sistem,
        no_sertifikat: r.no_sertifikat,
        status_kelulusan: r.status_kelulusan,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error("Error upserting rekap_kelulusan:", error);
        allOk = false;
      }
    }
    return allOk;
  } catch (e) {
    console.error("Supabase rekap_kelulusan sync error:", e);
    return false;
  }
}
