import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, FileCheck, CheckCircle2, Users, Target, Car, 
  BookOpen, AlertCircle, Sparkles, MessageSquare, Clock, PhoneCall, 
  ChevronRight, ChevronLeft, ExternalLink, ShieldCheck, ChevronDown, ChevronUp,
  FileSpreadsheet, Flame, Radio, Building2, Search, Scale, Gavel, Siren
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { getCustomBranding, subscribeToBranding, DepartmentBrandingConfig } from '../utils/brandingStorage';
import { 
  RecruitmentPortalConfig, 
  getRecruitmentPortalConfig, 
  subscribeToRecruitmentPortal,
  saveRecruitmentPortalConfig
} from '../utils/recruitmentPortalStorage';
import { HspdLawsPanel } from './HspdLawsPanel';

interface Props {
  onTriggerBackdoor?: () => void;
}

const RecruitmentInfoPanelComponent: React.FC<Props> = ({ onTriggerBackdoor }) => {
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());
  const [portal, setPortal] = useState<RecruitmentPortalConfig>(getRecruitmentPortalConfig());
  const [currentSlide, setCurrentSlide] = useState<'RECRUITMENT' | 'LAWS'>('RECRUITMENT');
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'phases' | 'divisions'>('overview');
  const [localAnimMode, setLocalAnimMode] = useState<'spin' | 'spin3d' | 'spin-float' | 'float'>('spin3d');

  useEffect(() => {
    const unsubBranding = subscribeToBranding(cfg => setBranding(cfg));
    const unsubPortal = subscribeToRecruitmentPortal(cfg => {
      setPortal(cfg);
      if (cfg.logoAnimation && cfg.logoAnimation !== 'none') {
        setLocalAnimMode(cfg.logoAnimation as any);
      }
    });
    return () => {
      unsubBranding();
      unsubPortal();
    };
  }, []);

  const handleCycleAnimation = () => {
    setLocalAnimMode(prev => {
      const next = prev === 'spin3d' ? 'spin' : prev === 'spin' ? 'spin-float' : prev === 'spin-float' ? 'float' : 'spin3d';
      saveRecruitmentPortalConfig({ logoAnimation: next });
      return next;
    });
  };

  const animClass = 
    localAnimMode === 'spin' ? 'animate-spin-slow' :
    localAnimMode === 'spin3d' ? 'animate-spin-3d' :
    localAnimMode === 'spin-float' ? 'animate-spin-float' :
    'animate-float-gentle';

  const animLabel = 
    localAnimMode === 'spin' ? 'Rotasi 360° Muter' :
    localAnimMode === 'spin3d' ? 'Rotasi 3D Koin Emas' :
    localAnimMode === 'spin-float' ? 'Muter & Mengambang' :
    'Melayang Halus';

  return (
    <div className="bg-[#0C1017] border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full font-mono text-xs">
      {/* ================= TOP SLIDER CAROUSEL CONTROLLER ================= */}
      <div className="bg-[#080B10] border-b border-gray-800/80 px-3 py-2 flex items-center justify-between gap-2 text-xs">
        {/* Tombol Geser ke Kiri (Kembali ke Penerimaan Anggota) */}
        <button
          type="button"
          id="btn-slide-prev"
          onClick={() => setCurrentSlide('RECRUITMENT')}
          disabled={currentSlide === 'RECRUITMENT'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition border ${
            currentSlide === 'RECRUITMENT'
              ? 'opacity-40 border-gray-800 text-gray-500 cursor-not-allowed bg-transparent'
              : 'border-amber-600/70 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:text-white cursor-pointer active:scale-95 shadow-sm'
          }`}
          title="Tekan tombol ke kiri untuk kembali ke PORTAL INFORMASI & PENERIMAAN ANGGOTA HSPD"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Kembali ke Penerimaan Anggota</span>
        </button>

        {/* Slide Indicator & Dots */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentSlide('RECRUITMENT')}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentSlide === 'RECRUITMENT' ? 'bg-amber-400 ring-2 ring-amber-400/40 scale-125' : 'bg-gray-600 hover:bg-gray-400'
              }`}
              title="Slide 1: Penerimaan Anggota HSPD"
            />
            <button
              type="button"
              onClick={() => setCurrentSlide('LAWS')}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentSlide === 'LAWS' ? 'bg-cyan-400 ring-2 ring-cyan-400/40 scale-125' : 'bg-gray-600 hover:bg-gray-400'
              }`}
              title="Slide 2: Undang-Undang & Regulasi HSPD"
            />
          </div>
          <span className="text-[10px] text-gray-300 font-mono font-bold tracking-wider hidden sm:inline">
            {currentSlide === 'RECRUITMENT' ? '[ 1/2 • REKRUTMEN ANGGOTA ]' : '[ 2/2 • UNDANG-UNDANG HSPD ]'}
          </span>
        </div>

        {/* Tombol Geser ke Kanan (Lihat Undang-Undang HSPD) */}
        <button
          type="button"
          id="btn-slide-next"
          onClick={() => setCurrentSlide('LAWS')}
          disabled={currentSlide === 'LAWS'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition border ${
            currentSlide === 'LAWS'
              ? 'opacity-40 border-gray-800 text-gray-500 cursor-not-allowed bg-transparent'
              : 'border-cyan-600/70 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-white cursor-pointer active:scale-95 shadow-sm'
          }`}
          title="Tekan tombol ke kanan untuk melihat PORTAL INFORMASI UNDANG-UNDANG & REGULASI KEPOLISIAN HSPD"
        >
          <span>Lihat Undang-Undang HSPD</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* ================= SLIDE 1: PORTAL INFORMASI & PENERIMAAN ANGGOTA HSPD ================= */}
      {currentSlide === 'RECRUITMENT' && (
        <div className="flex flex-col flex-1 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0B0F17] via-[#101724] to-[#0B0F17] border-b border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>

            {/* Dynamic Spinning & Moving Logo Container */}
            <div 
              onClick={handleCycleAnimation}
              className="relative shrink-0 group cursor-pointer select-none"
              title={`Logo sedang ${animLabel}. Klik untuk mengganti variasi putaran logo!`}
            >
              {/* Outer glowing orbital spinning ring */}
              <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-amber-400/60 animate-spin-slow pointer-events-none"></div>
              
              {/* Second subtle reverse spinning ring */}
              <div 
                className="absolute -inset-3 rounded-full border border-dotted border-amber-500/30 pointer-events-none" 
                style={{ animation: 'spinSlow 22s linear infinite reverse' }}
              ></div>

              {/* Badge Frame with Glowing Pulse Aura */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/90 p-1 border-2 border-amber-500/80 shadow-xl shadow-amber-500/40 flex items-center justify-center animate-pulse-glow transition-all duration-300 group-hover:scale-105 group-hover:border-amber-400">
                <img
                  src={branding.logoUrl || HSPD_LOGO_URL}
                  alt={`${branding.departmentName} Police Academy`}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain rounded-full transition-transform ${animClass}`}
                  onError={e => {
                    (e.target as HTMLImageElement).src = HSPD_LOGO_URL;
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left z-10 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  portal.isOpen
                    ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-700/60 text-rose-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${portal.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  {portal.badgeActiveText || (portal.isOpen ? 'REKRUTMEN DIBUKA • BATCH KEPOLISIAN AKTIF' : 'REKRUTMEN DITUTUP')}
                </span>
                <span className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-bold">
                  {portal.badgeCategoryText || 'POLICE ACADEMY'}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-100 font-sans tracking-wide">
                {portal.portalTitle || `PORTAL INFORMASI & PENERIMAAN ANGGOTA ${branding.departmentCode || 'HSPD'}`}
              </h2>

              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                {portal.portalDescription || `Bergabunglah dengan jajaran penegak hukum terdepan ${branding.agencyJurisdiction}. Mengabdi dengan integritas, keberanian, dan profesionalisme tinggi.`}
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0A0E17] text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-300 bg-[#121724]/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1. Ringkasan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requirements')}
              className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
                activeTab === 'requirements'
                  ? 'border-blue-500 text-blue-400 bg-[#121724]/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Syarat & Kualifikasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('phases')}
              className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
                activeTab === 'phases'
                  ? 'border-emerald-500 text-emerald-400 bg-[#121724]/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">3. Alur Seleksi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('divisions')}
              className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
                activeTab === 'divisions'
                  ? 'border-purple-500 text-purple-400 bg-[#121724]/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">4. Divisi Karir</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="p-4 sm:p-5 space-y-3.5 flex-1">
            {/* TAB 1: OVERVIEW & MOTTO */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Mission Statement Box */}
                <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Shield className="w-4 h-4" />
                    <span>{portal.visionTitle || 'VISI & NILAI UTAMA KEPOLISIAN (CORE VALUES)'}</span>
                  </div>
                  <p className="text-gray-300 font-sans leading-relaxed text-xs">
                    {portal.visionDescription || 'State of HighState Police Department (HSPD) bertindak sebagai garda terdepan penegakan hukum pidana, ketertiban umum, dan perlindungan warga kota. Setiap personel dituntut menjunjung tinggi:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    {portal.coreValues.map((val, i) => (
                      <div 
                        key={val.id ? `${val.id}-${i}` : `val-${i}`} 
                        className={`p-2 bg-[#161B22] border rounded-lg text-center ${
                          val.color === 'amber' ? 'border-amber-800/40' :
                          val.color === 'blue' ? 'border-blue-800/40' :
                          val.color === 'emerald' ? 'border-emerald-800/40' :
                          val.color === 'purple' ? 'border-purple-800/40' :
                          val.color === 'rose' ? 'border-rose-800/40' : 'border-cyan-800/40'
                        }`}
                      >
                        <div className={`font-bold ${
                          val.color === 'amber' ? 'text-amber-400' :
                          val.color === 'blue' ? 'text-blue-400' :
                          val.color === 'emerald' ? 'text-emerald-400' :
                          val.color === 'purple' ? 'text-purple-400' :
                          val.color === 'rose' ? 'text-rose-400' : 'text-cyan-400'
                        }`}>
                          {val.title}
                        </div>
                        <div className="text-gray-400 text-[10px]">{val.subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats / Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {portal.quickStats.map((stat, i) => (
                    <div key={stat.id ? `${stat.id}-${i}` : `stat-${i}`} className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
                      <div className="text-[10px] text-gray-500 font-mono">{stat.label}</div>
                      <div className={`text-xs font-bold ${
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'amber' ? 'text-amber-400' :
                        stat.color === 'purple' ? 'text-purple-400' :
                        stat.color === 'rose' ? 'text-rose-400' : 'text-cyan-400'
                      }`}>
                        {stat.value}
                      </div>
                      <div className="text-[9px] text-gray-400">{stat.sublabel}</div>
                    </div>
                  ))}
                </div>

                {/* Important Notice for Recruits */}
                <div className="p-3.5 bg-amber-950/20 border border-amber-900/50 rounded-xl space-y-1.5 text-amber-300">
                  <div className="flex items-center gap-2 font-bold text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{portal.registrationNoticeTitle || 'INFORMASI REGISTRASI AKUN TERMINAL MDT:'}</span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-sans leading-relaxed whitespace-pre-line">
                    {portal.registrationNoticeContent || (
                      <>
                        • <strong>Pendaftaran Anggota Baru</strong> hanya dapat dibuatkan/disahkan oleh <strong>Pihak Atasan (High Command / FTO Supervisor)</strong> yang memiliki Passcode Resmi HQ.<br />
                        • Setelah didaftarkan oleh Atasan, anggota yang bersangkutan dapat <strong>mengubah PIN pribadi secara mandiri</strong> melalui tab <em>"Ubah PIN Mandiri"</em> di sebelah kanan portal ini kapan saja.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: PERSYARATAN IC & OOC */}
            {activeTab === 'requirements' && (
              <div className="space-y-4">
                {/* Persyaratan In-Character (IC) */}
                <div className="p-4 bg-[#0D1117] border border-blue-900/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{portal.icSectionTitle || 'PERSYARATAN IN-CHARACTER (IC)'}</span>
                    </div>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">
                      {portal.icSectionTag || 'WARGA KOTA'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] text-gray-300 font-sans">
                    {portal.icRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Persyaratan Out-of-Character (OOC) */}
                <div className="p-4 bg-[#0D1117] border border-amber-900/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Users className="w-4 h-4" />
                      <span>{portal.oocSectionTitle || 'PERSYARATAN OUT-OF-CHARACTER (OOC)'}</span>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                      {portal.oocSectionTag || 'ROLEPLAY DISCIPLINE'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] text-gray-300 font-sans">
                    {portal.oocRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TAHAPAN SELEKSI & AKADEMI */}
            {activeTab === 'phases' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>{portal.phasesHeaderTitle || '4 TAHAPAN SELEKSI POLICE ACADEMY'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {portal.phasesHeaderTag || 'PROSES SELEKSI RESMI'}
                  </span>
                </div>

                {/* Selection Steps Loop */}
                {portal.phases.map((phase, idx) => (
                  <div key={phase.id ? `${phase.id}-${idx}` : `phase-${idx}`} className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-gray-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{phase.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{phase.tag}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans pl-7 leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: DIVISI KARIR */}
            {activeTab === 'divisions' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {portal.divisions.map((div, i) => (
                    <div key={div.id ? `${div.id}-${i}` : `div-${i}`} className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-200 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-blue-400" />
                          <span>{div.name}</span>
                        </span>
                        <span className="text-[10px] bg-[#161B22] text-gray-400 px-1.5 py-0.5 rounded font-mono">
                          {div.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                        {div.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Jenjang Pangkat */}
                <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    Jenjang Karir Kepolisian:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    {portal.rankHierarchy.map((rank, idx) => (
                      <React.Fragment key={idx}>
                        <span className={`px-2 py-0.5 rounded border ${
                          idx === portal.rankHierarchy.length - 1
                            ? 'bg-amber-950 text-amber-300 border-amber-800 font-bold'
                            : idx === 0
                              ? 'bg-gray-800 text-gray-300 border-gray-700'
                              : 'bg-blue-950 text-blue-300 border-blue-800'
                        }`}>
                          {rank}
                        </span>
                        {idx < portal.rankHierarchy.length - 1 && (
                          <span className="text-gray-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info Box */}
          <div className="bg-[#0F1319] border-t border-gray-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-hotline-backdoor-logo"
                onClick={onTriggerBackdoor}
                className="p-1 -m-1 rounded-md hover:bg-amber-500/20 active:scale-95 transition-all text-amber-400 cursor-pointer focus:outline-none"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors" />
              </button>
              <span 
                onClick={onTriggerBackdoor}
                className={onTriggerBackdoor ? "cursor-pointer hover:text-gray-300 transition-colors select-none" : ""}
              >
                Hotline Rekrutmen & Tiket Pendaftaran: <strong>{portal.discordHotlineText || 'Discord Resmi HSPD'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              {portal.copyrightText || `${branding.agencyJurisdiction || 'State of HighState Police'} Academy © 2026`}
            </span>
          </div>
        </div>
      )}

      {/* ================= SLIDE 2: PORTAL INFORMASI UNDANG-UNDANG & REGULASI HSPD ================= */}
      {currentSlide === 'LAWS' && (
        <div className="flex flex-col flex-1 animate-fadeIn">
          {/* Header Banner for Laws */}
          <div className="bg-gradient-to-r from-[#0B0F17] via-[#0e1726] to-[#0B0F17] border-b border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none"></div>

            {/* Dynamic Seal Container for Laws */}
            <div 
              onClick={handleCycleAnimation}
              className="relative shrink-0 group cursor-pointer select-none"
              title="Lambang Resmi Hukum & Advokasi HSPD. Klik untuk memutar!"
            >
              <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin-slow pointer-events-none"></div>
              <div 
                className="absolute -inset-3 rounded-full border border-dotted border-cyan-500/30 pointer-events-none" 
                style={{ animation: 'spinSlow 22s linear infinite reverse' }}
              ></div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/90 p-1 border-2 border-cyan-500/80 shadow-xl shadow-cyan-500/30 flex items-center justify-center animate-pulse-glow transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-400">
                <img
                  src={branding.logoUrl || HSPD_LOGO_URL}
                  alt={`${branding.departmentName} Police Penal Code`}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain rounded-full transition-transform ${animClass}`}
                  onError={e => {
                    (e.target as HTMLImageElement).src = HSPD_LOGO_URL;
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left z-10 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-cyan-950/80 border-cyan-700/60 text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  UU & REGULASI KEPOLISIAN • HUKUM BERLAKU
                </span>
                <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded font-bold">
                  KUHP & SOP HSPD
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-gray-100 font-sans tracking-wide">
                PORTAL INFORMASI UNDANG-UNDANG & REGULASI KEPOLISIAN HSPD
              </h2>

              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                Pedoman Resmi Kitab Undang-Undang Hukum Pidana (KUHP), Standar Operasional Prosedur (SOP) Penegakan Hukum, Hak Miranda, & Klasifikasi Sanksi Pidana Kota.
              </p>
            </div>
          </div>

          {/* Laws Sub-Panel Component */}
          <HspdLawsPanel onBackToRecruitment={() => setCurrentSlide('RECRUITMENT')} />
        </div>
      )}
    </div>
  );
};

export const RecruitmentInfoPanel = React.memo(RecruitmentInfoPanelComponent);

