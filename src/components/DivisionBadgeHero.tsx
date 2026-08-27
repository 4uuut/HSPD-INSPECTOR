import React from 'react';
import { 
  Shield, Award, Crosshair, Search, Radio, KeyRound, 
  Sparkles, CheckCircle2, ChevronRight, Lock, Eye, AlertTriangle
} from 'lucide-react';
import { OfficerProfile, isOfficerHighRank, getDivisionArchetype } from '../types';

interface Props {
  currentOfficer: OfficerProfile;
  totalCases: number;
  totalRecords: number;
  totalRoster: number;
  activeBoloCount: number;
}

export const DivisionBadgeHero: React.FC<Props> = ({
  currentOfficer,
  totalCases,
  totalRecords,
  totalRoster,
  activeBoloCount
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const archetype = getDivisionArchetype(currentOfficer.division, currentOfficer.rank);

  const getDivisionTheme = () => {
    switch (archetype) {
      case 'COMMAND':
        return {
          badge: '👑 HIGH COMMAND HQ',
          bgGradient: 'from-amber-950/60 via-[#161B22] to-amber-900/30',
          borderColor: 'border-amber-600/70',
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-500/20',
          roleTitle: 'Otoritas Komando Tertinggi',
          roleDesc: 'Memegang kendali penuh otorisasi PIN, promosi/demosi anggota, persetujuan surat penangkapan (warrant), dan integrasi Discord Webhook.',
          icon: Award,
          tagColor: 'bg-amber-950 text-amber-300 border-amber-700/60',
          hudTitle: 'HQ COMMAND CLEARANCE LEVEL 5'
        };
      case 'DETECTIVE':
        return {
          badge: '🔍 DETECTIVE & CID BUREAU',
          bgGradient: 'from-indigo-950/60 via-[#161B22] to-blue-950/40',
          borderColor: 'border-indigo-600/70',
          accentText: 'text-indigo-400',
          accentBg: 'bg-indigo-500/20',
          roleTitle: 'Biro Investigasi Kriminal & Forensik',
          roleDesc: 'Penyelidikan kasus kriminal berat, analisis barang bukti balistik/sidik jari, pemetaan sindikat geng, dan pengajuan surat penggeledahan.',
          icon: Search,
          tagColor: 'bg-indigo-950 text-indigo-300 border-indigo-700/60',
          hudTitle: 'CRIMINAL INVESTIGATION TERMINAL'
        };
      case 'SWAT':
        return {
          badge: '⚡ SWAT / TACTICAL SPECIAL OPS',
          bgGradient: 'from-red-950/50 via-[#161B22] to-neutral-900/50',
          borderColor: 'border-red-600/70',
          accentText: 'text-red-400',
          accentBg: 'bg-red-500/20',
          roleTitle: 'Satuan Taktis & Operasi Khusus',
          roleDesc: 'Penyerbuan barikade, pembebasan sandera, penanganan buronan bersenjata berat (Code Red), dan pengamanan perimeter situasi kritis.',
          icon: Crosshair,
          tagColor: 'bg-red-950 text-red-300 border-red-700/60',
          hudTitle: 'TACTICAL INTERVENTION SYSTEM'
        };
      case 'TRAFFIC':
        return {
          badge: '🚗 TRAFFIC & HIGHWAY PATROL',
          bgGradient: 'from-emerald-950/50 via-[#161B22] to-teal-950/40',
          borderColor: 'border-emerald-600/70',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-500/20',
          roleTitle: 'Divisi Lalu Lintas & Penertiban Jalan Raya',
          roleDesc: 'Penanganan tilang kecepatan (Speeding), razia balap liar, pengelolaan garasi sitaan / impound lot, dan olah TKP laka lantas.',
          icon: Radio,
          tagColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
          hudTitle: 'HIGHWAY ENFORCEMENT HUD'
        };
      default:
        return {
          badge: '👮 PATROL ENFORCEMENT DIVISION',
          bgGradient: 'from-blue-950/50 via-[#161B22] to-slate-900/50',
          borderColor: 'border-blue-600/60',
          accentText: 'text-blue-400',
          accentBg: 'bg-blue-500/20',
          roleTitle: 'Divisi Patroli & Keamanan Publik',
          roleDesc: 'Garda terdepan penegakan hukum kota Los Santos, respon panggilan 911 darurat, tilang pelanggaran umum, dan pemrosesan tahanan.',
          icon: Shield,
          tagColor: 'bg-blue-950 text-blue-300 border-blue-700/60',
          hudTitle: 'STANDARD MOBILE PATROL CAD'
        };
    }
  };

  const theme = getDivisionTheme();
  const IconComp = theme.icon;

  return (
    <div className={`w-full rounded-xl border ${theme.borderColor} bg-gradient-to-r ${theme.bgGradient} p-3.5 sm:p-4 shadow-xl font-mono text-xs mb-4 relative overflow-hidden`}>
      {/* Background Decorative Tech Lines */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Column: Officer Identity & Division Archetype */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${theme.borderColor} ${theme.accentBg} shadow-inner`}>
            <IconComp className={`w-6 h-6 ${theme.accentText}`} />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${theme.tagColor}`}>
                {theme.badge}
              </span>
              <span className="text-[10px] text-gray-400 font-normal">
                {theme.hudTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 font-sans tracking-tight">
                {currentOfficer.name}
              </h2>
              <span className="text-xs bg-black/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 font-bold">
                {currentOfficer.badge}
              </span>
              <span className="text-xs text-gray-300 font-sans">
                — {currentOfficer.rank}
              </span>
            </div>

            <p className="text-[11px] text-gray-300 max-w-3xl leading-relaxed">
              <strong className={theme.accentText}>{theme.roleTitle}:</strong> {theme.roleDesc}
            </p>
          </div>
        </div>

        {/* Right Column: Live Tactical Counters */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-800/80">
          <div className="bg-black/50 border border-gray-800 rounded-lg px-2.5 py-1.5 text-center min-w-[72px]">
            <div className="text-[9px] text-gray-400 uppercase">Kasus DB</div>
            <div className="text-xs sm:text-sm font-bold text-indigo-400">{totalCases} Aktif</div>
          </div>

          <div className="bg-black/50 border border-gray-800 rounded-lg px-2.5 py-1.5 text-center min-w-[72px]">
            <div className="text-[9px] text-gray-400 uppercase">BOLO Alert</div>
            <div className="text-xs sm:text-sm font-bold text-rose-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              {activeBoloCount}
            </div>
          </div>

          <div className="bg-black/50 border border-gray-800 rounded-lg px-2.5 py-1.5 text-center min-w-[72px]">
            <div className="text-[9px] text-gray-400 uppercase">Penindakan</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400">{totalRecords} Rekor</div>
          </div>

          {isHighRank && (
            <div className="bg-amber-950/60 border border-amber-800/80 rounded-lg px-2.5 py-1.5 text-center min-w-[72px]">
              <div className="text-[9px] text-amber-400 uppercase">Anggota</div>
              <div className="text-xs sm:text-sm font-bold text-amber-200">{totalRoster} Org</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
