import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building2,
  FileCheck,
  CheckCircle2,
  Users,
  Target,
  BookOpen,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Clock,
  PhoneCall,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Flame,
  Radio,
  FileText,
  Megaphone,
  Award,
  Sliders,
  Landmark,
  Scale,
  Briefcase
} from 'lucide-react';
import {
  GovernmentPortalConfig,
  getGovernmentPortalConfig,
  subscribeToGovernmentPortal
} from '../utils/governmentRecruitmentStorage';
import { GovernmentRecruitmentModal } from './GovernmentRecruitmentModal';
import { OfficerProfile } from '../types';

interface Props {
  currentOfficer?: OfficerProfile | null;
}

export const GovernmentRecruitmentInfoPanel: React.FC<Props> = ({ currentOfficer }) => {
  const [portal, setPortal] = useState<GovernmentPortalConfig>(getGovernmentPortalConfig());
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'phases' | 'ministries'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    return subscribeToGovernmentPortal(cfg => setPortal(cfg));
  }, []);

  return (
    <div className="bg-[#161B22] border border-amber-700/60 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full font-mono text-xs">
      
      {/* Header Banner Kenegaraan */}
      <div className="bg-gradient-to-r from-[#17120A] via-[#241B0E] to-[#140F08] border-b border-amber-800/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-56 bg-gradient-to-l from-amber-500/15 to-transparent pointer-events-none"></div>

        {/* State Seal Emblem */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/90 p-2 border-2 border-amber-500/80 shadow-xl shadow-amber-500/30 flex items-center justify-center text-amber-300">
            <Landmark className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="space-y-1.5 text-center sm:text-left z-10 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              portal.isOpen
                ? 'bg-emerald-950/90 border-emerald-600/70 text-emerald-300 shadow-sm shadow-emerald-950/40'
                : 'bg-rose-950/90 border-rose-600/70 text-rose-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${portal.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {portal.badgeActiveText || (portal.isOpen ? 'REKRUTMEN DIBUKA • SELEKSI TERBUKA' : 'REKRUTMEN DITUTUP')}
            </span>
            <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-600/60 px-2 py-0.5 rounded font-bold uppercase">
              {portal.badgeCategoryText || 'CIVIL SERVICE & EXECUTIVE'}
            </span>

            {/* Quick Button for Superiors to Edit Announcement */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="ml-auto px-2 py-0.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200 text-[10px] font-bold rounded flex items-center gap-1 transition active:scale-95 shadow-sm"
              title="Ubah pengumuman dan pengaturan portal rekrutmen ini (Akses Atasan)"
            >
              <Sliders className="w-3 h-3 text-amber-300" />
              <span>Ubah Pengumuman (Atasan)</span>
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-amber-100 font-sans tracking-wide">
            {portal.portalTitle || 'PORTAL INFORMASI & PENERIMAAN APARATUR NEGARA'}
          </h2>

          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
            {portal.portalDescription || 'Pusat Informasi Kenegaraan & Penerimaan Calon Aparatur Sipil Negara serta Staf Khusus Eksekutif.'}
          </p>
        </div>
      </div>

      {/* MAKLUMAT RESMI TERKINI BANNER (Bisa diubah-ubah oleh Atasan) */}
      <div className={`p-3 sm:p-3.5 border-b font-sans transition-colors ${
        portal.announcementLevel === 'CRITICAL'
          ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
          : portal.announcementLevel === 'URGENT'
          ? 'bg-amber-950/60 border-amber-800/70 text-amber-200'
          : 'bg-[#15120B] border-amber-900/50 text-amber-100/90'
      }`}>
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-500/40 uppercase">
                  📢 MAKLUMAT RESMI EKSEKUTIF
                </span>
                <span className="text-xs font-bold font-sans text-amber-200 truncate">
                  {portal.announcementHeadline}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {portal.announcementAuthor}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              {portal.announcementContent}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0D1117] text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-300 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Visi & Nilai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeTab === 'requirements'
              ? 'border-amber-500 text-amber-300 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Persyaratan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('phases')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeTab === 'phases'
              ? 'border-amber-500 text-amber-300 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate">Alur Seleksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ministries')}
          className={`py-2.5 px-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
            activeTab === 'ministries'
              ? 'border-amber-500 text-amber-300 bg-[#161B22]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">Formasi</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        
        {/* TAB 1: OVERVIEW & NILAI KENEGARAAN */}
        {activeTab === 'overview' && (
          <div className="space-y-4 font-sans">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              {portal.quickStats.map(stat => (
                <div key={stat.id} className="p-2.5 bg-[#0D1117] border border-amber-900/40 rounded-lg text-center">
                  <div className="text-[9px] text-gray-400 uppercase font-bold">{stat.label}</div>
                  <div className="text-base sm:text-lg font-bold text-amber-300">{stat.value}</div>
                  <div className="text-[8px] text-gray-500">{stat.sublabel}</div>
                </div>
              ))}
            </div>

            {/* Visi Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{portal.visionTitle}</span>
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {portal.visionDescription}
              </p>
            </div>

            {/* Core Values Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {portal.coreValues.map(val => (
                <div key={val.id} className="p-3 bg-[#0D1117] border border-gray-800 hover:border-amber-700/60 rounded-lg space-y-1 transition">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="font-bold text-xs font-mono text-gray-100">{val.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pl-4">{val.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PERSYARATAN */}
        {activeTab === 'requirements' && (
          <div className="space-y-4 font-sans">
            {/* IC Requirements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <span className="font-bold text-xs font-mono text-amber-300 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>{portal.icSectionTitle}</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-mono">
                  {portal.icSectionTag}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {portal.icRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2 bg-[#0D1117] border border-gray-800/80 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* OOC Requirements */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <span className="font-bold text-xs font-mono text-blue-300 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-blue-400" />
                  <span>{portal.oocSectionTitle}</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60 font-mono">
                  {portal.oocSectionTag}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {portal.oocRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2 bg-[#0D1117] border border-gray-800/80 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: ALUR SELEKSI */}
        {activeTab === 'phases' && (
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
              <span className="font-bold text-xs font-mono text-purple-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>{portal.phasesHeaderTitle}</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60 font-mono">
                {portal.phasesHeaderTag}
              </span>
            </div>

            <div className="space-y-2.5">
              {portal.phases.map((phase) => (
                <div key={phase.id} className="p-3 bg-[#0D1117] border border-gray-800 hover:border-amber-600/50 rounded-lg flex items-start gap-3 transition">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                    {phase.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-100">{phase.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                        {phase.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FORMASI KEMENTERIAN */}
        {activeTab === 'ministries' && (
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
              <span className="font-bold text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{portal.ministriesHeaderTitle}</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono">
                {portal.ministriesHeaderTag}
              </span>
            </div>

            <div className="space-y-2.5">
              {portal.ministries.map((min) => (
                <div key={min.id} className="p-3 bg-[#0D1117] border border-gray-800 hover:border-amber-600/50 rounded-lg space-y-1.5 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                      <h4 className="font-bold text-xs text-gray-100">{min.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded">
                      {min.quota}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 pl-6 leading-relaxed">{min.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Registration Action */}
      <div className="p-3.5 bg-[#0D1117] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="text-[10px] text-gray-400 font-mono text-center sm:text-left">
          <span>{portal.copyrightText}</span>
        </div>

        <div className="flex items-center gap-2">
          {portal.formRegistrationUrl && (
            <a
              href={portal.formRegistrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Daftar / Formulir Seleksi</span>
            </a>
          )}
          {portal.discordHotlineUrl && (
            <a
              href={portal.discordHotlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discord Kenegaraan</span>
            </a>
          )}
        </div>
      </div>

      {/* Modal Settings */}
      {isEditModalOpen && (
        <GovernmentRecruitmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentOfficer={currentOfficer}
          onPortalUpdated={updated => setPortal(updated)}
        />
      )}
    </div>
  );
};
