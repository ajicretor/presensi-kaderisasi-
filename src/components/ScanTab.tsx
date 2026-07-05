import React, { useState, useRef, useEffect } from 'react';
import {
  Aperture,
  CheckCheck,
  CreditCard,
  Clock,
  Play,
  Square,
  Sparkles,
  Fingerprint,
  Upload,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Image,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Peserta, Sesi, Presensi, Branding } from '../types';
import jsQR from 'jsqr';

interface ScanTabProps {
  peserta: Peserta[];
  sesi: Sesi[];
  presensi: Presensi[];
  branding: Branding;
  onRecordPresence: (pesertaId: string, statusOverride?: "Tepat Waktu" | "Terlambat", skipAlert?: boolean) => void;
  activeSesiId: number;
}

export default function ScanTab({
  peserta,
  sesi,
  presensi,
  branding,
  onRecordPresence,
  activeSesiId
}: ScanTabProps) {
  const [selectedSesi, setSelectedSesi] = useState(activeSesiId);
  const [sensorMode, setSensorMode] = useState<'qr' | 'face'>('qr');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);

  // Reset page when session changes
  useEffect(() => {
    setLogPage(1);
  }, [selectedSesi]);

  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Map of last processed cards to prevent spamming/multiple logs in the same session
  const lastProcessedRef = useRef<{ id: string; time: number } | null>(null);

  // Sesi select handler
  const currentSesi = sesi.find(s => s.num === selectedSesi) || sesi[0] || {
    num: 1,
    materi: 'Ke-Ansoran Lanjutan',
    instruktur: 'K.H. Nuruddin Al-Syafii',
    startTime: '08:00',
    duration: 90,
    maxLate: 10,
    toiletLimit: 5
  };

  // Calculations
  const presentLogs = presensi.filter(p => p.sesi === selectedSesi);
  const totalPesertaNum = peserta.length;
  const presentCountNum = presentLogs.length;
  const progressPct = totalPesertaNum > 0 ? Math.round((presentCountNum / totalPesertaNum) * 100) : 0;

  // Manual list of kaders NOT yet present in the selected session
  const absentKaders = peserta.filter(
    p => !presentLogs.some(log => log.id === p.id)
  );

  // Recent logs
  const lastScannedKader = peserta.find(p => p.id === lastScannedId);
  const lastScannedLog = presentLogs.find(l => l.id === lastScannedId);

  // Pagination for scanned logs
  const logsPerPage = 10;
  const totalLogPages = Math.ceil(presentLogs.length / logsPerPage);
  const indexLastLog = logPage * logsPerPage;
  const indexFirstLog = indexLastLog - logsPerPage;
  const paginatedLogs = presentLogs.slice(indexFirstLog, indexLastLog);

  // Shared process QR barcode logic
  const handleScannedCode = (scannedId: string) => {
    const now = Date.now();
    // Cooldown of 2.5 seconds for scanning the same card
    if (lastProcessedRef.current && lastProcessedRef.current.id === scannedId && now - lastProcessedRef.current.time < 2500) {
      return;
    }
    lastProcessedRef.current = { id: scannedId, time: now };

    const found = peserta.find(p => p.id === scannedId);
    if (found) {
      const isDouble = presentLogs.some(log => log.id === scannedId);
      if (isDouble) {
        setScanFeedback({
          text: `DUPLIKASI: ${found.nama.toUpperCase()} SUDAH ABSEN DI SESI INI`,
          success: false
        });
        setTimeout(() => setScanFeedback(null), 3500);
        return;
      }

      // Record presence inside the system (API / local state helper)
      onRecordPresence(scannedId, undefined, true);
      setLastScannedId(scannedId);
      setScanFeedback({
        text: `PRESENSI BERHASIL: ${found.nama.toUpperCase()} (${found.utusan.toUpperCase()})`,
        success: true
      });
      setTimeout(() => setScanFeedback(null), 3500);
    } else {
      setScanFeedback({
        text: `ID QR TIDAK DIKENAL: ${scannedId}`,
        success: false
      });
      setTimeout(() => setScanFeedback(null), 3500);
    }
  };

  // Simulation handler for quick clicks in the database table
  const runSimulatedScan = (id: string, forceLateness?: "Tepat Waktu" | "Terlambat") => {
    const found = peserta.find(p => p.id === id);
    if (!found) return;

    const isDouble = presentLogs.some(log => log.id === id);
    if (isDouble) {
      setScanFeedback({
        text: `DUPLIKASI: ${found.nama.toUpperCase()} SUDAH ABSEN DI SESI INI`,
        success: false
      });
      setTimeout(() => setScanFeedback(null), 3500);
      return;
    }

    setScanFeedback({ text: "Memproses pindaian simulasi...", success: true });
    setTimeout(() => {
      onRecordPresence(id, forceLateness, true);
      setLastScannedId(id);
      setScanFeedback({
        text: `SIMULASI BERHASIL: ${found.nama.toUpperCase()}`,
        success: true
      });
      setTimeout(() => setScanFeedback(null), 2500);
    }, 700);
  };

  const handleManualPresenceSubmit = () => {
    if (!manualSelection) return;
    onRecordPresence(manualSelection);
    setLastScannedId(manualSelection);
    setManualSelection('');
    setScanFeedback({
      text: "Absensi manual berhasil dicatat!",
      success: true
    });
    setTimeout(() => setScanFeedback(null), 2500);
  };

  // Toggle user vs environment camera
  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Gallery file picker scanner
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanFeedback({ text: "Membaca gambar galeri...", success: true });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          if (canvas.width > 0 && canvas.height > 0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decrypted = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });

            if (decrypted && decrypted.data) {
              handleScannedCode(decrypted.data.trim());
            } else {
              setScanFeedback({
                text: "TIDAK BISA MEMBACA QR KODE. Pastikan gambar QR code terlihat jelas dan berpusat.",
                success: false
              });
              setTimeout(() => setScanFeedback(null), 4000);
            }
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Camera initialization and continuous loop
  useEffect(() => {
    if (!isCameraActive) {
      return;
    }

    let activeStream: MediaStream | null = null;
    let animationFrameId = 0;
    let isMounted = true;

    const startCameraStream = async () => {
      try {
        setCameraError(null);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Kamera tidak didukung atau dibatasi oleh izin browser/iframe ini.");
        }

        let stream: MediaStream;
        
        const primaryConstraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
        } catch (firstErr) {
          console.warn("Camera request with custom 1:1 constraints failed, trying standard 16:9/4:3 fallback:", firstErr);
          try {
            const fallbackConstraints1: MediaStreamConstraints = {
              video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            };
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints1);
          } catch (secondErr) {
            console.warn("Camera request with standard widescreen failed, trying facingMode only:", secondErr);
            try {
              const fallbackConstraints2: MediaStreamConstraints = {
                video: { facingMode: facingMode },
                audio: false
              };
              stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints2);
            } catch (thirdErr) {
              console.warn("Camera request with facingMode failed, trying generic video constraint:", thirdErr);
              const fallbackConstraints3: MediaStreamConstraints = {
                video: true,
                audio: false
              };
              stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints3);
            }
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          
          // Safari requires play() handled gracefully
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Safari auto-play video exception:", playErr);
          }
        }

        // Run frame decrypt scan loop
        const scanFrameTick = () => {
          if (!isMounted) return;

          if (
            sensorMode === 'qr' &&
            videoRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
          ) {
            const video = videoRef.current;
            const canvas = canvasRef.current || document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              if (canvas.width > 0 && canvas.height > 0) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let decoded = null;
                try {
                  decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                  });
                } catch (qrErr) {
                  console.warn("jsQR parsing exception:", qrErr);
                }

                if (decoded && decoded.data) {
                  handleScannedCode(decoded.data.trim());
                }
              }
            }
          }

          animationFrameId = requestAnimationFrame(scanFrameTick);
        };

        animationFrameId = requestAnimationFrame(scanFrameTick);
      } catch (err: any) {
        console.error("Web camera capture failed:", err);
        if (isMounted) {
          setCameraError(
            "Gagal membuka kamera aktif. Izin kamera ditolak atau sedang digunakan oleh aplikasi lain."
          );
        }
      }
    };

    startCameraStream();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, facingMode, sensorMode]);

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SISI KIRI: KAMERA SCANNER & PROGRESS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm p-5 space-y-4">
            
            <div className="text-center pb-2 border-b border-slate-100 dark:border-navy-850">
              <h3 className="text-sm font-black uppercase text-navy-900 dark:text-white tracking-widest">Pemindai Kamera</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold">Arahkan kamera ke kartu anggota untuk pencatatan instan</p>
            </div>

            {/* Scanner Sensor Mode Switch */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-navy-850 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {sensorMode === 'qr' ? (
                  <Aperture className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
                ) : (
                  <Fingerprint className="w-4 h-4 text-cyan-500 animate-pulse" />
                )}
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mode Sensor Utama</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-200 dark:bg-navy-900 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSensorMode('qr')}
                  className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${
                    sensorMode === 'qr' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-650 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  QR-CODE
                </button>
                <button
                  type="button"
                  onClick={() => setSensorMode('face')}
                  className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${
                    sensorMode === 'face' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-650 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  FACE ID
                </button>
              </div>
            </div>

            {/* Real-time Progress Counter */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-navy-850 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress Absen Sesi</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className={`text-2xl font-black ${sensorMode === 'face' ? 'text-cyan-500' : 'text-emerald-500'}`}>{presentCountNum}</span>
                  <span className="text-slate-400 font-bold text-sm">/</span>
                  <span className="text-slate-500 font-bold text-sm">{totalPesertaNum}</span>
                  <span className="text-slate-400 text-[10px] ml-1 uppercase font-bold">Kader</span>
                </div>
              </div>
              <div className="w-24 bg-slate-200 dark:bg-navy-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${sensorMode === 'face' ? 'bg-cyan-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Sesi & Materi Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pilih Sesi</label>
                <select
                  value={selectedSesi}
                  onChange={(e) => setSelectedSesi(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  {sesi.map((s, idx) => (
                    <option key={`${s.num}_${s.kab_kota || 'default'}_${idx}`} value={s.num}>Sesi {s.num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Materi</label>
                <input
                  type="text"
                  readOnly
                  value={currentSesi.materi}
                  className="w-full bg-slate-100 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Integrated Real Camera Scanner Container */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square w-full max-w-[340px] mx-auto flex items-center justify-center border border-slate-200 dark:border-navy-850 shadow-2xl">
              
              {isCameraActive && !cameraError ? (
                <>
                  {/* Real Live HTML5 Video Element */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    style={{ transform: facingMode === 'environment' ? 'none' : 'scale-x(-1)' }}
                  />

                  {/* Laser Scan line animations */}
                  <div className={`absolute left-4 right-4 h-0.5 shadow-md ${sensorMode === 'face' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-emerald-400 shadow-emerald-400/50'} z-10`} 
                       style={{ 
                         animation: 'scanLineMove 2s infinite ease-in-out',
                         top: '10%'
                       }} 
                  />
                  
                  {/* Canvas representation (hidden reference) */}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-2 pointer-events-none">
                  <div className="p-4 bg-slate-900 rounded-full text-slate-600">
                    <Aperture className="w-8 h-8 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {cameraError ? "Kamera Terkendala" : "Kamera Scanner Nonaktif"}
                  </span>
                  <p className="text-[9px] text-slate-500 max-w-[240px] leading-relaxed">
                    {cameraError || "Aktifkan scanner di bawah untuk memproses digital presensi kader."}
                  </p>
                </div>
              )}

              {/* Real-time Scan Overlay Banner Feedback inside Screen */}
              {scanFeedback && (
                <div className={`absolute bottom-3 left-3 right-3 py-2 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-wide text-center z-30 shadow-lg ${
                  scanFeedback.success ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {scanFeedback.text}
                </div>
              )}

              {/* Viewfinder borders overlays */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <div className="relative w-4/5 h-4/5 border border-white/10 rounded-lg flex items-center justify-center">
                  <div className={`absolute border-t-4 border-l-4 -top-1 -left-1 rounded-sm ${sensorMode === 'face' ? 'border-cyan-400' : 'border-emerald-400'}`} style={{ width: '28px', height: '28px' }}></div>
                  <div className={`absolute border-t-4 border-r-4 -top-1 -right-1 rounded-sm ${sensorMode === 'face' ? 'border-cyan-400' : 'border-emerald-400'}`} style={{ width: '28px', height: '28px' }}></div>
                  <div className={`absolute border-b-4 border-l-4 -bottom-1 -left-1 rounded-sm ${sensorMode === 'face' ? 'border-cyan-400' : 'border-emerald-400'}`} style={{ width: '28px', height: '28px' }}></div>
                  <div className={`absolute border-b-4 border-r-4 -bottom-1 -right-1 rounded-sm ${sensorMode === 'face' ? 'border-cyan-400' : 'border-emerald-400'}`} style={{ width: '28px', height: '28px' }}></div>
                  
                  {sensorMode === 'face' && isCameraActive && (
                    <div className="absolute w-36 h-48 rounded-[50%] border-2 border-dashed border-cyan-400/40 flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase text-cyan-400 bg-slate-950/80 px-2.5 py-0.5 rounded tracking-widest shadow-xs">Biometric locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Scanner controls under the feedback container */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className="flex-grow py-3 bg-slate-800 dark:bg-slate-950 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md hover:bg-slate-750"
              >
                <input
                  type="checkbox"
                  checked={!isCameraActive}
                  readOnly
                  className="rounded bg-slate-700 dark:bg-navy-900 border-slate-600 text-emerald-500 focus:ring-emerald-500 mr-1.5 cursor-pointer w-4 h-4"
                />
                <span>Matikan Scanner</span>
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                disabled={!isCameraActive}
                className="p-3 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-navy-850 dark:text-white dark:hover:bg-navy-950 rounded-xl transition shadow-md flex items-center justify-center disabled:opacity-45"
                title="Ganti Arah Kamera"
              >
                <RefreshCw className="w-4 h-4 text-slate-700 dark:text-white" />
              </button>
            </div>

            {/* Gallery Upload Scanner Option */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-4 rounded-xl flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Upload Dari Galeri</span>
              <label className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-navy-900 dark:hover:bg-navy-850 text-slate-700 dark:text-white border border-slate-200 dark:border-navy-850 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition">
                <span>Pilih File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
              </label>
            </div>

            {/* Quick Simulation Scanner Triggers */}
            {absentKaders.length > 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-navy-900 rounded-xl space-y-2">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Uji Cepat Pemindaian (Simulasi Sukses)</label>
                <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto custom-scrollbar">
                  {absentKaders.map(p => (
                    <button
                      key={p.id}
                      onClick={() => runSimulatedScan(p.id)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-navy-900 dark:border-navy-850 dark:hover:bg-navy-800 text-slate-700 dark:text-white font-bold text-[9px] rounded-lg tracking-wide uppercase transition hover:scale-105 active:scale-95 duration-150 truncate max-w-[110px]"
                    >
                      Scan {p.nama.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 rounded-xl text-center">
                <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-extrabold uppercase tracking-widest">Semua Kader Sudah Absen Terdaftar!</p>
              </div>
            )}

            {/* Dropdown Manual Entry */}
            <div className="pt-2 border-t border-slate-150 dark:border-navy-850">
              <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 text-center mb-2 tracking-wider uppercase">Pencatatan Presensi Manual</p>
              <div className="flex space-x-2">
                <select
                  value={manualSelection}
                  onChange={(e) => setManualSelection(e.target.value)}
                  className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:ring-1.5 focus:ring-emerald-500 focus:outline-none font-semibold"
                >
                  <option value="">-- Pilih Kader Belum Absen --</option>
                  {absentKaders.map(k => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.utusan})</option>
                  ))}
                </select>
                <button
                  onClick={handleManualPresenceSubmit}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition shadow-sm uppercase active:scale-[0.98]"
                >
                  Hadir
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* SISI KANAN: LIVE SPOTLIGHT LOG SCAN SINOPSIS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Spotlight of the Last Scanned User */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 transition-colors duration-350">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 ring-4 ring-emerald-500/10 dark:ring-navy-950 bg-slate-100 dark:bg-navy-900 flex items-center justify-center border border-slate-200 dark:border-navy-800">
              {lastScannedKader?.foto ? (
                <img src={lastScannedKader.foto} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <UserCheck className="w-10 h-10 text-slate-400" />
              )}
            </div>
            
            <div className="text-center md:text-left flex-1 space-y-1.5 truncate w-full">
              <span className="inline-flex px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[9px] rounded-full uppercase tracking-widest dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                PINDAIAN TERAKHIR
              </span>
              <h4 className="text-lg font-extrabold text-navy-900 dark:text-white tracking-tight uppercase truncate">
                {lastScannedKader ? lastScannedKader.nama : 'BELUM ADA DATA'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-sans">
                {lastScannedKader ? `Asal Delegasi: ${branding.delegationType || 'PAC'} ${lastScannedKader.utusan}` : 'Silakan lakukan scan QR-Card kader terlebih dahulu'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-150 dark:border-navy-850">
                  <CreditCard className="w-3.5 h-3.5" />
                  <strong className="text-slate-600 dark:text-slate-300">{lastScannedKader ? lastScannedKader.id : '-'}</strong>
                </span>
                <span className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-150 dark:border-navy-850">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-slate-600 dark:text-slate-300">{lastScannedLog ? `${lastScannedLog.waktu} (${lastScannedLog.status})` : '-'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity Scan Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden p-5 transition-colors duration-350 animate-fade-in font-sans">
            <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-navy-850 mb-3 flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              <span>Aktivitas Pindaian Terakhir (Real-Time)</span>
            </h4>
            
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[9px] text-slate-400 font-extrabold uppercase border-b border-slate-150 dark:border-navy-850">
                    <th className="pb-2.5">KADER / CARD</th>
                    <th className="pb-2.5">UTUSAN {branding.delegationType || 'PAC'}</th>
                    <th className="pb-2.5 text-center">STATUS</th>
                    <th className="pb-2.5 text-right">AKSI SINKRON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-850 font-medium text-slate-600 dark:text-slate-300">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-navy-950/20 transition-all duration-150">
                        <td className="py-3 font-bold text-slate-800 dark:text-white">
                          <div>
                            <span className="uppercase text-xs">{log.nama}</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{log.id}</span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                          {branding.delegationType || 'PAC'} {log.utusan}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            log.status === 'Tepat Waktu' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/15' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/15'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center space-x-1 text-emerald-500 text-[10px] font-bold">
                            <CheckCheck className="w-3.5 h-3.5 animate-pulse" />
                            <span>Synced</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                        Belum ada pindaian di sesi ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalLogPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-navy-850 gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Menampilkan {indexFirstLog + 1} - {Math.min(indexLastLog, presentLogs.length)} Dari {presentLogs.length} Pindaian
                </span>
                
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    disabled={logPage === 1}
                    onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-900 disabled:opacity-40 transition-colors duration-150"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  
                  {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setLogPage(pageNum)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all duration-150 ${
                        logPage === pageNum
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-navy-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    disabled={logPage === totalLogPages}
                    onClick={() => setLogPage(prev => Math.min(prev + 1, totalLogPages))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-900 disabled:opacity-40 transition-colors duration-150"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Styled inline keyframes scanning animation on React load */}
      <style>{`
        @keyframes scanLineMove {
          0% {
            top: 10%;
          }
          50% {
            top: 90%;
          }
          100% {
            top: 10%;
          }
        }
      `}</style>

    </div>
  );
}
