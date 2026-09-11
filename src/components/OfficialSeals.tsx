import React from 'react';
import { SealType } from '../types';

interface SealProps {
  type: SealType;
  className?: string;
  size?: number;
}

export const OfficialSeal: React.FC<SealProps> = ({ type, className = '', size = 130 }) => {
  if (type === 'HSPD_OFFICIAL') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-700/85 drop-shadow-sm rotate-[-4deg]">
          {/* Outer Ring */}
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="6 3" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="2" />
          
          {/* Circular Text Path */}
          <path
            id="hspd-seal-upper"
            d="M 22 100 A 78 78 0 1 1 178 100"
            fill="none"
          />
          <path
            id="hspd-seal-lower"
            d="M 178 100 A 78 78 0 1 1 22 100"
            fill="none"
          />
          
          <text fontSize="12.5" fontWeight="900" fill="currentColor" letterSpacing="2.5" fontFamily="monospace">
            <textPath href="#hspd-seal-upper" startOffset="50%" textAnchor="middle">
              ★ HIGHSTATE POLICE DEPT ★
            </textPath>
          </text>
          <text fontSize="11" fontWeight="800" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#hspd-seal-lower" startOffset="50%" textAnchor="middle">
              MISSION ROW HQ • OFFICIAL
            </textPath>
          </text>

          {/* Inner Ring */}
          <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />

          {/* Center Badge / Shield */}
          <g transform="translate(70, 68) scale(0.6)">
            <path
              d="M50 0 L100 20 L100 65 Q100 95 50 110 Q0 95 0 65 L0 20 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
            />
            <path
              d="M50 15 L85 30 L85 62 Q85 85 50 96 Q15 85 15 62 L15 30 Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="2"
            />
            <text x="50" y="58" fontSize="22" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
              HSPD
            </text>
            <text x="50" y="76" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">
              EST. 2026
            </text>
          </g>

          {/* Verified Badge text */}
          <rect x="52" y="142" width="96" height="18" fill="currentColor" rx="3" />
          <text x="100" y="155" fontSize="10.5" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" fontFamily="monospace">
            SEAL RESMI
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'CID_DETECTIVE') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-blue-800/85 drop-shadow-sm rotate-[3deg]">
          {/* Outer Ring */}
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
          
          <path id="cid-seal-upper" d="M 22 100 A 78 78 0 1 1 178 100" fill="none" />
          <path id="cid-seal-lower" d="M 178 100 A 78 78 0 1 1 22 100" fill="none" />
          
          <text fontSize="12" fontWeight="900" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#cid-seal-upper" startOffset="50%" textAnchor="middle">
              CRIMINAL INVESTIGATION DIV
            </textPath>
          </text>
          <text fontSize="11" fontWeight="800" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#cid-seal-lower" startOffset="50%" textAnchor="middle">
              ★ DETECTIVE BUREAU CID ★
            </textPath>
          </text>

          <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
          
          {/* Magnifying Glass / Star Emblem */}
          <g transform="translate(68, 65) scale(0.65)">
            <circle cx="45" cy="45" r="28" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="4" />
            <line x1="66" y1="66" x2="92" y2="92" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <text x="45" y="52" fontSize="20" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
              CID
            </text>
          </g>

          <rect x="46" y="142" width="108" height="18" fill="currentColor" rx="2" />
          <text x="100" y="155" fontSize="10" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" fontFamily="monospace">
            DIVISI KRIMINAL
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'TRAFFIC_TEU') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-800/85 drop-shadow-sm rotate-[-2deg]">
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4.5" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" />
          
          <path id="teu-seal-upper" d="M 22 100 A 78 78 0 1 1 178 100" fill="none" />
          <path id="teu-seal-lower" d="M 178 100 A 78 78 0 1 1 22 100" fill="none" />
          
          <text fontSize="12" fontWeight="900" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#teu-seal-upper" startOffset="50%" textAnchor="middle">
              TRAFFIC ENFORCEMENT UNIT
            </textPath>
          </text>
          <text fontSize="11" fontWeight="800" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#teu-seal-lower" startOffset="50%" textAnchor="middle">
              ★ LICENSING DIVISION ★
            </textPath>
          </text>

          <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
          
          <g transform="translate(62, 62) scale(0.75)">
            <polygon points="50,5 64,36 98,36 70,57 81,89 50,70 19,89 30,57 2,36 36,36" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
            <text x="50" y="55" fontSize="16" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
              TEU
            </text>
          </g>

          <rect x="42" y="142" width="116" height="18" fill="currentColor" rx="2" />
          <text x="100" y="155" fontSize="10" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" fontFamily="monospace">
            DIVISI PERIZINAN
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'INTERNAL_AFFAIRS') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-purple-900/85 drop-shadow-sm rotate-[4deg]">
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="8 4" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="2" />
          
          <path id="iad-seal-upper" d="M 22 100 A 78 78 0 1 1 178 100" fill="none" />
          <path id="iad-seal-lower" d="M 178 100 A 78 78 0 1 1 22 100" fill="none" />
          
          <text fontSize="12" fontWeight="900" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#iad-seal-upper" startOffset="50%" textAnchor="middle">
              INTERNAL AFFAIRS DIVISION
            </textPath>
          </text>
          <text fontSize="11" fontWeight="800" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#iad-seal-lower" startOffset="50%" textAnchor="middle">
              ★ ETHICS & DISCIPLINE ★
            </textPath>
          </text>

          <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
          
          <text x="100" y="98" fontSize="26" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
            IAD
          </text>
          <text x="100" y="118" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">
            PROPAM HSPD
          </text>

          <rect x="45" y="142" width="110" height="18" fill="currentColor" rx="2" />
          <text x="100" y="155" fontSize="10" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" fontFamily="monospace">
            SIDANG DISIPLIN
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'HIGH_COMMAND') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-amber-700/90 drop-shadow-sm rotate-[-3deg]">
          {/* Double Octagon / Star Border */}
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          
          <path id="hc-seal-upper" d="M 22 100 A 78 78 0 1 1 178 100" fill="none" />
          <path id="hc-seal-lower" d="M 178 100 A 78 78 0 1 1 22 100" fill="none" />
          
          <text fontSize="12" fontWeight="900" fill="currentColor" letterSpacing="2.5" fontFamily="monospace">
            <textPath href="#hc-seal-upper" startOffset="50%" textAnchor="middle">
              ★ CHIEF OF POLICE OFFICE ★
            </textPath>
          </text>
          <text fontSize="11" fontWeight="800" fill="currentColor" letterSpacing="2" fontFamily="monospace">
            <textPath href="#hc-seal-lower" startOffset="50%" textAnchor="middle">
              HIGH COMMAND VERIFIED
            </textPath>
          </text>

          <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
          
          {/* 4 Stars Emblem */}
          <g transform="translate(60, 68) scale(0.8)">
            <text x="50" y="32" fontSize="24" textAnchor="middle" fill="currentColor">
              ★★★★
            </text>
            <text x="50" y="58" fontSize="18" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">
              COMMAND
            </text>
          </g>

          <rect x="42" y="142" width="116" height="18" fill="currentColor" rx="3" />
          <text x="100" y="155" fontSize="10" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" fontFamily="monospace">
            OTORISASI PIMPINAN
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'APPROVED_PASSED') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size * 1.1, height: size * 0.7 }}
      >
        <div className="w-full h-full border-4 border-emerald-700/80 rounded-md p-1 rotate-[-6deg] flex flex-col items-center justify-center bg-emerald-950/10 shadow-sm">
          <div className="border border-emerald-700/60 w-full h-full rounded flex flex-col items-center justify-center px-2 py-1">
            <span className="text-[13px] font-black text-emerald-800 tracking-widest font-mono uppercase">
              APPROVED & PASSED
            </span>
            <span className="text-[9px] font-bold text-emerald-700 font-mono">
              VERIFIKASI MARKAS BESAR
            </span>
            <span className="text-[8px] font-semibold text-emerald-600/90 font-mono">
              STATUS: MEMENUHI SYARAT
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'PRESIDENTIAL_SEAL') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-md rotate-[-4deg]"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="#D97706" strokeWidth="4" strokeDasharray="3,3" opacity="0.95" />
          <circle cx="100" cy="100" r="86" fill="#78350F" fillOpacity="0.08" stroke="#B45309" strokeWidth="3" opacity="0.9" />
          <circle cx="100" cy="100" r="74" fill="none" stroke="#D97706" strokeWidth="1.5" opacity="0.85" />

          {/* Curved Text for President */}
          <path id="presidentialCurveTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
          <path id="presidentialCurveBottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />

          <text className="text-[11px] font-black uppercase tracking-[0.25em] fill-amber-700 font-serif">
            <textPath href="#presidentialCurveTop" startOffset="50%" textAnchor="middle">
              EXECUTIVE SEAL OF THE PRESIDENT
            </textPath>
          </text>
          <text className="text-[9px] font-bold uppercase tracking-[0.2em] fill-amber-800 font-serif">
            <textPath href="#presidentialCurveBottom" startOffset="50%" textAnchor="middle">
              STATE GOVERNMENT • EXECUTIVE
            </textPath>
          </text>

          {/* Center Eagle / Star Emblem */}
          <polygon points="100,55 104,68 118,68 107,77 111,90 100,81 89,90 93,77 82,68 96,68" fill="#B45309" opacity="0.9" />
          <text x="100" y="112" textAnchor="middle" className="text-[10px] font-black tracking-widest fill-amber-900 font-serif">
            OFFICE OF THE
          </text>
          <text x="100" y="126" textAnchor="middle" className="text-[13px] font-black tracking-widest fill-amber-800 font-serif">
            PRESIDENT
          </text>
          <text x="100" y="140" textAnchor="middle" className="text-[7.5px] font-bold tracking-wider fill-amber-700 font-mono">
            MOMO HATAKEYAMA
          </text>
        </svg>
      </div>
    );
  }

  if (type === 'GOVERNMENT_SEAL') {
    return (
      <div 
        className={`relative select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-md rotate-[-5deg]"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="#1D4ED8" strokeWidth="4" opacity="0.9" />
          <circle cx="100" cy="100" r="85" fill="#1E3A8A" fillOpacity="0.08" stroke="#2563EB" strokeWidth="2.5" opacity="0.85" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="#1D4ED8" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.8" />

          <path id="govCurveTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
          <path id="govCurveBottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />

          <text className="text-[10px] font-black uppercase tracking-[0.2em] fill-blue-800 font-serif">
            <textPath href="#govCurveTop" startOffset="50%" textAnchor="middle">
              STATE GOVERNMENT OF HIGHSTATE
            </textPath>
          </text>
          <text className="text-[9px] font-bold uppercase tracking-[0.2em] fill-blue-900 font-serif">
            <textPath href="#govCurveBottom" startOffset="50%" textAnchor="middle">
              OFFICIAL STATE AUTHORITY
            </textPath>
          </text>

          <text x="100" y="96" textAnchor="middle" className="text-[18px] font-black fill-blue-900">
            🏛️
          </text>
          <text x="100" y="118" textAnchor="middle" className="text-[10px] font-black tracking-widest fill-blue-900 font-mono">
            GOVERNMENT
          </text>
          <text x="100" y="132" textAnchor="middle" className="text-[8px] font-bold tracking-wider fill-blue-700 font-mono">
            VERIFIED & RATIFIED
          </text>
        </svg>
      </div>
    );
  }

  // CONFIDENTIAL / TOP SECRET STAMP
  return (
    <div 
      className={`relative select-none pointer-events-none ${className}`}
      style={{ width: size * 1.1, height: size * 0.7 }}
    >
      <div className="w-full h-full border-4 border-rose-800/85 rounded-md p-1 rotate-[-8deg] flex flex-col items-center justify-center bg-rose-950/10 shadow-sm">
        <div className="border border-rose-800/60 w-full h-full rounded flex flex-col items-center justify-center px-2 py-1">
          <span className="text-[13px] font-black text-rose-900 tracking-widest font-mono uppercase">
            RAHASIA NEGARA
          </span>
          <span className="text-[9px] font-bold text-rose-800 font-mono">
            HSPD CONFIDENTIAL
          </span>
          <span className="text-[8px] font-semibold text-rose-700/90 font-mono">
            HANYA UNTUK KEPENTINGAN RESMI
          </span>
        </div>
      </div>
    </div>
  );
};

interface CustomUploadedSealProps {
  imageUrl: string;
  size?: number;
  rotation?: number;
  opacity?: number;
  colorFilter?: 'original' | 'red' | 'blue' | 'purple' | 'gold' | 'black';
  className?: string;
}

export const CustomUploadedSeal: React.FC<CustomUploadedSealProps> = ({
  imageUrl,
  size = 130,
  rotation = -6,
  opacity = 0.85,
  colorFilter = 'original',
  className = ''
}) => {
  // CSS filter calculations for realistic stamp inks
  let filterStyle = 'none';
  if (colorFilter === 'red') {
    // Tint red ink
    filterStyle = 'sepia(1) saturate(600%) hue-rotate(330deg) contrast(120%)';
  } else if (colorFilter === 'blue') {
    // Tint police legal blue
    filterStyle = 'sepia(1) saturate(500%) hue-rotate(190deg) contrast(120%)';
  } else if (colorFilter === 'purple') {
    // Tint official purple/violet
    filterStyle = 'sepia(1) saturate(500%) hue-rotate(245deg) contrast(120%)';
  } else if (colorFilter === 'gold') {
    // Tint brass / gold
    filterStyle = 'sepia(1) saturate(400%) hue-rotate(15deg) contrast(115%)';
  } else if (colorFilter === 'black') {
    // Carbon black
    filterStyle = 'grayscale(1) contrast(160%)';
  }

  return (
    <div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        opacity: opacity,
        mixBlendMode: 'multiply'
      }}
    >
      <img
        src={imageUrl}
        alt="Custom Official Seal"
        className="max-w-full max-h-full object-contain drop-shadow-sm"
        style={{
          filter: filterStyle
        }}
      />
    </div>
  );
};

