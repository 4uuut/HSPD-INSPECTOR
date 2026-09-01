import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, FileCheck, CheckCircle2, Users, Target, Car, 
  BookOpen, AlertCircle, Sparkles, MessageSquare, Clock, PhoneCall, 
  ChevronRight, ExternalLink, ShieldCheck, ChevronDown, ChevronUp,
  FileSpreadsheet, Flame, Radio, Building2, Search
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { getCustomBranding, subscribeToBranding, DepartmentBrandingConfig } from '../utils/brandingStorage';
import { 
  RecruitmentPortalConfig, 
  getRecruitmentPortalConfig, 
  subscribeToRecruitmentPortal 
} from '../utils/recruitmentPortalStorage';

export const RecruitmentInfoPanel: React.FC = () => {
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());
  const [portal, setPortal] = useState<RecruitmentPortalConfig>(getRecruitmentPortalConfig());
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'phases' | 'divisions'>('overview');

  useEffect(() => {
    const unsubBranding = subscribeToBranding(cfg => setBranding(cfg));
    const unsubPortal = subscribeToRecruitmentPortal(cfg => setPortal(cfg));
    return () => {
      unsubBranding();
      unsubPortal();
    };
  }, []);

  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full font-mono text-xs">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F1319] via-[#151c27] to-[#0F1319] border-b border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>

        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/80 p-1 border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <img
              src={branding.logoUrl || HSPD_LOGO_URL}
              alt={`${branding.departmentName} Police Academy`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-full"
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
      <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0D1117] text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-400 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
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
              ? 'border-blue-500 text-blue-400 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
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
              ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
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
              ? 'border-purple-500 text-purple-400 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">4. Divisi Karir</span>
        </button>
      </div>

      {/* Main Content Area with Scroll */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 max-h-[560px]">
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
                    key={val.id || i} 
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
                <div key={stat.id || i} className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
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
              <div key={phase.id || idx} className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-gray-200">
                    <span className="w-5 h-5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-600 flex items-center justify-center text-[10px] font-mono">
                      {phase.stepNumber || idx + 1}
                    </span>
                    <span>{phase.title}</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">{phase.tag}</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans pl-7">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: DIVISI & JENJANG KARIR */}
        {activeTab === 'divisions' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between text-xs">
              <span className="text-gray-300 font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>{portal.divisionsHeaderTitle || 'STRUKTUR DIVISI & JENJANG KARIR KEPOLISIAN'}</span>
              </span>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                {portal.divisionsHeaderTag || `${portal.divisions.length} DIVISI UTAMA`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {portal.divisions.map((div, idx) => (
                <div key={div.id || idx} className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>{div.name}</span>
                    </div>
                    <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800 font-mono">
                      {div.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                    {div.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Jenjang Pangkat */}
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>URUTAN JENJANG KEPANGKATAN KEPOLISIAN (HIERARKI):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                {portal.rankHierarchy.map((rank, idx) => (
                  <React.Fragment key={idx}>
                    <span className={`px-2 py-0.5 rounded border ${
                      idx >= portal.rankHierarchy.length - 6
                        ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
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
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          <span>Hotline Rekrutmen & Tiket Pendaftaran: <strong>{portal.discordHotlineText || 'Discord Resmi HSPD'}</strong></span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          {portal.copyrightText || `${branding.agencyJurisdiction || 'State of HighState Police'} Academy © 2026`}
        </span>
      </div>
    </div>
  );
};
