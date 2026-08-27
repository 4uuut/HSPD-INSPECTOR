import React, { useState, useEffect } from 'react';
import { 
  Microscope, Sparkles, Crosshair, AlertTriangle, 
  CheckCircle2, FileText, Plus, Shield, Search, 
  Copy, Check, X, ArrowRight, Activity, Flame, 
  Layers, FlaskConical, Fingerprint
} from 'lucide-react';
import { OfficerProfile, ForensicAnalysis, ForensicAnalysisType, ForensicMatchResult } from '../types';
import { getSavedForensics, saveForensics } from '../utils/forensicsLabStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../utils/discordWebhook';

interface Props {
  currentOfficer: OfficerProfile | null;
}

export const ForensicsLabBoard: React.FC<Props> = ({ currentOfficer }) => {
  const [analyses, setAnalyses] = useState<ForensicAnalysis[]>(() => getSavedForensics());
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isNewLabModal, setIsNewLabModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Lab Analysis Form
  const [caseRef, setCaseRef] = useState('CAS-2026-');
  const [analysisType, setAnalysisType] = useState<ForensicAnalysisType>('BALLISTICS_MATCH');
  const [sampleDesc, setSampleDesc] = useState('');
  const [findings, setFindings] = useState('');
  const [matchResult, setMatchResult] = useState<ForensicMatchResult>('POSITIVE_MATCH');
  const [matchTarget, setMatchTarget] = useState('');

  // Interactive Crime Lab Simulator State (for live in-situ testing)
  const [simTestType, setSimTestType] = useState<'GSR' | 'BALLISTICS' | 'DRUG_PURITY' | 'FINGERPRINT'>('GSR');
  const [simRunning, setSimRunning] = useState(false);
  const [simOutput, setSimOutput] = useState<string | null>(null);

  // Sync listener
  useEffect(() => {
    const handleSync = () => setAnalyses(getSavedForensics());
    window.addEventListener('hspd-forensics-updated', handleSync);
    return () => window.removeEventListener('hspd-forensics-updated', handleSync);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Run Simulator Test
  const handleRunSimulator = () => {
    setSimRunning(true);
    setSimOutput(null);

    setTimeout(() => {
      setSimRunning(false);
      if (simTestType === 'GSR') {
        setSimOutput('🔬 HASIL UJI GSR (Griess Reagent): POSITIF RESIDU TIMBAL & MESIU! Tersangka melepaskan tembakan dalam 6 jam terakhir (Kadar Nitrit: 92.4%).');
      } else if (simTestType === 'BALLISTICS') {
        setSimOutput('🎯 HASIL UJI BALISTIK (IBIS Striation Match): 98.7% KECOCOKAN ALUR LARAS dengan Senjata Glock 19 (Serial: HSPD-9921) yang disita di TKP!');
      } else if (simTestType === 'DRUG_PURITY') {
        setSimOutput('🧪 HASIL UJI KEMURNIAN KIMIA (Marquis Reagent): POSITIF METHAMPHETAMINE KELAS TINGGI! Kemurnian zat aktif: 93.8% (Kategori: Narkotika Kelas 1).');
      } else {
        setSimOutput('🖐️ HASIL PEMINDAIAN SIDIK JARI (AFIS Latent Scan): DITEMUKAN KECOCOKAN 10-TITIK MINUTIAE dengan Database KTP Sipil: Trevor Philips (LS-10293).');
      }
    }, 1800);
  };

  // Save new record
  const handleCreateAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleDesc.trim() || !findings.trim()) return;

    const labNum = `LAB-${new Date().getFullYear()}-${String(analyses.length + 92).padStart(4, '0')}`;
    const newRecord: ForensicAnalysis = {
      id: `lab-${Date.now()}`,
      labNumber: labNum,
      caseReference: caseRef.trim() || 'CAS-UNASSIGNED',
      examinerName: currentOfficer?.name || 'Crime Lab Forensics Specialist',
      examinerBadge: currentOfficer?.badge || '#001',
      analysisType,
      sampleDescription: sampleDesc.trim(),
      findings: findings.trim(),
      matchResult,
      matchTarget: matchTarget.trim() || 'N/A',
      timestamp: Date.now()
    };

    const updated = [newRecord, ...analyses];
    setAnalyses(updated);
    saveForensics(updated);

    // Discord Webhook
    const webhook = getDiscordWebhookConfig();
    if (webhook?.webhookUrl) {
      sendDiscordLog(webhook.webhookUrl, {
        title: `🔬 CRIME LAB FORENSICS REPORT: ${newRecord.labNumber}`,
        description: `📋 **Kasus Terkait:** ${newRecord.caseReference}\n🧪 **Jenis Uji:** ${newRecord.analysisType}\n👤 **Pemeriksa:** ${newRecord.examinerName} (${newRecord.examinerBadge})\n🔍 **Temuan:** ${newRecord.findings}\n⚖️ **Hasil:** ${newRecord.matchResult} -> ${newRecord.matchTarget}`,
        color: newRecord.matchResult === 'POSITIVE_MATCH' || newRecord.matchResult === 'CONFIRMED_CONTRABAND' ? 0x22c55e : 0x94a3b8
      });
    }

    setSampleDesc('');
    setFindings('');
    setMatchTarget('');
    setIsNewLabModal(false);
  };

  const filteredAnalyses = analyses.filter(a => {
    if (activeFilter === 'ALL') return true;
    return a.analysisType === activeFilter;
  });

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-teal-950/50 via-[#12181C] to-[#141E24] border border-teal-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 shrink-0 shadow-lg shadow-teal-950/50">
            <Microscope className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase tracking-wider">
                CRIME LAB & BALLISTICS
              </span>
              <span className="text-[10px] text-gray-400 font-sans">
                {analyses.length} Laporan Uji Forensik Terverifikasi
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-100 mt-0.5 tracking-tight">
              Laboratorium Forensik, Uji Balistik & Residu Mesiu (GSR)
            </h2>
            <p className="text-[11px] text-gray-400 font-sans">
              Pencocokan alur peluru selongsong TKP (Ballistics), uji usap residu mesiu di tangan tersangka (GSR), pengujian kemurnian narkotika, dan pemindaian sidik jari laten (AFIS).
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewLabModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-black font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-teal-950/50 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ INPUT LAPORAN UJI LAB</span>
        </button>
      </div>

      {/* Interactive Live Crime Lab Test Station (Instant Field Testing) */}
      <div className="p-4 bg-[#141820] border border-teal-800/70 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
            <FlaskConical className="w-4 h-4" />
            <span>STASIUN PENGUJIAN SAMPEL CEPAT (RAPID FIELD FORENSICS TESTER)</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">Status Spektrometer: ONLINE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => setSimTestType('GSR')}
            className={`p-2.5 rounded-xl border text-left transition ${
              simTestType === 'GSR' ? 'bg-teal-950 border-teal-500 text-teal-200' : 'bg-[#0A0D12] border-gray-800 text-gray-400'
            }`}
          >
            <div className="font-bold">🔫 Uji Residu Mesiu (GSR)</div>
            <div className="text-[10px] text-gray-500 font-sans mt-0.5">Uji swab tangan tersangka</div>
          </button>

          <button
            onClick={() => setSimTestType('BALLISTICS')}
            className={`p-2.5 rounded-xl border text-left transition ${
              simTestType === 'BALLISTICS' ? 'bg-teal-950 border-teal-500 text-teal-200' : 'bg-[#0A0D12] border-gray-800 text-gray-400'
            }`}
          >
            <div className="font-bold">🎯 Uji Balistik Proyektil</div>
            <div className="text-[10px] text-gray-500 font-sans mt-0.5">Cocokkan alur striasi laras</div>
          </button>

          <button
            onClick={() => setSimTestType('DRUG_PURITY')}
            className={`p-2.5 rounded-xl border text-left transition ${
              simTestType === 'DRUG_PURITY' ? 'bg-teal-950 border-teal-500 text-teal-200' : 'bg-[#0A0D12] border-gray-800 text-gray-400'
            }`}
          >
            <div className="font-bold">🧪 Uji Kemurnian Narkoba</div>
            <div className="text-[10px] text-gray-500 font-sans mt-0.5">Marquis / Scott reagent</div>
          </button>

          <button
            onClick={() => setSimTestType('FINGERPRINT')}
            className={`p-2.5 rounded-xl border text-left transition ${
              simTestType === 'FINGERPRINT' ? 'bg-teal-950 border-teal-500 text-teal-200' : 'bg-[#0A0D12] border-gray-800 text-gray-400'
            }`}
          >
            <div className="font-bold">🖐️ Pindai Sidik Jari (AFIS)</div>
            <div className="text-[10px] text-gray-500 font-sans mt-0.5">Minutiae database match</div>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleRunSimulator}
            disabled={simRunning}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-black font-extrabold rounded-xl transition flex items-center gap-2 shadow-md"
          >
            {simRunning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>MENGANALISIS SAMPEL DI LAB...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>JALANKAN UJI SPEKTROMETER DIGITAL</span>
              </>
            )}
          </button>

          {simOutput && (
            <button
              onClick={() => {
                setFindings(simOutput);
                setIsNewLabModal(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1"
            >
              <span>+ Masukkan Hasil ke Laporan Resmi</span>
            </button>
          )}
        </div>

        {simOutput && (
          <div className="p-3 bg-[#0A0D12] border border-teal-500/80 rounded-xl text-teal-200 text-xs font-sans animate-fadeIn">
            {simOutput}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeFilter === 'ALL' ? 'bg-teal-600 text-black shadow' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Semua Hasil Lab ({analyses.length})
        </button>

        <button
          onClick={() => setActiveFilter('BALLISTICS_MATCH')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeFilter === 'BALLISTICS_MATCH' ? 'bg-teal-600 text-black shadow' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Uji Balistik
        </button>

        <button
          onClick={() => setActiveFilter('GSR_SWAB_TEST')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeFilter === 'GSR_SWAB_TEST' ? 'bg-teal-600 text-black shadow' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Uji Residu GSR
        </button>

        <button
          onClick={() => setActiveFilter('DRUG_PURITY_TEST')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeFilter === 'DRUG_PURITY_TEST' ? 'bg-teal-600 text-black shadow' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Uji Narkotika
        </button>
      </div>

      {/* Analysis Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAnalyses.map((item) => {
          const isMatch = item.matchResult === 'POSITIVE_MATCH' || item.matchResult === 'CONFIRMED_CONTRABAND';
          return (
            <div
              key={item.id}
              className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3 hover:border-gray-700 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100 text-xs">{item.labNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-gray-700 text-gray-400 font-mono">
                      Ref: {item.caseReference}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isMatch
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {item.matchResult}
                  </span>
                </div>

                <div className="text-xs font-bold text-teal-300">
                  {item.analysisType.replace(/_/g, ' ')}
                </div>

                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs font-sans">
                  <div className="text-gray-400">📦 Sampel Bukti: <strong className="text-gray-200">{item.sampleDescription}</strong></div>
                  <div className="text-gray-400">🎯 Hasil Cocok Ke: <strong className="text-amber-300">{item.matchTarget}</strong></div>
                </div>

                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {item.findings}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Pemeriksa: {item.examinerName} ({item.examinerBadge})</span>
                <span>{new Date(item.timestamp).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: INPUT FORENSIC REPORT */}
      {isNewLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-lg bg-[#0F1318] border border-teal-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-teal-400 text-sm">INPUT LAPORAN UJI LAB FORENSIK RESMI</span>
              <button onClick={() => setIsNewLabModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAnalysis} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nomor Referensi Kasus (CID) *</label>
                  <input
                    type="text"
                    required
                    value={caseRef}
                    onChange={(e) => setCaseRef(e.target.value)}
                    placeholder="CAS-2026-0012"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Jenis Pengujian Lab</label>
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  >
                    <option value="BALLISTICS_MATCH">BALLISTICS MATCH (Uji Striasi Laras)</option>
                    <option value="GSR_SWAB_TEST">GSR SWAB TEST (Residu Mesiu Tangan)</option>
                    <option value="DRUG_PURITY_TEST">DRUG PURITY TEST (Uji Kemurnian Narkoba)</option>
                    <option value="FINGERPRINT_SCAN">FINGERPRINT SCAN (Sidik Jari AFIS)</option>
                    <option value="DNA_MATCH">DNA SAMPLE MATCHING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Deskripsi Sampel Bukti TKP *</label>
                <input
                  type="text"
                  required
                  value={sampleDesc}
                  onChange={(e) => setSampleDesc(e.target.value)}
                  placeholder="Contoh: Selongsong peluru 9mm dievakuasi dari pilar bank"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Hasil Verifikasi Lab</label>
                  <select
                    value={matchResult}
                    onChange={(e) => setMatchResult(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  >
                    <option value="POSITIVE_MATCH">POSITIVE MATCH (Terbukti Cocok)</option>
                    <option value="CONFIRMED_CONTRABAND">CONFIRMED CONTRABAND (Narkotika/Bahan Terlarang)</option>
                    <option value="NEGATIVE_MATCH">NEGATIVE MATCH (Tidak Ada Kecocokan)</option>
                    <option value="INCONCLUSIVE">INCONCLUSIVE (Sampel Kurang / Rusak)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Target / Pemilik Teridentifikasi</label>
                  <input
                    type="text"
                    value={matchTarget}
                    onChange={(e) => setMatchTarget(e.target.value)}
                    placeholder="Contoh: Senjata Glock 19 #9921 / Tersangka"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Uraian Temuan Ilmiah Forensik *</label>
                <textarea
                  rows={3}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Rincian hasil mikroskop komparasi, persentase kemurnian zat, dan nomor registrasi laras..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewLabModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-black font-bold rounded-lg">Publikasikan Laporan Lab</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
