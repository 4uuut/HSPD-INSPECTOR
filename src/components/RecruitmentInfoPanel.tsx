import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, FileCheck, CheckCircle2, Users, Target, Car, 
  BookOpen, AlertCircle, Sparkles, MessageSquare, Clock, PhoneCall, 
  ChevronRight, ExternalLink, ShieldCheck, ChevronDown, ChevronUp,
  FileSpreadsheet, Flame, Radio, Building2, Search
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { getCustomBranding, subscribeToBranding, DepartmentBrandingConfig } from '../utils/brandingStorage';

export const RecruitmentInfoPanel: React.FC = () => {
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'phases' | 'divisions'>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    return subscribeToBranding(cfg => setBranding(cfg));
  }, []);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              REKRUTMEN DIBUKA • BATCH KEPOLISIAN AKTIF
            </span>
            <span className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-bold">
              POLICE ACADEMY
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-gray-100 font-sans tracking-wide">
            PORTAL INFORMASI & PENERIMAAN ANGGOTA {branding.departmentCode || 'HSPD'}
          </h2>

          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
            Bergabunglah dengan jajaran penegak hukum terdepan {branding.agencyJurisdiction}. Mengabdi dengan integritas, keberanian, dan profesionalisme tinggi.
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
                <span>VISI & NILAI UTAMA KEPOLISIAN (CORE VALUES)</span>
              </div>
              <p className="text-gray-300 font-sans leading-relaxed text-xs">
                State of HighState Police Department (HSPD) bertindak sebagai garda terdepan penegakan hukum pidana, ketertiban umum, dan perlindungan warga kota. Setiap personel dituntut menjunjung tinggi:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 bg-[#161B22] border border-amber-800/40 rounded-lg text-center">
                  <div className="text-amber-400 font-bold">INTEGRITY</div>
                  <div className="text-gray-400 text-[10px]">Jujur, adil, anti-korupsi</div>
                </div>
                <div className="p-2 bg-[#161B22] border border-blue-800/40 rounded-lg text-center">
                  <div className="text-blue-400 font-bold">HONOR</div>
                  <div className="text-gray-400 text-[10px]">Kehormatan lencana dinas</div>
                </div>
                <div className="p-2 bg-[#161B22] border border-emerald-800/40 rounded-lg text-center">
                  <div className="text-emerald-400 font-bold">COURAGE</div>
                  <div className="text-gray-400 text-[10px]">Siap siaga 24/7 di lapangan</div>
                </div>
              </div>
            </div>

            {/* Quick Stats / Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
                <div className="text-[10px] text-gray-500 font-mono">STATUS REKRUTMEN</div>
                <div className="text-xs font-bold text-emerald-400">OPEN BATCH</div>
                <div className="text-[9px] text-gray-400">Pendaftaran Aktif</div>
              </div>

              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
                <div className="text-[10px] text-gray-500 font-mono">PANGKAT AWAL</div>
                <div className="text-xs font-bold text-blue-400">CADET [CDT]</div>
                <div className="text-[9px] text-gray-400">Probationary Period</div>
              </div>

              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
                <div className="text-[10px] text-gray-500 font-mono">KODE RADIO UTAMA</div>
                <div className="text-xs font-bold text-amber-400">FREQ 1111</div>
                <div className="text-[9px] text-gray-400">Dispatch Utama</div>
              </div>

              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-center space-y-0.5">
                <div className="text-[10px] text-gray-500 font-mono">OTORISASI TERMINAL</div>
                <div className="text-xs font-bold text-purple-400">HIGH COMMAND</div>
                <div className="text-[9px] text-gray-400">Supervisor Verified</div>
              </div>
            </div>

            {/* Important Notice for Recruits */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-900/50 rounded-xl space-y-1.5 text-amber-300">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>INFORMASI REGISTRASI AKUN TERMINAL MDT:</span>
              </div>
              <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                • <strong>Pendaftaran Anggota Baru</strong> hanya dapat dibuatkan/disahkan oleh <strong>Pihak Atasan (High Command / FTO Supervisor)</strong> yang memiliki Passcode Resmi HQ.<br />
                • Setelah didaftarkan oleh Atasan, anggota yang bersangkutan dapat <strong>mengubah PIN pribadi secara mandiri</strong> melalui tab <em>"Ubah PIN Mandiri"</em> di sebelah kanan portal ini kapan saja.
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
                  <span>PERSYARATAN IN-CHARACTER (IC)</span>
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">
                  WARGA KOTA
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-gray-300 font-sans">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Usia Minimal:</strong> Berusia minimal 21 tahun saat mendaftar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Catatan Kriminal Bersih (Clean Record):</strong> Tidak memiliki riwayat kriminal berat atau hukuman penjara dalam kurun waktu terakhir (SKCK Polisi Sah).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Lisensi & Surat Izin:</strong> Memiliki KTP HighState sah, Surat Izin Mengemudi (SIM A/C), serta izin kepemilikan senjata resmi.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Kebugaran Fisik & Psikologis:</strong> Bebas narkoba, sehat jasmani dan rohani, mampu berpikir tenang dalam situasi baku tembak / high-stress.</span>
                </div>
              </div>
            </div>

            {/* Persyaratan Out-of-Character (OOC) */}
            <div className="p-4 bg-[#0D1117] border border-amber-900/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Users className="w-4 h-4" />
                  <span>PERSYARATAN OUT-OF-CHARACTER (OOC)</span>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                  ROLEPLAY DISCIPLINE
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-gray-300 font-sans">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Komunikasi & Voice:</strong> Memiliki mikrofon yang jelas, stabil, dan wajib aktif di Voice Channel Radio Discord saat bertugas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Pemahaman Roleplay Polisi:</strong> Wajib memahami SOP Kepolisian, Miranda Rights, 10-Signals, serta anti <em>Powergaming (PG)</em>, <em>Metagaming (MG)</em>, & <em>Fail RP</em>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Kedisiplinan & Sikap:</strong> Mampu mematuhi komando atasan, menghargai sesama rekan dan player publik, serta siap menerima sanksi surat peringatan (SP) jika melanggar SOP.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Aktivitas & Jam Dinas:</strong> Bersedia memenuhi kuota minimal jam bertugas mingguan yang telah ditentukan divisi.</span>
                </div>
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
                4 TAHAPAN SELEKSI POLICE ACADEMY
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                PROSES SELEKSI RESMI
              </span>
            </div>

            {/* Step 1 */}
            <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-600 flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>Tahap I: Pendaftaran & Seleksi Administrasi</span>
                </div>
                <span className="text-[10px] text-blue-400 font-mono">Form Online / Discord</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans pl-7">
                Pengisian formulir rekrutmen, penyerahan identitas resmi, riwayat hidup, serta pengecekan latar belakang kriminal oleh divisi Internal Affairs.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-600 flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>Tahap II: Ujian Tulis & Wawancara Psikologi</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">Tes Pengetahuan</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans pl-7">
                Ujian pengetahuan dasar mengenai Kitab Undang-Undang Pidana (Pasal Hukum), Kode Sandi Radio 10-Signals, prosedur penangkapan (Miranda Warning), serta wawancara mentalitas.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600 flex items-center justify-center text-[10px] font-mono">3</span>
                  <span>Tahap III: Praktik EVOC & Uji Tembak (Shooting Range)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Simulasi Lapangan</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans pl-7">
                Uji kemampuan mengemudi kendaraan taktis (Emergency Vehicle Operations Course: PIT maneuver, boxing, high-speed pursuit) dan uji ketepatan menembak (Tazer, Combat Pistol, Carbine Rifle).
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-600 flex items-center justify-center text-[10px] font-mono">4</span>
                  <span>Tahap IV: Orientasi Lapangan Cadet (Field Training)</span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">Akademi Magang</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans pl-7">
                Kandidat yang lulus dilantik sebagai <strong>CADET [CDT]</strong> dan bertugas patroli langsung di lapangan di bawah bimbingan dan evaluasi ketat dari <em>Field Training Officer (FTO)</em> sebelum promosi menjadi <em>Police Officer I</em>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: DIVISI & JENJANG KARIR */}
        {activeTab === 'divisions' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between text-xs">
              <span className="text-gray-300 font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                STRUKTUR DIVISI & JENJANG KARIR KEPOLISIAN
              </span>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                5 DIVISI UTAMA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Divisi 1: Patrol Division */}
              <div className="p-3 bg-[#0D1117] border border-blue-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>Patrol Division (PD)</span>
                  </div>
                  <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800 font-mono">CORE UNIT</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Tulang punggung kepolisian untuk patroli perkotaan 24 jam, respon panggilan darurat 911, dan pengamanan pertama di TKP.
                </p>
              </div>

              {/* Divisi 2: Traffic Enforcement Unit */}
              <div className="p-3 bg-[#0D1117] border border-amber-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>Traffic Enforcement (TEU)</span>
                  </div>
                  <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800 font-mono">LALU LINTAS</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Unit pengawasan lalu lintas, operasi razia kelayakan berkendara, penindakan balap liar, dan pengawalan V.I.P.
                </p>
              </div>

              {/* Divisi 3: Criminal Investigation Division */}
              <div className="p-3 bg-[#0D1117] border border-emerald-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Detective / CID</span>
                  </div>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">INVESTIGASI</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Penyelidikan kasus kejahatan besar, sindikat narkotika, perdagangan senjata ilegal, serta operasi penyamaran rahasia (undercover).
                </p>
              </div>

              {/* Divisi 4: S.W.A.T Special Weapons */}
              <div className="p-3 bg-[#0D1117] border border-rose-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>S.W.A.T Tactical Unit</span>
                  </div>
                  <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-800 font-mono">ELITE FORCE</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Unit taktis penanganan krisis berbahaya tingkat tinggi, pembebasan sandera, penjinakan bahan peledak, dan raid properti bersenjata berat.
                </p>
              </div>
            </div>

            {/* Jenjang Pangkat */}
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>URUTAN JENJANG KEPANGKATAN KEPOLISIAN (HIERARKI):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">CADET</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">PO I</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">PO II</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">PO III</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">SLO</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">SERGEANT</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">LIEUTENANT</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">CAPTAIN</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">COMMANDER</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">DEPUTY CHIEF</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-700 font-bold">CHIEF OF POLICE</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-[#0F1319] border-t border-gray-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          <span>Hotline Rekrutmen & Tiket Pendaftaran: <strong>Discord Resmi HSPD</strong></span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          State of HighState Police Academy © 2026
        </span>
      </div>
    </div>
  );
};
