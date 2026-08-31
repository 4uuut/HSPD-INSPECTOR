import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, 
  Lock, KeyRound, Sparkles, Cpu, Eye, Check,
  Car, Siren, Shield, Radio, Crosshair, Award, FileText, 
  Target, Zap, Compass, HelpCircle, Terminal, Send
} from 'lucide-react';

interface CaptchaVerificationProps {
  onVerify: (verified: boolean) => void;
  isVerified: boolean;
}

// Single-Question Security Challenge Bank (No Multiple-Choice - Manual Typed Input)
interface TypedSecurityChallenge {
  id: string;
  category: string;
  question: string;
  hint: string;
  expectedAnswers: string[]; // List of valid accepted variations (lowercased during check)
  placeholder: string;
  exampleAnswer?: string;
}

const SECURITY_QUESTIONS: TypedSecurityChallenge[] = [
  {
    id: 'radio_10_8',
    category: '10-CODES RADIO',
    question: 'Sebutkan kode sandi radio untuk status "Siap Menerima Tugas / Sedang Berpatroli (On-Duty)":',
    hint: 'Format standar 10-Codes (Contoh: 10-8)',
    expectedAnswers: ['10-8', '10 8', '108', 'code 10-8', 'code 108'],
    placeholder: 'Contoh: 10-8'
  },
  {
    id: 'radio_10_99',
    category: 'DARURAT TERTINGGI',
    question: 'Sebutkan kode sandi radio darurat saat "Petugas Dalam Bahaya / Membutuhkan Bantuan Kritis (Officer Down)":',
    hint: 'Sandi darurat 10-99 atau 10-13',
    expectedAnswers: ['10-99', '10 99', '1099', '10-13', '10 13', '1013', 'code 10-99', 'code 1099'],
    placeholder: 'Contoh: 10-99'
  },
  {
    id: 'code_4',
    category: 'RADIO CODE',
    question: 'Sebutkan kode radio kepolisian untuk menyatakan status "Situasi Terkendali / Aman / Clear":',
    hint: 'Kode status situasi (Contoh: Code 4)',
    expectedAnswers: ['code 4', 'code-4', 'code4', 'c4', '4', 'kode 4', 'code 4 under control'],
    placeholder: 'Contoh: Code 4'
  },
  {
    id: 'miranda_warning',
    category: 'SOP HUKUM & HAK',
    question: 'Sebutkan nama hak peringatan hukum yang WAJIB dibacakan kepada tersangka saat penangkapan sebelum interogasi:',
    hint: 'Hak konstitusional tersangka (Miranda Rights)',
    expectedAnswers: ['miranda rights', 'miranda', 'hak miranda', 'miranda warning', 'miranda right', 'peringatan miranda'],
    placeholder: 'Ketik nama hak perlindungan hukum...'
  },
  {
    id: 'radio_10_7',
    category: '10-CODES RADIO',
    question: 'Sebutkan kode sandi radio untuk status "Selesai Dinas / Keluar dari Pelayanan (Off-Duty)":',
    hint: 'Sandi status dinas (Contoh: 10-7)',
    expectedAnswers: ['10-7', '10 7', '107', 'code 10-7', 'code 107'],
    placeholder: 'Contoh: 10-7'
  },
  {
    id: 'radio_10_20',
    category: '10-CODES RADIO',
    question: 'Sebutkan kode sandi radio kepolisian untuk menanyakan atau menyampaikan "Lokasi Terkini Petugas":',
    hint: 'Sandi posisi/koordinat (Contoh: 10-20)',
    expectedAnswers: ['10-20', '10 20', '1020', 'code 10-20', 'code 1020'],
    placeholder: 'Contoh: 10-20'
  },
  {
    id: 'radio_10_4',
    category: '10-CODES RADIO',
    question: 'Sebutkan kode sandi radio untuk menyatakan "Pesan Diterima / Dimengerti / Roger":',
    hint: 'Sandi konfirmasi penerimaan radio (Contoh: 10-4)',
    expectedAnswers: ['10-4', '10 4', '104', 'code 10-4', 'code 104'],
    placeholder: 'Contoh: 10-4'
  },
  {
    id: 'math_calc_1',
    category: 'KALKULASI OTORISASI',
    question: 'Hitung hasil perhitungan token keamanan kepolisian: (12 × 4) + 12 - 10 = ?',
    hint: 'Ketik angka hasil akhir perhitungan di atas',
    expectedAnswers: ['50'],
    placeholder: 'Ketik angka hasil...'
  },
  {
    id: 'math_calc_2',
    category: 'KALKULASI OTORISASI',
    question: 'Hitung hasil perhitungan token keamanan kepolisian: (25 × 2) + 35 - 15 = ?',
    hint: 'Ketik angka hasil akhir perhitungan di atas',
    expectedAnswers: ['70'],
    placeholder: 'Ketik angka hasil...'
  },
  {
    id: 'fine_calc_1',
    category: 'KALKULASI DENDA TILANG',
    question: 'Hitung total akumulasi denda tilang: Menerobos Lampu Merah ($250) + Tidak Bawa SIM ($350) + Kebut-kebutan ($400):',
    hint: 'Ketik nominal angka total (Contoh: 1000 atau $1000)',
    expectedAnswers: ['1000', '$1000', '1.000', '$1.000', '1000$', '1,000', '$1,000'],
    placeholder: 'Ketik angka total denda (misal: 1000)...'
  },
  {
    id: 'div_swat',
    category: 'STRUKTUR DIVISI',
    question: 'Sebutkan singkatan nama unit taktis kepolisian bersenjata berat khusus penanganan teror dan sandera:',
    hint: 'Special Weapons and Tactics (Singkatan 4 huruf)',
    expectedAnswers: ['swat', 's.w.a.t', 's.w.a.t.'],
    placeholder: 'Ketik singkatan unit taktis...'
  },
  {
    id: 'div_iad',
    category: 'STRUKTUR DIVISI',
    question: 'Sebutkan singkatan nama divisi internal kepolisian yang bertugas menginvestigasi pelanggaran kode etik personel:',
    hint: 'Internal Affairs Division (Singkatan 3 huruf)',
    expectedAnswers: ['iad', 'i.a.d', 'i.a.d.', 'internal affairs'],
    placeholder: 'Ketik singkatan divisi internal...'
  }
];

export const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  onVerify,
  isVerified
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Single Question State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  
  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEffect, setSuccessEffect] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Pick a random question
  const randomizeQuestion = () => {
    const nextIdx = Math.floor(Math.random() * SECURITY_QUESTIONS.length);
    setCurrentIdx(nextIdx);
    setUserInput('');
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCheckboxClick = () => {
    if (isVerified) return;
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      randomizeQuestion();
      setIsOpenModal(true);
    }, 350);
  };

  // VERIFY USER TYPED INPUT
  const handleValidateInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = userInput.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Silakan ketik jawaban terlebih dahulu!');
      inputRef.current?.focus();
      return;
    }

    const currentQ = SECURITY_QUESTIONS[currentIdx];
    const isMatched = currentQ.expectedAnswers.some(ans => {
      const cleanExpected = ans.trim().toLowerCase();
      return trimmed === cleanExpected || trimmed.replace(/[\s\-_]/g, '') === cleanExpected.replace(/[\s\-_]/g, '');
    });

    if (isMatched) {
      setSuccessEffect(true);
      const generatedToken = `HSPD-SEC-${Math.floor(100000 + Math.random() * 900000)}`;
      setVerificationToken(generatedToken);

      setTimeout(() => {
        setSuccessEffect(false);
        setIsOpenModal(false);
        onVerify(true);
      }, 550);
    } else {
      setErrorMessage('❌ Jawaban verifikasi tidak cocok. Pastikan ejaan tepat atau klik Acak Soal!');
      inputRef.current?.select();
    }
  };

  const handleResetVerification = () => {
    onVerify(false);
    setVerificationToken(null);
    setUserInput('');
    setErrorMessage(null);
  };

  const currentQ = SECURITY_QUESTIONS[currentIdx];

  return (
    <div className="w-full select-none">
      {/* reCAPTCHA-style Widget Box */}
      <div 
        className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
          isVerified 
            ? 'bg-emerald-950/40 border-emerald-600/70 shadow-sm shadow-emerald-900/30'
            : 'bg-[#0D1117] border-gray-700 hover:border-gray-500 shadow-md'
        }`}
      >
        {/* Left Side: Checkbox & Label */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isVerified ? (
              <div 
                onClick={handleResetVerification}
                className="w-7 h-7 rounded-lg bg-emerald-600 border border-emerald-400 flex items-center justify-center text-white cursor-pointer shadow-md shadow-emerald-600/40 transition hover:scale-105"
                title="Klik untuk verifikasi ulang"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            ) : isVerifying ? (
              <div className="w-7 h-7 rounded-lg bg-gray-800 border border-blue-500 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                id="btn-captcha-checkbox"
                onClick={handleCheckboxClick}
                className="w-7 h-7 rounded-lg bg-[#161B22] border-2 border-gray-500 hover:border-blue-400 focus:border-blue-400 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-inner"
              >
                <span className="sr-only">Verifikasi Saya bukan robot</span>
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs font-sans">
              <span className={isVerified ? 'text-emerald-300' : 'text-gray-200'}>
                {isVerified ? 'Saya bukan robot (Terverifikasi)' : 'Saya bukan robot'}
              </span>
              {isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
              <span>{isVerified ? `Token: ${verificationToken}` : 'HSPD Guard Anti-Bot System'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Shield Brand Logo */}
        <div className="flex flex-col items-end justify-center pl-2 border-l border-gray-800 text-[9px] text-gray-400 font-mono">
          <div className="flex items-center gap-1 text-blue-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span className="tracking-tight">HSPD GUARD</span>
          </div>
          <span className="text-[8px] text-gray-400">Security Suite</span>
        </div>
      </div>

      {/* Single Challenge Verification Modal (No Multiple-Choice / No Tabs) */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3">
          <div className={`bg-[#161B22] border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-sans transition-all ${
            successEffect ? 'border-emerald-500 shadow-emerald-500/30' : 'border-blue-500/80 shadow-blue-900/30'
          }`}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-3.5 text-white border-b border-blue-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/50 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-white">HSPD Security Challenge</h3>
                    <span className="px-1.5 py-0.2 bg-blue-500/30 text-blue-200 text-[9px] rounded font-mono border border-blue-400/40">GUARD VERIFICATION</span>
                  </div>
                  <p className="text-[10px] text-blue-200 font-mono">Validasi Otoritas & Pencegahan Otomasi Bot</p>
                </div>
              </div>

              <button
                type="button"
                onClick={randomizeQuestion}
                className="p-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-800/80 text-blue-200 transition border border-blue-700/60 active:scale-95 flex items-center gap-1 text-[10px]"
                title="Ganti / Acak Soal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acak Soal</span>
              </button>
            </div>

            {/* Modal Body - Single Question with Direct Text Input */}
            <div 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleValidateInput();
                }
              }} 
              className="p-4 space-y-3.5"
            >
              
              {/* Question Box */}
              <div className="p-3.5 bg-[#0D1117] border border-blue-900/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 text-[9px] font-mono font-bold tracking-wider">
                    {currentQ.category}
                  </span>
                  <span className="text-[9px] text-amber-400/90 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>INPUT MANUAL (NON-PILIHAN GANDA)</span>
                  </span>
                </div>

                <p className="text-xs font-semibold text-gray-100 leading-relaxed">
                  {currentQ.question}
                </p>

                {currentQ.hint && (
                  <div className="text-[10px] text-gray-400 flex items-start gap-1 pt-1 border-t border-gray-800/80 font-mono">
                    <span className="text-amber-400">💡</span>
                    <span>Petunjuk: {currentQ.hint}</span>
                  </div>
                )}
              </div>

              {/* Direct Input Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Jawaban Anda:</span>
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">Tekan [Enter] untuk verifikasi</span>
                </label>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={currentQ.placeholder}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#0D1117] border-2 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-gray-500 text-xs font-mono font-semibold transition"
                    autoComplete="off"
                    autoFocus
                  />
                  {userInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setUserInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs px-1.5 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message Notification */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {successEffect && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs flex items-center justify-center gap-2 animate-pulse font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>VERIFIKASI TEPAT! Akses terminal disetujui...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setErrorMessage(null);
                    setUserInput('');
                  }}
                  className="w-1/3 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => handleValidateInput()}
                  disabled={!userInput.trim()}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>KONFIRMASI JAWABAN</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[#0D1117] border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>HSPD CAPTCHA GUARD</span>
              </span>
              <span className="text-emerald-400 font-bold">MIL-SPEC SECURITY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
