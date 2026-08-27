import React, { useState } from 'react';
import { 
  Plus, Award, BookOpen, Star, 
  Check, Copy, Send, X, FileText, CheckCircle2
} from 'lucide-react';
import { CadetEvaluation, OfficerProfile } from '../../types';
import { saveCadetEvals } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface AcademyFtoPanelProps {
  cadetEvals: CadetEvaluation[];
  onUpdateEvals: (evals: CadetEvaluation[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const AcademyFtoPanel: React.FC<AcademyFtoPanelProps> = ({
  cadetEvals,
  onUpdateEvals,
  currentOfficer
}) => {
  const [isNewEvalModal, setIsNewEvalModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states
  const [cadetName, setCadetName] = useState('');
  const [cadetBadge, setCadetBadge] = useState('');
  const [phase, setPhase] = useState<'PHASE 1 (OBSERVATION)' | 'PHASE 2 (BASIC PATROL)' | 'PHASE 3 (SOLO SHADOW)' | 'FINAL EVALUATION'>('PHASE 2 (BASIC PATROL)');
  const [drivingScore, setDrivingScore] = useState(4);
  const [radioCommsScore, setRadioCommsScore] = useState(4);
  const [pasalApplicationScore, setPasalApplicationScore] = useState(4);
  const [tacticalShootScore, setTacticalShootScore] = useState(4);
  const [mirandaRightsScore, setMirandaRightsScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<'PASS_TO_NEXT_PHASE' | 'GRADUATE_TO_PO1' | 'RE_EVALUATE' | 'ACADEMY_DISMISSAL'>('PASS_TO_NEXT_PHASE');

  const calculateGrade = (avg: number) => {
    if (avg >= 4.5) return 'OUTSTANDING';
    if (avg >= 3.5) return 'SATISFACTORY';
    if (avg >= 2.5) return 'NEEDS_IMPROVEMENT';
    return 'UNSATISFACTORY';
  };

  const handleCreateEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadetName.trim()) return;

    const avg = (drivingScore + radioCommsScore + pasalApplicationScore + tacticalShootScore + mirandaRightsScore) / 5;
    const overallGrade = calculateGrade(avg);

    const newEval: CadetEvaluation = {
      id: `eval-${Date.now()}`,
      cadetName: cadetName.trim(),
      cadetBadge: cadetBadge.trim() || '#CADET',
      ftoName: currentOfficer?.name || 'Senior FTO Officer',
      ftoBadge: currentOfficer?.badge || '#FTO-01',
      phase,
      drivingScore,
      radioCommsScore,
      pasalApplicationScore,
      tacticalShootScore,
      mirandaRightsScore,
      overallGrade,
      notes: notes.trim() || 'Evaluasi berjalan sesuai modul FTO.',
      recommendation,
      evaluatedAt: Date.now()
    };

    const updated = [newEval, ...cadetEvals];
    onUpdateEvals(updated);
    saveCadetEvals(updated);
    setIsNewEvalModal(false);

    // Reset
    setCadetName('');
    setCadetBadge('');
    setNotes('');
  };

  const handleSendDiscordEval = async (ev: CadetEvaluation) => {
    const cfg = getDiscordWebhookConfig();
    if (!cfg.webhookUrl) {
      alert('Webhook Discord belum disetting.');
      return;
    }

    const success = await sendDiscordLog(cfg.webhookUrl, {
      title: `🎓 RAPOR EVALUASI FTO / AKADEMI KEPOLISIAN: ${ev.cadetName}`,
      description: `Laporan Penilaian Lapangan Field Training Officer (FTO) untuk Siswa Cadet HSPD`,
      color: 0x059669,
      fields: [
        { name: 'Siswa Cadet', value: `**${ev.cadetName}** (${ev.cadetBadge})`, inline: true },
        { name: 'Fase Pelatihan', value: ev.phase, inline: true },
        { name: 'Predikat Akhir', value: `🏆 **${ev.overallGrade}**`, inline: true },
        { name: 'Rekomendasi FTO', value: `⭐ **${ev.recommendation}**`, inline: true },
        { name: 'Skor Mengemudi (EVOC)', value: `${ev.drivingScore}/5 ⭐`, inline: true },
        { name: 'Skor Radio 10-Codes', value: `${ev.radioCommsScore}/5 ⭐`, inline: true },
        { name: 'Skor Hak Miranda', value: `${ev.mirandaRightsScore}/5 ⭐`, inline: true },
        { name: 'Skor Pengetahuan KUHP', value: `${ev.pasalApplicationScore}/5 ⭐`, inline: true },
        { name: 'Catatan Instruktur FTO', value: ev.notes, inline: false },
        { name: 'Penguji FTO', value: `${ev.ftoName} (${ev.ftoBadge})`, inline: true }
      ]
    });

    if (success) {
      alert('✅ Rapor FTO berhasil dikirim ke Webhook Discord!');
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <span>POLICE ACADEMY & FIELD TRAINING DIVISION (FTO)</span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Penilaian kompetensi siswa cadet, modul kurikulum patroli, dan sertifikasi kenaikan pangkat Officer I (PO-1).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewEvalModal(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ INPUT RAPOR EVALUASI FTO</span>
        </button>
      </div>

      {/* Evaluations Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {cadetEvals.map((ev) => (
          <div key={ev.id} className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <h4 className="font-bold text-gray-100 text-sm flex items-center gap-1.5">
                  <span>{ev.cadetName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {ev.cadetBadge}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono">FTO: {ev.ftoName} ({ev.ftoBadge})</p>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  ev.overallGrade === 'OUTSTANDING'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : ev.overallGrade === 'SATISFACTORY'
                    ? 'bg-blue-950 text-blue-300 border border-blue-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {ev.overallGrade}
                </span>
                <div className="text-[10px] text-emerald-400 font-mono mt-1">{ev.phase}</div>
              </div>
            </div>

            {/* Competency Metric Sliders */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">EVOC Driving:</span>
                <span className="font-bold text-emerald-400">{ev.drivingScore} / 5 ⭐</span>
              </div>
              <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">Radio 10-Codes:</span>
                <span className="font-bold text-emerald-400">{ev.radioCommsScore} / 5 ⭐</span>
              </div>
              <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">KUHP & Pasal:</span>
                <span className="font-bold text-emerald-400">{ev.pasalApplicationScore} / 5 ⭐</span>
              </div>
              <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400">Hak Miranda:</span>
                <span className="font-bold text-emerald-400">{ev.mirandaRightsScore} / 5 ⭐</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs">
              <div className="text-gray-400">Rekomendasi: <strong className="text-amber-300">{ev.recommendation}</strong></div>
              <p className="text-gray-300 leading-relaxed italic">"{ev.notes}"</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSendDiscordEval(ev)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 font-mono"
              >
                <Send className="w-3 h-3" />
                <span>Kirim Rapor ke Discord</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Cadet Evaluation Modal */}
      {isNewEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-emerald-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-emerald-400 text-sm">INPUT RAPOR EVALUASI FTO CADET</span>
              <button onClick={() => setIsNewEvalModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateEval} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Siswa Cadet *</label>
                  <input
                    type="text"
                    required
                    value={cadetName}
                    onChange={(e) => setCadetName(e.target.value)}
                    placeholder="Nama Cadet"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Badge Cadet</label>
                  <input
                    type="text"
                    value={cadetBadge}
                    onChange={(e) => setCadetBadge(e.target.value)}
                    placeholder="#301"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Fase Pelatihan</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  <option value="PHASE 1 (OBSERVATION)">PHASE 1 (Observasi & Penumpang)</option>
                  <option value="PHASE 2 (BASIC PATROL)">PHASE 2 (Patroli Dasar Mengemudi)</option>
                  <option value="PHASE 3 (SOLO SHADOW)">PHASE 3 (Solo Shadowing)</option>
                  <option value="FINAL EVALUATION">FINAL EVALUATION (Kelulusan)</option>
                </select>
              </div>

              <div className="space-y-2 border-y border-gray-800 py-2">
                <div className="flex justify-between items-center">
                  <span>EVOC Mengemudi & Pengejaran ({drivingScore}/5):</span>
                  <input type="range" min="1" max="5" value={drivingScore} onChange={e => setDrivingScore(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Komunikasi Radio 10-Codes ({radioCommsScore}/5):</span>
                  <input type="range" min="1" max="5" value={radioCommsScore} onChange={e => setRadioCommsScore(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Penerapan Pasal KUHP ({pasalApplicationScore}/5):</span>
                  <input type="range" min="1" max="5" value={pasalApplicationScore} onChange={e => setPasalApplicationScore(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Pembacaan Hak Miranda ({mirandaRightsScore}/5):</span>
                  <input type="range" min="1" max="5" value={mirandaRightsScore} onChange={e => setMirandaRightsScore(Number(e.target.value))} />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Rekomendasi FTO</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="PASS_TO_NEXT_PHASE">LULUS KE FASE BERIKUTNYA (PASS)</option>
                  <option value="GRADUATE_TO_PO1">LULUS AKADEMI KE POLICE OFFICER I (PO-1)</option>
                  <option value="RE_EVALUATE">EVALUASI ULANG / REMEDIAL</option>
                  <option value="ACADEMY_DISMISSAL">DROP OUT / PEMBERHENTIAN</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Catatan Kelebihan & Evaluasi FTO</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan kelemahan atau kelebihan cadet..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewEvalModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">Simpan Rapor FTO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
