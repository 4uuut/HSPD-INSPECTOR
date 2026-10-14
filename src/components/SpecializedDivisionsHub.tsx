import React, { useState, useEffect } from 'react';
import { 
  Radio, Shield, Flame, Scale, BookOpen, 
  Car, RefreshCw, Sparkles, Layers, ShieldAlert,
  FolderArchive, Plus, FileText, CheckCircle,
  Search, Lock, Package, Crosshair
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
  DivisionCaseFile,
  isSupervisorOrAbove
} from '../types';
import { 
  getSavedAsdHelis,
  getSavedK9Partners,
  getSavedK9Logs,
  getSavedSwatOps,
  getSavedIadComplaints,
  getSavedCadetEvals,
  getSavedTedRecords,
  getSavedDivisionCaseFiles,
  saveDivisionCaseFiles
} from '../utils/specializedDivisionsStorage';
import { 
  isHighCommandOfficer, 
  normalizeDivisionKey, 
  canOfficerAccessCaseFile,
  getDivisionDisplayName,
  getDivisionTheme,
  OFFICIAL_DIVISIONS_CONFIG,
  OfficialDivisionKey
} from '../utils/divisionAccess';
import { DivisionCaseFilesBoard } from './divisions/DivisionCaseFilesBoard';
import { AsdTacticalPanel } from './divisions/AsdTacticalPanel';
import { K9DeploymentPanel } from './divisions/K9DeploymentPanel';
import { SwatTacticalPanel } from './divisions/SwatTacticalPanel';
import { IadHearingPanel } from './divisions/IadHearingPanel';
import { TedTrafficPanel } from './divisions/TedTrafficPanel';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster?: OfficerAccount[];
}

type DivisionTabKey = 
  | 'case_files' 
  | 'patrol' 
  | 'metro' 
  | 'swat' 
  | 'detective' 
  | 'evidence' 
  | 'air_support' 
  | 'psd';

export const SpecializedDivisionsHub: React.FC<Props> = ({ currentOfficer, roster = [] }) => {
  // Navigation tabs - Default to 'case_files'
  const [activeDivisionTab, setActiveDivisionTab] = useState<DivisionTabKey>('case_files');

  // State
  const [caseFiles, setCaseFiles] = useState<DivisionCaseFile[]>(() => getSavedDivisionCaseFiles());
  const [helis, setHelis] = useState<AsdHelicopter[]>(() => getSavedAsdHelis());
  const [k9Partners, setK9Partners] = useState<K9Partner[]>(() => getSavedK9Partners());
  const [k9Logs, setK9Logs] = useState<K9DeploymentLog[]>(() => getSavedK9Logs());
  const [swatOps, setSwatOps] = useState<SwatOperation[]>(() => getSavedSwatOps());
  const [iadComplaints, setIadComplaints] = useState<IadComplaint[]>(() => getSavedIadComplaints());
  const [cadetEvals, setCadetEvals] = useState<CadetEvaluation[]>(() => getSavedCadetEvals());
  const [tedRecords, setTedRecords] = useState<TedTrafficRecord[]>(() => getSavedTedRecords());

  const isHighCmd = isHighCommandOfficer(currentOfficer);
  const officerDivKey = currentOfficer?.division ? normalizeDivisionKey(currentOfficer.division) : 'PATROL';

  // Sync listener across storage events
  useEffect(() => {
    const syncAll = () => {
      setCaseFiles(getSavedDivisionCaseFiles());
      setHelis(getSavedAsdHelis());
      setK9Partners(getSavedK9Partners());
      setK9Logs(getSavedK9Logs());
      setSwatOps(getSavedSwatOps());
      setIadComplaints(getSavedIadComplaints());
      setCadetEvals(getSavedCadetEvals());
      setTedRecords(getSavedTedRecords());
    };

    window.addEventListener('hspd-case-files-updated', syncAll);
    window.addEventListener('hspd-asd-updated', syncAll);
    window.addEventListener('hspd-k9-updated', syncAll);
    window.addEventListener('hspd-k9-logs-updated', syncAll);
    window.addEventListener('hspd-swat-updated', syncAll);
    window.addEventListener('hspd-iad-updated', syncAll);
    window.addEventListener('hspd-academy-updated', syncAll);
    window.addEventListener('hspd-ted-updated', syncAll);

    return () => {
      window.removeEventListener('hspd-case-files-updated', syncAll);
      window.removeEventListener('hspd-asd-updated', syncAll);
      window.removeEventListener('hspd-k9-updated', syncAll);
      window.removeEventListener('hspd-k9-logs-updated', syncAll);
      window.removeEventListener('hspd-swat-updated', syncAll);
      window.removeEventListener('hspd-iad-updated', syncAll);
      window.removeEventListener('hspd-academy-updated', syncAll);
      window.removeEventListener('hspd-ted-updated', syncAll);
    };
  }, []);

  const handleUpdateCaseFiles = (updated: DivisionCaseFile[]) => {
    setCaseFiles(updated);
    saveDivisionCaseFiles(updated);
  };

  // Accessible cases for current officer
  const myAccessibleCases = caseFiles.filter(c => canOfficerAccessCaseFile(currentOfficer, c));

  const tabs: {
    id: DivisionTabKey;
    targetDivKey?: OfficialDivisionKey;
    label: string;
    subLabel: string;
    icon: any;
    badge: string;
    activeBorder: string;
    requiresDivisionMatch?: boolean;
  }[] = [
    {
      id: 'case_files',
      label: 'Pusat Berkas Kasus',
      subLabel: 'Semua Berkas Resmi',
      icon: FolderArchive,
      badge: `${myAccessibleCases.length} Berkas`,
      activeBorder: 'border-blue-500 text-blue-400 bg-blue-950/50'
    },
    {
      id: 'patrol',
      targetDivKey: 'PATROL',
      label: 'Patrol Division',
      subLabel: 'Patroli & Respon 911',
      icon: Car,
      badge: `${caseFiles.filter(c => normalizeDivisionKey(c.division) === 'PATROL').length} Kasus`,
      activeBorder: 'border-blue-500 text-blue-400 bg-blue-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'metro',
      targetDivKey: 'METRO',
      label: 'Metro Division',
      subLabel: 'Perkotaan & Pengamanan',
      icon: Shield,
      badge: `${caseFiles.filter(c => normalizeDivisionKey(c.division) === 'METRO').length} Kasus`,
      activeBorder: 'border-cyan-500 text-cyan-400 bg-cyan-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'swat',
      targetDivKey: 'SWAT',
      label: 'SWAT Taktis',
      subLabel: 'Special Weapon & Tactical',
      icon: Flame,
      badge: `${caseFiles.filter(c => normalizeDivisionKey(c.division) === 'SWAT').length} Kasus`,
      activeBorder: 'border-red-500 text-red-400 bg-red-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'detective',
      targetDivKey: 'DETECTIVE',
      label: 'Detective Bureau',
      subLabel: 'Investigasi & CID',
      icon: Search,
      badge: `${caseFiles.filter(c => normalizeDivisionKey(c.division) === 'DETECTIVE').length} Kasus`,
      activeBorder: 'border-amber-500 text-amber-400 bg-amber-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'evidence',
      targetDivKey: 'EVIDENCE',
      label: 'Evidence Cell',
      subLabel: 'Brankas Barang Bukti',
      icon: Package,
      badge: `${caseFiles.filter(c => normalizeDivisionKey(c.division) === 'EVIDENCE').length} Kasus`,
      activeBorder: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'air_support',
      targetDivKey: 'AIR_SUPPORT',
      label: 'Air Support Unit',
      subLabel: 'Penerbang Heli FLIR',
      icon: Radio,
      badge: `${helis.filter(h => h.status === 'IN_AIR_PATROL').length} Mengudara`,
      activeBorder: 'border-sky-500 text-sky-400 bg-sky-950/40',
      requiresDivisionMatch: true
    },
    {
      id: 'psd',
      targetDivKey: 'PSD',
      label: 'Standards (PSD)',
      subLabel: 'Sidang Etik & Propam',
      icon: Scale,
      badge: `${iadComplaints.filter(c => c.status === 'UNDER_INVESTIGATION').length} Sidang`,
      activeBorder: 'border-purple-500 text-purple-400 bg-purple-950/40',
      requiresDivisionMatch: true
    }
  ];

  // Check access for the currently selected division tab
  const activeTabConfig = tabs.find(t => t.id === activeDivisionTab);
  const targetDivisionKey = activeTabConfig?.targetDivKey;
  const isAuthorizedForTab = 
    activeDivisionTab === 'case_files' || 
    isHighCmd || 
    (targetDivisionKey && officerDivKey === targetDivisionKey);

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
              <span>PUSAT BERKAS KASUS OPERASIONAL & 7 DIVISI RESMI HSPD</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                OFFICIAL 7 DIVISIONS
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-sans mt-0.5 max-w-4xl">
              Sistem berkas kasus operasional (Case Files) 7 divisi resmi: <strong>Patrol Division Unit</strong>, <strong>Metro Division Unit</strong>, <strong>Special Weapon and Tactical (SWAT)</strong>, <strong>Detective Bureau</strong>, <strong>Evidence Cell Management</strong>, <strong>Air Support Unit</strong>, dan <strong>Professional Standards Division</strong>. Dilengkapi pembatasan akses ketat antar-divisi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right font-mono">
            <div className="text-[10px] text-gray-400">PETUGAS OPERATOR:</div>
            <div className="font-bold text-gray-200">{currentOfficer?.name || 'Officer On-Duty'}</div>
            <div className="text-[10px] text-blue-400 flex items-center justify-end gap-1">
              <span>{currentOfficer?.rank || 'Patrol Unit'}</span>
              <span className="text-gray-400">•</span>
              <span className="font-bold text-amber-300">{currentOfficer?.division || 'Divisi Resmi'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Division Navigation Tabs (8 Tabs: Case Files + 7 Official Divisions) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeDivisionTab === t.id;
          const isRestricted = t.requiresDivisionMatch && !isHighCmd && t.targetDivKey !== officerDivKey;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveDivisionTab(t.id)}
              className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-1.5 cursor-pointer ${
                isActive
                  ? `${t.activeBorder} shadow-lg ring-1 ring-white/10`
                  : isRestricted
                  ? 'bg-[#121620] border-gray-800/80 text-gray-500 hover:text-gray-400 hover:bg-[#151B27]'
                  : 'bg-[#141820] border-gray-800 text-gray-400 hover:bg-[#181E29] hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? '' : isRestricted ? 'text-gray-600' : 'text-gray-500'}`} />
                <div className="flex items-center gap-1">
                  {isRestricted && <span className="text-[9px] opacity-75">🔒</span>}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 font-bold">
                    {t.badge}
                  </span>
                </div>
              </div>
              <div>
                <div className="font-bold text-xs truncate">
                  {t.label}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {t.subLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Panel Content Router with Access Security Gate */}
      <div className="pt-1">
        {/* If user is not authorized for this specific division tab, show Access Denied Screen */}
        {!isAuthorizedForTab ? (
          <div className="p-8 sm:p-12 bg-[#101522] border border-red-900/60 rounded-2xl text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-500/10">
              <Lock className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                HAK AKSES DIVISI TERKUNCI • RESTRICTED
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                AKSES BERKAS & PANEL DIVISI DITOLAK
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Sub-panel operasional dan seluruh berkas kasus divisi <strong className="text-amber-400">{getDivisionDisplayName(targetDivisionKey)}</strong> diklasifikasikan secara ketat. Sesuai regulasi kepolisian, personel divisi lain tidak diizinkan membuka arsip ini.
              </p>
              <div className="p-3 bg-black/50 rounded-xl border border-gray-800 text-left text-[11px] space-y-1.5 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Divisi Penugasan Anda:</span>
                  <span className="font-bold text-white">{currentOfficer?.division || 'Divisi Reguler'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Divisi Target:</span>
                  <span className="font-bold text-amber-400">{getDivisionDisplayName(targetDivisionKey)}</span>
                </div>
                <div className="text-[10px] text-red-400/90 pt-1 border-t border-gray-800/80">
                  ⚠️ Hanya anggota resmi {getDivisionDisplayName(targetDivisionKey)} atau Staf Komando Pimpinan Mabes yang memiliki otorisasi penuh.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveDivisionTab('case_files')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-md shadow-blue-500/20"
            >
              Kembali ke Pusat Berkas Kasus
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: CENTRAL CASE FILES BOARD */}
            {activeDivisionTab === 'case_files' && (
              <DivisionCaseFilesBoard
                caseFiles={caseFiles}
                onUpdateCaseFiles={handleUpdateCaseFiles}
                currentOfficer={currentOfficer}
                activeFilterDivision="ALL"
              />
            )}

            {/* TAB 2: PATROL DIVISION UNIT */}
            {activeDivisionTab === 'patrol' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-950/30 border border-blue-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-blue-300 text-xs">BERKAS KASUS & OPERASI PATROL DIVISION UNIT</h3>
                    <p className="text-[11px] text-gray-400">Pusat dokumentasi respon panggilan 911, pengejaran kecepatan tinggi, dan ketertiban jalan raya.</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700 font-bold">
                    PATROL UNIT
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="PATROL"
                />

                <div className="pt-4 border-t border-gray-800">
                  <TedTrafficPanel
                    tedRecords={tedRecords}
                    onUpdateRecords={setTedRecords}
                    currentOfficer={currentOfficer}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: METRO DIVISION UNIT */}
            {activeDivisionTab === 'metro' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-cyan-950/30 border border-cyan-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-cyan-300 text-xs">BERKAS KASUS & OPERASI METRO DIVISION UNIT</h3>
                    <p className="text-[11px] text-gray-400">Penanganan ketertiban area metropolitan, operasi pengendalian massa, dan pengerahan tim penanganan khusus.</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700 font-bold">
                    METRO UNIT
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="METRO"
                />

                <div className="pt-4 border-t border-gray-800">
                  <K9DeploymentPanel
                    k9Partners={k9Partners}
                    k9Logs={k9Logs}
                    onUpdatePartners={setK9Partners}
                    onUpdateLogs={setK9Logs}
                    currentOfficer={currentOfficer}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SWAT (SPECIAL WEAPON AND TACTICAL) */}
            {activeDivisionTab === 'swat' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-red-950/30 border border-red-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-red-300 text-xs">BERKAS KASUS OPERASIONAL SPECIAL WEAPON AND TACTICAL (SWAT)</h3>
                    <p className="text-[11px] text-gray-400">Arsip taktis perampokan bank bersenjata, pembebasan sandera, dan ancaman berkode merah (Code Red).</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700 font-bold">
                    SWAT UNIT
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="SWAT"
                />

                <div className="pt-4 border-t border-gray-800">
                  <SwatTacticalPanel
                    swatOps={swatOps}
                    onUpdateOps={setSwatOps}
                    currentOfficer={currentOfficer}
                  />
                </div>
              </div>
            )}

            {/* TAB 5: DETECTIVE BUREAU */}
            {activeDivisionTab === 'detective' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-950/30 border border-amber-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-amber-300 text-xs">BERKAS KASUS DETECTIVE BUREAU (CID)</h3>
                    <p className="text-[11px] text-gray-400">Penyelidikan intelijen, pembongkaran sindikat narkotika dan kriminalitas berat perkotaan.</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700 font-bold">
                    DETECTIVE CID
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="DETECTIVE"
                />
              </div>
            )}

            {/* TAB 6: EVIDENCE CELL MANAGEMENT */}
            {activeDivisionTab === 'evidence' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-emerald-300 text-xs">BERKAS KASUS & BRANKAS EVIDENCE CELL MANAGEMENT</h3>
                    <p className="text-[11px] text-gray-400">Pengelolaan brankas barang bukti kriminal, administrasi sitaan uang/senjata, dan rantai pengawasan (chain of custody).</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-bold">
                    EVIDENCE VAULT
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="EVIDENCE"
                />
              </div>
            )}

            {/* TAB 7: AIR SUPPORT UNIT */}
            {activeDivisionTab === 'air_support' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-sky-950/30 border border-sky-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sky-300 text-xs">BERKAS KASUS & ARMADA AIR SUPPORT UNIT</h3>
                    <p className="text-[11px] text-gray-400">Pengawasan taktis udara FLIR, pengejaran kendaraan berkecepatan tinggi, dan evakuasi medis helikopter.</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700 font-bold">
                    AIR SUPPORT
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="AIR_SUPPORT"
                />

                <div className="pt-4 border-t border-gray-800">
                  <AsdTacticalPanel
                    helis={helis}
                    onUpdateHelis={setHelis}
                    currentOfficer={currentOfficer}
                  />
                </div>
              </div>
            )}

            {/* TAB 8: PROFESSIONAL STANDARDS DIVISION (PSD) */}
            {activeDivisionTab === 'psd' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-purple-950/30 border border-purple-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-purple-300 text-xs">BERKAS KASUS & SIDANG PROFESSIONAL STANDARDS DIVISION (PSD)</h3>
                    <p className="text-[11px] text-gray-400">Sidang penegakan kode etik kepolisian, investigasi aduan masyarakat, dan pengawasan integritas personel.</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-bold">
                    STANDARDS PSD
                  </span>
                </div>

                <DivisionCaseFilesBoard
                  caseFiles={caseFiles}
                  onUpdateCaseFiles={handleUpdateCaseFiles}
                  currentOfficer={currentOfficer}
                  activeFilterDivision="PSD"
                />

                <div className="pt-4 border-t border-gray-800">
                  <IadHearingPanel
                    iadComplaints={iadComplaints}
                    onUpdateComplaints={setIadComplaints}
                    currentOfficer={currentOfficer}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
