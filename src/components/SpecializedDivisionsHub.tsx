import React, { useState, useEffect } from 'react';
import { 
  Award, Crosshair, Search, Radio, KeyRound, Sparkles, 
  CheckCircle2, AlertTriangle, Shield, Eye, Flame, 
  UserCheck, Plus, FileText, Check, Copy, X, ArrowRight,
  Compass, Zap, RefreshCw, Layers, ShieldAlert, BookOpen
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
  isSupervisorOrAbove,
  isOfficerHighRank 
} from '../types';
import { 
  getSavedAsdHelis, saveAsdHelis,
  getSavedK9Partners, saveK9Partners,
  getSavedK9Logs, saveK9Logs,
  getSavedSwatOps, saveSwatOps,
  getSavedIadComplaints, saveIadComplaints,
  getSavedCadetEvals, saveCadetEvals
} from '../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../utils/discordWebhook';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster?: OfficerAccount[];
}

export const SpecializedDivisionsHub: React.FC<Props> = ({ currentOfficer, roster = [] }) => {
  // Navigation tabs
  const [activeDivisionTab, setActiveDivisionTab] = useState<'asd' | 'k9' | 'swat' | 'iad' | 'academy'>('asd');

  // State
  const [helis, setHelis] = useState<AsdHelicopter[]>(() => getSavedAsdHelis());
  const [k9Partners, setK9Partners] = useState<K9Partner[]>(() => getSavedK9Partners());
  const [k9Logs, setK9Logs] = useState<K9DeploymentLog[]>(() => getSavedK9Logs());
  const [swatOps, setSwatOps] = useState<SwatOperation[]>(() => getSavedSwatOps());
  const [iadComplaints, setIadComplaints] = useState<IadComplaint[]>(() => getSavedIadComplaints());
  const [cadetEvals, setCadetEvals] = useState<CadetEvaluation[]>(() => getSavedCadetEvals());

  // Modals
  const [isNewK9LogModal, setIsNewK9LogModal] = useState(false);
  const [isNewSwatModal, setIsNewSwatModal] = useState(false);
  const [isNewIadModal, setIsNewIadModal] = useState(false);
  const [isNewEvalModal, setIsNewEvalModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [k9TargetType, setK9TargetType] = useState<'VEHICLE_SNIFF' | 'BUILDING_SWEEP' | 'FUGITIVE_TRACKING' | 'CROWD_CONTROL'>('VEHICLE_SNIFF');
  const [k9DogSelected, setK9DogSelected] = useState('K-9 Zeus');
  const [k9Location, setK9Location] = useState('');
  const [k9Result, setK9Result] = useState<'POSITIVE_HIT' | 'NEGATIVE_CLEAR' | 'SUSPECT_APPREHENDED'>('POSITIVE_HIT');
  const [k9Summary, setK9Summary] = useState('');

  // SWAT Form
  const [swatOpCode, setSwatOpCode] = useState('');
  const [swatMissionType, setSwatMissionType] = useState<'HOSTAGE_RESCUE' | 'BARRICADED_SUSPECT' | 'HIGH_RISK_WARRANT' | 'BANK_ROBBERY' | 'VIP_ESCORT'>('HIGH_RISK_WARRANT');
  const [swatLocation, setSwatLocation] = useState('');
  const [swatBreach, setSwatBreach] = useState<'EXPLOSIVE_C4' | 'BATTERING_RAM' | 'SHOTGUN_BREACH' | 'STEALTH_LOCKPICK' | 'GAS_ENTRY'>('EXPLOSIVE_C4');
  const [swatNotes, setSwatNotes] = useState('');

  // IAD Form
  const [iadAccusedName, setIadAccusedName] = useState('');
  const [iadAccusedBadge, setIadAccusedBadge] = useState('');
  const [iadCategory, setIadCategory] = useState<'EXCESSIVE_FORCE' | 'CORRUPTION' | 'UNPROFESSIONAL_CONDUCT' | 'EVIDENCE_TAMPERING' | 'PROCEDURAL_VIOLATION'>('EXCESSIVE_FORCE');
  const [iadNarrative, setIadNarrative] = useState('');
  const [iadComplainant, setIadComplainant] = useState('');

  // Cadet Eval Form
  const [cadetName, setCadetName] = useState('');
  const [cadetBadge, setCadetBadge] = useState('');
  const [evalPhase, setEvalPhase] = useState<'PHASE 1 (OBSERVATION)' | 'PHASE 2 (BASIC PATROL)' | 'PHASE 3 (SOLO SHADOW)' | 'FINAL EVALUATION'>('PHASE 2 (BASIC PATROL)');
  const [drivingScore, setDrivingScore] = useState(4);
  const [radioScore, setRadioScore] = useState(4);
  const [pasalScore, setPasalScore] = useState(4);
  const [shootScore, setShootScore] = useState(4);
  const [mirandaScore, setMirandaScore] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalRec, setEvalRec] = useState<'PASS_TO_NEXT_PHASE' | 'GRADUATE_TO_PO1' | 'RE_EVALUATE' | 'ACADEMY_DISMISSAL'>('PASS_TO_NEXT_PHASE');

  const isSupervisor = isSupervisorOrAbove(currentOfficer?.rank);

  // Sync listener
  useEffect(() => {
    const syncAll = () => {
      setHelis(getSavedAsdHelis());
      setK9Partners(getSavedK9Partners());
      setK9Logs(getSavedK9Logs());
      setSwatOps(getSavedSwatOps());
      setIadComplaints(getSavedIadComplaints());
      setCadetEvals(getSavedCadetEvals());
    };

    window.addEventListener('hspd-asd-updated', syncAll);
    window.addEventListener('hspd-k9-updated', syncAll);
    window.addEventListener('hspd-k9-logs-updated', syncAll);
    window.addEventListener('hspd-swat-updated', syncAll);
    window.addEventListener('hspd-iad-updated', syncAll);
    window.addEventListener('hspd-academy-updated', syncAll);

    return () => {
      window.removeEventListener('hspd-asd-updated', syncAll);
      window.removeEventListener('hspd-k9-updated', syncAll);
      window.removeEventListener('hspd-k9-logs-updated', syncAll);
      window.removeEventListener('hspd-swat-updated', syncAll);
      window.removeEventListener('hspd-iad-updated', syncAll);
      window.removeEventListener('hspd-academy-updated', syncAll);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Heli FLIR Mode
  const handleToggleFlir = (heliId: string) => {
    const updated = helis.map(h => {
      if (h.id === heliId) {
        const modes: ('NORMAL' | 'THERMAL_WHITE_HOT' | 'THERMAL_BLACK_HOT' | 'NIGHT_VISION')[] = [
          'NORMAL', 'THERMAL_WHITE_HOT', 'THERMAL_BLACK_HOT', 'NIGHT_VISION'
        ];
        const nextIdx = (modes.indexOf(h.flirThermalMode) + 1) % modes.length;
        return { ...h, flirThermalMode: modes[nextIdx] };
      }
      return h;
    });
    setHelis(updated);
    saveAsdHelis(updated);
  };

  // Toggle Searchlight
  const handleToggleSearchlight = (heliId: string) => {
    const updated = helis.map(h => h.id === heliId ? { ...h, searchlightActive: !h.searchlightActive } : h);
    setHelis(updated);
    saveAsdHelis(updated);
  };

  // Create K9 Log
  const handleCreateK9Log = (e: React.FormEvent) => {
    e.preventDefault();
    if (!k9Location.trim() || !k9Summary.trim()) return;

    const newLog: K9DeploymentLog = {
      id: `k9-log-${Date.now()}`,
      dogName: k9DogSelected,
      handlerName: currentOfficer?.name || 'K-9 Handler',
      location: k9Location.trim(),
      targetType: k9TargetType,
      resultStatus: k9Result,
      findingsSummary: k9Summary.trim(),
      timestamp: Date.now()
    };

    const updated = [newLog, ...k9Logs];
    setK9Logs(updated);
    saveK9Logs(updated);

    // Update Dog Stats
    const updatedPartners = k9Partners.map(p => {
      if (p.dogName === k9DogSelected) {
        return {
          ...p,
          totalDeployments: p.totalDeployments + 1,
          totalFinds: k9Result === 'POSITIVE_HIT' ? p.totalFinds + 1 : p.totalFinds,
          totalBites: k9Result === 'SUSPECT_APPREHENDED' ? p.totalBites + 1 : p.totalBites
        };
      }
      return p;
    });
    setK9Partners(updatedPartners);
    saveK9Partners(updatedPartners);

    setK9Location('');
    setK9Summary('');
    setIsNewK9LogModal(false);
  };

  // Create SWAT Operation
  const handleCreateSwatOp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swatOpCode.trim() || !swatLocation.trim()) return;

    const newOp: SwatOperation = {
      id: `swat-${Date.now()}`,
      opCode: swatOpCode.toUpperCase().trim(),
      missionType: swatMissionType,
      threatLevel: 'CODE_RED',
      teamLeadName: currentOfficer?.name || 'SWAT Commander',
      teamLeadBadge: currentOfficer?.badge || '#001',
      assignedOperators: [
        `${currentOfficer?.name || 'Operator'} (${currentOfficer?.badge || '#001'})`,
        'Marcus Vance (#102)',
        'Alex Mercer (#199)'
      ],
      breachingPlan: swatBreach,
      status: 'STAGED',
      targetLocation: swatLocation.trim(),
      hostageCount: 0,
      armedSuspectCount: 2,
      createdAt: Date.now(),
      notes: swatNotes.trim() || 'Tim taktis siap diterjunkan dengan perlengkapan laras panjang & rompi heavy armor.'
    };

    const updated = [newOp, ...swatOps];
    setSwatOps(updated);
    saveSwatOps(updated);

    setSwatOpCode('');
    setSwatLocation('');
    setSwatNotes('');
    setIsNewSwatModal(false);
  };

  // Create IAD Complaint
  const handleCreateIad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iadAccusedName.trim() || !iadNarrative.trim()) return;

    const caseNum = `IAD-${new Date().getFullYear()}-${String(iadComplaints.length + 42).padStart(4, '0')}`;
    const newComplaint: IadComplaint = {
      id: `iad-${Date.now()}`,
      caseNumber: caseNum,
      complainantName: iadComplainant.trim() || 'Warga Sipil',
      complainantType: 'CIVILIAN',
      accusedOfficerName: iadAccusedName.trim(),
      accusedOfficerBadge: iadAccusedBadge.trim() || '#000',
      accusedOfficerRank: 'POLICE OFFICER',
      allegationCategory: iadCategory,
      incidentDate: new Date().toLocaleDateString('id-ID'),
      incidentLocation: 'Los Santos Metro',
      narrative: iadNarrative.trim(),
      investigatorName: currentOfficer?.name || 'Internal Affairs Investigator',
      status: 'UNDER_INVESTIGATION',
      createdAt: Date.now()
    };

    const updated = [newComplaint, ...iadComplaints];
    setIadComplaints(updated);
    saveIadComplaints(updated);

    setIadAccusedName('');
    setIadAccusedBadge('');
    setIadNarrative('');
    setIadComplainant('');
    setIsNewIadModal(false);
  };

  // Create Cadet Evaluation
  const handleCreateCadetEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadetName.trim()) return;

    const avg = (drivingScore + radioScore + pasalScore + shootScore + mirandaScore) / 5;
    const grade = avg >= 4.5 ? 'OUTSTANDING' : avg >= 3.5 ? 'SATISFACTORY' : avg >= 2.5 ? 'NEEDS_IMPROVEMENT' : 'UNSATISFACTORY';

    const newEval: CadetEvaluation = {
      id: `eval-${Date.now()}`,
      cadetName: cadetName.trim(),
      cadetBadge: cadetBadge.trim() || '#300',
      ftoName: currentOfficer?.name || 'Field Training Officer',
      ftoBadge: currentOfficer?.badge || '#100',
      phase: evalPhase,
      drivingScore,
      radioCommsScore: radioScore,
      pasalApplicationScore: pasalScore,
      tacticalShootScore: shootScore,
      mirandaRightsScore: mirandaScore,
      overallGrade: grade,
      notes: evalNotes.trim() || 'Evaluasi berkala tahapan pelatihan cadet lapangan.',
      recommendation: evalRec,
      evaluatedAt: Date.now()
    };

    const updated = [newEval, ...cadetEvals];
    setCadetEvals(updated);
    saveCadetEvals(updated);

    setCadetName('');
    setCadetBadge('');
    setEvalNotes('');
    setIsNewEvalModal(false);
  };

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/50 via-[#121620] to-[#18121E] border border-indigo-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-950/50">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                SPECIALIZED UNITS HQ
              </span>
              <span className="text-[10px] text-gray-400 font-sans">
                6 Sub-Divisi Taktis & Khusus
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-100 mt-0.5 tracking-tight">
              Pusat Komando Divisi Khusus Kepolisian
            </h2>
            <p className="text-[11px] text-gray-400 font-sans">
              Pengelolaan unit Helikopter ASD, Unit K-9 Satwa Pelacak, Satuan Taktis SWAT, Propam Internal Affairs (IAD), dan Akademi FTO.
            </p>
          </div>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0D1017] p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveDivisionTab('asd')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeDivisionTab === 'asd' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🚁 ASD Heli ({helis.length})</span>
          </button>
          <button
            onClick={() => setActiveDivisionTab('k9')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeDivisionTab === 'k9' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🐕 K-9 Unit ({k9Partners.length})</span>
          </button>
          <button
            onClick={() => setActiveDivisionTab('swat')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeDivisionTab === 'swat' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>⚡ SWAT ({swatOps.length})</span>
          </button>
          <button
            onClick={() => setActiveDivisionTab('iad')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeDivisionTab === 'iad' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🛡️ IAD Propam ({iadComplaints.length})</span>
          </button>
          <button
            onClick={() => setActiveDivisionTab('academy')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeDivisionTab === 'academy' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🎓 Akademi FTO ({cadetEvals.length})</span>
          </button>
        </div>
      </div>

      {/* 1. ASD AIR SUPPORT DIVISION */}
      {activeDivisionTab === 'asd' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200">
              RADAR & STATUS PATROLI UDARA (AIR SUPPORT DIVISION / AIR-ONE)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {helis.map((heli) => (
              <div
                key={heli.id}
                className="p-4 bg-[#141820] border border-gray-800 rounded-2xl space-y-3.5 relative overflow-hidden"
              >
                {/* FLIR Simulated Screen Background if White-Hot */}
                {heli.flirThermalMode === 'THERMAL_WHITE_HOT' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-200/5 to-transparent pointer-events-none"></div>
                )}
                {heli.flirThermalMode === 'NIGHT_VISION' && (
                  <div className="absolute inset-0 bg-emerald-950/20 pointer-events-none"></div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-400 font-bold text-sm">
                      🚁
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-100 text-sm">{heli.tailNumber}</h3>
                      <p className="text-[10px] text-gray-400">{heli.model}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    heli.status === 'IN_AIR_PATROL'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {heli.status}
                  </span>
                </div>

                {/* Flight Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-sans">
                  <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-[10px]">PILOT / TFO:</div>
                    <div className="font-bold text-gray-200 mt-0.5">{heli.pilotName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">TFO: {heli.tacticalObserverName || 'Solo'}</div>
                  </div>

                  <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-[10px]">KETINGGIAN (ALT):</div>
                    <div className="font-bold text-amber-300 mt-0.5 font-mono">{heli.altitudeFeet} FT AGL</div>
                    <div className="text-[10px] text-gray-500">Sektor: {heli.currentSector}</div>
                  </div>

                  <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-[10px]">BAHAN BAKAR:</div>
                    <div className={`font-bold mt-0.5 font-mono ${heli.fuelPercentage > 30 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {heli.fuelPercentage}% FUEL
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${heli.fuelPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* FLIR Controls */}
                <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFlir(heli.id)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-gray-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>KAMERA: {heli.flirThermalMode}</span>
                    </button>

                    <button
                      onClick={() => handleToggleSearchlight(heli.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border ${
                        heli.searchlightActive
                          ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md shadow-amber-950'
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>LAMPU SOROT: {heli.searchlightActive ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const updated = helis.map(h => {
                        if (h.id === heli.id) {
                          const nextStatus = h.status === 'IN_AIR_PATROL' ? 'AVAILABLE' : 'IN_AIR_PATROL';
                          return { ...h, status: nextStatus as any, altitudeFeet: nextStatus === 'IN_AIR_PATROL' ? 1200 : 0 };
                        }
                        return h;
                      });
                      setHelis(updated);
                      saveAsdHelis(updated);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    {heli.status === 'IN_AIR_PATROL' ? 'LAND / STANDBY' : 'TAKE OFF PATROL'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. K-9 UNIT SATWA PELACAK */}
      {activeDivisionTab === 'k9' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200">
              ROSTER ANJING PELACAK & LOG PENGENDUSAN (K-9 CANINE DIVISION)
            </span>
            <button
              onClick={() => setIsNewK9LogModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ LOG PENUGASAN K-9</span>
            </button>
          </div>

          {/* Dogs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {k9Partners.map((dog) => (
              <div key={dog.id} className="p-3.5 bg-[#141820] border border-gray-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">
                      🐕
                    </div>
                    <div>
                      <div className="font-bold text-gray-100 text-xs">{dog.dogName}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{dog.breed}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {dog.certificationStatus}
                  </span>
                </div>

                <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 space-y-1 text-[11px] font-sans">
                  <div className="text-gray-300">Handler: <strong>{dog.handlerName}</strong> ({dog.handlerBadge})</div>
                  <div className="text-amber-400 font-mono text-[10px]">Spesialis: {dog.specialization}</div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-400">Tugas:</div>
                    <div className="font-bold text-gray-200">{dog.totalDeployments}x</div>
                  </div>
                  <div className="p-1.5 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-400">Temuan:</div>
                    <div className="font-bold text-emerald-400">{dog.totalFinds} Hit</div>
                  </div>
                  <div className="p-1.5 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-400">Bite:</div>
                    <div className="font-bold text-red-400">{dog.totalBites}x</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deployment Logs List */}
          <div className="space-y-2">
            <div className="font-bold text-gray-300 text-xs">RIWAYAT PENYISIRAN & TEMUAN K-9:</div>
            <div className="space-y-2">
              {k9Logs.map((log) => (
                <div key={log.id} className="p-3 bg-[#141820] border border-gray-800 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-gray-200">
                      <span>🐕 {log.dogName}</span>
                      <span className="text-gray-400 font-normal">(Handler: {log.handlerName})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        log.resultStatus === 'POSITIVE_HIT'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {log.resultStatus}
                      </span>
                    </div>
                    <p className="text-gray-300 font-sans text-xs">
                      {log.findingsSummary}
                    </p>
                    <div className="text-[10px] text-gray-500 font-sans">
                      📍 Lokasi: {log.location} • {new Date(log.timestamp).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SWAT TACTICAL OPERATIONS */}
      {activeDivisionTab === 'swat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200">
              OPERASI PENYERBUAN TAKTIS & CODE RED (SWAT BUREAU)
            </span>
            <button
              onClick={() => setIsNewSwatModal(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ BUAT OPERASI SWAT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {swatOps.map((op) => (
              <div key={op.id} className="p-4 bg-[#141820] border border-red-900/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold text-xs">
                      {op.opCode}
                    </span>
                    <span className="text-xs text-gray-300 font-bold">{op.missionType}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    op.status === 'ALL_CLEAR'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-red-600 text-white animate-pulse'
                  }`}>
                    {op.status}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs font-sans">
                  <div>📍 Target: <strong>{op.targetLocation}</strong></div>
                  <div className="text-gray-400">💥 Metode Dobrak: <strong className="text-amber-300">{op.breachingPlan}</strong></div>
                  <div className="text-gray-400">🛡️ Tim Penyerbu: {op.assignedOperators.join(', ')}</div>
                </div>

                <p className="text-xs text-gray-300 font-sans">
                  {op.notes}
                </p>

                <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Lead: {op.teamLeadName} ({op.teamLeadBadge})</span>
                  <span>{new Date(op.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. INTERNAL AFFAIRS DIVISION (IAD) */}
      {activeDivisionTab === 'iad' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200">
              AUDIT ETIK & PENGADUAN DISIPLIN ANGGOTA (INTERNAL AFFAIRS BUREAU)
            </span>
            <button
              onClick={() => setIsNewIadModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ REGISTER PENGADUAN IAD</span>
            </button>
          </div>

          <div className="space-y-3">
            {iadComplaints.map((comp) => (
              <div key={comp.id} className="p-4 bg-[#141820] border border-purple-900/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-300">{comp.caseNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                      {comp.allegationCategory}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                    comp.status === 'SUSTAINED'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1 text-xs font-sans">
                  <div>Terlapor: <strong className="text-gray-100">{comp.accusedOfficerRank} {comp.accusedOfficerName}</strong> ({comp.accusedOfficerBadge})</div>
                  <div className="text-gray-400">Pelapor: {comp.complainantName} • Tanggal: {comp.incidentDate} ({comp.incidentLocation})</div>
                </div>

                <p className="text-xs text-gray-300 font-sans">
                  "{comp.narrative}"
                </p>

                {comp.recommendedSanction && (
                  <div className="p-2 bg-rose-950/40 border border-rose-700/60 rounded-lg text-xs text-rose-300 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Rekomendasi Sanksi Sidang: {comp.recommendedSanction}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. POLICE ACADEMY & FTO EVALUATIONS */}
      {activeDivisionTab === 'academy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-200">
              RAPOR PENILAIAN CADET & UJIAN LAPANGAN FTO (POLICE ACADEMY)
            </span>
            <button
              onClick={() => setIsNewEvalModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ INPUT RAPOR EVALUASI FTO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cadetEvals.map((ev) => (
              <div key={ev.id} className="p-4 bg-[#141820] border border-emerald-900/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100 text-sm">👮 {ev.cadetName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 border border-gray-700 text-gray-400 font-mono">
                      {ev.cadetBadge}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {ev.overallGrade}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400">
                  FTO Penguji: <strong className="text-gray-200">{ev.ftoName} ({ev.ftoBadge})</strong> • {ev.phase}
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                  <div className="p-1 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-500">Drive</div>
                    <div className="font-bold text-amber-300">{ev.drivingScore}/5</div>
                  </div>
                  <div className="p-1 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-500">Radio</div>
                    <div className="font-bold text-amber-300">{ev.radioCommsScore}/5</div>
                  </div>
                  <div className="p-1 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-500">Pasal</div>
                    <div className="font-bold text-amber-300">{ev.pasalApplicationScore}/5</div>
                  </div>
                  <div className="p-1 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-500">Shoot</div>
                    <div className="font-bold text-amber-300">{ev.tacticalShootScore}/5</div>
                  </div>
                  <div className="p-1 bg-[#0A0D12] rounded border border-gray-800">
                    <div className="text-gray-500">Miranda</div>
                    <div className="font-bold text-amber-300">{ev.mirandaRightsScore}/5</div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 font-sans">
                  {ev.notes}
                </p>

                <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 text-xs text-emerald-300 font-medium">
                  Rekomendasi FTO: <strong>{ev.recommendation}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* K9 LOG MODAL */}
      {isNewK9LogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-amber-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-amber-400 text-sm">INPUT LOG PENYISIRAN K-9 SATWA</span>
              <button onClick={() => setIsNewK9LogModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateK9Log} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Pilih Anjing Pelacak</label>
                <select
                  value={k9DogSelected}
                  onChange={(e) => setK9DogSelected(e.target.value)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  {k9Partners.map(p => <option key={p.id} value={p.dogName}>{p.dogName} ({p.specialization})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Target Penyisiran</label>
                <select
                  value={k9TargetType}
                  onChange={(e) => setK9TargetType(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  <option value="VEHICLE_SNIFF">Penyisiran Kendaraan (Vehicle Sniff)</option>
                  <option value="BUILDING_SWEEP">Penyisiran Gedung / Rumah (Building Sweep)</option>
                  <option value="FUGITIVE_TRACKING">Pelacakan Jejak Buronan (Fugitive Tracking)</option>
                  <option value="CROWD_CONTROL">Pengendalian Massa (Crowd Control)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lokasi TKP *</label>
                <input
                  type="text"
                  required
                  value={k9Location}
                  onChange={(e) => setK9Location(e.target.value)}
                  placeholder="Contoh: Parkiran Pantai Vespucci"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Hasil Respon Anjing</label>
                <select
                  value={k9Result}
                  onChange={(e) => setK9Result(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="POSITIVE_HIT">POSITIVE HIT (Ditemukan Bau Narkoba / Senjata)</option>
                  <option value="NEGATIVE_CLEAR">NEGATIVE CLEAR (Area Bersih / Tidak Ditemukan)</option>
                  <option value="SUSPECT_APPREHENDED">SUSPECT APPREHENDED (Tersangka Dilumpuhkan Gigitan K-9)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Rincian Temuan *</label>
                <textarea
                  rows={2}
                  required
                  value={k9Summary}
                  onChange={(e) => setK9Summary(e.target.value)}
                  placeholder="Detail zat yang tercium atau respon anjing menggaruk dashboard/tas..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewK9LogModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-black font-bold rounded-lg">Simpan Log K-9</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWAT MODAL */}
      {isNewSwatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-red-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-red-400 text-sm">BUAT OPERASI PENYERBUAN SWAT BARU</span>
              <button onClick={() => setIsNewSwatModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateSwatOp} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Kode Sandi Operasi *</label>
                <input
                  type="text"
                  required
                  value={swatOpCode}
                  onChange={(e) => setSwatOpCode(e.target.value)}
                  placeholder="Contoh: OP-VIPER-STRIKE"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Jenis Misi</label>
                <select
                  value={swatMissionType}
                  onChange={(e) => setSwatMissionType(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  <option value="HIGH_RISK_WARRANT">HIGH RISK WARRANT (Penggerebekan Sarang Buronan)</option>
                  <option value="HOSTAGE_RESCUE">HOSTAGE RESCUE (Pembebasan Sandera)</option>
                  <option value="BARRICADED_SUSPECT">BARRICADED SUSPECT (Pengepungan Tersangka Berbarikade)</option>
                  <option value="BANK_ROBBERY">BANK ROBBERY CODE RED</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lokasi Target Penyerbuan *</label>
                <input
                  type="text"
                  required
                  value={swatLocation}
                  onChange={(e) => setSwatLocation(e.target.value)}
                  placeholder="Contoh: Gudang Docks Terminal 4"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Rencana Dobrak (Breaching)</label>
                <select
                  value={swatBreach}
                  onChange={(e) => setSwatBreach(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="EXPLOSIVE_C4">EXPLOSIVE C4 (Peledakan Pintu Masuk)</option>
                  <option value="BATTERING_RAM">BATTERING RAM (Dobrak Manual Besi)</option>
                  <option value="SHOTGUN_BREACH">SHOTGUN BREACH (Tembak Engsel Pintu)</option>
                  <option value="GAS_ENTRY">GAS ENTRY (Granat Asap / Flashbang)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Catatan Taktis</label>
                <textarea
                  rows={2}
                  value={swatNotes}
                  onChange={(e) => setSwatNotes(e.target.value)}
                  placeholder="Posisi sniper, jalur evakuasi sandera..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewSwatModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg">Luncurkan Briefing SWAT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IAD MODAL */}
      {isNewIadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-purple-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-purple-400 text-sm">REGISTER PENGADUAN PROPAM IAD</span>
              <button onClick={() => setIsNewIadModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateIad} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Petugas Terlapor *</label>
                  <input
                    type="text"
                    required
                    value={iadAccusedName}
                    onChange={(e) => setIadAccusedName(e.target.value)}
                    placeholder="Contoh: Marcus Vance"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Badge</label>
                  <input
                    type="text"
                    value={iadAccusedBadge}
                    onChange={(e) => setIadAccusedBadge(e.target.value)}
                    placeholder="#102"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Kategori Pelanggaran</label>
                <select
                  value={iadCategory}
                  onChange={(e) => setIadCategory(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                >
                  <option value="EXCESSIVE_FORCE">EXCESSIVE FORCE (Kekerasan Berlebihan)</option>
                  <option value="CORRUPTION">CORRUPTION / SUAP / PUNGLI</option>
                  <option value="UNPROFESSIONAL_CONDUCT">UNPROFESSIONAL CONDUCT (Etika Buruk)</option>
                  <option value="PROCEDURAL_VIOLATION">PROCEDURAL VIOLATION (Langgar SOP)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Nama Pelapor</label>
                <input
                  type="text"
                  value={iadComplainant}
                  onChange={(e) => setIadComplainant(e.target.value)}
                  placeholder="Warga / Petugas Internal"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Kronologi Kejadian *</label>
                <textarea
                  rows={3}
                  required
                  value={iadNarrative}
                  onChange={(e) => setIadNarrative(e.target.value)}
                  placeholder="Uraian waktu, tindakan petugas yang dilaporkan, dan saksi di tempat..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewIadModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">Register Kasus IAD</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FTO EVAL MODAL */}
      {isNewEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-emerald-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-emerald-400 text-sm">INPUT EVALUASI CADET AKADEMI FTO</span>
              <button onClick={() => setIsNewEvalModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateCadetEval} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Cadet *</label>
                  <input
                    type="text"
                    required
                    value={cadetName}
                    onChange={(e) => setCadetName(e.target.value)}
                    placeholder="Contoh: John Maverick"
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
                <label className="block text-gray-300 font-bold mb-1">Tahap Pembinaan</label>
                <select
                  value={evalPhase}
                  onChange={(e) => setEvalPhase(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="PHASE 1 (OBSERVATION)">PHASE 1 (OBSERVATION / RIDE ALONG)</option>
                  <option value="PHASE 2 (BASIC PATROL)">PHASE 2 (BASIC PATROL & TRAFFIC STOPS)</option>
                  <option value="PHASE 3 (SOLO SHADOW)">PHASE 3 (SOLO SHADOW & SHOOTING EXAM)</option>
                  <option value="FINAL EVALUATION">FINAL EVALUATION (KELULUSAN KE PO I)</option>
                </select>
              </div>

              {/* Sliders for scores */}
              <div className="space-y-2 p-2 bg-[#0A0D12] rounded-xl border border-gray-800">
                <div className="flex justify-between items-center">
                  <span>🚗 Skill Mengemudi:</span>
                  <span className="font-bold text-amber-300 font-mono">{drivingScore}/5</span>
                </div>
                <input type="range" min="1" max="5" value={drivingScore} onChange={(e) => setDrivingScore(Number(e.target.value))} className="w-full" />

                <div className="flex justify-between items-center">
                  <span>📻 Komunikasi Radio 10-Codes:</span>
                  <span className="font-bold text-amber-300 font-mono">{radioScore}/5</span>
                </div>
                <input type="range" min="1" max="5" value={radioScore} onChange={(e) => setRadioScore(Number(e.target.value))} className="w-full" />

                <div className="flex justify-between items-center">
                  <span>📜 Penerapan Pasal Pidana:</span>
                  <span className="font-bold text-amber-300 font-mono">{pasalScore}/5</span>
                </div>
                <input type="range" min="1" max="5" value={pasalScore} onChange={(e) => setPasalScore(Number(e.target.value))} className="w-full" />

                <div className="flex justify-between items-center">
                  <span>⚖️ Pembacaan Hak Miranda:</span>
                  <span className="font-bold text-amber-300 font-mono">{mirandaScore}/5</span>
                </div>
                <input type="range" min="1" max="5" value={mirandaScore} onChange={(e) => setMirandaScore(Number(e.target.value))} className="w-full" />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Rekomendasi FTO</label>
                <select
                  value={evalRec}
                  onChange={(e) => setEvalRec(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="PASS_TO_NEXT_PHASE">LULUS KE TAHAP BERIKUTNYA</option>
                  <option value="GRADUATE_TO_PO1">LULUS AKADEMI & RESMI MENJADI POLICE OFFICER I</option>
                  <option value="RE_EVALUATE">PERLU PENGULANGAN MATERI</option>
                  <option value="ACADEMY_DISMISSAL">DISKUALIFIKASI DARI AKADEMI</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewEvalModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">Simpan Rapor Cadet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
