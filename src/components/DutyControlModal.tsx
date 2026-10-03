import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OfficerProfile, DutyStatusCode, DutyLog, isOfficerHighRank } from '../types';
import { 
  Radio, Shield, Power, Clock, User, CheckCircle2, 
  AlertCircle, Settings, Send, RefreshCw, X, Globe,
  CheckCheck, Timer, Calendar, ShieldCheck, Camera,
  Upload, Image as ImageIcon, Trash2, ZoomIn, Link2, Plus,
  Smartphone, FileText, AlertTriangle, Lock, ChevronRight
} from 'lucide-react';
import { 
  getSavedDutyWebhookConfig, saveDutyWebhookConfig, 
  sendDutyReportToDiscord, testDutyDiscordWebhook, WebhookConfig 
} from '../utils/discordWebhook';
import { recordDutySession, getTodayDutyStatsForOfficer } from '../utils/attendanceExport';
import { getActiveLeaveForOfficer, formatIndoDateDisplay } from '../utils/officerLeaveStorage';
import { processAndCompressImage } from '../utils/imageCompressor';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile;
  isDuty: boolean;
  dutyStartTime: number;
  onDutyStatusChanged: (newDutyState: boolean, newDutyStartTime: number, statusCode?: DutyStatusCode) => void;
  onOpenLeaveModal?: () => void;
}

export const DutyControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  isDuty,
  dutyStartTime,
  onDutyStatusChanged,
  onOpenLeaveModal
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DutyStatusCode>(isDuty ? '8-1-0' : '8-1-1');

  // Webhook settings state (loaded directly from central config)
  const dutyWebhookConfig = getSavedDutyWebhookConfig();

  // Live timer tick for real-time duty duration
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string; shiftSummary?: string } | null>(null);

  // --- EVIDENCE PHOTOS STATES ---
  // On Duty (8-1-1): 1 foto HP sebelum on duty
  const [onDutyPhoneImage, setOnDutyPhoneImage] = useState<string>('');
  // Off Duty (8-1-0): 3 photos (2 foto kegiatan + 1 foto HP off duty)
  const [offDutyActivityImage1, setOffDutyActivityImage1] = useState<string>('');
  const [offDutyActivityImage2, setOffDutyActivityImage2] = useState<string>('');
  const [offDutyPhoneImage, setOffDutyPhoneImage] = useState<string>('');

  // Processing indicators
  const [isProcessingImg, setIsProcessingImg] = useState<string | null>(null);
  const [previewLightboxImg, setPreviewLightboxImg] = useState<{ title: string; url: string } | null>(null);

  // Hidden File Inputs Refs
  const onDutyPhoneInputRef = useRef<HTMLInputElement>(null);
  const onDutyPhoneCameraRef = useRef<HTMLInputElement>(null);

  const offDutyBatchInputRef = useRef<HTMLInputElement>(null);
  const offDutyAct1InputRef = useRef<HTMLInputElement>(null);
  const offDutyAct1CameraRef = useRef<HTMLInputElement>(null);
  const offDutyAct2InputRef = useRef<HTMLInputElement>(null);
  const offDutyAct2CameraRef = useRef<HTMLInputElement>(null);
  const offDutyPhoneInputRef = useRef<HTMLInputElement>(null);
  const offDutyPhoneCameraRef = useRef<HTMLInputElement>(null);

  // Notes & Callsign / Partner state
  const [dutyNotes, setDutyNotes] = useState('');
  const [dutyCallsign, setDutyCallsign] = useState('UNIT-1');
  const [dutyPartner, setDutyPartner] = useState('');

  // Sync default next state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(isDuty ? '8-1-0' : '8-1-1');
      setSubmitFeedback(null);
      setCurrentTime(Date.now());
      setOnDutyPhoneImage('');
      setOffDutyActivityImage1('');
      setOffDutyActivityImage2('');
      setOffDutyPhoneImage('');
      setDutyNotes('');
    }
  }, [isOpen, isDuty]);

  // Live second ticker while modal is open and on duty
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Akumulasi Laporan Harian (siang + malam disatukan menjadi 1 laporan harian)
  const todayPriorDutyStats = useMemo(() => {
    if (!isOpen) {
      return { hasDutyToday: false, todayMinutes: 0, todayFormatted: '0 Menit', sessionsCount: 0, existingSession: null };
    }
    return getTodayDutyStatsForOfficer(currentOfficer.badge, currentOfficer.name);
  }, [isOpen, currentOfficer.badge, currentOfficer.name, currentTime]);

  // Check active approved leave for today
  const activeLeaveToday = useMemo(() => {
    if (!isOpen) return null;
    return getActiveLeaveForOfficer(currentOfficer.badge, currentOfficer.name);
  }, [isOpen, currentOfficer.badge, currentOfficer.name]);

  if (!isOpen) return null;

  // Calculate live duty duration
  const elapsedMs = (isDuty && dutyStartTime > 0) ? Math.max(0, currentTime - dutyStartTime) : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);

  const displayHours = elapsedHours;
  const displayMinutes = elapsedMinutes % 60;
  const displaySeconds = elapsedSeconds % 60;

  let durationDetailedStr = '';
  if (displayHours > 0) {
    durationDetailedStr += `${displayHours} Jam `;
  }
  durationDetailedStr += `${displayMinutes} Menit ${displaySeconds} Detik`;

  const durationSimpleStr = `${displayHours > 0 ? `${displayHours} Jam ` : ''}${displayMinutes} Menit`;

  const startTimeStr = dutyStartTime > 0 
    ? new Date(dutyStartTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
    : '-';

  const endTimeStr = new Date(currentTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  // Strict Off-Duty (8-1-0) 3-Photo Requirement State & Validation
  const isOffDutyStatus = selectedStatus === '8-1-0' || selectedStatus === '10-7';
  const isOnDutyStatus = selectedStatus === '8-1-1' || selectedStatus === '10-8';

  // SOP RULES: MINIMAL DURASI DINAS ADALAH 2 JAM (120 MENIT)
  const MIN_DUTY_MINUTES = 120; // 2 Jam (120 Menit)
  const currentElapsedMs = (isDuty && dutyStartTime > 0) ? Math.max(0, currentTime - dutyStartTime) : 0;
  const currentElapsedMinutes = Math.floor(currentElapsedMs / 60000);

  const totalTodayAccumulatedMinutes = todayPriorDutyStats.todayMinutes + currentElapsedMinutes;

  // Minimal duty 2 jam terpenuhi jika sesi saat ini >= 120 menit ATAU total akumulasi hari ini (siang + malam) >= 120 menit
  // (atau jika perwira tinggi High Rank)
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const isMinDutySatisfied = !isOffDutyStatus || currentElapsedMinutes >= MIN_DUTY_MINUTES || totalTodayAccumulatedMinutes >= MIN_DUTY_MINUTES || isHighRank;
  const missingDutyMinutes = Math.max(0, MIN_DUTY_MINUTES - Math.max(currentElapsedMinutes, totalTodayAccumulatedMinutes));
  const missingH = Math.floor(missingDutyMinutes / 60);
  const missingM = missingDutyMinutes % 60;
  const missingText = missingH > 0 
    ? `${missingH} Jam ${missingM > 0 ? `${missingM} Menit` : ''}` 
    : `${missingM} Menit`;

  const offDutyMissingSlots = [
    !offDutyActivityImage1 ? 'Foto Kegiatan 1' : null,
    !offDutyActivityImage2 ? 'Foto Kegiatan 2' : null,
    !offDutyPhoneImage ? 'Foto Layar HP Selesai' : null
  ].filter(Boolean) as string[];

  const offDutyUploadedCount = 3 - offDutyMissingSlots.length;
  const isOffDutyPhotosComplete = offDutyUploadedCount === 3;
  const isSubmitDisabled = isSubmitting || (isOffDutyStatus && (!isOffDutyPhotosComplete || !isMinDutySatisfied));

  // Helper to process single file upload from device
  const handleProcessFileForSlot = async (
    file: File, 
    slotSetter: (val: string) => void,
    slotName: string
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih berkas gambar (JPG, PNG, WebP).');
      return;
    }
    setIsProcessingImg(slotName);
    try {
      const compressed = await processAndCompressImage(file, 1400, 1400, 0.85);
      slotSetter(compressed.dataUrl);
    } catch (err: any) {
      console.error('Failed to compress image:', err);
      alert(`Gagal memproses gambar: ${err.message || 'File tidak valid'}`);
    } finally {
      setIsProcessingImg(null);
    }
  };

  // Helper for batch uploading up to 3 files for off duty
  const handleBatchOffDutyUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 3);
    if (fileArr.length === 0) return;

    setIsProcessingImg('batch_off_duty');
    try {
      if (fileArr[0]) {
        const res1 = await processAndCompressImage(fileArr[0], 1400, 1400, 0.85);
        setOffDutyActivityImage1(res1.dataUrl);
      }
      if (fileArr[1]) {
        const res2 = await processAndCompressImage(fileArr[1], 1400, 1400, 0.85);
        setOffDutyActivityImage2(res2.dataUrl);
      }
      if (fileArr[2]) {
        const res3 = await processAndCompressImage(fileArr[2], 1400, 1400, 0.85);
        setOffDutyPhoneImage(res3.dataUrl);
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
    } finally {
      setIsProcessingImg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // STRICT VALIDATION 1: Minimal Durasi Dinas 2 Jam (120 Menit)
    if (isOffDutyStatus && !isMinDutySatisfied) {
      const missingH = Math.floor(missingDutyMinutes / 60);
      const missingM = missingDutyMinutes % 60;
      const missingText = missingH > 0 ? `${missingH} Jam ${missingM} Menit` : `${missingM} Menit`;
      setSubmitFeedback({
        type: 'error',
        message: `Akses Ditolak: Sesuai SOP Kepolisian, durasi dinas wajib minimal 2 Jam (120 Menit). Durasi dinas Anda saat ini baru ${Math.floor(currentElapsedMinutes / 60)} Jam ${currentElapsedMinutes % 60} Menit (kurang ${missingText} lagi). Anda belum dapat melakukan lepas dinas (8-1-0).`
      });
      return;
    }

    // STRICT VALIDATION 2: Lepas dinas (8-1-0) WAJIB 3 berkas foto lengkap (2 Kegiatan + 1 HP Selesai)
    if (isOffDutyStatus && !isOffDutyPhotosComplete) {
      setSubmitFeedback({
        type: 'error',
        message: `Akses Ditolak: Anda baru mengunggah ${offDutyUploadedCount} dari 3 bukti foto yang diwajibkan SOP. Wajib mengunggah ${offDutyMissingSlots.join(', ')} sebelum dapat menekan tombol Selesai 8-1-0 (Lepas Dinas).`
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    const now = Date.now();
    const finalElapsedMs = (isDuty && dutyStartTime > 0) ? Math.max(0, now - dutyStartTime) : 0;
    const finalMinutes = Math.floor(finalElapsedMs / 60000);
    const finalHours = Math.floor(finalMinutes / 60);
    const finalRemMins = finalMinutes % 60;
    const finalSeconds = Math.floor((finalElapsedMs % 60000) / 1000);

    const finalDurationFormatted = finalHours > 0 
      ? `${finalHours} Jam ${finalRemMins} Menit ${finalSeconds} Detik` 
      : `${finalRemMins} Menit ${finalSeconds} Detik`;

    // Hitung akumulasi harian jika sebelumnya sudah pernah dinas hari ini (misal sesi siang + sesi malam)
    const totalTodayAccumulatedMinutes = todayPriorDutyStats.todayMinutes + (isOffDutyStatus ? finalMinutes : 0);
    const totalTodayHours = Math.floor(totalTodayAccumulatedMinutes / 60);
    const totalTodayRemMins = totalTodayAccumulatedMinutes % 60;
    const accumulatedFormatted = totalTodayHours > 0 
      ? `${totalTodayHours} Jam ${totalTodayRemMins} Menit` 
      : `${totalTodayRemMins} Menit`;

    const statusTexts: Record<DutyStatusCode, string> = {
      '8-1-1': '8-1-1 ON DUTY (Mulai Dinas / Siap Patroli)',
      '8-1-0': '8-1-0 OFF DUTY (Selesai Dinas / Lepas Piket)',
      '10-8': '8-1-1 ON DUTY (Mulai Dinas / Siap Patroli)',
      '10-7': '8-1-0 OFF DUTY (Selesai Dinas / Lepas Piket)',
      '10-6': '10-6 BUSY (Sedang Penanganan Kasus / Sidang)',
      '10-97': '10-97 ON SCENE (Tiba di Lokasi Operasi)'
    };

    // Prepare evidence image collection
    const collectedEvidence: string[] = [];
    if (isOnDutyStatus) {
      if (onDutyPhoneImage) collectedEvidence.push(onDutyPhoneImage);
    } else if (isOffDutyStatus) {
      if (offDutyActivityImage1) collectedEvidence.push(offDutyActivityImage1);
      if (offDutyActivityImage2) collectedEvidence.push(offDutyActivityImage2);
      if (offDutyPhoneImage) collectedEvidence.push(offDutyPhoneImage);
    }

    const dutyLog: DutyLog = {
      id: `duty-${Date.now()}`,
      officerName: currentOfficer.name,
      officerBadge: currentOfficer.badge,
      officerRank: currentOfficer.rank,
      division: currentOfficer.division || 'Patrol Division',
      status: selectedStatus,
      statusText: statusTexts[selectedStatus] || `${selectedStatus} (Status Operasional)`,
      callsign: dutyCallsign !== 'UNIT-1' ? dutyCallsign : undefined,
      partner: dutyPartner.trim() ? dutyPartner.trim() : undefined,
      notes: dutyNotes.trim() ? dutyNotes.trim() : undefined,
      timestamp: now,
      dutyStartTime: isOffDutyStatus ? dutyStartTime : (isOnDutyStatus ? now : undefined),
      dutyEndTime: isOffDutyStatus ? now : undefined,
      durationMinutes: isOffDutyStatus ? finalMinutes : undefined,
      durationFormatted: isOffDutyStatus ? finalDurationFormatted : undefined,
      accumulatedDayMinutes: isOffDutyStatus ? totalTodayAccumulatedMinutes : undefined,
      accumulatedDayFormatted: isOffDutyStatus ? accumulatedFormatted : undefined,
      sessionsCountToday: isOffDutyStatus ? (todayPriorDutyStats.sessionsCount + 1) : undefined,
      // Attached photos
      onDutyPhoneImage: isOnDutyStatus ? onDutyPhoneImage : undefined,
      offDutyActivityImage1: isOffDutyStatus ? offDutyActivityImage1 : undefined,
      offDutyActivityImage2: isOffDutyStatus ? offDutyActivityImage2 : undefined,
      offDutyPhoneImage: isOffDutyStatus ? offDutyPhoneImage : undefined,
      evidenceImages: collectedEvidence
    };

    let webhookSuccess = true;
    let webhookMsg = '';

    if (dutyWebhookConfig.webhookUrl && dutyWebhookConfig.webhookUrl.trim()) {
      const res = await sendDutyReportToDiscord(dutyLog, dutyWebhookConfig);
      webhookSuccess = res.success;
      webhookMsg = res.message;
    }

    // Determine new isDuty state & start time cleanly
    let newDutyState = isDuty;
    let newDutyStartTime = dutyStartTime;

    if (isOnDutyStatus) {
      newDutyState = true;
      // If already on duty with valid timer, preserve it; otherwise start fresh timer now
      newDutyStartTime = (isDuty && dutyStartTime > 0) ? dutyStartTime : now;
    } else if (isOffDutyStatus) {
      newDutyState = false;
      newDutyStartTime = 0;
    } else if (selectedStatus === '10-6' || selectedStatus === '10-97') {
      newDutyState = true;
      newDutyStartTime = (isDuty && dutyStartTime > 0) ? dutyStartTime : now;
    }

    if (isOffDutyStatus && dutyStartTime > 0) {
      recordDutySession({
        officerBadge: currentOfficer.badge,
        officerName: currentOfficer.name,
        officerRank: currentOfficer.rank,
        division: currentOfficer.division || 'Patrol Division',
        startTime: dutyStartTime,
        endTime: now,
        durationMinutes: Math.max(1, finalMinutes),
        durationFormatted: finalDurationFormatted,
        notes: dutyNotes.trim() ? `${dutyNotes.trim()} (${currentOfficer.rank})` : `Shift Dinas ${currentOfficer.rank}`
      });
    }

    onDutyStatusChanged(newDutyState, newDutyStartTime, selectedStatus);
    setIsSubmitting(false);

    if (dutyWebhookConfig.webhookUrl.trim() && !webhookSuccess) {
      setSubmitFeedback({
        type: 'error',
        message: `Status dinas lokal diperbarui, namun Discord Webhook gagal: ${webhookMsg}`
      });
    } else {
      const photoCountText = collectedEvidence.length > 0 ? ` (+${collectedEvidence.length} Berkas Foto)` : '';
      setSubmitFeedback({
        type: 'success',
        message: `✅ Laporan status dinas [${selectedStatus}]${photoCountText} berhasil diperbarui${dutyWebhookConfig.webhookUrl.trim() ? ' & terkirim ke Discord!' : '!'}`,
        shiftSummary: isOffDutyStatus ? `Total Durasi Dinas: ${finalDurationFormatted} (Mulai: ${startTimeStr} - Selesai: ${endTimeStr})` : undefined
      });
      setTimeout(() => {
        onClose();
      }, isOffDutyStatus ? 1800 : 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#161B22] border border-blue-900/60 rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto font-mono">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-100 flex items-center gap-2">
                <span>Laporan Status Dinas (Duty Dispatch)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isDuty ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {isDuty ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Petugas: <strong className="text-gray-200">{currentOfficer.name}</strong> ({currentOfficer.badge}) • <span className="text-amber-400">{currentOfficer.rank}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS */}
        {submitFeedback && (
          <div className={`p-3 rounded-lg text-xs space-y-1 border ${
            submitFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {submitFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{submitFeedback.message}</span>
            </div>
            {submitFeedback.shiftSummary && (
              <div className="text-[11px] text-emerald-200 pl-6 bg-black/30 p-1.5 rounded border border-emerald-800/40">
                {submitFeedback.shiftSummary}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE LEAVE STATUS BANNER */}
        {activeLeaveToday && (
          <div className="p-3 bg-amber-950/60 border-2 border-amber-600/80 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 shadow-md font-mono">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>🟡 STATUS CUTI RESMI AKTIF</span>
                <span className="bg-amber-900 border border-amber-600 text-amber-100 text-[10px] px-2 py-0.2 rounded font-bold">
                  {activeLeaveToday.totalDays} HARI
                </span>
              </div>
              <div className="text-[11px] text-gray-300 leading-relaxed">
                Anda memiliki izin cuti resmi dari <strong>{formatIndoDateDisplay(activeLeaveToday.startDate)}</strong> s/d <strong>{formatIndoDateDisplay(activeLeaveToday.endDate)}</strong>. Di-ACC oleh: <strong>{activeLeaveToday.approvedBy}</strong> ({activeLeaveToday.approvedRank || 'Atasan'}).
              </div>
            </div>
          </div>
        )}

        {/* AJUKAN IZIN / CUTI SAPD BUTTON */}
        {onOpenLeaveModal && (
          <button
            type="button"
            onClick={onOpenLeaveModal}
            className="w-full py-2.5 px-3 bg-[#1C1613] hover:bg-[#281F1A] border border-amber-500/80 hover:border-amber-400 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-between transition shadow-sm group font-mono active:scale-98"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>AJUKAN IZIN / CUTI SAPD (ACC ATASAN)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 group-hover:translate-x-0.5 transition">
              <span>Buka Formulir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        )}

        {/* STATUS SELECTION CARDS: 8-1-1 ON DUTY & 8-1-0 OFF DUTY ONLY */}
        <div>
          <label className="text-[11px] font-bold text-gray-300 uppercase block mb-2">
            Pilih Status Operasional Petugas:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 8-1-1 ON DUTY */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              (selectedStatus === '8-1-1' || selectedStatus === '10-8')
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/30'
                : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}>
              <input
                type="radio"
                name="dutyStatus"
                value="8-1-1"
                checked={selectedStatus === '8-1-1' || selectedStatus === '10-8'}
                onChange={() => setSelectedStatus('8-1-1')}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-400">
                  <span>🟢 8-1-1 ON DUTY</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Mulai Piket / Siap Patroli</div>
              </div>
            </label>

            {/* 8-1-0 OFF DUTY */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              (selectedStatus === '8-1-0' || selectedStatus === '10-7')
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500 shadow-lg shadow-rose-950/30'
                : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}>
              <input
                type="radio"
                name="dutyStatus"
                value="8-1-0"
                checked={selectedStatus === '8-1-0' || selectedStatus === '10-7'}
                onChange={() => setSelectedStatus('8-1-0')}
                className="w-4 h-4 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs text-rose-400">
                  <span>🔴 8-1-0 OFF DUTY</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Selesai Dinas / Lepas Piket</div>
              </div>
            </label>
          </div>
        </div>

        {/* DETAILED DUTY DURATION RECAP CARD (DISPLAYED FOR 8-1-0 OFF DUTY & ACTIVE ON DUTY) */}
        {(selectedStatus === '8-1-0' || selectedStatus === '10-7' || isDuty) && (
          <div className={`p-4 rounded-xl border space-y-3 transition ${
            (selectedStatus === '8-1-0' || selectedStatus === '10-7')
              ? 'bg-gradient-to-b from-[#1C1518] to-[#0D1117] border-rose-900/80 shadow-lg shadow-rose-950/20'
              : 'bg-gradient-to-b from-[#10221A] to-[#0D1117] border-emerald-900/80'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Timer className={`w-4 h-4 ${(selectedStatus === '8-1-0' || selectedStatus === '10-7') ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className={(selectedStatus === '8-1-0' || selectedStatus === '10-7') ? 'text-rose-300' : 'text-emerald-300'}>
                  {(selectedStatus === '8-1-0' || selectedStatus === '10-7') ? 'REKAPITULASI SESI LEPAS DINAS (8-1-0 OFF DUTY)' : 'CATATAN WAKTU DINAS BERJALAN'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                (selectedStatus === '8-1-0' || selectedStatus === '10-7') ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {(selectedStatus === '8-1-0' || selectedStatus === '10-7') ? 'FINAL SHIFT RECAP' : 'LIVE SHIFT TIMER'}
              </span>
            </div>

            {/* Duration Display Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#0D1117] p-2.5 rounded-lg border border-gray-800 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Mulai Dinas (8-1-1)</div>
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{startTimeStr}</span>
                </div>
              </div>

              <div className="bg-[#0D1117] p-2.5 rounded-lg border border-gray-800 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Lepas Dinas (8-1-0)</div>
                <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{endTimeStr}</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border text-center ${
                (selectedStatus === '8-1-0' || selectedStatus === '10-7')
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}>
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Total Lama Dinas</div>
                <div className="text-xs font-bold font-mono tracking-wide">
                  {durationDetailedStr || '0 Menit 0 Detik'}
                </div>
              </div>
            </div>

            {/* Daily Consolidation Badge (e.g. Siang + Malam = 1 Laporan Harian) */}
            {(selectedStatus === '8-1-0' || selectedStatus === '10-7') && todayPriorDutyStats.hasDutyToday && (
              <div className="bg-blue-950/40 border border-blue-800/80 rounded-lg p-2.5 text-xs text-blue-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <span>📊 Akumulasi 1 Laporan Harian (Dinas Siang & Malam)</span>
                    <span className="text-[10px] bg-blue-900 border border-blue-600 px-1.5 py-0.2 rounded font-bold text-blue-100">
                      1 LAPORAN HARIAN
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed">
                    Sesi dinas sebelumnya hari ini: <span className="font-bold text-amber-300">{todayPriorDutyStats.todayFormatted}</span> ({todayPriorDutyStats.sessionsCount} sesi).
                    Total gabungan hari ini menjadi: <span className="font-bold text-emerald-300">{Math.floor(totalTodayAccumulatedMinutes / 60)} Jam {totalTodayAccumulatedMinutes % 60} Menit</span> (seluruh sesi siang & malam otomatis disatukan dan dihitung sebagai <strong>1 Laporan Harian</strong> resmi).
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* EVIDENCE PHOTO UPLOAD SECTION (8-1-1 vs 8-1-0)        */}
        {/* ---------------------------------------------------- */}

        {/* CASE 1: 8-1-1 ON DUTY -> 1 FOTO HP SEBELUM ON DUTY */}
        {(selectedStatus === '8-1-1' || selectedStatus === '10-8') && (
          <div className="p-3.5 bg-[#0D1117] border border-emerald-800/60 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-100 uppercase tracking-wide">
                  Bukti Foto Layar HP Sebelum On Duty (8-1-1)
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                onDutyPhoneImage ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {onDutyPhoneImage ? '✅ Foto Terlampir' : '⚠️ Wajib 1 Foto HP'}
              </span>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              Unggah 1 foto tangkapan layar HP in-game sebelum memulai dinas (menampilkan jam dan status HP).
            </p>

            {/* Hidden Input Files */}
            <input
              type="file"
              ref={onDutyPhoneInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOnDutyPhoneImage, 'on_duty_phone');
                }
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={onDutyPhoneCameraRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOnDutyPhoneImage, 'on_duty_phone');
                }
                e.target.value = '';
              }}
            />

            {/* Image Preview or Upload Dropzone */}
            {onDutyPhoneImage ? (
              <div className="relative group bg-black/60 rounded-lg border border-emerald-800/80 overflow-hidden p-2 flex items-center gap-3">
                <img
                  src={onDutyPhoneImage}
                  alt="Foto HP Sebelum On Duty"
                  className="w-20 h-16 object-cover rounded border border-gray-700 cursor-pointer group-hover:opacity-90 transition"
                  onClick={() => setPreviewLightboxImg({ title: 'Foto Layar HP Sebelum On Duty (8-1-1)', url: onDutyPhoneImage })}
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Foto HP Awal Dinas Terverifikasi</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    Klik gambar untuk melihat ukuran penuh.
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPreviewLightboxImg({ title: 'Foto Layar HP Sebelum On Duty (8-1-1)', url: onDutyPhoneImage })}
                      className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] rounded flex items-center gap-1 transition"
                    >
                      <ZoomIn className="w-3 h-3" /> Perbesar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDutyPhoneInputRef.current?.click()}
                      className="px-2 py-0.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-[10px] rounded flex items-center gap-1 transition"
                    >
                      <Upload className="w-3 h-3" /> Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnDutyPhoneImage('')}
                      className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] rounded flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-700 hover:border-emerald-500 bg-black/40 hover:bg-emerald-950/20 rounded-lg p-3 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
                onClick={() => onDutyPhoneInputRef.current?.click()}
              >
                {isProcessingImg === 'on_duty_phone' ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses foto HP...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-200">
                        Klik untuk Unggah Foto HP Sebelum On Duty (8-1-1)
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Pilih foto dari berkas device atau gunakan kamera HP
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onDutyPhoneInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Upload className="w-3 h-3" />
                        <span>PILIH DARI DEVICE / HP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDutyPhoneCameraRef.current?.click()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded text-[10px] font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Camera className="w-3 h-3" />
                        <span>KAMERA</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASE 2: 8-1-0 OFF DUTY -> 3 FOTO (2 FOTO KEGIATAN + 1 FOTO HP OFF DUTY) */}
        {(selectedStatus === '8-1-0' || selectedStatus === '10-7') && (
          <div className="p-3.5 bg-[#0D1117] border border-rose-900/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-gray-100 uppercase tracking-wide">
                  Upload 3 Berkas Bukti Lepas Dinas (8-1-0)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${
                  isOffDutyPhotosComplete
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                }`}>
                  {isOffDutyPhotosComplete ? '✅ 3 / 3 Foto Lengkap' : `⚠️ ${offDutyUploadedCount} / 3 Foto (Wajib 3)`}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              Sesuai SOP, wajib mengunggah <strong>2 Foto Kegiatan Patroli / Penindakan</strong> dan <strong>1 Foto Layar HP Selesai Dinas</strong>.
            </p>

            {!isOffDutyPhotosComplete && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-700/80 rounded-lg text-[11px] text-rose-200 font-mono flex items-start gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-snug">
                  <div>
                    <strong>Validasi Ketat Lepas Dinas:</strong> Tombol lepas dinas akan <strong>terkunci</strong> jika Anda tidak mengirim 3 foto lengkap (hanya kirim 1 atau 2 tidak diizinkan).
                  </div>
                  <div className="text-[10px] text-rose-300 font-sans">
                    Kurang: <span className="font-semibold text-white">{offDutyMissingSlots.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Master Batch Input for Off Duty */}
            <input
              type="file"
              ref={offDutyBatchInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleBatchOffDutyUpload(e.target.files);
                }
                e.target.value = '';
              }}
            />

            {/* Batch Upload Quick Button */}
            <button
              type="button"
              onClick={() => offDutyBatchInputRef.current?.click()}
              className="w-full py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/60 text-blue-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>PILIH 3 FOTO SEKALIGUS DARI DEVICE (AUTO-SLOT)</span>
            </button>

            {/* Hidden individual inputs for 3 slots */}
            <input
              type="file"
              ref={offDutyAct1InputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyActivityImage1, 'act1');
                }
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={offDutyAct1CameraRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyActivityImage1, 'act1');
                }
                e.target.value = '';
              }}
            />

            <input
              type="file"
              ref={offDutyAct2InputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyActivityImage2, 'act2');
                }
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={offDutyAct2CameraRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyActivityImage2, 'act2');
                }
                e.target.value = '';
              }}
            />

            <input
              type="file"
              ref={offDutyPhoneInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyPhoneImage, 'off_phone');
                }
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={offDutyPhoneCameraRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFileForSlot(e.target.files[0], setOffDutyPhoneImage, 'off_phone');
                }
                e.target.value = '';
              }}
            />

            {/* 3 SLOTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* SLOT 1: FOTO KEGIATAN 1 */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between transition ${
                offDutyActivityImage1 ? 'bg-black/60 border-blue-700/80' : 'bg-black/30 border-gray-800 hover:border-gray-700'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Foto Kegiatan 1
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                      offDutyActivityImage1 ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {offDutyActivityImage1 ? 'TERISI' : 'KOSONG'}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-1 mb-2">Patroli / Penindakan #1</div>
                </div>

                {offDutyActivityImage1 ? (
                  <div className="relative group rounded overflow-hidden aspect-[4/3] bg-black border border-gray-700">
                    <img
                      src={offDutyActivityImage1}
                      alt="Kegiatan 1"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewLightboxImg({ title: 'Foto Kegiatan Patroli #1', url: offDutyActivityImage1 })}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewLightboxImg({ title: 'Foto Kegiatan Patroli #1', url: offDutyActivityImage1 })}
                        className="p-1 bg-blue-600 rounded text-white"
                        title="Perbesar"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOffDutyActivityImage1('')}
                        className="p-1 bg-rose-600 rounded text-white"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => offDutyAct1InputRef.current?.click()}
                    className="border border-dashed border-gray-700 hover:border-blue-500 rounded aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-black/40 hover:bg-blue-950/20"
                  >
                    {isProcessingImg === 'act1' ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[9px] font-bold text-gray-300">+ Pilih Foto</span>
                        <span className="text-[8px] text-gray-500">Device / HP</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* SLOT 2: FOTO KEGIATAN 2 */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between transition ${
                offDutyActivityImage2 ? 'bg-black/60 border-blue-700/80' : 'bg-black/30 border-gray-800 hover:border-gray-700'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Foto Kegiatan 2
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                      offDutyActivityImage2 ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {offDutyActivityImage2 ? 'TERISI' : 'KOSONG'}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-1 mb-2">Patroli / Penindakan #2</div>
                </div>

                {offDutyActivityImage2 ? (
                  <div className="relative group rounded overflow-hidden aspect-[4/3] bg-black border border-gray-700">
                    <img
                      src={offDutyActivityImage2}
                      alt="Kegiatan 2"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewLightboxImg({ title: 'Foto Kegiatan Patroli #2', url: offDutyActivityImage2 })}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewLightboxImg({ title: 'Foto Kegiatan Patroli #2', url: offDutyActivityImage2 })}
                        className="p-1 bg-blue-600 rounded text-white"
                        title="Perbesar"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOffDutyActivityImage2('')}
                        className="p-1 bg-rose-600 rounded text-white"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => offDutyAct2InputRef.current?.click()}
                    className="border border-dashed border-gray-700 hover:border-blue-500 rounded aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-black/40 hover:bg-blue-950/20"
                  >
                    {isProcessingImg === 'act2' ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[9px] font-bold text-gray-300">+ Pilih Foto</span>
                        <span className="text-[8px] text-gray-500">Device / HP</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* SLOT 3: FOTO HP OFF DUTY */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between transition ${
                offDutyPhoneImage ? 'bg-black/60 border-rose-700/80' : 'bg-black/30 border-gray-800 hover:border-gray-700'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Foto HP Selesai
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                      offDutyPhoneImage ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {offDutyPhoneImage ? 'TERISI' : 'KOSONG'}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-1 mb-2">Tunjuk Layar HP Selesai</div>
                </div>

                {offDutyPhoneImage ? (
                  <div className="relative group rounded overflow-hidden aspect-[4/3] bg-black border border-gray-700">
                    <img
                      src={offDutyPhoneImage}
                      alt="Foto HP Off Duty"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewLightboxImg({ title: 'Foto Layar HP Selesai Dinas (8-1-0)', url: offDutyPhoneImage })}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewLightboxImg({ title: 'Foto Layar HP Selesai Dinas (8-1-0)', url: offDutyPhoneImage })}
                        className="p-1 bg-blue-600 rounded text-white"
                        title="Perbesar"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOffDutyPhoneImage('')}
                        className="p-1 bg-rose-600 rounded text-white"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => offDutyPhoneInputRef.current?.click()}
                    className="border border-dashed border-gray-700 hover:border-rose-500 rounded aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-black/40 hover:bg-rose-950/20"
                  >
                    {isProcessingImg === 'off_phone' ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[9px] font-bold text-gray-300">+ Pilih Foto</span>
                        <span className="text-[8px] text-gray-500">HP In-Game</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY / KEGIATAN INPUT (ONLY DISPLAYED WHEN OFF DUTY 8-1-0) */}
        {(selectedStatus === '8-1-0' || selectedStatus === '10-7') && (
          <div className="bg-[#0D1117] p-3 rounded-xl border border-rose-900/60 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-200 block flex items-center justify-between">
              <span>Activity / Kegiatan:</span>
              <span className="text-[10px] font-normal text-gray-400">Ringkasan kegiatan shift</span>
            </label>
            <input
              type="text"
              value={dutyNotes}
              onChange={(e) => setDutyNotes(e.target.value)}
              placeholder="Contoh: Patroli kota, tilang pelanggar lalu lintas, respon 911"
              className="w-full px-2.5 py-2 bg-[#161B22] border border-gray-700 focus:border-rose-500 rounded-lg text-xs text-gray-200 outline-none"
            />
          </div>
        )}

        {/* Discord Webhook Auto-Sync Indicator */}
        <div className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-gray-800 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Globe className={`w-3.5 h-3.5 ${dutyWebhookConfig.webhookUrl.trim() ? 'text-emerald-400' : 'text-gray-500'}`} />
            <span className="text-gray-300 text-[11px]">
              {dutyWebhookConfig.webhookUrl.trim() 
                ? 'Webhook Discord Log Dinas: Siap Terkirim Otomatis' 
                : 'Webhook Discord Log Dinas: Belum Dikonfigurasi'}
            </span>
          </div>

          {dutyWebhookConfig.webhookUrl.trim() ? (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Auto-Sync Active
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono">
              (Atur via Setting & Webhook)
            </span>
          )}
        </div>

        {/* BANNER VALIDASI KETAT 1: OFF DUTY 8-1-0 WAJIB MINIMAL 2 JAM (120 MENIT) */}
        {isOffDutyStatus && !isMinDutySatisfied && (
          <div className="p-3 bg-rose-950/80 border-2 border-rose-600/90 rounded-xl text-rose-200 text-xs font-mono flex items-start gap-2.5 shadow-lg">
            <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-rose-200 flex items-center justify-between">
                <span>🔒 SYARAT DURASI LEPAS DINAS: WAJIB MINIMAL 2 JAM (120 MENIT)</span>
                <span className="text-[11px] bg-rose-900 border border-rose-500 px-2 py-0.5 rounded font-bold text-rose-100">
                  KURANG {missingText.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-rose-300 leading-relaxed">
                Sesuai SOP Kepolisian, durasi dinas wajib minimal <strong>2 Jam (120 Menit)</strong>. Durasi dinas Anda saat ini baru <strong>{Math.floor(currentElapsedMinutes / 60)} Jam {currentElapsedMinutes % 60} Menit</strong>
                {todayPriorDutyStats.hasDutyToday ? ` (Total akumulasi hari ini: ${Math.floor(totalTodayAccumulatedMinutes / 60)} Jam ${totalTodayAccumulatedMinutes % 60} Menit)` : ''}.
                Tombol <strong className="text-white">"SELESAIKAN 8-1-0 (LEPAS DINAS)"</strong> di bawah terkunci hingga syarat durasi terpenuhi.
              </div>
            </div>
          </div>
        )}

        {/* BANNER VALIDASI KETAT 2: OFF DUTY 8-1-0 WAJIB 3 FOTO */}
        {isOffDutyStatus && !isOffDutyPhotosComplete && (
          <div className="p-3 bg-rose-950/80 border-2 border-rose-600/90 rounded-xl text-rose-200 text-xs font-mono flex items-start gap-2.5 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-rose-200 flex items-center justify-between">
                <span>⚠️ SYARAT LEPAS DINAS KETAT: WAJIB MENGUNGGAH 3 BUKTI LENGKAP</span>
                <span className="text-[11px] bg-rose-900 border border-rose-500 px-2 py-0.5 rounded font-bold text-rose-100">
                  {offDutyUploadedCount} / 3 FOTO TERUNGGAH
                </span>
              </div>
              <div className="text-[11px] text-rose-300 leading-relaxed">
                Tombol <strong className="text-white">"SELESAIKAN 8-1-0 (LEPAS DINAS)"</strong> di bawah terkunci dan tidak dapat ditekan jika hanya mengirim 1 atau 2 foto. Anda wajib mengunggah ketiga berkas berikut:
              </div>
              <div className="flex flex-wrap gap-2 pt-1 font-sans text-[11px]">
                <span className={`px-2 py-0.5 rounded border ${offDutyActivityImage1 ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-medium' : 'bg-rose-900/60 border-rose-500 text-rose-200 font-bold animate-pulse'}`}>
                  {offDutyActivityImage1 ? '✓ Foto Kegiatan 1 Terunggah' : '✗ 1. Foto Kegiatan 1 (Kurang)'}
                </span>
                <span className={`px-2 py-0.5 rounded border ${offDutyActivityImage2 ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-medium' : 'bg-rose-900/60 border-rose-500 text-rose-200 font-bold animate-pulse'}`}>
                  {offDutyActivityImage2 ? '✓ Foto Kegiatan 2 Terunggah' : '✗ 2. Foto Kegiatan 2 (Kurang)'}
                </span>
                <span className={`px-2 py-0.5 rounded border ${offDutyPhoneImage ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-medium' : 'bg-rose-900/60 border-rose-500 text-rose-200 font-bold animate-pulse'}`}>
                  {offDutyPhoneImage ? '✓ Foto Layar HP Selesai Terunggah' : '✗ 3. Foto Layar HP Selesai (Kurang)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
          >
            Tutup
          </button>

          <button
            id="btn-submit-duty-status"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            title={
              isOffDutyStatus && !isMinDutySatisfied
                ? `Tombol dinonaktifkan: Wajib dinas minimal 2 Jam (120 Menit). Durasi saat ini baru ${Math.floor(currentElapsedMinutes / 60)} Jam ${currentElapsedMinutes % 60} Menit (kurang ${missingText}).`
                : isOffDutyStatus && !isOffDutyPhotosComplete
                  ? `Tombol dinonaktifkan: Wajib unggah 3 bukti foto (saat ini ${offDutyUploadedCount}/3). Masih kurang: ${offDutyMissingSlots.join(', ')}.`
                  : undefined
            }
            className={`px-5 py-2.5 font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-lg ${
              isSubmitDisabled && isOffDutyStatus
                ? 'bg-rose-950/60 text-rose-400 border-2 border-rose-800/80 cursor-not-allowed opacity-90 shadow-none'
                : (selectedStatus === '8-1-1' || selectedStatus === '10-8')
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengirim Laporan & Berkas Bukti...</span>
              </>
            ) : isOffDutyStatus && !isMinDutySatisfied ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  🔒 MINIMAL DINAS 2 JAM (KURANG {missingText.toUpperCase()})
                </span>
              </>
            ) : isOffDutyStatus && !isOffDutyPhotosComplete ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  🔴 WAJIB 3 FOTO SELESAI ({offDutyUploadedCount}/3 TERUNGGAH)
                </span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>
                  {(selectedStatus === '8-1-1' || selectedStatus === '10-8') ? '🟢 AKTIFKAN 8-1-1 (MULAI DINAS)' : '🔴 SELESAIKAN 8-1-0 (LEPAS DINAS)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LIGHTBOX FULLSCREEN PREVIEW MODAL */}
      {previewLightboxImg && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewLightboxImg(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2.5 bg-[#0F1319] border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                {previewLightboxImg.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewLightboxImg(null)}
                className="w-6 h-6 rounded bg-gray-800 hover:bg-rose-900 text-gray-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={previewLightboxImg.url}
                alt={previewLightboxImg.title}
                className="max-w-full max-h-[70vh] object-contain rounded shadow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-4 py-2 bg-[#0F1319] border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewLightboxImg(null)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

