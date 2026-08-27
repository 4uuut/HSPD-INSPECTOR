import React, { useState } from 'react';
import { 
  Plus, Shield, AlertOctagon, Scale, 
  Check, Copy, FileText, Send, X, UserCheck
} from 'lucide-react';
import { IadComplaint, OfficerProfile } from '../../types';
import { saveIadComplaints } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface IadHearingPanelProps {
  iadComplaints: IadComplaint[];
  onUpdateComplaints: (complaints: IadComplaint[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const IadHearingPanel: React.FC<IadHearingPanelProps> = ({
  iadComplaints,
  onUpdateComplaints,
  currentOfficer
}) => {
  const [isNewComplaintModal, setIsNewComplaintModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states
  const [accusedName, setAccusedName] = useState('');
  const [accusedBadge, setAccusedBadge] = useState('');
  const [accusedRank, setAccusedRank] = useState('Officer II');
  const [allegationCategory, setAllegationCategory] = useState<'EXCESSIVE_FORCE' | 'CORRUPTION' | 'UNPROFESSIONAL_CONDUCT' | 'EVIDENCE_TAMPERING' | 'UNAUTHORIZED_WEAPON_DISCHARGE' | 'PROCEDURAL_VIOLATION'>('PROCEDURAL_VIOLATION');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [narrative, setNarrative] = useState('');

  // Selected complaint for review
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(iadComplaints[0]?.id || null);
  const activeCase = iadComplaints.find(c => c.id === selectedCaseId) || iadComplaints[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accusedName.trim() || !narrative.trim()) return;

    const newCase: IadComplaint = {
      id: `iad-${Date.now()}`,
      caseNumber: `IAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      complainantName: currentOfficer?.name || 'Pelapor Internal',
      complainantType: 'OFFICER_INTERNAL',
      accusedOfficerName: accusedName.trim(),
      accusedOfficerBadge: accusedBadge.trim() || '#N/A',
      accusedOfficerRank: accusedRank,
      allegationCategory,
      incidentDate: new Date().toISOString().split('T')[0],
      incidentLocation: incidentLocation.trim() || 'Los Santos Area',
      narrative: narrative.trim(),
      investigatorName: currentOfficer ? `${currentOfficer.name} (IAD Investigator)` : 'IAD Internal Affairs',
      status: 'UNDER_INVESTIGATION',
      createdAt: Date.now()
    };

    const updated = [newCase, ...iadComplaints];
    onUpdateComplaints(updated);
    saveIadComplaints(updated);
    setSelectedCaseId(newCase.id);
    setIsNewComplaintModal(false);

    // Reset Form
    setAccusedName('');
    setAccusedBadge('');
    setNarrative('');
  };

  const handleUpdateStatusAndSanction = (caseId: string, status: any, sanction?: any) => {
    const updated = iadComplaints.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status,
          recommendedSanction: sanction || c.recommendedSanction,
          resolvedAt: status === 'SUSTAINED' || status === 'EXONERATED' || status === 'UNFOUNDED' ? Date.now() : undefined
        };
      }
      return c;
    });
    onUpdateComplaints(updated);
    saveIadComplaints(updated);
  };

  const handleSendIadDiscord = async (c: IadComplaint) => {
    const cfg = getDiscordWebhookConfig();
    if (!cfg.webhookUrl) {
      alert('Webhook Discord belum disetting.');
      return;
    }

    const success = await sendDiscordLog(cfg.webhookUrl, {
      title: `⚖️ PUTUSAN AUDIT ETIK & DISIPLIN IAD: ${c.caseNumber}`,
      description: `Laporan Hasil Pemeriksaan Divisi Propam / Internal Affairs Division HSPD`,
      color: 0x9333ea,
      fields: [
        { name: 'Nomor Berkas IAD', value: `\`${c.caseNumber}\``, inline: true },
        { name: 'Petugas Terlapor', value: `**${c.accusedOfficerName}** (${c.accusedOfficerBadge})`, inline: true },
        { name: 'Kategori Pelanggaran', value: c.allegationCategory, inline: true },
        { name: 'Status Sidang', value: `**${c.status}**`, inline: true },
        { name: 'Sanksi Dijatuhkan', value: c.recommendedSanction ? `⚠️ **${c.recommendedSanction}**` : 'Nihil Sanksi', inline: true },
        { name: 'Pemeriksa IAD', value: c.investigatorName, inline: true },
        { name: 'Kronologi Singkat', value: c.narrative, inline: false }
      ]
    });

    if (success) {
      alert('✅ Berkas putusan IAD berhasil dikirim ke Webhook Discord!');
    }
  };

  const garrityWarningText = `[GARRITY WARNING - HAK PEMERIKSAAN INTERNAL PETUGAS]
"Anda sedang diwawancarai sebagai bagian dari investigasi administratif resmi oleh Internal Affairs Division. Pertanyaan yang diajukan berkaitan langsung dengan kinerja dan kewajiban dinas Anda. Anda diwajibkan menjawab dengan jujur. Jawaban Anda tidak dapat digunakan untuk melawan Anda dalam penuntutan pidana, namun penolakan menjawab dapat berakibat pada pemecatan disipliner secara administratif."`;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <span>INTERNAL AFFAIRS DIVISION (IAD / PROPAM & DISIPLIN)</span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Penanganan pengaduan etik, investigasi penyalahgunaan wewenang, dan penegakan sanksi disipliner kepolisian.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewComplaintModal(true)}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ REGISTRASI PENGADUAN IAD</span>
        </button>
      </div>

      {/* Garrity Warning & Active Case Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Active Case Review Form */}
        {activeCase ? (
          <div className="lg:col-span-2 p-4 bg-[#141820] border-2 border-purple-800/80 rounded-2xl space-y-3 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  {activeCase.caseNumber}
                </span>
                <span className="font-bold text-gray-100 text-sm">Terlapor: {activeCase.accusedOfficerName} ({activeCase.accusedOfficerBadge})</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                activeCase.status === 'SUSTAINED'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : activeCase.status === 'EXONERATED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}>
                STATUS: {activeCase.status}
              </span>
            </div>

            <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Kategori: <strong className="text-amber-400 font-mono">{activeCase.allegationCategory}</strong></div>
                <div>Investigator: <strong className="text-gray-200">{activeCase.investigatorName}</strong></div>
                <div>Pangkat: <span className="text-gray-300">{activeCase.accusedOfficerRank}</span></div>
                <div>Lokasi Kejadian: <span className="text-gray-300">{activeCase.incidentLocation}</span></div>
              </div>
              <div className="text-gray-300 text-xs leading-relaxed pt-1 border-t border-gray-800/60">
                <strong>Kronologi Pengaduan:</strong><br />
                {activeCase.narrative}
              </div>
            </div>

            {/* Verdict & Sanctions Controller */}
            <div className="p-3 bg-[#0A0D12] rounded-xl border border-purple-900/60 space-y-2 font-sans">
              <div className="font-bold text-purple-300 text-xs">KEPUTUSAN SIDANG ETIK & REKOMENDASI SANKSI:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatusAndSanction(activeCase.id, 'SUSTAINED', 'STRIKE_WARNING')}
                  className="px-2.5 py-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-bold border border-amber-700"
                >
                  ⚠️ TERBUKTI (SP-1 / STRIKE)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatusAndSanction(activeCase.id, 'SUSTAINED', 'SUSPENSION_DUTY')}
                  className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold border border-rose-700"
                >
                  🚫 SKORSING TUGAS (SUSPENSION)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatusAndSanction(activeCase.id, 'EXONERATED')}
                  className="px-2.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold border border-emerald-700"
                >
                  ✅ EXONERATED (SESUAI SOP)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatusAndSanction(activeCase.id, 'UNFOUNDED')}
                  className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold border border-gray-700"
                >
                  ❌ TIDAK TERBUKTI (UNFOUNDED)
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400">
                  Sanksi Terdaftar: <strong className="text-amber-300">{activeCase.recommendedSanction || 'Belum Ada Sanksi'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSendIadDiscord(activeCase)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 font-mono"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Putusan ke Discord</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Garrity Warning Generator Tool */}
        <div className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-gray-100 text-xs">PANDUAN GARRITY WARNING</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Wajib dibacakan kepada petugas yang diperiksa sebelum wawancara penyelidikan etik administratif IAD dimulai.
          </p>
          <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300 leading-relaxed">
            {garrityWarningText}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(garrityWarningText, 'garrity')}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            {copiedText === 'garrity' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === 'garrity' ? 'Tersalin ke Clipboard!' : 'Salin Naskah Garrity Warning'}</span>
          </button>
        </div>
      </div>

      {/* Case Complaints List */}
      <div className="space-y-2">
        <div className="font-bold text-gray-300 text-xs">DAFTAR SEMUA BERKAS INVESTIGASI IAD:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {iadComplaints.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                c.id === selectedCaseId
                  ? 'bg-[#191522] border-purple-500 shadow-md ring-1 ring-purple-500/50'
                  : 'bg-[#141820] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-900">
                    {c.caseNumber}
                  </span>
                  <span className="font-bold text-gray-200 text-xs">{c.accusedOfficerName} ({c.accusedOfficerBadge})</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  c.status === 'SUSTAINED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : c.status === 'EXONERATED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                }`}>
                  {c.status}
                </span>
              </div>

              <div className="text-[11px] text-gray-400">
                Pelanggaran: <strong className="text-amber-400">{c.allegationCategory}</strong>
              </div>

              <p className="text-[11px] text-gray-300 line-clamp-1 italic">
                "{c.narrative}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New IAD Complaint Modal */}
      {isNewComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-purple-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-purple-400 text-sm">REGISTRASI PENGADUAN DISIPLIN IAD BARU</span>
              <button onClick={() => setIsNewComplaintModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateComplaint} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Petugas Terlapor *</label>
                  <input
                    type="text"
                    required
                    value={accusedName}
                    onChange={(e) => setAccusedName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nomor Badge</label>
                  <input
                    type="text"
                    value={accusedBadge}
                    onChange={(e) => setAccusedBadge(e.target.value)}
                    placeholder="#123"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Pangkat</label>
                  <input
                    type="text"
                    value={accusedRank}
                    onChange={(e) => setAccusedRank(e.target.value)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Kategori Dugaan</label>
                  <select
                    value={allegationCategory}
                    onChange={(e) => setAllegationCategory(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  >
                    <option value="PROCEDURAL_VIOLATION">Pelanggaran SOP / Prosedural</option>
                    <option value="EXCESSIVE_FORCE">Penggunaan Kekuatan Berlebih</option>
                    <option value="CORRUPTION">Korupsi & Suap (Bribery)</option>
                    <option value="UNPROFESSIONAL_CONDUCT">Perilaku Tidak Profesional</option>
                    <option value="UNAUTHORIZED_WEAPON_DISCHARGE">Lepas Tembakan Tanpa Izin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lokasi TKP Kejadian</label>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="Contoh: Sel Tahanan MRPD"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Kronologi & Alasan Pengaduan *</label>
                <textarea
                  rows={3}
                  required
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Ceritakan fakta kronologi pelanggaran..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewComplaintModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">Daftarkan Kasus IAD</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
