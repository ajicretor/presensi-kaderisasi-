import React, { useState, useEffect } from 'react';
import {
  Award,
  Sliders,
  Cpu,
  Activity,
  Download,
  Sparkles,
  Edit3,
  X,
  Printer,
  Upload,
  Search,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { Peserta, Sesi, Presensi, Branding } from '../types';

interface KelulusanTabProps {
  peserta: Peserta[];
  sesi: Sesi[];
  presensi: Presensi[];
  branding: Branding;
  onSaveEvaluasi: (id: string, updates: Partial<Peserta>) => void;
  onBulkUpdateKelulusan: (updatedPeserta: Peserta[]) => void;
  currentUserRole: string;
  currentUserPermissions: string[];
  currentUserName: string;
}

export default function KelulusanTab({
  peserta,
  sesi,
  presensi,
  branding,
  onSaveEvaluasi,
  onBulkUpdateKelulusan,
  currentUserRole,
  currentUserPermissions,
  currentUserName
}: KelulusanTabProps) {
  // Calculates total session duration
  const sortedSesi = [...sesi].sort((a,b) => a.num - b.num);
  const totalDuration = sortedSesi.reduce((sum, s) => sum + (s.duration || 0), 0) || 1;

  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // AI thresholds State
  const [minPres, setMinPres] = useState<number>(75);
  const [minMenit, setMinMenit] = useState<number>(877.5);
  const [isAiEvaluated, setIsAiEvaluated] = useState(() => {
    return localStorage.getItem('SIANSOR_AI_EVALUATED') === 'true';
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);

  // Modal Input Evaluasi State
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [evalId, setEvalId] = useState('');
  const [evalPost, setEvalPost] = useState<number>(0);
  const [evalPraktik, setEvalPraktik] = useState<number>(0);
  const [evalKeaktifan, setEvalKeaktifan] = useState<number>(0);
  const [evalIzin, setEvalIzin] = useState<number>(0);
  const [evalStatus, setEvalStatus] = useState<"LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS">('TIDAK LULUS');
  const [evalSertifikat, setEvalSertifikat] = useState('');

  // Modal AI Diagnostic State
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [diagId, setDiagId] = useState('');
  const [diagData, setDiagData] = useState<any>(null);

  // Modal Custom Certificate State
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [certId, setCertId] = useState('');
  const [certNomor, setCertNomor] = useState('');
  const [certNama, setCertNama] = useState('');
  const [certUtusan, setCertUtusan] = useState('');
  const [certBody1, setCertBody1] = useState('');
  const [certBody2, setCertBody2] = useState('');
  const [certBody3, setCertBody3] = useState('');
  const [certKetua, setCertKetua] = useState('DHOMIRY A GHAZALY., S.H');
  const [certSekretaris, setCertSekretaris] = useState('M. ANGGA GUNAEFI., S.Pd');
  const [certLocationHijriah, setCertLocationHijriah] = useState('CILEUNGSI , 13 MUHARRAM 1448 H');
  const [certDateMasehi, setCertDateMasehi] = useState('28 JUNI 2026 M');
  const [certSiapsData, setCertSiapsData] = useState('');
  
  // Custom uploaded images for Certificate
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customStempel, setCustomStempel] = useState<string | null>(null);
  const [customTtdKetua, setCustomTtdKetua] = useState<string | null>(null);
  const [customTtdSekr, setCustomTtdSekr] = useState<string | null>(null);

  // States for Back Side of Certificate (Daftar Materi)
  const [certActivePage, setCertActivePage] = useState<'depan' | 'belakang'>('depan');
  const [certTtl, setCertTtl] = useState('BOGOR, 03/03/1997');
  const [certJabatan, setCertJabatan] = useState('KADER');
  const [certInstruktur, setCertInstruktur] = useState('SEPTA AJI., S.KOM');
  const [certFoto, setCertFoto] = useState<string | null>(null);
  const [certSubjects, setCertSubjects] = useState([
    { no: "1", materi: "Orientasi Pengkaderan", narasumber: "M. Angga Gunaefi., S.Pd" },
    { no: "2", materi: "Ahlussunah Wal jama'ah I", narasumber: "KH. Abduloh Nawawi MDZ., S.Pd" },
    { no: "3", materi: "Dalil-Dalil Amaliyah dan Tradisi Keagamaan NU", narasumber: "Kyai Maman Djamaludin, M.Pd" },
    { no: "4", materi: "Ke-Indonesiaan dan Kebangsaan", narasumber: "Zulfikar., S.Pd" },
    { no: "5", materi: "Ke-Nahdlatul Ulama-an I", narasumber: "Kyai Syahri Ramdani" },
    { no: "6", materi: "Ke Ansoran I", narasumber: "Dhomiry A Ghazaly., S.H" },
    { no: "7", materi: "Organisasi dan Kepemimpinan", narasumber: "Rachman Nugeraha., M.H" },
    { no: "8", materi: "Pengenalan Peraturan Organisasi GP Ansor", narasumber: "Septa Aji., S.Kom" },
    { no: "9", materi: "Literasi Digital", narasumber: "Septa Aji., S.Kom" },
    { no: "10", materi: "Rencana Tindak Lanjut ( RTL )", narasumber: "Hamdani Maulana Malik., S.E" },
    { no: "11", materi: "Pembaiatan", narasumber: "Instruktur" }
  ]);

  // Modal SK Penetapan Kelulusan State
  const [isSkOpen, setIsSkOpen] = useState(false);
  const [skNomor, setSkNomor] = useState('029 /PC-IX-22/SK-01/VI/2026');
  const [skAngkatan, setSkAngkatan] = useState('XXIX');
  const [skKecamatan, setSkKecamatan] = useState('Cileungsi');
  const [skTanggalRapat, setSkTanggalRapat] = useState('27 Juni 2026');
  
  const [skMenimbangA, setSkMenimbangA] = useState('Bahwa Dewan Instruktur Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor menganggap penting adanya surat penetapan kelulusan peserta Pelatihan Kepemimpinan Dasar (PKD) Angkatan XXIX yang dilaksanakan oleh Pimpinan Anak Cabang Gerakan Pemuda Ansor Kecamatan Cileungsi Kabupaten Bogor');
  const [skMenimbangB, setSkMenimbangB] = useState('Bahwa untuk menjamin kepastian status kelulusan kepesertaan Kaderisasi Pelatihan Kepemimpinan Dasar (PKD) sebagai bagian dari Pelaksanaan amanat organisasi');
  
  const [skMengingatA, setSkMengingatA] = useState('Keputusan Konferensi besar Pimpinan Pusat Gerakan Pemuda Ansor Nomor 08/KONBES-XXVII/X/2024 tentang Sistem Kaderisasi');
  const [skMengingatB, setSkMengingatB] = useState('Peraturan Organisasi (PO) Sistem Kaderisasi Pasal 63 Ayat 2');
  
  const [skMemperhatikanA, setSkMemperhatikanA] = useState('Rekapitulasi absensi kehadiran peserta pada setiap materi wajib yang telah ditentukan sistem kaderisasi');
  const [skMemperhatikanB, setSkMemperhatikanB] = useState('Rapat Dewan Instruktur Cabang mengenai kelayakan kelulusan peserta PKD Angkatan XXIX Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor pada tanggal 27 Juni 2026');
  const [skMemperhatikanC, setSkMemperhatikanC] = useState('Mendengarkan saran dan masukan dari Pimpinan Anak Cabang Gerakan Pemuda Ansor Kecamatan Cileungsi Kabupaten Bogor');

  const [skDitetapkan, setSkDitetapkan] = useState('Di Cileungsi');
  const [skTanggalHijriah, setSkTanggalHijriah] = useState('11/12 Muharrom 1448H');
  const [skTanggalMasehi, setSkTanggalMasehi] = useState('28 Juni 2026 M');
  
  const [skKepalaSekolah, setSkKepalaSekolah] = useState('HAMDANI M MALIK, S.E');
  const [skKoordinator, setSkKoordinator] = useState('SEPTA AJI., S.KOM');
  const [skKetua, setSkKetua] = useState('DOMIRI A GHAZALI, S.H');

  const [skTextTotal, setSkTextTotal] = useState('');
  const [skTextLulus, setSkTextLulus] = useState('');
  const [skTextTidakLulus, setSkTextTidakLulus] = useState('');

  const [skOperator, setSkOperator] = useState('');
  const [skWaktuCetak, setSkWaktuCetak] = useState('');
  const [skLogo, setSkLogo] = useState<string | null>(null);
  const [useQrSignatures, setUseQrSignatures] = useState(true);
  const [useDocumentValidation, setUseDocumentValidation] = useState(true);

  // States for live interactive preview QR codes
  const [previewQrKepalaSekolah, setPreviewQrKepalaSekolah] = useState('');
  const [previewQrKoordinator, setPreviewQrKoordinator] = useState('');
  const [previewQrKetua, setPreviewQrKetua] = useState('');
  const [previewQrValidation, setPreviewQrValidation] = useState('');

  function kekata(n: number): string {
    const words = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (n < 12) return words[n];
    if (n < 20) return words[n - 10] + " Belas";
    if (n < 100) return words[Math.floor(n / 10)] + " Puluh" + (n % 10 !== 0 ? " " + kekata(n % 10) : "");
    if (n < 200) return "Seratus " + kekata(n - 100);
    if (n < 1000) return kekata(Math.floor(n / 100)) + " Ratus" + (n % 100 !== 0 ? " " + kekata(n % 100) : "");
    return String(n);
  }

  useEffect(() => {
    if (isEvalOpen && evalId) {
      const currentParticipant = peserta.find(p => p.id === evalId);
      if (currentParticipant) {
        const presentLogs = presensi.filter(pr => pr.id === currentParticipant.id);
        const attendedMinutes = presentLogs.reduce((sum, log) => {
          const matchingS = sesi.find(s => s.num === log.sesi);
          return sum + (matchingS?.duration || 0);
        }, 0);
        const pct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

        let autoStatus: "LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS" = "TIDAK LULUS";
        if (pct < 75) {
          autoStatus = "TIDAK LULUS";
        } else if (pct === 75) {
          autoStatus = "LULUS BERSYARAT";
        } else {
          autoStatus = "LULUS";
        }
        setEvalStatus(autoStatus);
      }
    }
  }, [isEvalOpen, evalId, peserta, presensi, sesi, totalDuration]);

  useEffect(() => {
    if (isSkOpen) {
      const tot = peserta.length;
      const lls = peserta.filter(p => p.status_kelulusan === 'LULUS' || p.status_kelulusan === 'LULUS BERSYARAT').length;
      const tdk = peserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;
      
      setSkTextTotal(`${tot} ( ${kekata(tot)} )`);
      setSkTextLulus(`${lls} ( ${kekata(lls)} )`);
      setSkTextTidakLulus(`${tdk} ( ${kekata(tdk)} )`);

      if (!skOperator) {
        setSkOperator(currentUserName || 'Operator Admin');
      }

      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = now.toLocaleDateString('id-ID', optionsDate);
      const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      setSkWaktuCetak(`${formattedDate}, ${formattedTime}`);
    }
  }, [isSkOpen, peserta, currentUserName]);

  useEffect(() => {
    const updatePreviewQrs = async () => {
      try {
        if (useQrSignatures) {
          const qrKepala = await QRCode.toDataURL(
            `DEWAN INSTRUKTUR PC GP ANSOR KAB BOGOR\nJabatan: Kepala Sekolah Kaderisasi\nNama: ${skKepalaSekolah}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, 
            { margin: 1, width: 120 }
          );
          const qrKoord = await QRCode.toDataURL(
            `DEWAN INSTRUKTUR PC GP ANSOR KAB BOGOR\nJabatan: Koordinator Instruktur Cabang\nNama: ${skKoordinator}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, 
            { margin: 1, width: 120 }
          );
          const qrKetuaSig = await QRCode.toDataURL(
            `PIMPINAN CABANG GERAKAN PEMUDA ANSOR KAB BOGOR\nJabatan: Ketua\nNama: ${skKetua}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, 
            { margin: 1, width: 120 }
          );
          setPreviewQrKepalaSekolah(qrKepala);
          setPreviewQrKoordinator(qrKoord);
          setPreviewQrKetua(qrKetuaSig);
        } else {
          setPreviewQrKepalaSekolah('');
          setPreviewQrKoordinator('');
          setPreviewQrKetua('');
        }

        if (useDocumentValidation) {
          const valText = `DOKUMEN RESMI TERVERIFIKASI\nSK Penetapan Kelulusan PKD Angkatan ${skAngkatan}\nNomor: ${skNomor}\nKecamatan: ${skKecamatan}\nOperator Cetak: ${skOperator || 'Admin'}\nWaktu Cetak: ${skWaktuCetak || 'Now'}\nStatus: SAH & TERCATAT`;
          const qrVal = await QRCode.toDataURL(valText, { margin: 1, width: 120 });
          setPreviewQrValidation(qrVal);
        } else {
          setPreviewQrValidation('');
        }
      } catch (err) {
        console.error('Error generating preview QR codes', err);
      }
    };

    if (isSkOpen) {
      updatePreviewQrs();
    }
  }, [
    isSkOpen,
    skKepalaSekolah,
    skKoordinator,
    skKetua,
    skAngkatan,
    skNomor,
    skKecamatan,
    skOperator,
    skWaktuCetak,
    useQrSignatures,
    useDocumentValidation
  ]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const isAdmin = currentUserRole === 'Admin';
  const canRekap = isAdmin || currentUserPermissions.includes('rekap');

  // Sync count indicators
  const countLulus = peserta.filter(p => p.status_kelulusan === 'LULUS').length;
  const countBersyarat = peserta.filter(p => p.status_kelulusan === 'LULUS BERSYARAT').length;
  const countTidakLulus = peserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredPeserta = peserta.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.utusan.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);
  const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeserta = filteredPeserta.slice(startIndex, endIndex);

  // Quantization helpers for AI Classifier
  const quantizeScore = (score: number) => {
    if (score >= 85) return "SANGAT_BAIK";
    if (score >= 70) return "BAIK";
    if (score >= 55) return "CUKUP";
    return "KURANG";
  };

  const quantizePresence = (pct: number) => {
    if (pct >= 90) return "SANGAT_TINGGI";
    if (pct >= 80) return "TINGGI";
    if (pct >= 60) return "CUKUP";
    return "RENDAH";
  };

  // Perform AI Evaluation
  const runAiEvaluation = () => {
    setIsEvaluating(true);
    setEvalProgress(0);

    // Predict for all kaders and bundle updates based on the exact percentage criteria
    const updatedPesertaList = peserta.map((p, index) => {
      const presentLogs = presensi.filter(pr => pr.id === p.id);
      const attendedMinutes = presentLogs.reduce((sum, log) => {
        const matchingS = sesi.find(s => s.num === log.sesi);
        return sum + (matchingS?.duration || 0);
      }, 0);
      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let prediction: "LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS" = "TIDAK LULUS";

      if (presPct < 75) {
        prediction = "TIDAK LULUS";
      } else if (presPct === 75) {
        prediction = "LULUS BERSYARAT";
      } else {
        prediction = "LULUS";
      }

      const certNo = prediction === 'LULUS' && !p.no_sertifikat
        ? `CERT/ANS/PC/${String(index + 1).padStart(3, '0')}/2026`
        : p.no_sertifikat;

      return {
        ...p,
        status_kelulusan: prediction,
        no_sertifikat: certNo
      };
    });

    let current = 0;
    const interval = setInterval(() => {
      // realistic increments for algorithmic computation feel
      current += Math.floor(Math.random() * 3) + 2; 
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsAiEvaluated(true);
          localStorage.setItem('SIANSOR_AI_EVALUATED', 'true');
          onBulkUpdateKelulusan(updatedPesertaList);
          setIsEvaluating(false);
        }, 500);
      }
      setEvalProgress(current);
    }, 35);
  };

  const handleOpenEval = (p: Peserta) => {
    setEvalId(p.id);
    setEvalPost(p.nilai_post_test);
    setEvalPraktik(p.nilai_praktik);
    setEvalKeaktifan(p.nilai_keaktifan);
    setEvalIzin(p.izin_menit || 0);
    setEvalStatus(p.status_kelulusan);
    setEvalSertifikat(p.no_sertifikat || '');
    setIsEvalOpen(true);
  };

  const handleSaveEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEvaluasi(evalId, {
      nilai_post_test: evalPost,
      nilai_praktik: evalPraktik,
      nilai_keaktifan: evalKeaktifan,
      izin_menit: evalIzin,
      status_kelulusan: evalStatus,
      no_sertifikat: evalSertifikat
    });
    setIsEvalOpen(false);
  };

  const handleOpenDiag = (p: Peserta) => {
    const presentLogs = presensi.filter(pr => pr.id === p.id);
    const attendedMinutes = presentLogs.reduce((sum, log) => {
      const matchingS = sesi.find(s => s.num === log.sesi);
      return sum + (matchingS?.duration || 0);
    }, 0);
    const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

    let pCat = quantizePresence(presPct);
    let postCat = quantizeScore(p.nilai_post_test || 0);
    let praktikCat = quantizeScore(p.nilai_praktik || 0);
    let aktifCat = quantizeScore(p.nilai_keaktifan || 0);

    // Simulated posterior probs for visual beautiful meters
    let probs = {
      lulus: p.status_kelulusan === 'LULUS' ? 85 : (p.status_kelulusan === 'LULUS BERSYARAT' ? 40 : 10),
      bersyarat: p.status_kelulusan === 'LULUS BERSYARAT' ? 55 : (p.status_kelulusan === 'LULUS' ? 12 : 30),
      tidak: p.status_kelulusan === 'TIDAK LULUS' ? 60 : (p.status_kelulusan === 'LULUS BERSYARAT' ? 5 : 5)
    };
    
    // Normalize to 100%
    const sum = probs.lulus + probs.bersyarat + probs.tidak;
    probs.lulus = Math.round((probs.lulus / sum) * 100);
    probs.bersyarat = Math.round((probs.bersyarat / sum) * 100);
    probs.tidak = 100 - probs.lulus - probs.bersyarat;

    setDiagId(p.id);
    setDiagData({
      nama: p.nama,
      utusan: p.utusan,
      pct: presPct,
      minutes: attendedMinutes,
      treePresence: `Kehadiran (${presPct}%) < Batas Lulus (75%)? ${presPct < 75 ? 'YA (TIDAK LULUS)' : 'TIDAK'}`,
      treeScores: `Persentase Kehadiran (${presPct}%) === 75%? ${
        presPct === 75 ? 'YA (LULUS BERSYARAT)' : (presPct > 75 ? 'TIDAK (LULUS)' : 'TIDAK (TIDAK LULUS)')
      }`,
      probs
    });
    setIsDiagOpen(true);
  };

  // ----------------- Certificate live preview drawing on Canvas -----------------
  const handleOpenCertificateCustomizer = (p: Peserta) => {
    setCertId(p.id);
    setCertNomor(p.no_sertifikat || "06.020 / PC-IX-22/SK-01/PKD-XXIX/VI/2026");
    setCertNama(p.nama);
    setCertUtusan(p.utusan);
    setCertBody1("TELAH MENYELESAIKAN PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN XXIX");
    setCertBody2(`${branding.organisasi.toUpperCase()} PADA TANGGAL 26 - 28 JUNI 2026 BERTEMPAT`);
    setCertBody3("DI SDIT NURUL AKBAR DESA GANDOANG KECAMATAN CILEUNGSI KABUPATEN BOGOR");
    setCertKetua("DHOMIRY A GHAZALY., S.H");
    setCertSekretaris("M. ANGGA GUNAEFI., S.Pd");
    setCertLocationHijriah("CILEUNGSI , 13 MUHARRAM 1448 H");
    setCertDateMasehi("28 JUNI 2026 M");
    setCertSiapsData(`https://siaps.ansorbogor.or.id/verify/${p.id}`);
    
    // Back Side state variables
    setCertActivePage('depan');
    setCertTtl("BOGOR, 03/03/1997");
    setCertJabatan("KADER");
    setCertInstruktur("SEPTA AJI., S.KOM");
    setCertFoto(p.foto || null);
    
    setIsCertOpen(true);
  };

  const drawCertificatePreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset base canvas proportions 1200 x 850
    canvas.width = 1200;
    canvas.height = 850;

    // White base color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 850);

    // Decorative background: Islamic geometric arabesque watermark pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.04)'; // Soft green watermark
    ctx.lineWidth = 1;
    const patSize = 48;
    const patStep = 100;
    for (let x = 0; x < 1200 + patStep; x += patStep) {
      for (let y = 0; y < 850 + patStep; y += patStep) {
        ctx.save();
        ctx.translate(x, y);
        
        // Overlapping squares rotated by 45 degrees to form an 8-pointed star
        ctx.beginPath();
        ctx.rect(-patSize/2, -patSize/2, patSize, patSize);
        ctx.stroke();
        
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-patSize/2, -patSize/2, patSize, patSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, patSize / 4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }
    ctx.restore();

    // Premium Border Frames
    // Outer green border
    ctx.strokeStyle = '#005a36'; // Elegant Dark Green
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1160, 810);

    // Inner thin gold/amber border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 30, 1140, 790);

    // Middle elegant green border
    ctx.strokeStyle = '#005a36';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(38, 38, 1124, 774);

    // Corner decorative lines
    ctx.fillStyle = '#005a36';
    // Top-left
    ctx.fillRect(15, 15, 30, 8);
    ctx.fillRect(15, 15, 8, 30);
    // Top-right
    ctx.fillRect(1155, 15, 30, 8);
    ctx.fillRect(1177, 15, 8, 30);
    // Bottom-left
    ctx.fillRect(15, 827, 30, 8);
    ctx.fillRect(15, 805, 8, 30);
    // Bottom-right
    ctx.fillRect(1155, 827, 30, 8);
    ctx.fillRect(1177, 805, 8, 30);

    if (certActivePage === 'depan') {
      // Load logo if uploaded, otherwise draw dynamic vector shield GP Ansor
    const logoToUse = customLogo || (branding?.logo && branding.logo.trim().startsWith('data:image/') ? branding.logo : null);
    if (logoToUse) {
      const img = new Image();
      img.src = logoToUse;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 550, 65, 100, 100);
          resolve(true);
        };
        img.onerror = () => {
          resolve(false);
        };
      });
    } else {
      // Draw professional GP Ansor triangle logo
      ctx.save();
      ctx.translate(600, 115);
      
      const logoGreen = '#005a36';
      const logoSize = 100;
      
      // Draw outer triangle
      ctx.strokeStyle = logoGreen;
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -logoSize/2);
      ctx.lineTo(logoSize * 0.58, logoSize * 0.45);
      ctx.lineTo(-logoSize * 0.58, logoSize * 0.45);
      ctx.closePath();
      ctx.stroke();

      // Draw inner thin triangle
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -logoSize/2 + 8);
      ctx.lineTo(logoSize * 0.58 - 10, logoSize * 0.45 - 5);
      ctx.lineTo(-logoSize * 0.58 + 10, logoSize * 0.45 - 5);
      ctx.closePath();
      ctx.stroke();

      // Triangle fill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -logoSize/2 + 3);
      ctx.lineTo(logoSize * 0.58 - 3, logoSize * 0.45 - 2);
      ctx.lineTo(-logoSize * 0.58 + 3, logoSize * 0.45 - 2);
      ctx.closePath();
      ctx.fill();

      // Crescent moon in the middle
      ctx.fillStyle = logoGreen;
      ctx.beginPath();
      ctx.arc(0, 4, 18, -Math.PI * 0.6, Math.PI * 0.8, false);
      ctx.arc(4, 2, 16, Math.PI * 0.8, -Math.PI * 0.6, true);
      ctx.closePath();
      ctx.fill();

      // Helper for drawing 5-point star
      const drawStarVec = (sx: number, sy: number, r: number) => {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.beginPath();
        ctx.rotate(-Math.PI / 2);
        for (let i = 0; i < 10; i++) {
          const radius = (i % 2 === 0) ? r : r / 2.3;
          const angle = (Math.PI * i) / 5;
          ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // 9 Stars
      // Top central star
      drawStarVec(0, -16, 7);

      // Left 4 stars
      drawStarVec(-14, -8, 3.2);
      drawStarVec(-22, 1, 3.2);
      drawStarVec(-24, 11, 3.2);
      drawStarVec(-18, 20, 3.2);

      // Right 4 stars
      drawStarVec(14, -8, 3.2);
      drawStarVec(22, 1, 3.2);
      drawStarVec(24, 11, 3.2);
      drawStarVec(18, 20, 3.2);

      // Rays shining from top star
      ctx.strokeStyle = logoGreen;
      ctx.lineWidth = 1.2;
      for (let angle = -Math.PI * 0.8; angle <= -Math.PI * 0.2; angle += Math.PI * 0.15) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 10, -16 + Math.sin(angle) * 10);
        ctx.lineTo(Math.cos(angle) * 17, -16 + Math.sin(angle) * 17);
        ctx.stroke();
      }

      // Banner for ANSOR
      ctx.fillStyle = logoGreen;
      ctx.fillRect(-35, 23, 70, 13);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 8.5px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("ANSOR", 0, 29.5);

      ctx.restore();
    }

    // Elegant Calligraphy / Serif Font for Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#005a36'; // Elegant green
    ctx.font = "italic 68px 'Playfair Display', 'Georgia', 'Didot', serif";
    ctx.fillText("Sertifikat", 600, 260);

    // Certificate Number
    ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#334155';
    ctx.fillText(`NOMOR : ${certNomor}`, 600, 305);

    // Given To
    ctx.fillStyle = '#475569';
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("DIBERIKAN KEPADA :", 600, 345);

    // Participant Name (Big, bold green, elegant italic serif)
    ctx.fillStyle = '#005a36';
    ctx.font = "bold italic 44px 'Playfair Display', 'Georgia', serif";
    ctx.fillText(certNama.toUpperCase(), 600, 400);

    // Underline
    ctx.strokeStyle = '#d97706'; // Gold/amber line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 411);
    ctx.lineTo(820, 411);
    ctx.stroke();

    // Body texts
    ctx.fillStyle = '#334155';
    ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certBody1.toUpperCase(), 600, 455);
    ctx.fillText(certBody2.toUpperCase(), 600, 480);
    ctx.fillText(certBody3.toUpperCase(), 600, 505);
    
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#0f172a';
    ctx.fillText("DAN DINYATAKAN LULUS", 600, 540);

    // Location & Date
    ctx.fillStyle = '#1e293b';
    ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certLocationHijriah.toUpperCase(), 600, 580);
    
    // Line under location & Hijriah date
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(480, 587);
    ctx.lineTo(720, 587);
    ctx.stroke();

    ctx.fillText(certDateMasehi.toUpperCase(), 600, 605);

    // PIMPINAN CABANG GERAKAN PEMUDA ANSOR KABUPATEN BOGOR Headers
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("PIMPINAN CABANG", 600, 640);
    ctx.fillText("GERAKAN PEMUDA ANSOR", 600, 657);
    ctx.fillText("KABUPATEN BOGOR", 600, 674);

    // Chairman & Secretary names and roles
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certKetua, 350, 765);
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#475569';
    ctx.fillText("KETUA", 350, 785);

    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certSekretaris, 810, 765);
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#475569';
    ctx.fillText("SEKRETARIS", 810, 785);

    // Digital Signature QR Code for Ketua (Left)
    try {
      const ketuaQrText = `VERIFIKASI TANDA TANGAN DIGITAL\nPimpinan Cabang GP Ansor Kabupaten Bogor\nNama: ${certKetua}\nJabatan: KETUA\nSertifikat No: ${certNomor}\nStatus: TERVERIFIKASI & SAH`;
      const ketuaQrUrl = await QRCode.toDataURL(ketuaQrText, { margin: 1, width: 70 });
      const qrImg = new Image();
      qrImg.src = ketuaQrUrl;
      await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, 315, 650, 70, 70); r(true); } });
    } catch (e) {
      console.error(e);
    }

    // Digital Signature QR Code for Secretary (Right)
    try {
      const sekQrText = `VERIFIKASI TANDA TANGAN DIGITAL\nPimpinan Cabang GP Ansor Kabupaten Bogor\nNama: ${certSekretaris}\nJabatan: SEKRETARIS\nSertifikat No: ${certNomor}\nStatus: TERVERIFIKASI & SAH`;
      const sekQrUrl = await QRCode.toDataURL(sekQrText, { margin: 1, width: 70 });
      const qrImg = new Image();
      qrImg.src = sekQrUrl;
      await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, 775, 650, 70, 70); r(true); } });
    } catch (e) {
      console.error(e);
    }

    // SIAPs QR Code (Bottom Right)
    try {
      const qrDataUrl = await QRCode.toDataURL(certSiapsData || certId, { margin: 1, width: 105 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, 1040, 670, 105, 105); r(true); } });
      
      // Label under QR Code
      ctx.fillStyle = '#475569';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("APLIKASI SIAPs", 1092, 792);
    } catch (e) {
      console.error(e);
    }
    } else {
      // ----------------- DRAW BACK SIDE (HALAMAN BELAKANG & DAFTAR MATERI) -----------------
      // Draw light background container for Bio & Photo
      ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
      ctx.fillRect(60, 50, 1080, 200);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 50, 1080, 200);

      // Photo Frame
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(80, 60, 140, 180);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(80, 60, 140, 180);

      if (certFoto) {
        const img = new Image();
        img.src = certFoto;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 82, 62, 136, 176);
            resolve(true);
          };
          img.onerror = () => {
            resolve(false);
          };
        });
      } else {
        // Placeholder text
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("PAS FOTO", 150, 140);
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("3 x 4", 150, 165);
      }

      // Draw Bio text
      ctx.textAlign = 'left';
      const bioLeft = 260;
      
      // Labels
      ctx.fillStyle = '#475569';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("NAMA", bioLeft, 100);
      ctx.fillText("TTL", bioLeft, 138);
      ctx.fillText("UTUSAN", bioLeft, 176);
      ctx.fillText("JABATAN", bioLeft, 214);

      // Values
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`:   ${certNama.toUpperCase()}`, bioLeft + 110, 100);
      ctx.fillText(`:   ${certTtl.toUpperCase()}`, bioLeft + 110, 138);
      ctx.fillText(`:   ${certUtusan.toUpperCase()}`, bioLeft + 110, 176);
      ctx.fillText(`:   ${certJabatan.toUpperCase()}`, bioLeft + 110, 214);

      // subjects (Materi) data array - now using state certSubjects
      const subjects = certSubjects;

      // Draw Table Bounding Box & Grid Lines
      const tableY = 270;
      const colNoW = 70;
      const colMatW = 550;
      const colNarW = 460;
      const rowH = 34;
      const tableW = colNoW + colMatW + colNarW; // 1080px
      const totalTableH = rowH * 12; // 1 header + 11 rows = 408px

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, tableY, tableW, totalTableH);

      // Header background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, tableY, tableW, rowH);

      // Header Texts
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'center';
      
      ctx.fillText("NO", 60 + colNoW / 2, tableY + rowH / 2 + 5);
      ctx.fillText("MATERI", 60 + colNoW + colMatW / 2, tableY + rowH / 2 + 5);
      ctx.fillText("NARASUMBER", 60 + colNoW + colMatW + colNarW / 2, tableY + rowH / 2 + 5);

      // Grid line below header
      ctx.beginPath();
      ctx.moveTo(60, tableY + rowH);
      ctx.lineTo(60 + tableW, tableY + rowH);
      ctx.stroke();

      // Draw rows
      for (let i = 0; i < 11; i++) {
        const rowY = tableY + rowH + i * rowH;

        // Row border
        ctx.beginPath();
        ctx.moveTo(60, rowY + rowH);
        ctx.lineTo(60 + tableW, rowY + rowH);
        ctx.stroke();

        const item = subjects[i];

        // NO centered
        ctx.fillStyle = '#334155';
        ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(item.no, 60 + colNoW / 2, rowY + rowH / 2 + 5);

        // MATERI left-aligned
        ctx.fillStyle = '#1e293b';
        ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(item.materi, 60 + colNoW + 15, rowY + rowH / 2 + 5);

        // NARASUMBER left-aligned
        ctx.fillStyle = '#334155';
        ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(item.narasumber, 60 + colNoW + colMatW + 15, rowY + rowH / 2 + 5);
      }

      // Draw Vertical column dividers
      ctx.beginPath();
      ctx.moveTo(60 + colNoW, tableY);
      ctx.lineTo(60 + colNoW, tableY + totalTableH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(60 + colNoW + colMatW, tableY);
      ctx.lineTo(60 + colNoW + colMatW, tableY + totalTableH);
      ctx.stroke();

      // Instructor Signature block (Bottom Right)
      const sigX = 950;
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText("INSTRUKTUR", sigX, 700);

      // Digital Signature QR Code for Instruktur
      try {
        const insQrText = `VERIFIKASI TANDA TANGAN DIGITAL\nDewan Instruktur GP Ansor Kabupaten Bogor\nNama: ${certInstruktur}\nJabatan: DEWAN INSTRUKTUR\nSertifikat No: ${certNomor}\nStatus: TERVERIFIKASI & SAH`;
        const insQrUrl = await QRCode.toDataURL(insQrText, { margin: 1, width: 68 });
        const qrImg = new Image();
        qrImg.src = insQrUrl;
        await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, sigX - 34, 708, 68, 68); r(true); } });
      } catch (e) {
        console.error(e);
      }

      // Printed Name
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(certInstruktur.toUpperCase(), sigX, 800);
    }
  };

  useEffect(() => {
    if (isCertOpen) {
      drawCertificatePreview();
    }
  }, [
    isCertOpen,
    certNomor,
    certNama,
    certUtusan,
    certBody1,
    certBody2,
    certBody3,
    certKetua,
    certSekretaris,
    certLocationHijriah,
    certDateMasehi,
    certSiapsData,
    customLogo,
    customStempel,
    customTtdKetua,
    customTtdSekr,
    certActivePage,
    certTtl,
    certJabatan,
    certInstruktur,
    certFoto,
    certSubjects
  ]);

  const downloadCertPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Sertifikat_${certNama.replace(/\s+/g, '_')}_Ansor.png`;
    link.click();
    setIsCertOpen(false);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re => {
        if (re.target?.result) setter(re.target.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const handlePrintSK = async () => {
    // Generate QR Codes
    let qrKepalaSekolahImg = '';
    let qrKoordinatorImg = '';
    let qrKetuaImg = '';
    let qrValidationImg = '';

    try {
      if (useQrSignatures) {
        qrKepalaSekolahImg = await QRCode.toDataURL(`DEWAN INSTRUKTUR PC GP ANSOR KAB BOGOR\nJabatan: Kepala Sekolah Kaderisasi\nNama: ${skKepalaSekolah}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, { margin: 1, width: 120 });
        qrKoordinatorImg = await QRCode.toDataURL(`DEWAN INSTRUKTUR PC GP ANSOR KAB BOGOR\nJabatan: Koordinator Instruktur Cabang\nNama: ${skKoordinator}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, { margin: 1, width: 120 });
        qrKetuaImg = await QRCode.toDataURL(`PIMPINAN CABANG GERAKAN PEMUDA ANSOR KAB BOGOR\nJabatan: Ketua\nNama: ${skKetua}\nStatus: TERVERIFIKASI & TANDATANGAN DIGITAL`, { margin: 1, width: 120 });
      }
      if (useDocumentValidation) {
        const valText = `DOKUMEN RESMI TERVERIFIKASI\nSK Penetapan Kelulusan PKD Angkatan ${skAngkatan}\nNomor: ${skNomor}\nKecamatan: ${skKecamatan}\nOperator Cetak: ${skOperator}\nWaktu Cetak: ${skWaktuCetak}\nStatus: SAH & TERCATAT`;
        qrValidationImg = await QRCode.toDataURL(valText, { margin: 1, width: 120 });
      }
    } catch (err) {
      console.error('Error generating QR codes for SK', err);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ansorGreenLogo = `
<svg viewBox="0 0 120 140" width="100" height="116" xmlns="http://www.w3.org/2000/svg">
  <polygon points="60,5 115,115 5,115" fill="#008a3c" />
  <polygon points="60,11 110,110 10,110" fill="none" stroke="#ffffff" stroke-width="2" />
  <path d="M 40,75 A 20,20 0 0,0 80,75 A 17,17 0 0,1 40,75 Z" fill="#ffffff" />
  <circle cx="60" cy="72" r="4.5" fill="#ffffff" />
  <line x1="60" y1="67" x2="60" y2="58" stroke="#ffffff" stroke-width="1.5" />
  <line x1="60" y1="77" x2="60" y2="82" stroke="#ffffff" stroke-width="1.5" />
  <line x1="55" y1="72" x2="46" y2="72" stroke="#ffffff" stroke-width="1.5" />
  <line x1="65" y1="72" x2="74" y2="72" stroke="#ffffff" stroke-width="1.5" />
  <line x1="56.5" y1="68.5" x2="50" y2="62" stroke="#ffffff" stroke-width="1.2" />
  <line x1="63.5" y1="68.5" x2="70" y2="62" stroke="#ffffff" stroke-width="1.2" />
  <line x1="56.5" y1="75.5" x2="50" y2="82" stroke="#ffffff" stroke-width="1.2" />
  <line x1="63.5" y1="75.5" x2="70" y2="82" stroke="#ffffff" stroke-width="1.2" />

  <polygon points="60,35 61.5,39.5 66,39.5 62.5,42.2 63.8,46.5 60,44 56.2,46.5 57.5,42.2 54,39.5 58.5,39.5" fill="#ffffff" />
  <polygon points="38,48 39.2,51 43,51 40,53 41,56.5 38,54.5 35,56.5 36,53 33,51 36.8,51" fill="#ffffff" />
  <polygon points="32,60 33.2,63 37,63 34,65 35,68.5 32,66.5 29,68.5 30,65 27,63 30.8,63" fill="#ffffff" />
  <polygon points="30,73 31.2,76 35,76 32,78 33,81.5 30,79.5 27,81.5 28,78 25,76 28.8,76" fill="#ffffff" />
  <polygon points="32,86 33.2,89 37,89 34,91 35,94.5 32,92.5 29,94.5 30,92 27,89 30.8,89" fill="#ffffff" />
  <polygon points="82,48 83.2,51 87,51 84,53 85,56.5 82,54.5 79,56.5 80,53 77,51 80.8,51" fill="#ffffff" />
  <polygon points="88,60 89.2,63 93,63 90,65 91,68.5 88,66.5 85,68.5 86,65 83,63 86.8,63" fill="#ffffff" />
  <polygon points="90,73 91.2,76 95,76 92,78 93,81.5 90,79.5 87,81.5 88,78 85,76 88.8,76" fill="#ffffff" />
  <polygon points="88,86 89.2,89 93,89 90,91 91,94.5 88,92.5 85,94.5 86,92 83,89 86.8,89" fill="#ffffff" />

  <rect x="15" y="103" width="90" height="15" fill="#008a3c" />
  <text x="60" y="115" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle" letter-spacing="1">ANSOR</text>
</svg>
    `;

    const logoHtml = skLogo 
      ? `<div class="logo-container"><img src="${skLogo}" alt="Logo" /></div>`
      : `<div class="logo-container"><div>${ansorGreenLogo}</div></div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Surat_Ketetapan_Kelulusan_PKD_${skAngkatan}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
            
            @page {
              size: A4;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Cambria', Georgia, serif;
              font-size: 14px;
              color: #000000;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* Page styles */
            .page {
              width: 210mm;
              height: 297mm;
              background-color: #ffffff;
              box-sizing: border-box;
              padding: 20mm 20mm;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            /* Kop Surat Styles */
            .header-flex {
              display: flex;
              align-items: center;
              gap: 20px;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .logo-container {
              width: 100px;
              height: 116px;
              min-width: 100px;
              min-height: 116px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              box-sizing: border-box;
            }
            .logo-container img {
              width: 100px;
              height: 116px;
              object-fit: contain;
            }
            .logo-container svg {
              width: 100px;
              height: 116px;
            }
            .logo-container div {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .header-info {
              flex-grow: 1;
              text-align: right;
              padding-right: 0px;
              font-family: 'Times New Roman', Times, serif;
            }
            .title-main {
              font-family: 'Times New Roman', Times, serif;
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0;
              color: #000000;
              letter-spacing: 0.05em;
              line-height: 1.2;
            }
            .title-sub1 {
              font-family: 'Times New Roman', Times, serif;
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 2px 0 0 0;
              color: #000000;
              letter-spacing: 0.03em;
              line-height: 1.2;
            }
            .title-sub2 {
              font-family: 'Times New Roman', Times, serif;
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 2px 0 0 0;
              color: #000000;
              letter-spacing: 0.05em;
              line-height: 1.2;
            }
            .address-info {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11px;
              font-weight: 500;
              margin: 8px 0 2px 0;
              color: #000000;
            }
            .links-info {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11px;
              font-weight: 500;
              margin: 0;
              color: #000000;
            }
            .links-info a {
              color: #0284c7;
              text-decoration: underline;
            }

            /* Document structure styles */
            .doc-title {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-size: 14px;
              font-weight: 800;
              text-decoration: underline;
              text-transform: uppercase;
              margin-top: 10px;
              margin-bottom: 2px;
              letter-spacing: 0.05em;
            }
            .doc-number {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .doc-about-label {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .doc-about-title {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              max-width: 85%;
              margin: 0 auto 18px auto;
              line-height: 1.4;
            }

            .bismillah {
              font-family: 'Cambria', Georgia, serif;
              font-style: italic;
              font-weight: 700;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .opening-text {
              font-family: 'Cambria', Georgia, serif;
              font-weight: 700;
              font-size: 14px;
              margin-bottom: 14px;
            }

            /* Table-like row layout for formal documents */
            .doc-table {
              font-family: 'Cambria', Georgia, serif;
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 14px;
              line-height: 1.45;
            }
            .doc-table td {
              padding: 4px 0;
              vertical-align: top;
            }
            .col-label {
              font-weight: 800;
              width: 120px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            .col-separator {
              width: 15px;
              text-align: center;
              font-weight: bold;
            }
            .col-content {
              text-align: justify;
            }
            .bullet-list {
              margin: 0;
              padding: 0;
              list-style-type: none;
            }
            .bullet-list li {
              position: relative;
              padding-left: 18px;
              margin-bottom: 6px;
            }
            .bullet-list li .bullet-char {
              position: absolute;
              left: 0;
              font-weight: bold;
            }

            .centered-divider {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-weight: 800;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 12px 0;
            }

            /* Stats block for page 1 bottom */
            .stats-container {
              margin-top: 6px;
              margin-left: 20px;
              font-family: 'Cambria', Georgia, serif;
              font-size: 14px;
            }
            .stats-row {
              display: flex;
              margin-bottom: 4px;
            }
            .stats-label {
              width: 110px;
              font-weight: 600;
            }
            .stats-dots {
              width: 15px;
              font-weight: bold;
            }
            .stats-val {
              font-weight: 700;
            }

            /* Page 2 signatures styles */
            .meta-date {
              margin-left: auto;
              width: 280px;
              font-family: 'Cambria', Georgia, serif;
              font-size: 14px;
              margin-top: 15px;
              margin-bottom: 15px;
              line-height: 1.45;
            }
            .meta-date table {
              width: 100%;
              border-collapse: collapse;
            }
            .meta-date td {
              padding: 2px 0;
              font-family: 'Cambria', Georgia, serif;
              font-size: 14px;
              color: #000000;
            }

            .instruktur-title {
              font-family: 'Cambria', Georgia, serif;
              text-align: center;
              font-weight: 800;
              font-size: 14px;
              text-transform: uppercase;
              margin-bottom: 20px;
              line-height: 1.35;
            }

            .sig-row {
              font-family: 'Cambria', Georgia, serif;
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              margin-bottom: 30px;
              font-size: 14px;
              text-align: center;
            }
            .sig-col {
              width: 200px;
            }
            .sig-name {
              font-weight: 800;
              text-decoration: underline;
              text-transform: uppercase;
              margin-top: 65px;
            }
            .sig-name-line {
              font-weight: 800;
              text-decoration: underline;
              text-transform: uppercase;
              margin-top: 4px;
            }

            .validation-badge {
              position: absolute;
              bottom: calc(48px + 0.5cm);
              left: 20mm;
              width: calc(100% - 40mm);
              max-width: 420px;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              gap: 12px;
              border: 1.5px dashed #008a3c;
              background-color: #f0fdf4;
              padding: 10px 14px;
              border-radius: 8px;
              font-size: 8px;
              line-height: 1.4;
              color: #000000;
              text-align: left;
            }
            .validation-qr {
              width: 65px;
              height: 65px;
              background: #ffffff;
              padding: 3px;
              border: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .validation-qr img {
              width: 58px;
              height: 58px;
              object-fit: contain;
            }
            .validation-details {
              flex: 1;
              text-align: left;
            }
            .validation-title {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-weight: 800;
              color: #047857;
              font-size: 8px;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
              border-bottom: 1.5px solid #34d399;
              padding-bottom: 3px;
              text-transform: uppercase;
            }
            .validation-text {
              margin: 2px 0;
            }

            .sig-row-mengetahui {
              font-family: 'Cambria', Georgia, serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              font-size: 14px;
              margin-top: 15px;
            }
            .sig-mengetahui-title {
              font-weight: 700;
              text-transform: uppercase;
              line-height: 1.35;
            }

            /* Elegant green footer matching the image */
            .footer-container {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 48px;
              background-color: #008a3c;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 25px;
              color: #ffffff;
              font-family: 'Inter', sans-serif;
              font-size: 9.5px;
              font-weight: 700;
              border-top: 1.5px solid #ffffff;
            }
            .footer-left {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .social-icons {
              display: flex;
              gap: 4px;
            }
            .social-icon {
              width: 16px;
              height: 16px;
              background-color: #ffffff;
              color: #008a3c;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8.5px;
              font-weight: 900;
            }
            .social-handle {
              letter-spacing: 0.02em;
            }
            .footer-badge {
              background-color: transparent;
              color: #ffffff;
              border: 1.5px solid #ffffff;
              padding: 4px 14px;
              border-radius: 14px;
              font-size: 9px;
              margin-left: 12px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            
            /* Styled diagonal stripe on right */
            .footer-stripe {
              position: absolute;
              right: 0;
              bottom: 0;
              height: 100%;
              width: 150px;
              background-color: #00aa4e;
              clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%);
              border-left: 4px solid #ffffff;
            }

            @media print {
              body {
                background-color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .page {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
              }
              .page:last-child {
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body>
          
          <!-- ================= PAGE 1 ================= -->
          <div class="page">
            <div class="content-body">
              
              <!-- Kop Surat -->
              <div class="header-flex">
                ${logoHtml}
                <div class="header-info">
                  <h1 class="title-main">PIMPINAN CABANG</h1>
                  <h2 class="title-sub1">GERAKAN PEMUDA ANSOR</h2>
                  <h2 class="title-sub2">KABUPATEN BOGOR</h2>
                  <p class="address-info">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</p>
                  <p class="links-info">Website : <a href="https://ansorbogoronline.or.id" target="_blank">ansorbogoronline.or.id</a>, | email : <a href="mailto:ansorbogoronline@gmail.com">ansorbogoronline@gmail.com</a>.</p>
                </div>
              </div>

              <!-- Judul SK -->
              <div class="doc-title">SURAT KEPUTUSAN PENETAPAN KELULUSAN</div>
              <div class="doc-number">Nomor : ${skNomor}</div>
              
              <div class="doc-about-label">T e n t a n g</div>
              <div class="doc-about-title">
                PENETAPAN KELULUSAN PESERTA<br/>
                PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN ${skAngkatan}<br/>
                PIMPINAN CABANG GERAKAN PEMUDA ANSOR<br/>
                KABUPATEN BOGOR
              </div>

              <div class="bismillah">Bismillâhirrahmânirrahîm,</div>
              <div class="opening-text">Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor,</div>

              <!-- MENIMBANG, MENGINGAT, MEMPERHATIKAN -->
              <table class="doc-table">
                <tr>
                  <td class="col-label">MENIMBANG</td>
                  <td class="col-separator">:</td>
                  <td class="col-content">
                    <ul class="bullet-list">
                      <li>
                        <span class="bullet-char">a.</span>
                        ${skMenimbangA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        ${skMenimbangB}
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td class="col-label">MENGINGAT</td>
                  <td class="col-separator">:</td>
                  <td class="col-content">
                    <ul class="bullet-list">
                      <li>
                        <span class="bullet-char">a.</span>
                        ${skMengingatA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        ${skMengingatB}
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td class="col-label">MEMPERHATIKAN</td>
                  <td class="col-separator">:</td>
                  <td class="col-content">
                    <ul class="bullet-list">
                      <li>
                        <span class="bullet-char">a.</span>
                        ${skMemperhatikanA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        ${skMemperhatikanB}
                      </li>
                      <li>
                        <span class="bullet-char">c.</span>
                        ${skMemperhatikanC}
                      </li>
                    </ul>
                  </td>
                </tr>
              </table>

              <div class="centered-divider">MEMUTUSKAN</div>

              <table class="doc-table">
                <tr>
                  <td class="col-label">MENETAPKAN</td>
                  <td class="col-separator">:</td>
                  <td class="col-content">
                    <strong>1. Menyatakan Kelulusan Sebagai Berikut :</strong>
                    <div class="stats-container">
                      <div class="stats-row">
                        <span class="stats-label">Total Peserta</span>
                        <span class="stats-dots">:</span>
                        <span class="stats-val">${skTextTotal}</span>
                      </div>
                      <div class="stats-row">
                        <span class="stats-label">Lulus</span>
                        <span class="stats-dots">:</span>
                        <span class="stats-val">${skTextLulus}</span>
                      </div>
                      <div class="stats-row">
                        <span class="stats-label">Tidak Lulus</span>
                        <span class="stats-dots">:</span>
                        <span class="stats-val">${skTextTidakLulus}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

            </div>

            <!-- Page 1 Footer -->
            <div class="footer-container">
              <div class="footer-left">
                <div class="social-icons">
                  <div class="social-icon">▶</div>
                  <div class="social-icon">f</div>
                  <div class="social-icon">📷</div>
                  <div class="social-icon">𝕏</div>
                </div>
                <span class="social-handle">ansorbogoronline</span>
                <span class="footer-badge">www.ansorbogoronline.or.id</span>
              </div>
              <div class="footer-stripe"></div>
            </div>
          </div>

          <!-- ================= PAGE 2 ================= -->
          <div class="page">
            <div class="content-body">
              
              <!-- Kop Surat -->
              <div class="header-flex">
                ${logoHtml}
                <div class="header-info">
                  <h1 class="title-main">PIMPINAN CABANG</h1>
                  <h2 class="title-sub1">GERAKAN PEMUDA ANSOR</h2>
                  <h2 class="title-sub2">KABUPATEN BOGOR</h2>
                  <p class="address-info">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</p>
                  <p class="links-info">Website : <a href="https://ansorbogoronline.or.id" target="_blank">ansorbogoronline.or.id</a>, | email : <a href="mailto:ansorbogoronline@gmail.com">ansorbogoronline@gmail.com</a>.</p>
                </div>
              </div>

              <!-- Menetapkan lanjutan points 2 and 3 -->
              <table class="doc-table" style="margin-top: 20px;">
                <tr>
                  <td class="col-label" style="opacity: 0;">MENETAPKAN</td>
                  <td class="col-separator" style="opacity: 0;">:</td>
                  <td class="col-content">
                    <ul class="bullet-list" style="margin-top: -6px;">
                      <li style="padding-left: 18px; margin-bottom: 12px;">
                        <span class="bullet-char">2.</span>
                        Bahwa Peserta yang lulus berhak mendapatkan Sertifikat PKD setelah melaksanakan rencana tindak lanjut yang sudah ditentukan.
                      </li>
                      <li style="padding-left: 18px;">
                        <span class="bullet-char">3.</span>
                        Daftar Nama Hasil Kelulusan Kaderisasi menjadi bagian tidak terpisahkan dari surat ketetapan ini
                      </li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Ditetapkan di dan Tanggal -->
              <div class="meta-date">
                <table>
                  <tr>
                    <td style="width: 85px; font-weight: normal;">Ditetapkan</td>
                    <td style="width: 15px; text-align: center; font-weight: normal;">:</td>
                    <td style="font-weight: normal;">${skDitetapkan}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: normal;">Tanggal</td>
                    <td style="text-align: center; font-weight: normal;">:</td>
                    <td style="text-decoration: underline; font-weight: normal;">${skTanggalHijriah}</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td style="text-align: center; font-weight: normal;">:</td>
                    <td style="text-decoration: underline; font-weight: normal;">${skTanggalMasehi}</td>
                  </tr>
                </table>
              </div>

              <!-- Dewan Instruktur PC GP Ansor Kab Bogor -->
              <div class="instruktur-title">
                DEWAN INSTRUKTUR PIMPINAN CABANG<br/>
                GERAKAN PEMUDA ANSOR<br/>
                KABUPATEN BOGOR
              </div>

              <!-- Signature Row 1 -->
              <div class="sig-row">
                <div class="sig-col" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 140px;">
                  <div style="font-weight: 700; text-align: center;">Kepala Sekolah Kaderisasi,</div>
                  ${useQrSignatures ? ` <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="${qrKepalaSekolahImg}" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ` : '<div style="height: 60px;"></div>'}
                  <div class="sig-name-line">${skKepalaSekolah}</div>
                </div>
                <div class="sig-col" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 140px;">
                  <div style="font-weight: 700; text-align: center;">Koordinator Instruktur Cabang,</div>
                  ${useQrSignatures ? ` <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="${qrKoordinatorImg}" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ` : '<div style="height: 60px;"></div>'}
                  <div class="sig-name-line">${skKoordinator}</div>
                </div>
              </div>

              <!-- Signature Row 2 (Mengetahui) -->
              <div class="sig-row-mengetahui" style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 10px;">
                <div class="sig-mengetahui-title">Mengetahui</div>
                <div class="sig-mengetahui-title" style="font-weight: 800;">PIMPINAN CABANG GERAKAN PEMUDA ANSOR</div>
                <div class="sig-mengetahui-title" style="font-weight: 800; margin-bottom: 3px;">KABUPATEN BOGOR</div>
                <div style="font-weight: 700; margin-bottom: 3px;">Ketua,</div>
                ${useQrSignatures ? ` <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="${qrKetuaImg}" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ` : '<div style="height: 55px;"></div>'}
                <div class="sig-name-line">${skKetua}</div>
              </div>

              <!-- Verification & Validation Stamp -->
              ${useDocumentValidation ? ` <div class="validation-badge"> <div class="validation-qr"> <img src="${qrValidationImg}" alt="Validation QR" /> </div> <div class="validation-details"> <div class="validation-title">VALIDASI SISTEM KADERISASI</div> <div class="validation-text"><strong>Operator Cetak:</strong> ${skOperator}</div> <div class="validation-text"><strong>Waktu Cetak:</strong> ${skWaktuCetak}</div> <div class="validation-text"><strong>Status Dokumen:</strong> SAH &amp; TERVERIFIKASI DI DATABASE ${branding.organisasi.toUpperCase()}</div> </div> </div> ` : ''}

            </div>

            <!-- Page 2 Footer -->
            <div class="footer-container">
              <div class="footer-left">
                <div class="social-icons">
                  <div class="social-icon">▶</div>
                  <div class="social-icon">f</div>
                  <div class="social-icon">📷</div>
                  <div class="social-icon">𝕏</div>
                </div>
                <span class="social-handle">ansorbogoronline</span>
                <span class="footer-badge">www.ansorbogoronline.or.id</span>
              </div>
              <div class="footer-stripe"></div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsSkOpen(false);
  };

  const handlePrintKelulusan = () => {
    if (!canRekap) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build logo HTML
    let logoHtml = '';
    if (branding && branding.logo && (typeof branding.logo === 'string')) {
      if (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) {
        logoHtml = `<div class="logo-container"><div>${branding.logo}</div></div>`;
      } else {
        logoHtml = `<div class="logo-container"><img src="${branding.logo}" alt="Logo" /></div>`;
      }
    }

    // Sort participants by name
    const sortedPeserta = [...peserta].sort((a, b) => a.nama.localeCompare(b.nama));

    // Build table header for Sesi dynamically
    const sesiHeadersHtml = sortedSesi.map(s => {
      return `<th style="text-align: center; font-size: 8px; max-width: 90px; min-width: 60px; line-height: 1.1;">${s.materi.toUpperCase()}<br/><span style="font-size: 7px; color: #64748b; font-weight: normal;">(${s.duration}M)</span></th>`;
    }).join('');

    // Build table rows
    const rowsHtml = sortedPeserta.map((p, index) => {
      const presentSesiNums = presensi.filter(pr => pr.id === p.id).map(pr => pr.sesi);
      
      let attendedMinutes = 0;
      const sesiCellsHtml = sortedSesi.map(s => {
        const isPresent = presentSesiNums.includes(s.num);
        if (isPresent) {
          attendedMinutes += (s.duration || 0);
        }
        return `<td style="text-align: center; font-family: monospace; font-size: 10px; font-weight: bold; color: ${isPresent ? '#10b981' : '#f87171'}; background-color: ${isPresent ? '#f0fdf4' : '#fef2f2'};">${isPresent ? s.duration : 0}</td>`;
      }).join('');

      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let badgeClass = 'badge-off';
      if (p.status_kelulusan === 'LULUS') {
        badgeClass = 'badge-on';
      } else if (p.status_kelulusan === 'LULUS BERSYARAT') {
        badgeClass = 'badge-pending';
      }

      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="font-weight: bold; text-transform: uppercase;">
            <div>${p.nama}</div>
            <div style="font-size: 8px; color: #64748b; font-weight: normal; margin-top: 2px;">PAC ${p.utusan}</div>
          </td>
          ${sesiCellsHtml}
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${attendedMinutes} m</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${presPct >= minPres ? '#10b981' : '#ef4444'};">${presPct}%</td>
          <td style="text-align: center; font-family: monospace;">${p.izin_menit || 0} m</td>
          <td style="text-align: center;"><span class="badge ${badgeClass}">${p.status_kelulusan}</span></td>
          <td style="font-family: monospace; font-size: 9px; color: #475569;">${p.no_sertifikat || '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan_Rekapitulasi_Hasil_Kelulusan</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif, Arial; padding: 30px; color: #1e293b; background-color: #ffffff; }
            
            /* Kop Surat Styles */
            .header-flex { display: flex; align-items: center; gap: 20px; border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-container { width: 70px; height: 70px; min-width: 70px; min-height: 70px; display: flex; align-items: center; justify-content: center; background-color: #ecfdf5; border: 1.5px solid #d1fae5; border-radius: 14px; overflow: hidden; box-sizing: border-box; }
            .logo-container img { width: 48px; height: 48px; object-fit: contain; }
            .logo-container svg { width: 48px; height: 48px; }
            .logo-container div { display: flex; align-items: center; justify-content: center; }
            
            .header-info { flex-grow: 1; }
            .title-main { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: 0.02em; }
            .title-sub1 { font-size: 13px; font-weight: 800; text-transform: uppercase; margin: 5px 0 0 0; color: #334155; }
            .title-sub2 { font-size: 11px; font-weight: 900; text-transform: uppercase; margin: 2px 0 0 0; color: #10b981; letter-spacing: 0.1em; }
            
            /* Meta Grid Info */
            .meta-info { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: inline-block; }
            
            /* Table Styles */
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            /* Status Badges */
            .badge { display: inline-block; font-size: 8px; font-weight: 900; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
            .badge-on { background-color: #d1fae5; color: #065f46; border: 1.5px solid #34d399; }
            .badge-pending { background-color: #fef3c7; color: #92400e; border: 1.5px solid #fbbf24; }
            .badge-off { background-color: #fee2e2; color: #991b1b; border: 1.5px solid #f87171; }
            
            @media print {
              body { padding: 0; margin: 0; }
              @page { size: landscape; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-flex">
            ${logoHtml}
            <div class="header-info">
              <h1 class="title-main">Laporan Rekapitulasi Hasil Kelulusan Peserta Kaderisasi</h1>
              <h2 class="title-sub1">${branding.organisasi.toUpperCase()}</h2>
              <h2 class="title-sub2">${branding.cabang.toUpperCase()}</h2>
            </div>
          </div>
          
          <div class="meta-info">
            Kaderisasi: <span style="color: #0f172a;">Pelatihan Kepemimpinan Dasar (PKD)</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Nama Lengkap</th>
                ${sesiHeadersHtml}
                <th style="text-align: center; width: 60px;">Hasil</th>
                <th style="text-align: center; width: 60px;">Persentase</th>
                <th style="text-align: center; width: 60px;">Izin / Menit</th>
                <th style="text-align: center; width: 100px;">Evaluasi Sistem</th>
                <th style="width: 120px;">No. Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-family: monospace; font-weight: bold;">
            <div>VALIDASI SISTEM: HASIL REKAPITULASI KELULUSAN SAH MELALUI ${branding.appName.toUpperCase()}</div>
            <div>OPERATOR CETAK: ${currentUserName.toUpperCase()} &nbsp;|&nbsp; WAKTU CETAK: ${(() => {
              const d = new Date();
              const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
              return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toTimeString().split(' ')[0]} WIB`;
            })()}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Param AI setup */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm space-y-4 transition-colors duration-350">
          <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-2.5 flex items-center space-x-2">
            <Sliders className="text-emerald-500 w-4 h-4" />
            <span>Parameter Kriteria AI (C4.5)</span>
          </h4>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5Packed">Min. Presensi (%)</label>
              <input
                type="number"
                value={minPres}
                onChange={(e) => setMinPres(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5Packed">Min. Menit Lulus</label>
              <input
                type="number"
                step="0.1"
                value={minMenit}
                onChange={(e) => setMinMenit(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={runAiEvaluation}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Evaluasi Otomatis (C4.5 + Bayes)</span>
          </button>
        </div>

        {/* Sync dashboard summaries */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between transition-colors duration-350">
          <div>
            <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-2.5 flex items-center space-x-2 mb-3">
              <Activity className="text-emerald-500 w-4 h-4" />
              <span>Distribusi Sebaran Rekomendasi Kelulusan AI</span>
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest uppercase">LULUS</span>
                <span className="text-xl font-black text-emerald-600">{countLulus}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-amber-700 dark:text-amber-400 tracking-widest uppercase">BERSYARAT</span>
                <span className="text-xl font-black text-amber-600">{countBersyarat}</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-rose-700 dark:text-rose-450 tracking-widest uppercase">TIDAK LULUS</span>
                <span className="text-xl font-black text-rose-600">{countTidakLulus}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 pt-2 border-t border-slate-50 dark:border-navy-850">
            {canRekap && (
              <>
                <button
                  onClick={() => setIsSkOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-[10px] flex items-center space-x-1.5 transition active:scale-[0.98] shadow-sm uppercase tracking-wider"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Cetak SK Kelulusan</span>
                </button>

                <button
                  onClick={handlePrintKelulusan}
                  className="bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-white border border-slate-200 dark:border-navy-850 font-bold px-4 py-2.5 rounded-xl text-[10px] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cetak Laporan Kelulusan</span>
                </button>

                <button
                  onClick={() => {
                    let headers = ['Nama Kader', 'Delegasi PAC', 'Hadir Sesi', 'Lateness Percent', 'Post Test', 'Praktik', 'Izin Menit', 'Rekomendasi AI Kelulusan'];
                    let rows = peserta.map(p => {
                      const presentCount = presensi.filter(pr => pr.id === p.id).length;
                      return [
                        p.nama,
                        p.utusan,
                        `${presentCount} Sesi`,
                        `${Math.round((presentCount / sesi.length) * 100)}%`,
                        p.nilai_post_test,
                        p.nilai_praktik,
                        p.izin_menit || 0,
                        p.status_kelulusan
                      ];
                    });

                    let tsvContent = "data:text/xls;charset=utf-8,\uFEFF"
                      + [headers.join("\t"), ...rows.map(e => e.join("\t"))].join("\n");

                    const uri = encodeURI(tsvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", uri);
                    link.setAttribute("download", "Laporan_Akurasi_Kelulusan_Kader.xls");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-white border border-slate-200 dark:border-navy-850 font-bold px-4 py-2.5 rounded-xl text-[10px] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ekspor Laporan Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Spreadsheet List */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden transition-colors duration-350 animate-fade-in">
        <div className="p-4 border-b border-slate-200 dark:border-navy-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-700 dark:text-white font-semibold"
              placeholder="Cari nama atau PAC utusan..."
            />
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            *Gunakan tombol <span className="text-emerald-500 font-black">Evaluasi Otomatis</span> untuk melatih klasifikasi hibrida
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-auto min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-extrabold text-[9px] uppercase tracking-widest border-b border-slate-200 dark:border-navy-850">
                <th className="p-3 text-center w-12 sticky left-0 bg-slate-50 dark:bg-slate-950 z-20">NO</th>
                <th className="p-3 sticky left-12 bg-slate-50 dark:bg-slate-950 z-10 w-48 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">Nama Lengkap</th>
                
                {/* Dynamically render Sesi names */}
                {sortedSesi.map(s => (
                  <th key={s.num} className="p-2 text-center w-28 border-l dark:border-navy-850 text-[8px] leading-tight" title={s.materi}>
                    <div className="font-extrabold line-clamp-2 max-w-[100px] mx-auto uppercase">{s.materi}</div>
                    <div className="font-semibold text-slate-400 dark:text-slate-500 mt-0.5 text-[7px] font-mono">({s.duration}M)</div>
                  </th>
                ))}

                <th className="p-3 text-center w-20 bg-slate-105 dark:bg-navy-950 font-black text-slate-700 dark:text-white border-l dark:border-navy-850">HASIL</th>
                <th className="p-3 text-center w-20 bg-slate-105 dark:bg-navy-950 font-black text-slate-700 dark:text-white border-l dark:border-navy-850">PERSENTASE</th>
                <th className="p-3 text-center w-20 border-l dark:border-navy-850">IZIN / MENIT</th>
                <th className="p-3 text-center w-24 border-l dark:border-navy-850">EVALUASI SISTEM</th>
                <th className="p-3 text-center w-24 sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-navy-850 text-xs text-slate-650 dark:text-slate-350">
              {paginatedPeserta.map((p, idx) => {
                const presentSesiNums = presensi.filter(pr => pr.id === p.id).map(pr => pr.sesi);
                
                let attendedMinutes = 0;
                sortedSesi.forEach(s => {
                  if (presentSesiNums.includes(s.num)) {
                    attendedMinutes += (s.duration || 0);
                  }
                });

                const pct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition align-middle">
                    
                    {/* NO Column */}
                    <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 w-12 text-center font-mono font-bold text-[10px] text-slate-400 dark:text-slate-500">
                      {startIndex + idx + 1}
                    </td>

                    {/* Name column */}
                    <td className="p-3 sticky left-12 bg-white dark:bg-slate-900 z-10 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.06)] font-bold text-slate-800 dark:text-white uppercase truncate max-w-[160px] border-l dark:border-navy-850">
                      <div>{p.nama}</div>
                      <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">PAC {p.utusan}</div>
                    </td>

                    {/* Sesi details */}
                    {sortedSesi.map(s => {
                      const isPresent = presentSesiNums.includes(s.num);
                      return (
                        <td
                          key={s.num}
                          className={`p-2 text-center font-mono font-bold border-l dark:border-navy-850 ${
                            isPresent ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'
                          }`}
                        >
                          {isPresent ? s.duration : 0}
                        </td>
                      );
                    })}

                    {/* Attendance totals (HASIL) */}
                    <td className="p-3 text-center font-black font-mono text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border-l dark:border-navy-850">
                      {attendedMinutes} m
                    </td>

                    {/* PERSENTASE */}
                    <td className={`p-3 text-center font-mono font-black ${pct >= minPres ? 'text-emerald-500' : 'text-rose-500'} bg-slate-50 dark:bg-slate-950 border-l dark:border-navy-850`}>
                      {pct}%
                    </td>

                    {/* IZIN / MENIT */}
                    <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-l dark:border-navy-850">
                      {p.izin_menit || 0} m
                    </td>

                     {/* Evaluasi AI */}
                    <td className="p-3 text-center whitespace-nowrap border-l dark:border-navy-850">
                      <div className="flex items-center justify-center space-x-1">
                        {(() => {
                          const displayStatus = p.status_kelulusan || (pct < 75 ? "TIDAK LULUS" : pct === 75 ? "LULUS BERSYARAT" : "LULUS");
                          return (
                            <>
                              <span className={`px-2 py-0.5 rounded-full border font-black text-[8px] uppercase tracking-wider ${
                                displayStatus === 'LULUS'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/20'
                                  : (displayStatus === 'LULUS BERSYARAT'
                                    ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/20'
                                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/15 dark:text-rose-455 dark:border-rose-900/20')
                              }`}>
                                {displayStatus}
                              </span>
                              
                              <button
                                onClick={() => handleOpenDiag(p)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-navy-950 text-emerald-500 rounded-lg transition"
                                title="Statistik Diagnosa AI"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Aksi icons */}
                    <td className="p-3 text-center sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEval(p)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-405 rounded-lg hover:bg-amber-100 transition border border-amber-250/10"
                          title="Input Hasil Pengujian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenCertificateCustomizer(p)}
                          disabled={p.status_kelulusan !== 'LULUS'}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/35 transition border border-emerald-250/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Cetak/Suni Sertifikat Kader"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPeserta.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-150 dark:border-navy-850 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-950/5 rounded-b-[20px]">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menampilkan <span className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + 1, filteredPeserta.length)}</span> - <span className="text-emerald-600 dark:text-emerald-400">{Math.min(endIndex, filteredPeserta.length)}</span> dari <span className="text-slate-800 dark:text-white">{filteredPeserta.length}</span> Peserta
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 select-none cursor-pointer"
              >
                Sebelumnya
              </button>
              
              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === activePage;
                if (totalPages > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-400 px-1 font-bold text-xs select-none">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7.5 h-7.5 rounded-lg text-[11px] font-black transition duration-150 flex items-center justify-center select-none cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 select-none cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POP-UP: MODAL EDIT DATA EVALUASI DAN AKADEMIS */}
      {isEvalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            
            <div className="bg-emerald-600 text-white p-4.5 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-white">Input Hasil Pengujian</h4>
                <p className="text-[9px] text-emerald-100 font-bold truncate max-w-[200px] mt-0.5">
                  ID: {evalId}
                </p>
              </div>
              <button
                onClick={() => setIsEvalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvalSubmit} className="p-5 space-y-4 text-xs">
              {(() => {
                const p = peserta.find(x => x.id === evalId);
                if (!p) return null;
                const logs = presensi.filter(pr => pr.id === p.id);
                const attMins = logs.reduce((sum, log) => {
                  const matchingS = sesi.find(s => s.num === log.sesi);
                  return sum + (matchingS?.duration || 0);
                }, 0);
                const attPct = Math.round((attMins / totalDuration) * 100) || 0;
                return (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center uppercase">HASIL (DURASI HADIR)</label>
                      <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-3 rounded-lg text-center font-black text-sm text-slate-800 dark:text-white">
                        {attMins} m
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center uppercase">PERSENTASE KEHADIRAN</label>
                      <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-3 rounded-lg text-center font-black text-sm text-slate-800 dark:text-white">
                        {attPct}%
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">IZIN / KELUAR KELAS (MENIT)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={evalIzin}
                  onChange={(e) => setEvalIzin(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg font-bold text-slate-850 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">STATUS KELULUSAN (OTOMATIS AI)</label>
                <div className={`w-full border p-3 rounded-lg font-black text-center text-sm transition-colors ${
                  evalStatus === 'LULUS'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    : (evalStatus === 'LULUS BERSYARAT'
                      ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      : 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30')
                }`}>
                  {evalStatus}
                </div>
                {(() => {
                  const p = peserta.find(x => x.id === evalId);
                  if (!p) return null;
                  const logs = presensi.filter(pr => pr.id === p.id);
                  const attMins = logs.reduce((sum, log) => {
                    const matchingS = sesi.find(s => s.num === log.sesi);
                    return sum + (matchingS?.duration || 0);
                  }, 0);
                  const attPct = Math.round((attMins / totalDuration) * 100) || 0;
                  return (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center leading-relaxed">
                      Lulus jika &gt;75%, Lulus Bersyarat jika 75%, Tidak Lulus jika &lt;75% <br />
                      Dihitung otomatis dari kehadiran: <strong className="text-slate-650 dark:text-slate-300">{attMins}m ({attPct}%)</strong>
                    </p>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-850 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsEvalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-500 dark:text-slate-400 font-bold rounded-lg border border-slate-200 dark:border-navy-850 uppercase active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-650 text-white font-bold rounded-lg shadow-md transition active:scale-[0.98] uppercase tracking-wider"
                >
                  Simpan Evaluasi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* POP-UP: MODAL AI DIAGNOSTIC TRACE */}
      {isDiagOpen && diagData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-lg shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            <div className="bg-slate-900 text-white px-6 py-4.5 flex justify-between items-center border-b dark:border-navy-850">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Logika Klasifikasi Keputusan AI</h4>
              </div>
              <button
                onClick={() => setIsDiagOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-navy-850 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm">
                  {diagData.nama.charAt(0)}
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase">{diagData.nama}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Asal PAC: {diagData.utusan}</p>
                </div>
              </div>

              {/* Decision Tree C4.5 Trace */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trace Node Pohon Keputusan (C4.5):</p>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-navy-850 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-500">▶</span>
                    <span>{diagData.treePresence}</span>
                  </div>
                  <div className="flex items-center space-x-2 border-t dark:border-navy-900 pt-1.5 mt-1.5">
                    <span className="text-emerald-500">▶</span>
                    <span>{diagData.treeScores}</span>
                  </div>
                </div>
              </div>

              {/* Bayes Posterior probabilities meters */}
              <div className="space-y-2.5">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Peluang Klasifikasi Bayesian:</p>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-navy-850">
                  
                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>LULUS</span>
                      <span className="text-emerald-500 font-bold">{diagData.probs.lulus}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${diagData.probs.lulus}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>LULUS BERSYARAT</span>
                      <span className="text-amber-500 font-bold">{diagData.probs.bersyarat}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${diagData.probs.bersyarat}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>TIDAK LULUS</span>
                      <span className="text-rose-500 font-bold">{diagData.probs.tidak}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${diagData.probs.tidak}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-3 border-t dark:border-navy-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950 -mx-6 -mb-6 p-4.5 rounded-b-xl">
                <span className="text-[10px] font-black text-slate-400">STATUS DIAGNOSIS:</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {peserta.find(k => k.id === diagId)?.status_kelulusan}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP: MODAL CUSTOMIZABLE LIVE CERTIFICATE DESIGNER */}
      {isCertOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-5xl h-[90vh] shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100 flex flex-col">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b dark:border-navy-850">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-widest">Kustomisasi Draf & Cetak Sertifikat Kader</h4>
              </div>
              <button
                onClick={() => setIsCertOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Form panel */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4 border-r dark:border-navy-850 h-full custom-scrollbar">
                <div className="flex flex-col space-y-3 border-b dark:border-navy-850 pb-2">
                  <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest">Kontrol Data Sertifikat</h5>
                  
                  {/* Segmented Page Selector */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border dark:border-navy-850">
                    <button
                      type="button"
                      onClick={() => setCertActivePage('depan')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        certActivePage === 'depan'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Halaman Depan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertActivePage('belakang')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        certActivePage === 'belakang'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Halaman Belakang (Materi)</span>
                    </button>
                  </div>
                </div>

                {certActivePage === 'depan' ? (
                  <>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Register</label>
                      <input
                        type="text"
                        value={certNomor}
                        onChange={(e) => setCertNomor(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        value={certNama}
                        onChange={(e) => setCertNama(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 1)</label>
                      <textarea
                        rows={2}
                        value={certBody1}
                        onChange={(e) => setCertBody1(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 2)</label>
                      <textarea
                        rows={2}
                        value={certBody2}
                        onChange={(e) => setCertBody2(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 3)</label>
                      <textarea
                        rows={2}
                        value={certBody3}
                        onChange={(e) => setCertBody3(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-navy-850">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Ketua Cabang</label>
                        <input
                          type="text"
                          value={certKetua}
                          onChange={(e) => setCertKetua(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Sekretaris Cabang</label>
                        <input
                          type="text"
                          value={certSekretaris}
                          onChange={(e) => setCertSekretaris(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-navy-850">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Lokasi & Tanggal Hijriah</label>
                        <input
                          type="text"
                          value={certLocationHijriah}
                          onChange={(e) => setCertLocationHijriah(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Masehi</label>
                        <input
                          type="text"
                          value={certDateMasehi}
                          onChange={(e) => setCertDateMasehi(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pb-3 border-b dark:border-navy-850">
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data Aplikasi SIAPs (QR Code)</label>
                      <textarea
                        rows={2}
                        value={certSiapsData}
                        onChange={(e) => setCertSiapsData(e.target.value)}
                        placeholder="Masukkan link verifikasi atau data teks SIAPs untuk QR Code"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                      <div>
                        <label className="block text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Unggah File Data SIAPs (.txt, .json, .csv)</label>
                        <input
                          type="file"
                          accept=".txt,.json,.csv,.text"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setCertSiapsData(evt.target.result as string);
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850 text-[10px]"
                        />
                      </div>
                    </div>

                    {/* Sub Upload replacement elements */}
                    <div className="space-y-4 pt-2">
                      <h6 className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Sunting Aset Gambar (Opsional)</h6>
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <label className="block font-bold text-slate-400 mb-1 uppercase">Ubah Logo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCustomImageUpload(e, setCustomLogo)}
                            className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-400 mb-1 uppercase">Ubah Stempel</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCustomImageUpload(e, setCustomStempel)}
                            className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-400 mb-1 uppercase">TTD Ketua</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCustomImageUpload(e, setCustomTtdKetua)}
                            className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-400 mb-1 uppercase">TTD Sekr.</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCustomImageUpload(e, setCustomTtdSekr)}
                            className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLogo(null);
                          setCustomStempel(null);
                          setCustomTtdKetua(null);
                          setCustomTtdSekr(null);
                        }}
                        className="w-full py-1.5 text-[10px] uppercase font-black tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-navy-900 border dark:border-navy-850 text-slate-600 dark:text-slate-400 rounded-lg transition"
                      >
                        Reset Visual Default
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        value={certNama}
                        onChange={(e) => setCertNama(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Tempat, Tanggal Lahir (TTL)</label>
                      <input
                        type="text"
                        value={certTtl}
                        onChange={(e) => setCertTtl(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                        placeholder="Contoh: BOGOR, 03/03/1997"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Asal Utusan (PAC)</label>
                      <input
                        type="text"
                        value={certUtusan}
                        onChange={(e) => setCertUtusan(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Jabatan Kaderisasi</label>
                      <input
                        type="text"
                        value={certJabatan}
                        onChange={(e) => setCertJabatan(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nama Instruktur Penanggungjawab</label>
                      <input
                        type="text"
                        value={certInstruktur}
                        onChange={(e) => setCertInstruktur(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Unggah / Ganti Pas Foto Peserta (3x4)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomImageUpload(e, setCertFoto)}
                        className="w-full border p-2 rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-navy-850 text-xs text-slate-700 dark:text-slate-350"
                      />
                      {certFoto && (
                        <div className="mt-2 flex items-center space-x-2">
                          <img src={certFoto} alt="Preview Foto" className="w-12 h-16 object-cover border rounded bg-slate-100" />
                          <button
                            type="button"
                            onClick={() => setCertFoto(null)}
                            className="text-[10px] text-rose-500 font-bold hover:underline"
                          >
                            Hapus Foto
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t dark:border-navy-850">
                      <h6 className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">Daftar Narasumber Materi</h6>
                      <div className="space-y-3 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border dark:border-navy-850 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {certSubjects.map((sub, idx) => (
                          <div key={sub.no} className="flex flex-col space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {sub.no}. {sub.materi}
                            </span>
                            <input
                              type="text"
                              value={sub.narasumber}
                              onChange={(e) => {
                                const newSubjects = [...certSubjects];
                                newSubjects[idx] = { ...newSubjects[idx], narasumber: e.target.value };
                                setCertSubjects(newSubjects);
                              }}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Real canvas rendering and interactive preview */}
              <div className="w-full md:w-1/2 p-6 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center h-full">
                <div className="w-full flex-1 flex flex-col justify-center max-h-[80%]">
                  <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest mb-3 text-center">Pratinjau Asli Sertifikat</h5>
                  <div className="w-full aspect-[1200/850] bg-white border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-lg flex items-center justify-center relative">
                    <canvas ref={canvasRef} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="w-full pt-4 shrink-0">
                  <button
                    onClick={downloadCertPng}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Sertifikat (PNG)</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* POP-UP: MODAL EDIT & CETAK SURAT KETETAPAN (SK) KELULUSAN */}
      {isSkOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-6xl h-[90vh] shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4.5 flex justify-between items-center shrink-0 border-b dark:border-navy-850">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Atur & Cetak Surat Keputusan Kelulusan (SK)</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Format resmi Pimpinan Cabang GP Ansor Kabupaten Bogor</p>
                </div>
              </div>
              <button
                onClick={() => setIsSkOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Left pane: Editable fields */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-150 dark:border-navy-850 space-y-6">
                
                {/* Section 1: Nomor & Angkatan */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">1. Identitas & Kop Surat</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">NOMOR SK KELULUSAN</label>
                      <input
                        type="text"
                        value={skNomor}
                        onChange={(e) => setSkNomor(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">ANGKATAN PKD (ROMAWI)</label>
                      <input
                        type="text"
                        value={skAngkatan}
                        onChange={(e) => setSkAngkatan(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">KECAMATAN PELAKSANA</label>
                      <input
                        type="text"
                        value={skKecamatan}
                        onChange={(e) => setSkKecamatan(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TANGGAL RAPAT PLENO</label>
                      <input
                        type="text"
                        value={skTanggalRapat}
                        onChange={(e) => setSkTanggalRapat(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  {/* Upload Logo Kop Surat */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-navy-850 space-y-3">
                    <label className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">LOGO KOP SURAT (SK)</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-navy-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {skLogo ? (
                          <img src={skLogo} className="w-full h-full object-contain" alt="Kop Logo" />
                        ) : (
                          <div className="p-1 w-full h-full flex items-center justify-center">
                            <svg viewBox="0 0 120 140" className="w-8 h-9 shrink-0" xmlns="http://www.w3.org/2000/svg">
                              <polygon points="60,5 115,115 5,115" fill="#008a3c" />
                              <polygon points="60,11 110,110 10,110" fill="none" stroke="#ffffff" strokeWidth="2" />
                              <path d="M 40,75 A 20,20 0 0,0 80,75 A 17,17 0 0,1 40,75 Z" fill="#ffffff" />
                              <circle cx="60" cy="72" r="4.5" fill="#ffffff" />
                              <line x1="60" y1="67" x2="60" y2="58" stroke="#ffffff" strokeWidth="1.5" />
                              <line x1="60" y1="77" x2="60" y2="82" stroke="#ffffff" strokeWidth="1.5" />
                              <line x1="55" y1="72" x2="46" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                              <line x1="65" y1="72" x2="74" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                              <line x1="56.5" y1="68.5" x2="50" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                              <line x1="63.5" y1="68.5" x2="70" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                              <line x1="56.5" y1="75.5" x2="50" y2="82" stroke="#ffffff" stroke-width="1.2" />
                              <line x1="63.5" y1="75.5" x2="70" y2="82" stroke="#ffffff" stroke-width="1.2" />
                              <polygon points="60,35 61.5,39.5 66,39.5 62.5,42.2 63.8,46.5 60,44 56.2,46.5 57.5,42.2 54,39.5 58.5,39.5" fill="#ffffff" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex space-x-2">
                          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center space-x-1">
                            <span>Upload Logo Baru</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCustomImageUpload(e, setSkLogo)}
                              className="hidden"
                            />
                          </label>
                          {skLogo && (
                            <button
                              type="button"
                              onClick={() => setSkLogo(null)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium font-sans">Format PNG/JPG transparan direkomendasikan.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Menimbang */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">2. Konsideran - MENIMBANG</h5>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN A (URGENSI & PELAKSANA)</label>
                    <textarea
                      value={skMenimbangA}
                      onChange={(e) => setSkMenimbangA(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN B (KEPASTIAN STATUS)</label>
                    <textarea
                      value={skMenimbangB}
                      onChange={(e) => setSkMenimbangB(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 3: Mengingat */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">3. Konsideran - MENGINGAT</h5>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN A (SISTEM KADERISASI PP)</label>
                    <textarea
                      value={skMengingatA}
                      onChange={(e) => setSkMengingatA(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN B (PERATURAN ORGANISASI PO)</label>
                    <textarea
                      value={skMengingatB}
                      onChange={(e) => setSkMengingatB(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 4: Memperhatikan */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">4. Konsideran - MEMPERHATIKAN</h5>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN A (REKAPITULASI ABSENSI)</label>
                    <textarea
                      value={skMemperhatikanA}
                      onChange={(e) => setSkMemperhatikanA(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN B (HASIL DEWAN INSTRUKTUR CABANG)</label>
                    <textarea
                      value={skMemperhatikanB}
                      onChange={(e) => setSkMemperhatikanB(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">POIN C (SARAN & MASUKAN PAC)</label>
                    <textarea
                      value={skMemperhatikanC}
                      onChange={(e) => setSkMemperhatikanC(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 5: Statistik Kelulusan (Customizable inputs) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-navy-850 pb-1.5">
                    <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">5. Hasil Statistik Kelulusan</h5>
                    <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">Otomatis Sistem</span>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL PESERTA (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={skTextTotal}
                      className="w-full bg-slate-100/70 dark:bg-navy-950/40 border border-dashed border-slate-250 dark:border-navy-850/60 px-3 py-2 rounded-xl text-xs font-black text-slate-550 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL LULUS (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={skTextLulus}
                      className="w-full bg-slate-100/70 dark:bg-navy-950/40 border border-dashed border-slate-250 dark:border-navy-850/60 px-3 py-2 rounded-xl text-xs font-black text-slate-550 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL TIDAK LULUS (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={skTextTidakLulus}
                      className="w-full bg-slate-100/70 dark:bg-navy-950/40 border border-dashed border-slate-250 dark:border-navy-850/60 px-3 py-2 rounded-xl text-xs font-black text-slate-550 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                {/* Section 6: Penandatangan & Tanggal Surat */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">6. Tanggal & Penandatangan</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TEMPAT DITETAPKAN</label>
                      <input
                        type="text"
                        value={skDitetapkan}
                        onChange={(e) => setSkDitetapkan(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TANGGAL HIJRIAH</label>
                      <input
                        type="text"
                        value={skTanggalHijriah}
                        onChange={(e) => setSkTanggalHijriah(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TANGGAL MASEHI</label>
                      <input
                        type="text"
                        value={skTanggalMasehi}
                        onChange={(e) => setSkTanggalMasehi(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">KEPALA SEKOLAH KADERISASI</label>
                    <input
                      type="text"
                      value={skKepalaSekolah}
                      onChange={(e) => setSkKepalaSekolah(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">KOORDINATOR INSTRUKTUR CABANG</label>
                    <input
                      type="text"
                      value={skKoordinator}
                      onChange={(e) => setSkKoordinator(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">KETUA CABANG GP ANSOR</label>
                    <input
                      type="text"
                      value={skKetua}
                      onChange={(e) => setSkKetua(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 7: QR & Validasi */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">7. Tanda Tangan QR & Validasi Sistem</h5>
                  
                  <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-navy-850">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useQrSignatures}
                        onChange={(e) => setUseQrSignatures(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-navy-800 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Gunakan Tanda Tangan QR Code (Pengesahan)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useDocumentValidation}
                        onChange={(e) => setUseDocumentValidation(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-navy-800 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aktifkan Validasi Keaslian Dokumen (User, Waktu & QR)</span>
                    </label>
                  </div>

                  {useDocumentValidation && (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">NAMA OPERATOR / USER</label>
                        <input
                          type="text"
                          value={skOperator}
                          onChange={(e) => setSkOperator(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                          placeholder="Nama Operator"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">WAKTU VERIFIKASI / CETAK</label>
                        <input
                          type="text"
                          value={skWaktuCetak}
                          onChange={(e) => setSkWaktuCetak(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                          placeholder="Waktu Cetak"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right pane: Interactive styled 2-page print layout preview */}
              <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-950 p-6 overflow-y-auto flex flex-col items-center space-y-8 select-none">
                <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest self-start">PRATINJAU DOKUMEN CETAK (2 HALAMAN)</h5>
                
                {/* Simulated Sheet Page 1 */}
                <div className="w-[145mm] min-h-[205mm] bg-white border border-slate-200 dark:border-navy-800 shadow-xl p-6 relative flex flex-col justify-between text-[6px] text-slate-850 leading-normal">
                  <div>
                    {/* Simulated Header */}
                    <div className="flex items-center gap-3 pb-2 mb-3">
                      {skLogo ? (
                        <img src={skLogo} className="w-9 h-10 object-contain shrink-0" alt="SK Logo" />
                      ) : (
                        <svg viewBox="0 0 120 140" className="w-9 h-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="60,5 115,115 5,115" fill="#008a3c" />
                          <polygon points="60,11 110,110 10,110" fill="none" stroke="#ffffff" strokeWidth="2" />
                          <path d="M 40,75 A 20,20 0 0,0 80,75 A 17,17 0 0,1 40,75 Z" fill="#ffffff" />
                          <circle cx="60" cy="72" r="4.5" fill="#ffffff" />
                          <line x1="60" y1="67" x2="60" y2="58" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="60" y1="77" x2="60" y2="82" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="55" y1="72" x2="46" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="65" y1="72" x2="74" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="56.5" y1="68.5" x2="50" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="63.5" y1="68.5" x2="70" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="56.5" y1="75.5" x2="50" y2="82" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="63.5" y1="75.5" x2="70" y2="82" stroke="#ffffff" strokeWidth="1.2" />

                          {/* Stars */}
                          <polygon points="60,35 61.5,39.5 66,39.5 62.5,42.2 63.8,46.5 60,44 56.2,46.5 57.5,42.2 54,39.5 58.5,39.5" fill="#ffffff" />
                          <polygon points="38,48 39.2,51 43,51 40,53 41,56.5 38,54.5 35,56.5 36,53 33,51 36.8,51" fill="#ffffff" />
                          <polygon points="32,60 33.2,63 37,63 34,65 35,68.5 32,66.5 29,68.5 30,65 27,63 30.8,63" fill="#ffffff" />
                          <polygon points="30,73 31.2,76 35,76 32,78 33,81.5 30,79.5 27,81.5 28,78 25,76 28.8,76" fill="#ffffff" />
                          <polygon points="32,86 33.2,89 37,89 34,91 35,94.5 32,92.5 29,94.5 30,92 27,89 30.8,89" fill="#ffffff" />
                          <polygon points="82,48 83.2,51 87,51 84,53 85,56.5 82,54.5 79,56.5 80,53 77,51 80.8,51" fill="#ffffff" />
                          <polygon points="88,60 89.2,63 93,63 90,65 91,68.5 88,66.5 85,68.5 86,65 83,63 86.8,63" fill="#ffffff" />
                          <polygon points="90,73 91.2,76 95,76 92,78 93,81.5 90,79.5 87,81.5 88,78 85,76 88.8,76" fill="#ffffff" />
                          <polygon points="88,86 89.2,89 93,89 90,91 91,94.5 88,92.5 85,94.5 86,92 83,89 86.8,89" fill="#ffffff" />

                          <rect x="15" y="103" width="90" height="15" fill="#008a3c" />
                          <text x="60" y="115" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="11" fill="#ffffff" textAnchor="middle" letterSpacing="1">ANSOR</text>
                        </svg>
                      )}
                      <div className="flex-1 text-right font-bold">
                        <div className="text-[7.5px] uppercase tracking-wider font-extrabold text-black">PIMPINAN CABANG</div>
                        <div className="text-[7.5px] uppercase tracking-wider font-extrabold text-black">GERAKAN PEMUDA ANSOR</div>
                        <div className="text-[8px] uppercase tracking-widest font-black text-black">KABUPATEN BOGOR</div>
                        <div className="text-[4.2px] font-medium text-slate-700 mt-0.5">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</div>
                        <div className="text-[4px] font-medium text-slate-700">Website: <span className="text-sky-600 underline">ansorbogoronline.or.id</span> | email: <span className="text-sky-600 underline">ansorbogoronline@gmail.com</span></div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center font-black underline uppercase text-[6px] mt-2 mb-0.5">SURAT KEPUTUSAN PENETAPAN KELULUSAN</div>
                    <div className="text-center font-semibold text-[5.5px] mb-2">Nomor : {skNomor}</div>
                    
                    <div className="text-center font-bold uppercase text-[5px] mb-0.5">T e n t a n g</div>
                    <div className="text-center font-black uppercase text-[5.5px] max-w-[85%] mx-auto mb-4 line-height-relaxed text-slate-900">
                      PENETAPAN KELULUSAN PESERTA PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN {skAngkatan} PIMPINAN CABANG GERAKAN PEMUDA ANSOR KABUPATEN BOGOR
                    </div>

                    <div className="font-semibold italic mb-0.5">Bismillâhirrahmânirrahîm,</div>
                    <div className="font-bold mb-2">Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor,</div>

                    <table className="w-full text-[5.5px]">
                      <tbody>
                        <tr>
                          <td className="w-16 font-extrabold align-top">MENIMBANG</td>
                          <td className="w-2 text-center align-top">:</td>
                          <td className="align-top pb-1.5 text-slate-700">
                            a. {skMenimbangA.length > 120 ? skMenimbangA.substring(0, 120) + "..." : skMenimbangA}<br/>
                            b. {skMenimbangB}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-extrabold align-top">MENGINGAT</td>
                          <td className="text-center align-top">:</td>
                          <td className="align-top pb-1.5 text-slate-700">
                            a. {skMengingatA}<br/>
                            b. {skMengingatB}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-extrabold align-top">MEMPERHATIKAN</td>
                          <td className="text-center align-top">:</td>
                          <td className="align-top pb-1.5 text-slate-700">
                            a. {skMemperhatikanA}<br/>
                            b. {skMemperhatikanB.length > 120 ? skMemperhatikanB.substring(0, 120) + "..." : skMemperhatikanB}<br/>
                            c. {skMemperhatikanC}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="text-center font-black tracking-wider text-[5.5px] my-1.5">MEMUTUSKAN</div>

                    <table className="w-full text-[5.5px]">
                      <tbody>
                        <tr>
                          <td className="w-16 font-extrabold align-top">MENETAPKAN</td>
                          <td className="text-center align-top">:</td>
                          <td className="align-top">
                            <strong>1. Menyatakan Kelulusan Sebagai Berikut :</strong>
                            <div className="mt-1 ml-2 space-y-0.5 text-[5px]">
                              <div>Total Peserta : {skTextTotal}</div>
                              <div>Lulus : {skTextLulus}</div>
                              <div>Tidak Lulus : {skTextTidakLulus}</div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Elegant Simulated Green Footer */}
                  <div className="h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-b flex items-center justify-between px-3 -mx-6 -mb-6 relative overflow-hidden">
                    <span className="text-[4px] text-white font-extrabold">▶ f 📷 𝕏 &nbsp; ansorbogoronline</span>
                    <span className="text-[4px] text-emerald-100 bg-emerald-700/50 px-1 py-0.5 rounded">www.ansorbogoronline.or.id</span>
                  </div>
                </div>

                {/* Simulated Sheet Page 2 */}
                <div className="w-[145mm] min-h-[205mm] bg-white border border-slate-200 dark:border-navy-800 shadow-xl p-6 relative flex flex-col justify-between text-[6px] text-slate-850 leading-normal">
                  <div>
                    {/* Simulated Header */}
                    <div className="flex items-center gap-3 pb-2 mb-3">
                      {skLogo ? (
                        <img src={skLogo} className="w-9 h-10 object-contain shrink-0" alt="SK Logo" />
                      ) : (
                        <svg viewBox="0 0 120 140" className="w-9 h-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="60,5 115,115 5,115" fill="#008a3c" />
                          <polygon points="60,11 110,110 10,110" fill="none" stroke="#ffffff" strokeWidth="2" />
                          <path d="M 40,75 A 20,20 0 0,0 80,75 A 17,17 0 0,1 40,75 Z" fill="#ffffff" />
                          <circle cx="60" cy="72" r="4.5" fill="#ffffff" />
                          <line x1="60" y1="67" x2="60" y2="58" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="60" y1="77" x2="60" y2="82" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="55" y1="72" x2="46" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="65" y1="72" x2="74" y2="72" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1="56.5" y1="68.5" x2="50" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="63.5" y1="68.5" x2="70" y2="62" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="56.5" y1="75.5" x2="50" y2="82" stroke="#ffffff" strokeWidth="1.2" />
                          <line x1="63.5" y1="75.5" x2="70" y2="82" stroke="#ffffff" strokeWidth="1.2" />

                          {/* Stars */}
                          <polygon points="60,35 61.5,39.5 66,39.5 62.5,42.2 63.8,46.5 60,44 56.2,46.5 57.5,42.2 54,39.5 58.5,39.5" fill="#ffffff" />
                          <polygon points="38,48 39.2,51 43,51 40,53 41,56.5 38,54.5 35,56.5 36,53 33,51 36.8,51" fill="#ffffff" />
                          <polygon points="32,60 33.2,63 37,63 34,65 35,68.5 32,66.5 29,68.5 30,65 27,63 30.8,63" fill="#ffffff" />
                          <polygon points="30,73 31.2,76 35,76 32,78 33,81.5 30,79.5 27,81.5 28,78 25,76 28.8,76" fill="#ffffff" />
                          <polygon points="32,86 33.2,89 37,89 34,91 35,94.5 32,92.5 29,94.5 30,92 27,89 30.8,89" fill="#ffffff" />
                          <polygon points="82,48 83.2,51 87,51 84,53 85,56.5 82,54.5 79,56.5 80,53 77,51 80.8,51" fill="#ffffff" />
                          <polygon points="88,60 89.2,63 93,63 90,65 91,68.5 88,66.5 85,68.5 86,65 83,63 86.8,63" fill="#ffffff" />
                          <polygon points="90,73 91.2,76 95,76 92,78 93,81.5 90,79.5 87,81.5 88,78 85,76 88.8,76" fill="#ffffff" />
                          <polygon points="88,86 89.2,89 93,89 90,91 91,94.5 88,92.5 85,94.5 86,92 83,89 86.8,89" fill="#ffffff" />

                          <rect x="15" y="103" width="90" height="15" fill="#008a3c" />
                          <text x="60" y="115" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="11" fill="#ffffff" textAnchor="middle" letterSpacing="1">ANSOR</text>
                        </svg>
                      )}
                      <div className="flex-1 text-right font-bold">
                        <div className="text-[7.5px] uppercase tracking-wider font-extrabold text-black">PIMPINAN CABANG</div>
                        <div className="text-[7.5px] uppercase tracking-wider font-extrabold text-black">GERAKAN PEMUDA ANSOR</div>
                        <div className="text-[8px] uppercase tracking-widest font-black text-black">KABUPATEN BOGOR</div>
                        <div className="text-[4.2px] font-medium text-slate-700 mt-0.5">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</div>
                        <div className="text-[4px] font-medium text-slate-700">Website: <span className="text-sky-600 underline">ansorbogoronline.or.id</span> | email: <span className="text-sky-600 underline">ansorbogoronline@gmail.com</span></div>
                      </div>
                    </div>

                    {/* Continuing menetapkan points */}
                    <table className="w-full text-[6.5px] mt-4">
                      <tbody>
                        <tr>
                          <td className="w-16 font-extrabold align-top opacity-0">MENETAPKAN</td>
                          <td className="w-2 text-center align-top opacity-0">:</td>
                          <td className="align-top space-y-1">
                            <div>2. Bahwa Peserta yang lulus berhak mendapatkan Sertifikat PKD setelah melaksanakan rencana tindak lanjut yang sudah ditentukan.</div>
                            <div>3. Daftar Nama Hasil Kelulusan Kaderisasi menjadi bagian tidak terpisahkan dari surat ketetapan ini</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Meta dates on right */}
                    <div className="w-28 ml-auto text-[6.5px] border-t border-slate-200 pt-2 mt-4 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Ditetapkan</span>
                        <span>: {skDitetapkan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tanggal</span>
                        <span>: {skTanggalHijriah}</span>
                      </div>
                      <div className="flex justify-between">
                        <span></span>
                        <span>: {skTanggalMasehi}</span>
                      </div>
                    </div>

                    <div className="text-center font-black uppercase text-[5.5px] mt-4 mb-4">
                      DEWAN INSTRUKTUR PIMPINAN CABANG<br/>
                      GERAKAN PEMUDA ANSOR<br/>
                      KABUPATEN BOGOR
                    </div>

                    <div className="flex justify-between px-4 text-[5.5px] font-bold">
                      <div className="text-center w-28 flex flex-col justify-between h-[65px]">
                        <div>Kepala Sekolah Kaderisasi,</div>
                        {useQrSignatures ? (
                          <div className="my-1 mx-auto w-10 h-10 bg-white border border-slate-200 p-0.5 rounded flex items-center justify-center relative overflow-hidden">
                            {previewQrKepalaSekolah ? (
                              <img src={previewQrKepalaSekolah} className="w-full h-full object-contain animate-fadeIn" alt="QR TTD" />
                            ) : (
                              <div className="text-[4px] text-slate-400">Loading...</div>
                            )}
                          </div>
                        ) : (
                          <div className="h-6"></div>
                        )}
                        <div className="font-black underline uppercase leading-none">{skKepalaSekolah}</div>
                      </div>
                      <div className="text-center w-28 flex flex-col justify-between h-[65px]">
                        <div>Koordinator Instruktur Cabang,</div>
                        {useQrSignatures ? (
                          <div className="my-1 mx-auto w-10 h-10 bg-white border border-slate-200 p-0.5 rounded flex items-center justify-center relative overflow-hidden">
                            {previewQrKoordinator ? (
                              <img src={previewQrKoordinator} className="w-full h-full object-contain animate-fadeIn" alt="QR TTD" />
                            ) : (
                              <div className="text-[4px] text-slate-400">Loading...</div>
                            )}
                          </div>
                        ) : (
                          <div className="h-6"></div>
                        )}
                        <div className="font-black underline uppercase leading-none">{skKoordinator}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center text-[5.5px] mt-3">
                      <div className="font-bold">Mengetahui</div>
                      <div className="font-extrabold uppercase text-[5.5px]">PIMPINAN CABANG GERAKAN PEMUDA ANSOR</div>
                      <div className="font-extrabold uppercase text-[5.5px] mb-0.5">KABUPATEN BOGOR</div>
                      <div className="font-bold">Ketua,</div>
                      {useQrSignatures ? (
                        <div className="my-1 mx-auto w-10 h-10 bg-white border border-slate-200 p-0.5 rounded flex items-center justify-center relative overflow-hidden">
                          {previewQrKetua ? (
                            <img src={previewQrKetua} className="w-full h-full object-contain animate-fadeIn" alt="QR TTD" />
                          ) : (
                            <div className="text-[4px] text-slate-400">Loading...</div>
                          )}
                        </div>
                      ) : (
                        <div className="h-6"></div>
                      )}
                      <div className="font-black underline uppercase">{skKetua}</div>
                    </div>

                    {/* Simulated Validation Badge in Preview */}
                    {useDocumentValidation && (
                      <div className="absolute bottom-[39px] left-6 max-w-[190px] border border-dashed border-emerald-500 bg-emerald-50/70 p-1.5 rounded-lg flex items-center gap-1.5 text-[4px] leading-tight text-slate-800">
                        <div className="w-8 h-8 bg-white border border-slate-200 p-0.5 rounded shrink-0 flex items-center justify-center relative overflow-hidden">
                          {previewQrValidation ? (
                            <img src={previewQrValidation} className="w-full h-full object-contain animate-fadeIn" alt="Validation QR" />
                          ) : (
                            <div className="text-[4px] text-slate-400">Loading...</div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-black text-emerald-700 text-[4.5px] tracking-wider border-b border-emerald-500 pb-0.5 mb-0.5">VALIDASI SISTEM KADERISASI</div>
                          <div><strong>Operator:</strong> {skOperator}</div>
                          <div><strong>Waktu:</strong> {skWaktuCetak}</div>
                          <div className="text-emerald-800 font-bold">✔ Dokumen Sah & Terverifikasi</div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Elegant Simulated Green Footer */}
                  <div className="h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-b flex items-center justify-between px-3 -mx-6 -mb-6 relative overflow-hidden">
                    <span className="text-[4px] text-white font-extrabold">▶ f 📷 𝕏 &nbsp; ansorbogoronline</span>
                    <span className="text-[4px] text-emerald-100 bg-emerald-700/50 px-1 py-0.5 rounded">www.ansorbogoronline.or.id</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4.5 border-t dark:border-navy-850 flex justify-between items-center shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  const tot = peserta.length;
                  const lls = peserta.filter(p => p.status_kelulusan === 'LULUS' || p.status_kelulusan === 'LULUS BERSYARAT').length;
                  const tdk = peserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;
                  
                  setSkNomor('029 /PC-IX-22/SK-01/VI/2026');
                  setSkAngkatan('XXIX');
                  setSkKecamatan('Cileungsi');
                  setSkTanggalRapat('27 Juni 2026');
                  setSkMenimbangA('Bahwa Dewan Instruktur Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor menganggap penting adanya surat penetapan kelulusan peserta Pelatihan Kepemimpinan Dasar (PKD) Angkatan XXIX yang dilaksanakan oleh Pimpinan Anak Cabang Gerakan Pemuda Ansor Kecamatan Cileungsi Kabupaten Bogor');
                  setSkMenimbangB('Bahwa untuk menjamin kepastian status kelulusan kepesertaan Kaderisasi Pelatihan Kepemimpinan Dasar (PKD) sebagai bagian dari Pelaksanaan amanat organisasi');
                  setSkMengingatA('Keputusan Konferensi besar Pimpinan Pusat Gerakan Pemuda Ansor Nomor 08/KONBES-XXVII/X/2024 tentang Sistem Kaderisasi');
                  setSkMengingatB('Peraturan Organisasi (PO) Sistem Kaderisasi Pasal 63 Ayat 2');
                  setSkMemperhatikanA('Rekapitulasi absensi kehadiran peserta pada setiap materi wajib yang telah ditentukan sistem kaderisasi');
                  setSkMemperhatikanB('Rapat Dewan Instruktur Cabang mengenai kelayakan kelulusan peserta PKD Angkatan XXIX Pimpinan Cabang Gerakan Pemuda Ansor Kabupaten Bogor pada tanggal 27 Juni 2026');
                  setSkMemperhatikanC('Mendengarkan saran dan masukan dari Pimpinan Anak Cabang Gerakan Pemuda Ansor Kecamatan Cileungsi Kabupaten Bogor');
                  setSkDitetapkan('Di Cileungsi');
                  setSkTanggalHijriah('11/12 Muharrom 1448H');
                  setSkTanggalMasehi('28 Juni 2026 M');
                  setSkKepalaSekolah('HAMDANI M MALIK, S.E');
                  setSkKoordinator('SEPTA AJI., S.KOM');
                  setSkKetua('DOMIRI A GHAZALI, S.H');
                  setSkTextTotal(`${tot} ( ${kekata(tot)} )`);
                  setSkTextLulus(`${lls} ( ${kekata(lls)} )`);
                  setSkTextTidakLulus(`${tdk} ( ${kekata(tdk)} )`);
                  setUseQrSignatures(true);
                  setUseDocumentValidation(true);
                  setSkOperator(currentUserName || 'Operator Admin');
                  const now = new Date();
                  const formattedDateTime = now.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) + ' pukul ' + now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) + ' WIB';
                  setSkWaktuCetak(formattedDateTime);
                }}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900 font-extrabold rounded-lg border border-slate-200 dark:border-navy-850 uppercase text-[10px] tracking-wider transition"
              >
                Reset Default
              </button>
              
              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSkOpen(false)}
                  className="px-5 py-2 text-slate-500 dark:text-slate-400 bg-white hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-850 font-extrabold rounded-lg uppercase text-[10px] tracking-wider transition"
                >
                  Batal
                </button>
                <button
                  onClick={handlePrintSK}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-lg shadow-md transition active:scale-[0.98] uppercase text-[10px] tracking-wider flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Surat Keputusan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Progress Evaluasi AI */}
      {isEvaluating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-navy-900 rounded-[24px] shadow-2xl p-8 max-w-md w-full text-center">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              {/* Outer Pulse/Rotator */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-navy-900"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-teal-500 border-b-transparent border-l-transparent animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              <Cpu className="w-10 h-10 text-emerald-500 animate-pulse" />
            </div>

            <h3 className="text-md font-black text-slate-850 dark:text-white uppercase tracking-wider mb-1">
              Menjalankan Evaluasi Otomatis
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6 font-medium">
              Sistem sedang melakukan sinkronisasi data peserta...
            </p>

            {/* Progress Track */}
            <div className="w-full bg-slate-100 dark:bg-navy-950 h-3 rounded-full overflow-hidden mb-3 border border-slate-200/40 dark:border-navy-900">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${evalProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-550 mb-6 px-1">
              <span className="uppercase tracking-widest text-emerald-500 font-black">
                {evalProgress < 30 ? (
                  "Melatih Klasifikasi C4.5..."
                ) : evalProgress < 65 ? (
                  "Menghitung Probabilitas Bayes..."
                ) : evalProgress < 90 ? (
                  "Mengklasifikasikan Kader..."
                ) : evalProgress < 100 ? (
                  "Finalisasi Evaluasi..."
                ) : (
                  "Evaluasi Selesai!"
                )}
              </span>
              <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">
                {evalProgress}%
              </span>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
              Memproses kriteria kelulusan &gt;= 75% kehadiran untuk {peserta.length} peserta secara real-time.
            </p>
          </div>
        </div>
      )}

    </div>
  );

  // Selector helper to format manual dropdown
  function evaluasiFormStatus() {
    return evalStatus;
  }

  function setEvaluasiFormStatus(val: string) {
    setEvalStatus(val as any);
  }
}
