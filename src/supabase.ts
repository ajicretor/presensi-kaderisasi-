import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Peserta, Sesi, Presensi, Tim, Branding } from './types';
import { safeStorage } from './utils/storage';

// Check local storage for dynamic connection keys first, otherwise fallback to Vite env variables
let cachedSupabaseClient: SupabaseClient | null = null;
let apiEnvUrl = '';
let apiEnvKey = '';

export function setApiEnvKeys(url: string, key: string) {
  apiEnvUrl = url;
  apiEnvKey = key;
  cachedSupabaseClient = null; // Reset client to force recreation with new keys
}

export function getSupabaseKeys() {
  const customUrl = safeStorage.getItem('SIANSOR_SUPABASE_URL');
  const customKey = safeStorage.getItem('SIANSOR_SUPABASE_KEY');
  const meta = (import.meta as any);
  
  const envUrl = apiEnvUrl || (meta.env ? (meta.env.VITE_SUPABASE_URL as string) : '') || (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_URL as string) : '') || '';
  const envKey = apiEnvKey || (meta.env ? (meta.env.VITE_SUPABASE_ANON_KEY as string) : '') || (typeof process !== 'undefined' && process.env ? (process.env.VITE_SUPABASE_ANON_KEY as string) : '') || '';

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
VALUES (1, 'SI-ANSOR PRO v7.0', 'PC GP ANSOR KABUPATEN BOGOR', 'KABUPATEN BOGOR', 14, '<svg class="w-11 h-11" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="blueTeal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0284c7" /><stop offset="50%" stop-color="#0ea5e9" /><stop offset="100%" stop-color="#0d9488" /></linearGradient><linearGradient id="emeraldTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" /><stop offset="100%" stop-color="#059669" /></linearGradient><linearGradient id="skyGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#1e3a8a" /><stop offset="100%" stop-color="#0284c7" /></linearGradient></defs><path d="M 20 60 A 40 40 0 0 1 100 60" stroke="url(#skyGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 10" /><path d="M 12 60 C 12 30, 30 12, 60 12 C 90 12, 108 30, 108 60 C 108 80, 95 100, 75 108" stroke="url(#blueTeal)" stroke-width="7" stroke-linecap="round" fill="none" /><path d="M 22 75 C 16 65, 18 45, 30 30" stroke="url(#emeraldTeal)" stroke-width="5" stroke-linecap="round" fill="none" /><g stroke="#0d9488" stroke-width="2" opacity="0.6"><line x1="60" y1="20" x2="60" y2="24" /><line x1="60" y1="100" x2="60" y2="96" /><line x1="20" y1="60" x2="24" y2="60" /><line x1="100" y1="60" x2="96" y2="60" /><line x1="32" y1="32" x2="35" y2="35" /><line x1="88" y1="32" x2="85" y2="35" /><line x1="32" y1="88" x2="35" y2="85" /><line x1="88" y1="88" x2="85" y2="85" /></g><path d="M 60 28 C 58 18, 65 10, 75 8 C 70 16, 68 22, 60 28 Z" fill="url(#emeraldTeal)" /><path d="M 58 26 C 54 22, 55 16, 60 12 C 58 18, 58 22, 58 26 Z" fill="url(#blueTeal)" /><circle cx="60" cy="46" r="5" fill="#10b981" /><path d="M 60 51 C 54 53, 50 63, 60 78 C 70 63, 66 53, 60 51 Z" fill="url(#emeraldTeal)" /><path d="M 46 51 C 52 49, 56 50, 60 51 C 64 50, 68 49, 74 51 C 66 58, 54 58, 46 51 Z" fill="url(#blueTeal)" /><circle cx="48" cy="55" r="4.5" fill="#0284c7" /><path d="M 48 59.5 C 42 61, 38 72, 48 83 C 54 72, 52 61, 48 59.5 Z" fill="url(#blueTeal)" /><circle cx="72" cy="55" r="4.5" fill="#0284c7" /><path d="M 72 59.5 C 78 61, 82 72, 72 83 C 66 72, 68 61, 72 59.5 Z" fill="url(#blueTeal)" /><path d="M 35 88 C 45 98, 55 98, 60 98 C 65 98, 75 98, 85 88" stroke="url(#blueTeal)" stroke-width="4" stroke-linecap="round" fill="none" /><path d="M 42 93 C 50 101, 56 101, 60 101 C 64 101, 70 101, 78 93" stroke="url(#blueTeal)" stroke-width="3" stroke-linecap="round" fill="none" /><path d="M 48 98 C 53 104, 57 104, 60 104 C 63 104, 67 104, 72 98" stroke="url(#blueTeal)" stroke-width="2" stroke-linecap="round" fill="none" /></svg>', 'emerald')
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

// Helper function to query with retry in case of database cold start or statement timeout
async function queryWithRetry(queryFn: () => PromiseLike<any> | any, retries = 3, delayMs = 1500): Promise<any> {
  let lastResult: any = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      lastResult = await queryFn();
      if (!lastResult.error) {
        return lastResult;
      }
      
      const errMsg = lastResult.error.message?.toLowerCase() || '';
      const errCode = lastResult.error.code;

      console.warn(`Query attempt ${attempt + 1} failed:`, lastResult.error);

      // If it is a known schema missing table error (42P01) or Auth error (invalid apikey, etc.), do not retry
      if (
        errCode === '42P01' || 
        (errMsg.includes('relation') && errMsg.includes('does not exist')) ||
        errMsg.includes('apikey') || 
        errMsg.includes('invalid') ||
        errMsg.includes('jwt') ||
        lastResult.error.status === 401 ||
        lastResult.error.status === 403 ||
        errCode === 'PGRST111'
      ) {
        return lastResult;
      }
    } catch (e: any) {
      lastResult = { error: { message: e.message || String(e), code: 'EXCEPTION' } };
      console.warn(`Query attempt ${attempt + 1} threw exception:`, e);
    }
    
    // Wait before next attempt
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return lastResult;
}

// Robust upsert helper that can dynamically strip non-existent columns (perfect for old database schemas)
async function robustUpsert(client: any, tableName: string, rows: any[]): Promise<boolean> {
  if (rows.length === 0) return true;

  try {
    let currentRows = rows.map(r => ({ ...r }));
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { error } = await client.from(tableName).upsert(currentRows);
      
      if (!error) {
        return true;
      }

      console.warn(`Upsert to ${tableName} failed on attempt ${attempts + 1}:`, error);

      // Code 42703 is undefined_column in Postgres
      if (error.code === '42703' && error.message) {
        const match = error.message.match(/column "([^"]+)"/);
        if (match && match[1]) {
          const missingColumn = match[1];
          console.warn(`Detected missing column "${missingColumn}" in table "${tableName}". Retrying without this column...`);
          
          currentRows = currentRows.map(row => {
            const newRow = { ...row };
            delete newRow[missingColumn];
            return newRow;
          });

          attempts++;
          continue;
        }
      }

      // If it is another error or we can't extract column, stop and return false
      return false;
    }
    return false;
  } catch (e) {
    console.error(`Exception during robustUpsert to ${tableName}:`, e);
    return false;
  }
}

// Supabase fetching utilities with fallback behavior
export async function syncPeserta(data: Peserta[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    if (data.length === 0) return true;

    // Fetch existing peserta list from Supabase for differential synchronization with retry
    const { data: existing, error: fetchError } = await queryWithRetry(() => client.from('peserta').select('*'));
    if (fetchError) {
      console.warn("Error fetching existing peserta, falling back to full robust upsert:", fetchError);
      const rows = data.map(p => ({
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
      }));
      return await robustUpsert(client, 'peserta', rows);
    }

    const existingList = existing || [];
    const existingMap = new Map<string, any>();
    existingList.forEach(item => {
      existingMap.set(item.id, item);
    });

    const localKeys = new Set<string>();
    const toUpsert: any[] = [];

    // Identify which rows actually need to be written (new or changed)
    data.forEach(p => {
      localKeys.add(p.id);
      const match = existingMap.get(p.id);
      if (match) {
        const hasChanged =
          match.nama !== p.nama ||
          match.utusan !== p.utusan ||
          match.hp !== p.hp ||
          match.foto !== p.foto ||
          match.nilai_post_test !== p.nilai_post_test ||
          match.nilai_praktik !== p.nilai_praktik ||
          match.nilai_keaktifan !== p.nilai_keaktifan ||
          match.status_kelulusan !== p.status_kelulusan ||
          match.no_sertifikat !== p.no_sertifikat ||
          (match.izin_menit !== undefined && match.izin_menit !== p.izin_menit);

        if (hasChanged) {
          toUpsert.push({
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
        }
      } else {
        toUpsert.push({
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
      }
    });

    // Identify deletes
    const toDeleteIds: string[] = [];
    existingList.forEach(item => {
      if (!localKeys.has(item.id)) {
        toDeleteIds.push(item.id);
      }
    });

    let allOk = true;

    // Delete in chunks of 100 for safety and speed
    if (toDeleteIds.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
        const chunk = toDeleteIds.slice(i, i + chunkSize);
        const { error } = await client.from('peserta').delete().in('id', chunk);
        if (error) {
          console.error("Error batch deleting peserta:", error);
          allOk = false;
        }
      }
    }

    // Upsert the new/changed rows using robustUpsert
    if (toUpsert.length > 0) {
      const success = await robustUpsert(client, 'peserta', toUpsert);
      if (!success) allOk = false;
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
    if (data.length === 0) return true;

    // Fetch existing sesi list with retry
    const { data: existing, error: fetchError } = await queryWithRetry(() => client.from('sesi').select('*'));
    if (fetchError) {
      console.warn("Error fetching existing sesi, falling back to full robust upsert:", fetchError);
      const rows = data.map(s => ({
        num: s.num,
        materi: s.materi,
        instruktur: s.instruktur,
        startTime: s.startTime,
        duration: s.duration,
        maxLate: s.maxLate,
        toiletLimit: s.toiletLimit,
        active: s.active
      }));
      return await robustUpsert(client, 'sesi', rows);
    }

    const existingList = existing || [];
    const existingMap = new Map<number, any>();
    existingList.forEach(item => {
      existingMap.set(item.num, item);
    });

    const localKeys = new Set<number>();
    const toUpsert: any[] = [];

    data.forEach(s => {
      localKeys.add(s.num);
      const match = existingMap.get(s.num);
      if (match) {
        const hasChanged =
          match.materi !== s.materi ||
          match.instruktur !== s.instruktur ||
          match.startTime !== s.startTime ||
          match.duration !== s.duration ||
          match.maxLate !== s.maxLate ||
          match.toiletLimit !== s.toiletLimit ||
          match.active !== s.active;

        if (hasChanged) {
          toUpsert.push({
            num: s.num,
            materi: s.materi,
            instruktur: s.instruktur,
            startTime: s.startTime,
            duration: s.duration,
            maxLate: s.maxLate,
            toiletLimit: s.toiletLimit,
            active: s.active
          });
        }
      } else {
        toUpsert.push({
          num: s.num,
          materi: s.materi,
          instruktur: s.instruktur,
          startTime: s.startTime,
          duration: s.duration,
          maxLate: s.maxLate,
          toiletLimit: s.toiletLimit,
          active: s.active
        });
      }
    });

    // Identify deletes
    const toDeleteIds: number[] = [];
    existingList.forEach(item => {
      if (!localKeys.has(item.num)) {
        toDeleteIds.push(item.num);
      }
    });

    let allOk = true;

    if (toDeleteIds.length > 0) {
      const { error } = await client.from('sesi').delete().in('num', toDeleteIds);
      if (error) {
        console.error("Error deleting sesi:", error);
        allOk = false;
      }
    }

    if (toUpsert.length > 0) {
      const success = await robustUpsert(client, 'sesi', toUpsert);
      if (!success) allOk = false;
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
    // 1. Fetch existing presensi from Supabase for differential synchronization with retry
    const { data: existing, error: fetchError } = await queryWithRetry(() => client.from('presensi').select('*'));
    if (fetchError) {
      console.warn("Error fetching existing presensi, falling back to full wipe & re-write:", fetchError);
      const { error: delError } = await client.from('presensi').delete().neq('id', 'CONCRETE_PLACEHOLDER_IMPROVEMENT');
      if (delError) return false;

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
        return !error;
      }
      return true;
    }

    const existingList = existing || [];
    const existingMap = new Map<string, any>();
    existingList.forEach(item => {
      existingMap.set(`${item.id}_${item.sesi}`, item);
    });

    const localKeys = new Set<string>();
    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    // 2. Identify inserts and updates
    data.forEach(p => {
      const key = `${p.id}_${p.sesi}`;
      localKeys.add(key);

      const match = existingMap.get(key);
      if (match) {
        const hasChanged = 
          match.nama !== p.nama ||
          match.utusan !== p.utusan ||
          match.materi !== p.materi ||
          match.waktu !== p.waktu ||
          match.status !== p.status;

        if (hasChanged) {
          toUpdate.push({
            db_id: match.db_id,
            id: p.id,
            nama: p.nama,
            utusan: p.utusan,
            materi: p.materi,
            waktu: p.waktu,
            status: p.status,
            sesi: p.sesi
          });
        }
      } else {
        toInsert.push({
          id: p.id,
          nama: p.nama,
          utusan: p.utusan,
          materi: p.materi,
          waktu: p.waktu,
          status: p.status,
          sesi: p.sesi
        });
      }
    });

    // 3. Identify deletes
    const toDeleteIds: number[] = [];
    existingList.forEach(item => {
      const key = `${item.id}_${item.sesi}`;
      if (!localKeys.has(key)) {
        toDeleteIds.push(item.db_id);
      }
    });

    let allOk = true;

    // Delete in chunks of 100 for maximum performance and stability
    if (toDeleteIds.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
        const chunk = toDeleteIds.slice(i, i + chunkSize);
        const { error } = await client.from('presensi').delete().in('db_id', chunk);
        if (error) {
          console.error("Error batch deleting presensi:", error);
          allOk = false;
        }
      }
    }

    // Insert in chunks of 100
    if (toInsert.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await client.from('presensi').insert(chunk);
        if (error) {
          console.error("Error batch inserting presensi:", error);
          allOk = false;
        }
      }
    }

    // Update in chunks of 100 using robustUpsert
    if (toUpdate.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < toUpdate.length; i += chunkSize) {
        const chunk = toUpdate.slice(i, i + chunkSize);
        const success = await robustUpsert(client, 'presensi', chunk);
        if (!success) allOk = false;
      }
    }

    return allOk;
  } catch (e) {
    console.error("Supabase presensi differential sync error:", e);
    return false;
  }
}

export async function syncTim(data: Tim[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    if (data.length === 0) return true;

    const rows = data.map(t => ({
      username: t.username,
      nama: t.nama,
      role: t.role,
      password: t.password || '',
      permissions: t.permissions
    }));

    return await robustUpsert(client, 'tim', rows);
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
    
    // We will start with a full camelCase payload
    let currentPayload: any = {
      id: 1,
      appName: branding.appName,
      organisasi: branding.organisasi,
      cabang: branding.cabang,
      totalSesi: branding.totalSesi,
      logo: branding.logo,
      themeColor: branding.themeColor,
      delegationType: branding.delegationType || 'PAC'
    };

    // If existingBranding was found, we align our initial payload with its keys
    if (existingBranding) {
      const dbKeys = Object.keys(existingBranding);
      const alignedPayload: any = { id: 1 };
      
      // Map properties with casing matching database keys
      if (dbKeys.includes('appName')) alignedPayload.appName = branding.appName;
      else if (dbKeys.includes('appname')) alignedPayload.appname = branding.appName;
      else alignedPayload.appName = branding.appName;

      alignedPayload.organisasi = branding.organisasi;
      alignedPayload.cabang = branding.cabang;

      if (dbKeys.includes('totalSesi')) alignedPayload.totalSesi = branding.totalSesi;
      else if (dbKeys.includes('totalsesi')) alignedPayload.totalsesi = branding.totalSesi;
      else alignedPayload.totalSesi = branding.totalSesi;

      alignedPayload.logo = branding.logo;

      if (dbKeys.includes('themeColor')) alignedPayload.themeColor = branding.themeColor;
      else if (dbKeys.includes('themecolor')) alignedPayload.themecolor = branding.themeColor;
      else alignedPayload.themeColor = branding.themeColor;

      if (dbKeys.includes('delegationType')) alignedPayload.delegationType = branding.delegationType || 'PAC';
      else if (dbKeys.includes('delegationtype')) alignedPayload.delegationtype = branding.delegationType || 'PAC';
      else alignedPayload.delegationType = branding.delegationType || 'PAC';

      currentPayload = alignedPayload;
    }

    // Keep track of failed columns to avoid infinite loops
    const failedColumns = new Set<string>();

    for (let attempt = 0; attempt < 12; attempt++) {
      const { error } = await client.from('branding').upsert(currentPayload);
      if (!error) {
        return true;
      }

      console.warn(`Sync branding attempt ${attempt + 1} failed:`, error);

      // If it's an "undefined column" error (PostgreSQL error code 42703)
      if (error.code === '42703' && error.message) {
        // Find column name between quotes, e.g., column "appName" of relation "branding" does not exist
        const match = error.message.match(/column "([^"]+)"/);
        if (match) {
          const missingCol = match[1];
          failedColumns.add(missingCol);
          delete currentPayload[missingCol];

          // If a camelCase variant failed and the lowercase variant hasn't failed yet, try substituting it
          if (missingCol === 'appName' && !failedColumns.has('appname')) {
            currentPayload.appname = branding.appName;
          } else if (missingCol === 'totalSesi' && !failedColumns.has('totalsesi')) {
            currentPayload.totalsesi = branding.totalSesi;
          } else if (missingCol === 'themeColor' && !failedColumns.has('themecolor')) {
            currentPayload.themecolor = branding.themeColor;
          } else if (missingCol === 'delegationType' && !failedColumns.has('delegationtype')) {
            currentPayload.delegationtype = branding.delegationType || 'PAC';
          }
          
          continue;
        }
      }

      // If we got a different error or we couldn't match a column name, let's try some standard fallback payloads
      if (attempt === 0) {
        // Fallback 1: Pure lowercase schema payload
        currentPayload = {
          id: 1,
          appname: branding.appName,
          organisasi: branding.organisasi,
          cabang: branding.cabang,
          totalsesi: branding.totalSesi,
          logo: branding.logo,
          themecolor: branding.themeColor,
          delegationtype: branding.delegationType || 'PAC'
        };
        continue;
      }

      if (attempt === 1) {
        // Fallback 2: Minimal essential payload (just ID, organisasi, cabang, logo, which are guaranteed to exist or have standard lowercase names)
        currentPayload = {
          id: 1,
          organisasi: branding.organisasi,
          cabang: branding.cabang,
          logo: branding.logo
        };
        continue;
      }

      // If everything else fails, return false
      return false;
    }

    return false;
  } catch (e) {
    console.error("Exception syncing branding to Supabase:", e);
    return false;
  }
}

export async function fetchAllFromSupabase(): Promise<any> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      errorType: 'auth',
      errors: [{ message: 'Kunci API atau URL Supabase belum diatur.' }]
    };
  }

  try {
    // Fetch all sequentially with robust retry mechanisms to prevent connection pool exhaustion and database cold starts
    const resPeserta = await queryWithRetry(() => client.from('peserta').select('*'));
    const resSesi = await queryWithRetry(() => client.from('sesi').select('*').order('num', { ascending: true }));
    const resPresensi = await queryWithRetry(() => client.from('presensi').select('*'));
    const resTim = await queryWithRetry(() => client.from('tim').select('*'));
    const resBranding = await queryWithRetry(() => client.from('branding').select('*').eq('id', 1).maybeSingle());

    // Check for auth errors first
    const allErrors = [resPeserta.error, resSesi.error, resPresensi.error, resTim.error, resBranding.error];
    const authError = allErrors.find((err: any) => 
      err && (
        err.message?.toLowerCase().includes('apikey') || 
        err.message?.toLowerCase().includes('invalid') ||
        err.message?.toLowerCase().includes('jwt') ||
        err.status === 401 ||
        err.status === 403 ||
        err.code === 'PGRST111'
      )
    );

    if (authError) {
      return { errorType: 'auth', errors: [authError] };
    }

    // Check if CORE tables (peserta, sesi, presensi) are missing
    const coreErrors = [resPeserta.error, resSesi.error, resPresensi.error].filter(Boolean);
    const hasCoreMissingTable = coreErrors.some((err: any) => 
      err.code === '42P01' || 
      (err.message?.toLowerCase().includes('relation') && err.message?.toLowerCase().includes('does not exist'))
    );

    if (hasCoreMissingTable) {
      return { errorType: 'schema', errors: coreErrors };
    }

    // If there is any other core error
    if (coreErrors.length > 0) {
      return { errorType: 'connection', errors: coreErrors };
    }

    // Now we know core tables are fully available and connected!
    // What if auxiliary tables (tim, branding) are missing or errored? That's fine! We'll just fallback to local data.
    const peserta = resPeserta.data || [];
    const rawSesi = resSesi.data || [];
    const presensi = resPresensi.data || [];

    // Normalize Sesi column casing
    const sesi = rawSesi.map((s: any) => ({
      num: s.num,
      materi: s.materi || '',
      instruktur: s.instruktur || '',
      startTime: s.startTime || s.starttime || '08:00',
      duration: s.duration !== undefined ? s.duration : 90,
      maxLate: s.maxLate !== undefined ? s.maxLate : (s.maxlate !== undefined ? s.maxlate : 10),
      toiletLimit: s.toiletLimit !== undefined ? s.toiletLimit : (s.toiletlimit !== undefined ? s.toiletlimit : 5),
      active: s.active !== undefined ? s.active : false
    }));
    
    // Fallback for tim if missing or errored
    let tim = [];
    if (!resTim.error) {
      tim = resTim.data || [];
    } else {
      console.warn("Table 'tim' missing or errored in database, using local fallback:", resTim.error);
    }

    // Fallback for branding if missing or errored
    let branding = null;
    if (!resBranding.error) {
      branding = resBranding.data;
    } else {
      console.warn("Table 'branding' missing or errored in database, using local fallback:", resBranding.error);
    }

    return {
      peserta,
      sesi,
      presensi: presensi.map(p => ({
        id: p.id,
        nama: p.nama,
        utusan: p.utusan,
        materi: p.materi,
        waktu: p.waktu,
        status: p.status as "Tepat Waktu" | "Terlambat",
        sesi: p.sesi
      })),
      tim: tim.map(t => ({
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
      } : null,
      auxiliaryMissing: !!(resTim.error || resBranding.error)
    };
  } catch (e: any) {
    console.error("Failed to fetch all data from Supabase:", e);
    return {
      errorType: 'connection',
      errors: [{ message: e.message || String(e) }]
    };
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
    if (data.length === 0) return true;

    // Check if the rekap_kelulusan table exists
    let hasTable = true;
    try {
      const { error: checkError } = await queryWithRetry(() => client.from('rekap_kelulusan').select('id').limit(1));
      if (checkError && (checkError.code === '42P01' || checkError.message?.toLowerCase().includes('relation'))) {
        hasTable = false;
      }
    } catch (e) {
      hasTable = false;
    }

    if (!hasTable) {
      console.warn("Table 'rekap_kelulusan' does not exist in this database. Skipping rekap_kelulusan sync gracefully.");
      return true;
    }

    const rows = data.map(r => ({
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
    }));

    return await robustUpsert(client, 'rekap_kelulusan', rows);
  } catch (e) {
    console.error("Supabase rekap_kelulusan sync error:", e);
    return false;
  }
}
