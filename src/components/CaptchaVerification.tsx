import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, 
  Lock, KeyRound, Sparkles, Cpu, Eye, Check
} from 'lucide-react';

interface CaptchaVerificationProps {
  onVerify: (verified: boolean) => void;
  isVerified: boolean;
}

// Preset security puzzles with realistic police/MDT themes
const SECURITY_CHALLENGES = [
  {
    question: 'Berapa hasil dari kode keamanan: 10 + 4 ?',
    answer: '14',
    options: ['10', '14', '24', '40'],
    hint: 'Sandi 10-4: Roger / Dimengerti'
  },
  {
    question: 'Pilih nomor kode radio untuk "Situasi Aman / Terkendali":',
    answer: 'Code 4',
    options: ['Code 0', 'Code 1', 'Code 4', 'Code 99'],
    hint: 'Code 4 = Under Control / Clear'
  },
  {
    question: 'Berapa hasil dari: 7 + 8 ?',
    answer: '15',
    options: ['13', '15', '16', '14'],
    hint: 'Verifikasi Aritmatika Angka'
  },
  {
    question: 'Berapa hasil dari kode keamanan: 10 - 2 + 5 ?',
    answer: '13',
    options: ['12', '13', '15', '10'],
    hint: 'Perhitungan Validasi Token'
  },
  {
    question: 'Pilih kode radio untuk "Petugas Membutuhkan Bantuan Darurat (Officer Down)":',
    answer: '10-99',
    options: ['10-4', '10-8', '10-20', '10-99'],
    hint: '10-99 / 10-13 = Officer in distress'
  }
];

export const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  onVerify,
  isVerified
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currentChallenge = SECURITY_CHALLENGES[currentChallengeIdx];

  const handleCheckboxClick = () => {
    if (isVerified) return;
    setIsVerifying(true);
    // Simulate brief algorithmic inspection before opening interactive challenge
    setTimeout(() => {
      setIsVerifying(false);
      // Pick a random challenge
      setCurrentChallengeIdx(Math.floor(Math.random() * SECURITY_CHALLENGES.length));
      setSelectedOption(null);
      setErrorMessage(null);
      setIsOpenModal(true);
    }, 450);
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setErrorMessage(null);
  };

  const handleConfirmChallenge = () => {
    if (!selectedOption) {
      setErrorMessage('Silakan pilih salah satu jawaban untuk memverifikasi!');
      return;
    }

    if (selectedOption === currentChallenge.answer) {
      const generatedToken = `HSPD-SEC-${Math.floor(100000 + Math.random() * 900000)}`;
      setVerificationToken(generatedToken);
      setIsOpenModal(false);
      onVerify(true);
    } else {
      setErrorMessage('❌ Jawaban verifikasi tidak cocok. Silakan coba lagi!');
      // Switch to another challenge
      setTimeout(() => {
        setCurrentChallengeIdx((prev) => (prev + 1) % SECURITY_CHALLENGES.length);
        setSelectedOption(null);
      }, 700);
    }
  };

  const handleRefreshChallenge = () => {
    setCurrentChallengeIdx((prev) => (prev + 1) % SECURITY_CHALLENGES.length);
    setSelectedOption(null);
    setErrorMessage(null);
  };

  const handleResetVerification = () => {
    onVerify(false);
    setVerificationToken(null);
    setSelectedOption(null);
    setErrorMessage(null);
  };

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
              <span>{isVerified ? `Token: ${verificationToken}` : 'Verifikasi Keamanan MDT'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Shield Brand Logo */}
        <div className="flex flex-col items-end justify-center pl-2 border-l border-gray-800 text-[9px] text-gray-400 font-mono">
          <div className="flex items-center gap-1 text-blue-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span className="tracking-tight">HSPD GUARD</span>
          </div>
          <span className="text-[8px] text-gray-400">Anti-Bot Protection</span>
        </div>
      </div>

      {/* Interactive Verification Modal Challenge */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-blue-500/70 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 text-white border-b border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide">Uji Keamanan Otorisasi Petugas</h3>
                  <p className="text-[10px] text-blue-200 font-mono">HSPD Security Challenge v3</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshChallenge}
                className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-800/60 text-blue-200 transition border border-blue-700/50"
                title="Ganti Soal Tantangan"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5">
              <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-xl">
                <div className="text-[10px] font-bold text-blue-400 uppercase font-mono mb-1 flex items-center justify-between">
                  <span>Pertanyaan Verifikasi:</span>
                  <span className="text-gray-400 text-[9px]">Pilih jawaban tepat</span>
                </div>
                <p className="text-xs font-semibold text-gray-100">
                  {currentChallenge.question}
                </p>
                {currentChallenge.hint && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    💡 Petunjuk: {currentChallenge.hint}
                  </p>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-2">
                {currentChallenge.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/40'
                          : 'bg-[#0D1117] border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setSelectedOption(null);
                  }}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmChallenge}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VERIFIKASI</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#0D1117] border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between font-mono">
              <span>HSPD CAPTCHA GUARD</span>
              <span className="text-emerald-400 font-bold">SECURE PROTOCOL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
