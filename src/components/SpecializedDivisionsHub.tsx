import React, { useState, useEffect } from 'react';
import { 
  Radio, Shield, Flame, Scale, BookOpen, 
  Car, RefreshCw, Sparkles, Layers, ShieldAlert
} from 'lucide-react';
import { 
  OfficerProfile, 
  OfficerAccount, 
  AsdHelicopter, 
  K9Partner, 
  K9DeploymentLog, 
  SwatOperation, 
  IadComplaint, 
  CadetEvaluation,
  TedTrafficRecord,
  isSupervisorOrAbove
} from '../types';
import { 
  getSavedAsdHelis,
  getSavedK9Partners,
  getSavedK9Logs,
  getSavedSwatOps,
  getSavedIadComplaints,
  getSavedCadetEvals,
  getSavedTedRecords
} from '../utils/specializedDivisionsStorage';
import { AsdTacticalPanel } from './divisions/AsdTacticalPanel';
import { K9DeploymentPanel } from './divisions/K9DeploymentPanel';
import { SwatTacticalPanel } from './divisions/SwatTacticalPanel';
import { IadHearingPanel } from './divisions/IadHearingPanel';
import { AcademyFtoPanel } from './divisions/AcademyFtoPanel';
import { TedTrafficPanel } from './divisions/TedTrafficPanel';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster?: OfficerAccount[];
}

export const SpecializedDivisionsHub: React.FC<Props> = ({ currentOfficer, roster = [] }) => {
  // Navigation tabs
  const [activeDivisionTab, setActiveDivisionTab] = useState<'asd' | 'k9' | 'swat' | 'iad' | 'academy' | 'ted'>('asd');

  // State
  const [helis, setHelis] = useState<AsdHelicopter[]>(() => getSavedAsdHelis());
  const [k9Partners, setK9Partners] = useState<K9Partner[]>(() => getSavedK9Partners());
  const [k9Logs, setK9Logs] = useState<K9DeploymentLog[]>(() => getSavedK9Logs());
  const [swatOps, setSwatOps] = useState<SwatOperation[]>(() => getSavedSwatOps());
  const [iadComplaints, setIadComplaints] = useState<IadComplaint[]>(() => getSavedIadComplaints());
  const [cadetEvals, setCadetEvals] = useState<CadetEvaluation[]>(() => getSavedCadetEvals());
  const [tedRecords, setTedRecords] = useState<TedTrafficRecord[]>(() => getSavedTedRecords());

  const isSupervisor = isSupervisorOrAbove(currentOfficer?.rank);

  // Sync listener across storage events
  useEffect(() => {
    const syncAll = () => {
      setHelis(getSavedAsdHelis());
      setK9Partners(getSavedK9Partners());
      setK9Logs(getSavedK9Logs());
      setSwatOps(getSavedSwatOps());
      setIadComplaints(getSavedIadComplaints());
      setCadetEvals(getSavedCadetEvals());
      setTedRecords(getSavedTedRecords());
    };

    window.addEventListener('hspd-asd-updated', syncAll);
    window.addEventListener('hspd-k9-updated', syncAll);
    window.addEventListener('hspd-k9-logs-updated', syncAll);
    window.addEventListener('hspd-swat-updated', syncAll);
    window.addEventListener('hspd-iad-updated', syncAll);
    window.addEventListener('hspd-academy-updated', syncAll);
    window.addEventListener('hspd-ted-updated', syncAll);

    return () => {
      window.removeEventListener('hspd-asd-updated', syncAll);
      window.removeEventListener('hspd-k9-updated', syncAll);
      window.removeEventListener('hspd-k9-logs-updated', syncAll);
      window.removeEventListener('hspd-swat-updated', syncAll);
      window.removeEventListener('hspd-iad-updated', syncAll);
      window.removeEventListener('hspd-academy-updated', syncAll);
      window.removeEventListener('hspd-ted-updated', syncAll);
    };
  }, []);

  const tabs = [
    {
      id: 'asd' as const,
      label: 'ASD (Air Support)',
      icon: Radio,
      badge: `${helis.filter(h => h.status === 'IN_AIR_PATROL').length} Mengudara`,
      color: 'from-blue-600 to-indigo-600',
      activeBorder: 'border-blue-500 text-blue-400 bg-blue-950/40'
    },
    {
      id: 'k9' as const,
      label: 'K-9 Canine Squad',
      icon: Shield,
      badge: `${k9Partners.length} Anjing Aktif`,
      color: 'from-amber-600 to-orange-600',
      activeBorder: 'border-amber-500 text-amber-400 bg-amber-950/40'
    },
    {
      id: 'swat' as const,
      label: 'SWAT / METRO',
      icon: Flame,
      badge: `${swatOps.filter(o => o.status === 'EXECUTING').length} Operasi`,
      color: 'from-red-600 to-rose-700',
      activeBorder: 'border-red-500 text-red-400 bg-red-950/40'
    },
    {
      id: 'iad' as const,
      label: 'IAD (Propam / Etik)',
      icon: Scale,
      badge: `${iadComplaints.filter(c => c.status === 'UNDER_INVESTIGATION').length} Kasus`,
      color: 'from-purple-600 to-pink-600',
      activeBorder: 'border-purple-500 text-purple-400 bg-purple-950/40'
    },
    {
      id: 'academy' as const,
      label: 'Police Academy / FTO',
      icon: BookOpen,
      badge: `${cadetEvals.length} Rapor`,
      color: 'from-emerald-600 to-teal-600',
      activeBorder: 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
    },
    {
      id: 'ted' as const,
      label: 'TED (Satlantas / Radar)',
      icon: Car,
      badge: `${tedRecords.length} Tilang/DUI`,
      color: 'from-sky-600 to-cyan-600',
      activeBorder: 'border-sky-500 text-sky-400 bg-sky-950/40'
    }
  ];

  return (
    <div className="space-y-4 font-sans text-xs pb-8">
      {/* Top Banner & Header */}
      <div className="p-4 bg-gradient-to-r from-[#0C121E] via-[#101726] to-[#0C121E] border border-blue-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Layers className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-100 flex items-center gap-2">
              <span>PUSAT PENANGANAN OPERASIONAL & DIVISI KHUSUS HSPD</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                TACTICAL & SPECIAL OPS
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Fasilitas penanganan misi taktis terpadu: Patroli Udara FLIR ASD, Simulator Penyisiran Satwa K-9, Incident Commander SWAT, Garrity Warning IAD, Scorecard FTO Akademi, dan Radar Penindakan TED.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right font-mono">
            <div className="text-[10px] text-gray-400">PETUGAS OPERATOR:</div>
            <div className="font-bold text-gray-200">{currentOfficer?.name || 'Officer On-Duty'}</div>
            <div className="text-[10px] text-blue-400">{currentOfficer?.rank || 'Patrol Unit'} ({currentOfficer?.badge || '#HSPD'})</div>
          </div>
        </div>
      </div>

      {/* Division Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeDivisionTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveDivisionTab(t.id)}
              className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-2 cursor-pointer ${
                isActive
                  ? `${t.activeBorder} shadow-lg ring-1 ring-white/10`
                  : 'bg-[#141820] border-gray-800 text-gray-400 hover:bg-[#181E29] hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-500'}`} />
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 font-bold">
                  {t.badge}
                </span>
              </div>
              <div className="font-bold text-xs truncate">
                {t.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Panel Content Router */}
      <div className="pt-1">
        {activeDivisionTab === 'asd' && (
          <AsdTacticalPanel
            helis={helis}
            onUpdateHelis={setHelis}
            currentOfficer={currentOfficer}
          />
        )}

        {activeDivisionTab === 'k9' && (
          <K9DeploymentPanel
            k9Partners={k9Partners}
            k9Logs={k9Logs}
            onUpdatePartners={setK9Partners}
            onUpdateLogs={setK9Logs}
            currentOfficer={currentOfficer}
          />
        )}

        {activeDivisionTab === 'swat' && (
          <SwatTacticalPanel
            swatOps={swatOps}
            onUpdateOps={setSwatOps}
            currentOfficer={currentOfficer}
          />
        )}

        {activeDivisionTab === 'iad' && (
          <IadHearingPanel
            iadComplaints={iadComplaints}
            onUpdateComplaints={setIadComplaints}
            currentOfficer={currentOfficer}
          />
        )}

        {activeDivisionTab === 'academy' && (
          <AcademyFtoPanel
            cadetEvals={cadetEvals}
            onUpdateEvals={setCadetEvals}
            currentOfficer={currentOfficer}
          />
        )}

        {activeDivisionTab === 'ted' && (
          <TedTrafficPanel
            tedRecords={tedRecords}
            onUpdateRecords={setTedRecords}
            currentOfficer={currentOfficer}
          />
        )}
      </div>
    </div>
  );
};
