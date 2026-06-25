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
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // AI thresholds State
  const [minPres, setMinPres] = useState<number>(75);
  const [minMenit, setMinMenit] = useState<number>(877.5);

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
  const [certKetua, setCertKetua] = useState('DOMIRI A GHAZALY., S.H');
  const [certSekretaris, setCertSekretaris] = useState('M. ANGGA GUNAEFI., S.Pd');
  
  // Custom uploaded images for Certificate
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customStempel, setCustomStempel] = useState<string | null>(null);
  const [customTtdKetua, setCustomTtdKetua] = useState<string | null>(null);
  const [customTtdSekr, setCustomTtdSekr] = useState<string | null>(null);

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
  const [skTanggalHijriah, setSkTanggalHijriah] = useState('12 Muharrom 1448H');
  const [skTanggalMasehi, setSkTanggalMasehi] = useState('28 Juni 2026 M');
  
  const [skKepalaSekolah, setSkKepalaSekolah] = useState('HAMDANI M MALIK, S.E');
  const [skKoordinator, setSkKoordinator] = useState('SEPTA AJI., S.KOM');
  const [skKetua, setSkKetua] = useState('DOMIRI A GHAZALI, S.H');

  const [skTextTotal, setSkTextTotal] = useState('');
  const [skTextLulus, setSkTextLulus] = useState('');
  const [skTextTidakLulus, setSkTextTidakLulus] = useState('');

  const [skOperator, setSkOperator] = useState('');
  const [skWaktuCetak, setSkWaktuCetak] = useState('');
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

  // Calculates total session duration
  const sortedSesi = [...sesi].sort((a,b) => a.num - b.num);
  const totalDuration = sortedSesi.reduce((sum, s) => sum + (s.duration || 0), 0) || 1;

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
    // 1. Train dataset parameters on fly (using latest state)
    // Class distribution model
    const classes: ("LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS")[] = ["LULUS", "LULUS BERSYARAT", "TIDAK LULUS"];
    let priors: Record<string, number> = { "LULUS": 0.33, "LULUS BERSYARAT": 0.33, "TIDAK LULUS": 0.33 };
    let likelihoods: Record<string, Record<string, Record<string, number>>> = {
      presensi: {}, postTest: {}, praktik: {}, keaktifan: {}
    };

    classes.forEach(c => {
      likelihoods.presensi[c] = { "SANGAT_TINGGI": 1, "TINGGI": 1, "CUKUP": 1, "RENDAH": 1 };
      likelihoods.postTest[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
      likelihoods.praktik[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
      likelihoods.keaktifan[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
    });

    // Populate data
    peserta.forEach(p => {
      const status = p.status_kelulusan || "TIDAK LULUS";
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

      if (likelihoods.presensi[status]) likelihoods.presensi[status][pCat]++;
      if (likelihoods.postTest[status]) likelihoods.postTest[status][postCat]++;
      if (likelihoods.praktik[status]) likelihoods.praktik[status][praktikCat]++;
      if (likelihoods.keaktifan[status]) likelihoods.keaktifan[status][aktifCat]++;
    });

    // Predict for all kaders and bundle updates
    const updatedPesertaList = peserta.map((p, index) => {
      const presentLogs = presensi.filter(pr => pr.id === p.id);
      const attendedMinutes = presentLogs.reduce((sum, log) => {
        const matchingS = sesi.find(s => s.num === log.sesi);
        return sum + (matchingS?.duration || 0);
      }, 0);
      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let prediction: "LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS" = "TIDAK LULUS";

      // 1. C4.5 Decision Step 1: Lateness and overall absence criteria
      if (presPct < minPres) {
        prediction = "TIDAK LULUS";
      } else if (presPct >= minPres && attendedMinutes >= minMenit && p.nilai_post_test >= 75 && p.nilai_praktik >= 75 && p.nilai_keaktifan >= 75) {
        prediction = "LULUS";
      } else {
        // Bayes Posterior probability
        let bestProb = -1;
        let pCat = quantizePresence(presPct);
        let postCat = quantizeScore(p.nilai_post_test || 0);
        let praktikCat = quantizeScore(p.nilai_praktik || 0);
        let aktifCat = quantizeScore(p.nilai_keaktifan || 0);

        classes.forEach(c => {
          let prob = priors[c] *
            (likelihoods.presensi[c][pCat] || 0.01) *
            (likelihoods.postTest[c][postCat] || 0.01) *
            (likelihoods.praktik[c][praktikCat] || 0.01) *
            (likelihoods.keaktifan[c][aktifCat] || 0.01);
          if (prob > bestProb) {
            bestProb = prob;
            prediction = c;
          }
        });
      }

      // Safeguard downgrade
      if (prediction === 'LULUS' && attendedMinutes < minMenit) {
        prediction = "LULUS BERSYARAT";
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

    onBulkUpdateKelulusan(updatedPesertaList);
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
      treePresence: `Kehadiran (${presPct}%) < Batas AI (${minPres}%)? ${presPct < minPres ? 'YA (TIDAK LULUS)' : 'TIDAK'}`,
      treeScores: `Durasi Kelas (${attendedMinutes}m) >= Syarat (${minMenit}m) & Rata-rata akad >= 75? ${
        (attendedMinutes >= minMenit && p.nilai_post_test >= 75 && p.nilai_praktik >= 75 && p.nilai_keaktifan >= 75) ? 'YA (LULUS MUTLAK)' : 'TIDAK (LALU EVALUASI BAYES)'
      }`,
      probs
    });
    setIsDiagOpen(true);
  };

  // ----------------- Certificate live preview drawing on Canvas -----------------
  const handleOpenCertificateCustomizer = (p: Peserta) => {
    setCertId(p.id);
    setCertNomor(p.no_sertifikat || "CERT/ANS-PC/XXVIII/001/2026");
    setCertNama(p.nama);
    setCertUtusan(p.utusan);
    setCertBody1("TELAH MENYELESAIKAN PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN XXVIII PIMPINAN CABANG");
    setCertBody2("GERAKAN PEMUDA ANSOR KABUPATEN BOGOR PADA TANGGAL 13 - 15 JUNI 2026 BERTEMPAT");
    setCertBody3("DI PONDOK PESANTREN AL-FALAH DESA SUSUKAN KABUPATEN BOGOR");
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

    // Decorative background layout pattern
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.02;
    for (let x = 100; x < 1200; x += 150) {
      for (let y = 100; y < 850; y += 150) {
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // Premium Border Frames
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 1120, 770);

    // Green corner anchors
    ctx.fillStyle = '#059669';
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillRect(1150, 20, 30, 30);
    ctx.fillRect(20, 800, 30, 30);
    ctx.fillRect(1150, 800, 30, 30);

    // Load logo if uploaded, otherwise draw dynamic vector shield GP Ansor
    const logoToUse = customLogo || (branding?.logo && branding.logo.trim().startsWith('data:image/') ? branding.logo : null);
    if (logoToUse) {
      const img = new Image();
      img.src = logoToUse;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 545, 80, 110, 110);
          resolve(true);
        };
        img.onerror = () => {
          resolve(false);
        };
      });
    } else {
      // Dynamic beautiful vector logo rendering
      ctx.save();
      ctx.translate(600, 135);
      ctx.scale(1.1, 1.1);
      ctx.translate(-60, -60);
      ctx.strokeStyle = "#1E70CD";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(30, 40);
      ctx.bezierCurveTo(30, 40, 55, 35, 60, 35);
      ctx.bezierCurveTo(65, 35, 90, 40, 90, 40);
      ctx.bezierCurveTo(90, 40, 93, 72, 60, 92);
      ctx.bezierCurveTo(27, 72, 30, 40, 30, 40);
      ctx.closePath();
      ctx.stroke();

      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(42, 55);
      ctx.lineTo(58, 71);
      ctx.lineTo(86, 43);
      ctx.stroke();

      ctx.strokeStyle = "#4FAF3C";
      ctx.beginPath();
      ctx.moveTo(51, 64);
      ctx.lineTo(58, 71);
      ctx.lineTo(66, 63);
      ctx.stroke();
      ctx.restore();
    }

    // Calligraphy font placeholder or serif fallback
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = "italic bold 64px serif";
    ctx.fillText("Sertifikat_Kaderisasi", 600, 260);

    // Certificate Number
    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#475569';
    ctx.fillText(`NOMOR REGISTER : ${certNomor}`, 600, 305);

    // Given To
    ctx.fillStyle = '#64748b';
    ctx.font = "extrabold 11px sans-serif";
    ctx.fillText("DIBERIKAN KEPADA :", 600, 345);

    // Participant Name (Big!)
    ctx.fillStyle = '#059669';
    ctx.font = "black 36px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certNama.toUpperCase(), 600, 400);

    // Separator line
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(400, 415);
    ctx.lineTo(800, 415);
    ctx.stroke();

    // Body texts
    ctx.fillStyle = '#334155';
    ctx.font = "500 13px sans-serif";
    ctx.fillText(certBody1.toUpperCase(), 600, 460);
    ctx.fillText(certBody2.toUpperCase(), 600, 485);
    ctx.fillText(certBody3.toUpperCase(), 600, 510);
    ctx.font = "extrabold 15px sans-serif";
    ctx.fillStyle = '#0f172a';
    ctx.fillText("DAN DINYATAKAN LULUS SEBAGAI ANGGOTA KADER GP ANSOR", 600, 545);

    // Date/Time
    ctx.fillStyle = '#1e293b';
    ctx.font = "extrabold 12px sans-serif";
    ctx.fillText("BOGOR, 15 JUNI 2026 M", 600, 595);

    // Chairman & Secretary titles
    ctx.fillStyle = '#0f172a';
    ctx.font = "extrabold 14px sans-serif";
    ctx.fillText(certKetua, 350, 735);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("KETUA CABANG", 350, 755);

    ctx.fillStyle = '#0f172a';
    ctx.font = "extrabold 14px sans-serif";
    ctx.fillText(certSekretaris, 810, 735);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("SEKRETARIS CABANG", 810, 755);

    // TTDs rendering
    if (customTtdKetua) {
      const img = new Image();
      img.src = customTtdKetua;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 260, 640, 180, 75); r(true); } });
    } else {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(300, 700);
      ctx.bezierCurveTo(320, 670, 310, 710, 350, 665);
      ctx.stroke();
    }

    if (customTtdSekr) {
      const img = new Image();
      img.src = customTtdSekr;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 720, 640, 180, 75); r(true); } });
    } else {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(760, 695);
      ctx.bezierCurveTo(780, 660, 810, 690, 830, 670);
      ctx.stroke();
    }

    // Wet Seal Stamp Rendering
    if (customStempel) {
      const img = new Image();
      img.src = customStempel;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 450, 630, 110, 110); r(true); } });
    } else {
      // Draw lovely stamp outline
      ctx.save();
      ctx.translate(500, 695);
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText("STEMPEL BASAH", -32, 3);
      ctx.restore();
    }

    // QR Code generation automatically rendered onto canvas via standard qrcode library
    try {
      const qrDataUrl = await QRCode.toDataURL(certId, { margin: 1, width: 110 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, 1020, 630, 110, 110); r(true); } });
    } catch (e) {
      console.error(e);
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
    customLogo,
    customStempel,
    customTtdKetua,
    customTtdSekr
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

    let logoHtml = '';
    if (branding && branding.logo && (typeof branding.logo === 'string')) {
      if (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) {
        logoHtml = `<div class="logo-container"><div>${branding.logo}</div></div>`;
      } else {
        logoHtml = `<div class="logo-container"><img src="${branding.logo}" alt="Logo" /></div>`;
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Surat_Ketetapan_Kelulusan_PKD_${skAngkatan}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
              color: #000000;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* Page styles */
            .page {
              width: 210mm;
              height: 295mm;
              background-color: #ffffff;
              box-sizing: border-box;
              padding: 15mm 20mm;
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
              border-bottom: 3.5px double #000000;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .logo-container {
              width: 75px;
              height: 75px;
              min-width: 75px;
              min-height: 75px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              box-sizing: border-box;
            }
            .logo-container img {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .logo-container svg {
              width: 70px;
              height: 70px;
            }
            .logo-container div {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .header-info {
              flex-grow: 1;
              text-align: center;
            }
            .title-main {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 21px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0;
              color: #000000;
              letter-spacing: 0.01em;
              line-height: 1.1;
            }
            .title-sub1 {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 4px 0 0 0;
              color: #000000;
              letter-spacing: 0.01em;
              line-height: 1.1;
            }
            .title-sub2 {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 22px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 3px 0 0 0;
              color: #000000;
              letter-spacing: 0.03em;
              line-height: 1.1;
            }
            .address-info {
              font-family: 'Inter', sans-serif;
              font-size: 9.5px;
              font-weight: 500;
              margin: 6px 0 0 0;
              color: #1e293b;
            }
            .links-info {
              font-family: 'Inter', sans-serif;
              font-size: 9.5px;
              font-weight: 500;
              margin: 2px 0 0 0;
              color: #1e293b;
            }
            .links-info a {
              color: #0284c7;
              text-decoration: none;
            }

            /* Document structure styles */
            .doc-title {
              text-align: center;
              font-size: 13px;
              font-weight: 800;
              text-decoration: underline;
              text-transform: uppercase;
              margin-top: 10px;
              margin-bottom: 2px;
              letter-spacing: 0.05em;
            }
            .doc-number {
              text-align: center;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .doc-about-label {
              text-align: center;
              font-size: 11px;
              font-weight: 700;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .doc-about-title {
              text-align: center;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              max-width: 85%;
              margin: 0 auto 18px auto;
              line-height: 1.4;
            }

            .bismillah {
              font-family: 'Playfair Display', Georgia, serif;
              font-style: italic;
              font-weight: 700;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .opening-text {
              font-weight: 700;
              font-size: 11.5px;
              margin-bottom: 14px;
            }

            /* Table-like row layout for formal documents */
            .doc-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 11px;
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
              text-align: center;
              font-weight: 800;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 12px 0;
            }

            /* Stats block for page 1 bottom */
            .stats-container {
              margin-top: 6px;
              margin-left: 20px;
              font-family: 'Inter', sans-serif;
              font-size: 11px;
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
              width: 250px;
              font-size: 11px;
              margin-top: 15px;
              margin-bottom: 15px;
              line-height: 1.4;
            }
            .meta-date table {
              width: 100%;
            }
            .meta-date td {
              padding: 1px 0;
            }

            .instruktur-title {
              text-align: center;
              font-weight: 800;
              font-size: 11.5px;
              text-transform: uppercase;
              margin-bottom: 20px;
              line-height: 1.35;
            }

            .sig-row {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              margin-bottom: 30px;
              font-size: 11.5px;
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
              display: flex;
              align-items: center;
              gap: 12px;
              border: 1.5px dashed #10b981;
              background-color: #f0fdf4;
              padding: 10px 14px;
              border-radius: 8px;
              max-width: 380px;
              font-size: 9.5px;
              line-height: 1.4;
              color: #111827;
              margin: 15px auto 0 auto;
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
              font-size: 9px;
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
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              font-size: 11.5px;
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
              background: linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%);
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 25px;
              color: #ffffff;
              font-family: 'Inter', sans-serif;
              font-size: 9.5px;
              font-weight: 700;
              border-top: 1px solid #34d399;
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
              color: #059669;
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
              background-color: #10b981;
              border: 1px solid rgba(255, 255, 255, 0.4);
              padding: 3px 8px;
              border-radius: 5px;
              font-size: 9px;
              margin-left: 10px;
            }
            
            /* Styled diagonal stripe on right */
            .footer-stripe {
              position: absolute;
              right: 0;
              bottom: 0;
              height: 100%;
              width: 80px;
              background: linear-gradient(135deg, #047857 0%, #065f46 100%);
              clip-path: polygon(30% 0, 100% 0, 100% 100%, 0 100%);
              border-left: 3px solid #34d399;
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
                \${logoHtml}
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
              <div class="doc-number">Nomor : \${skNomor}</div>
              
              <div class="doc-about-label">T e n t a n g</div>
              <div class="doc-about-title">
                PENETAPAN KELULUSAN PESERTA<br/>
                PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN \${skAngkatan}<br/>
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
                        \${skMenimbangA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        \${skMenimbangB}
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
                        \${skMengingatA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        \${skMengingatB}
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
                        \${skMemperhatikanA}
                      </li>
                      <li>
                        <span class="bullet-char">b.</span>
                        \${skMemperhatikanB}
                      </li>
                      <li>
                        <span class="bullet-char">c.</span>
                        \${skMemperhatikanC}
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
                        <span class="stats-val">\${skTextTotal}</span>
                      </div>
                      <div class="stats-row">
                        <span class="stats-label">Lulus</span>
                        <span class="stats-dots">:</span>
                        <span class="stats-val">\${skTextLulus}</span>
                      </div>
                      <div class="stats-row">
                        <span class="stats-label">Tidak Lulus</span>
                        <span class="stats-dots">:</span>
                        <span class="stats-val">\${skTextTidakLulus}</span>
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
                \${logoHtml}
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
                    <td style="width: 90px; font-weight: bold;">Ditetapkan</td>
                    <td style="width: 15px; text-align: center; font-weight: bold;">:</td>
                    <td>\${skDitetapkan}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold;">Tanggal</td>
                    <td style="text-align: center; font-weight: bold;">:</td>
                    <td style="text-decoration: underline; font-weight: 700;">\${skTanggalHijriah}</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td style="text-align: center; font-weight: bold;">:</td>
                    <td style="text-decoration: underline; font-weight: 700;">\${skTanggalMasehi}</td>
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
                  \${useQrSignatures ? ' <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="' + qrKepalaSekolahImg + '" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ' : '<div style="height: 60px;"></div>'}
                  <div class="sig-name-line">\${skKepalaSekolah}</div>
                </div>
                <div class="sig-col" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 140px;">
                  <div style="font-weight: 700; text-align: center;">Koordinator Instruktur Cabang,</div>
                  \${useQrSignatures ? ' <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="' + qrKoordinatorImg + '" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ' : '<div style="height: 60px;"></div>'}
                  <div class="sig-name-line">\${skKoordinator}</div>
                </div>
              </div>

              <!-- Signature Row 2 (Mengetahui) -->
              <div class="sig-row-mengetahui" style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 10px;">
                <div class="sig-mengetahui-title">Mengetahui</div>
                <div class="sig-mengetahui-title" style="font-weight: 800;">PIMPINAN CABANG GERAKAN PEMUDA ANSOR</div>
                <div class="sig-mengetahui-title" style="font-weight: 800; margin-bottom: 3px;">KABUPATEN BOGOR</div>
                <div style="font-weight: 700; margin-bottom: 3px;">Ketua,</div>
                \${useQrSignatures ? ' <div style="margin: 6px auto; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;"> <img src="' + qrKetuaImg + '" style="width: 70px; height: 70px;" alt="QR Code" /> </div> ' : '<div style="height: 55px;"></div>'}
                <div class="sig-name-line">\${skKetua}</div>
              </div>

              <!-- Verification & Validation Stamp -->
              \${useDocumentValidation ? ' <div class="validation-badge"> <div class="validation-qr"> <img src="' + qrValidationImg + '" alt="Validation QR" /> </div> <div class="validation-details"> <div class="validation-title">VALIDASI SISTEM KADERISASI</div> <div class="validation-text"><strong>Operator Cetak:</strong> \${skOperator}</div> <div class="validation-text"><strong>Waktu Cetak:</strong> \${skWaktuCetak}</div> <div class="validation-text"><strong>Status Dokumen:</strong> SAH &amp; TERVERIFIKASI DI DATABASE PC GP ANSOR KABUPATEN BOGOR</div> </div> </div> ' : ''}

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
                <th className="p-3 w-36 border-l dark:border-navy-850">NO. SERTIFIKAT</th>
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
                        <span className={`px-2 py-0.5 rounded-full border font-black text-[8px] uppercase tracking-wider ${
                          p.status_kelulusan === 'LULUS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/20'
                            : (p.status_kelulusan === 'LULUS BERSYARAT'
                              ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/20'
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/15 dark:text-rose-455 dark:border-rose-900/20')
                        }`}>
                          {p.status_kelulusan}
                        </span>
                        
                        <button
                          onClick={() => handleOpenDiag(p)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-navy-950 text-emerald-500 rounded-lg transition"
                          title="Statistik Diagnosa AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        </button>
                      </div>
                    </td>

                    {/* Sertifikat card */}
                    <td className="p-3 font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] border-l dark:border-navy-850" title={p.no_sertifikat}>
                      {p.no_sertifikat || '-'}
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
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">POST TEST</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalPost}
                    onChange={(e) => setEvalPost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">PRAKTIK</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalPraktik}
                    onChange={(e) => setEvalPraktik(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">KEAKTIFAN</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalKeaktifan}
                    onChange={(e) => setEvalKeaktifan(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
              </div>

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
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">STATUS KELULUSAN MANUAL</label>
                <select
                  value={evaluasiFormStatus()}
                  onChange={(e) => setEvaluasiFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-2.5 rounded-lg font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                  <option value="LULUS BERSYARAT">LULUS BERSYARAT</option>
                  <option value="LULUS">LULUS</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">NOMOR SERTIFIKAT</label>
                <input
                  type="text"
                  value={evalSertifikat}
                  onChange={(e) => setEvalSertifikat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg font-mono font-bold dark:text-white"
                  placeholder="Contoh: CERT/PC/001/2026"
                />
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
                <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest border-b dark:border-navy-850 pb-2">Kontrol Data Sertifikat</h5>
                
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
                  <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-1.5">5. Hasil Statistik Kelulusan</h5>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL PESERTA (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      value={skTextTotal}
                      onChange={(e) => setSkTextTotal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL LULUS (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      value={skTextLulus}
                      onChange={(e) => setSkTextLulus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 tracking-widest uppercase">TOTAL TIDAK LULUS (ANGKAH & TERBILANG)</label>
                    <input
                      type="text"
                      value={skTextTidakLulus}
                      onChange={(e) => setSkTextTidakLulus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-navy-850 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 font-mono"
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
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 rounded">
                        <span className="text-[8px] text-emerald-600 font-extrabold">ANSOR</span>
                      </div>
                      <div className="flex-1 text-center font-bold">
                        <div className="text-[7.5px] uppercase">PIMPINAN CABANG</div>
                        <div className="text-[7.5px] uppercase">GERAKAN PEMUDA ANSOR</div>
                        <div className="text-[8px] uppercase font-black text-emerald-600">KABUPATEN BOGOR</div>
                        <div className="text-[4px] font-normal text-slate-500">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</div>
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
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 rounded">
                        <span className="text-[8px] text-emerald-600 font-extrabold">ANSOR</span>
                      </div>
                      <div className="flex-1 text-center font-bold">
                        <div className="text-[7.5px] uppercase">PIMPINAN CABANG</div>
                        <div className="text-[7.5px] uppercase">GERAKAN PEMUDA ANSOR</div>
                        <div className="text-[8px] uppercase font-black text-emerald-600">KABUPATEN BOGOR</div>
                        <div className="text-[4px] font-normal text-slate-500">Jl.Bina Citra No.05 Kel Tengah Kec. Cibinong Kab. Bogor Telp: 08787264414</div>
                      </div>
                    </div>

                    {/* Continuing menetapkan points */}
                    <table className="w-full text-[5.5px] mt-4">
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
                    <div className="w-28 ml-auto text-[5.5px] border-t border-slate-200 pt-2 mt-4 space-y-0.5">
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
                      <div className="mt-3 border border-dashed border-emerald-500/40 bg-emerald-50/50 p-1.5 rounded-lg flex items-center gap-1.5 text-[4px] leading-tight text-slate-800">
                        <div className="w-8 h-8 bg-white border border-slate-200 p-0.5 rounded shrink-0 flex items-center justify-center relative overflow-hidden">
                          {previewQrValidation ? (
                            <img src={previewQrValidation} className="w-full h-full object-contain animate-fadeIn" alt="Validation QR" />
                          ) : (
                            <div className="text-[4px] text-slate-400">Loading...</div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-black text-emerald-700 text-[4.5px] tracking-wider border-b border-emerald-500/20 pb-0.5 mb-0.5">VALIDASI SISTEM KADERISASI</div>
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
                  setSkTanggalHijriah('12 Muharrom 1448H');
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
