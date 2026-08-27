import { Emergency911Call, PanicAlert, CadUnit, PursuitTrackerState, DutyStatusCode } from '../types';
import { pushAllToFirestore, pushToFirestore } from '../services/firebaseRealtimeSync';

export const CAD_CALLS_KEY = 'hspd_cad_911_calls_v1';
export const CAD_PANIC_KEY = 'hspd_cad_panic_alerts_v1';
export const CAD_UNITS_KEY = 'hspd_cad_active_units_v1';
export const CAD_PURSUIT_KEY = 'hspd_cad_active_pursuit_v1';

export const INITIAL_911_CALLS: Emergency911Call[] = [
  {
    id: 'call-1',
    callNumber: 'CAD-2026-0891',
    callerName: 'Security Pacific Bank (Silent Alarm)',
    callerPhone: '555-0199',
    location: 'Pacific Standard Bank, Vinewood Blvd',
    postalCode: '7014',
    title: '10-90 Robbery in Progress (Vault Thermite Alarm)',
    details: 'Terdeteksi 4 perampok bersenjata laras panjang mengenakan topeng badut. Diduga terdapat 2 sandera pegawai bank di lantai 1.',
    priority: 'CODE 3 (URGENT)',
    status: 'DISPATCHED',
    assignedUnits: ['1-ADAM-12', 'LINCOLN-1', 'AIR-1'],
    timestamp: Date.now() - 1000 * 60 * 12
  },
  {
    id: 'call-2',
    callNumber: 'CAD-2026-0892',
    callerName: 'Anonymous Caller',
    callerPhone: '555-0312',
    location: 'Grove Street cul-de-sac, Davis',
    postalCode: '8092',
    title: '10-71 Shots Fired / Baku Tembak Antar Kelompok',
    details: 'Warga mendengar rentetan tembakan dari mobil sedan hitam (Albany Primo). Terlihat 1 korban tergeletak di trotoar.',
    priority: 'CODE 3 (URGENT)',
    status: 'ON_SCENE',
    assignedUnits: ['3-MARY-5'],
    timestamp: Date.now() - 1000 * 60 * 25
  },
  {
    id: 'call-3',
    callNumber: 'CAD-2026-0893',
    callerName: 'Kasir 24/7 Store Little Seoul',
    callerPhone: '555-0844',
    location: '24/7 Supermarket, Palomino Ave, Little Seoul',
    postalCode: '6012',
    title: '10-31 Hold Up / Todong Kasir Toko Kelontong',
    details: 'Pelaku 1 orang memakai hoodie merah menodongkan pisau lipat meminta uang laci kasir, melarikan diri ke arah kanal.',
    priority: 'CODE 2 (MEDIUM)',
    status: 'PENDING',
    assignedUnits: [],
    timestamp: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'call-4',
    callNumber: 'CAD-2026-0894',
    callerName: 'Paramedic EMS Dispatch',
    callerPhone: '555-0911',
    location: 'Del Perro Freeway Exit 3A',
    postalCode: '5021',
    title: '10-50 Major Traffic Accident / Tabrakan Beruntun',
    details: 'Dibutuhkan unit lantas untuk pengalihan arus jalan tol dan olah TKP tabrakan truk tanker vs mobil sedan.',
    priority: 'CODE 2 (MEDIUM)',
    status: 'RESOLVED',
    assignedUnits: ['2-TOM-2'],
    timestamp: Date.now() - 1000 * 60 * 60,
    resolvedAt: Date.now() - 1000 * 60 * 15,
    resolutionNotes: 'TKP telah steril, mobil diderek ke Impound Lot, arus lalin lancar.'
  }
];

export const INITIAL_CAD_UNITS: CadUnit[] = [
  {
    id: 'unit-1',
    callsign: '1-ADAM-12',
    primaryOfficerName: 'Leoarnd Neave',
    primaryOfficerBadge: '#001',
    partnerOfficerName: 'Marcus Vance',
    partnerOfficerBadge: '#102',
    division: 'Patrol Enforcement',
    vehicleType: 'Vapid Stanier Cruiser (HSPD-01)',
    status: '10-97',
    statusText: '10-97 On Scene (Pacific Standard)',
    assignedCallNumber: 'CAD-2026-0891',
    lastLocation: 'Vinewood Blvd / Meteor St',
    updatedAt: Date.now() - 1000 * 60 * 3
  },
  {
    id: 'unit-2',
    callsign: 'LINCOLN-1',
    primaryOfficerName: 'David Miller',
    primaryOfficerBadge: '#045',
    division: 'SWAT Tactical Unit',
    vehicleType: 'Bearcat Armored SWAT Insurgent',
    status: '10-97',
    statusText: '10-97 Perimeter Breaching Team',
    assignedCallNumber: 'CAD-2026-0891',
    lastLocation: 'Vinewood Bank Rear Alley',
    updatedAt: Date.now() - 1000 * 60 * 2
  },
  {
    id: 'unit-3',
    callsign: 'AIR-1',
    primaryOfficerName: 'Elena Rostova',
    primaryOfficerBadge: '#088',
    partnerOfficerName: 'Tommy Ross',
    partnerOfficerBadge: '#142',
    division: 'Air Support Division',
    vehicleType: 'Buckingham Police Maverick (N911LS)',
    status: '10-8',
    statusText: '10-8 Air Orbit (FLIR Tracking)',
    assignedCallNumber: 'CAD-2026-0891',
    lastLocation: 'Downtown / Vinewood Airspace (1200 ft)',
    updatedAt: Date.now() - 1000 * 60 * 1
  },
  {
    id: 'unit-4',
    callsign: '3-MARY-5',
    primaryOfficerName: 'Frank Sinatra',
    primaryOfficerBadge: '#210',
    division: 'Traffic & Highway Patrol',
    vehicleType: 'Western Police Sovereign Bike',
    status: '10-6',
    statusText: '10-6 Processing Scene Davis',
    assignedCallNumber: 'CAD-2026-0892',
    lastLocation: 'Carson Ave / Grove St',
    updatedAt: Date.now() - 1000 * 60 * 8
  },
  {
    id: 'unit-5',
    callsign: '2-TOM-2',
    primaryOfficerName: 'Alex Mercer',
    primaryOfficerBadge: '#199',
    division: 'Patrol Enforcement',
    vehicleType: 'Bravado Buffalo STX Interceptor',
    status: '10-8',
    statusText: '10-8 Available Routine Patrol',
    lastLocation: 'Mission Row HQ',
    updatedAt: Date.now() - 1000 * 60 * 5
  }
];

export const INITIAL_PURSUIT: PursuitTrackerState = {
  id: 'pursuit-active-1',
  targetVehicle: 'Hitam Matte Karin Sultan RS (Plat: 84JFK92)',
  suspectCount: 3,
  lastLocation: 'Del Perro Freeway menuju Los Santos Freeway',
  headingDirection: 'Northbound (Kecepatan ~140 MPH)',
  codeLevel: 'CODE 3',
  primaryUnit: '1-ADAM-12',
  secondaryUnits: ['2-TOM-2', '3-MARY-5'],
  airUnitCallsign: 'AIR-1',
  isPitAuthorized: true,
  isSpikeAuthorized: true,
  isBoxingAuthorized: true,
  status: 'ACTIVE',
  startedAt: Date.now() - 1000 * 60 * 8,
  updatedAt: Date.now() - 1000 * 30
};

export const getSavedCadCalls = (): Emergency911Call[] => {
  try {
    const raw = localStorage.getItem(CAD_CALLS_KEY);
    if (!raw) return INITIAL_911_CALLS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_911_CALLS;
  } catch (e) {
    return INITIAL_911_CALLS;
  }
};

export const saveCadCalls = (calls: Emergency911Call[]) => {
  localStorage.setItem(CAD_CALLS_KEY, JSON.stringify(calls));
  window.dispatchEvent(new Event('hspd-cad-calls-updated'));
  pushAllToFirestore('CAD_CALLS', calls).catch(console.error);
};

export const getSavedPanicAlerts = (): PanicAlert[] => {
  try {
    const raw = localStorage.getItem(CAD_PANIC_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const savePanicAlerts = (alerts: PanicAlert[]) => {
  localStorage.setItem(CAD_PANIC_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event('hspd-panic-alerts-updated'));
  pushAllToFirestore('PANIC_ALERTS', alerts).catch(console.error);
};

export const getSavedCadUnits = (): CadUnit[] => {
  try {
    const raw = localStorage.getItem(CAD_UNITS_KEY);
    if (!raw) return INITIAL_CAD_UNITS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CAD_UNITS;
  } catch (e) {
    return INITIAL_CAD_UNITS;
  }
};

export const saveCadUnits = (units: CadUnit[]) => {
  localStorage.setItem(CAD_UNITS_KEY, JSON.stringify(units));
  window.dispatchEvent(new Event('hspd-cad-units-updated'));
  pushAllToFirestore('CAD_UNITS', units).catch(console.error);
};

export const getSavedPursuit = (): PursuitTrackerState | null => {
  try {
    const raw = localStorage.getItem(CAD_PURSUIT_KEY);
    if (!raw) return INITIAL_PURSUIT;
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PURSUIT;
  }
};

export const savePursuit = (pursuit: PursuitTrackerState | null) => {
  if (!pursuit) {
    localStorage.removeItem(CAD_PURSUIT_KEY);
  } else {
    localStorage.setItem(CAD_PURSUIT_KEY, JSON.stringify(pursuit));
  }
  window.dispatchEvent(new Event('hspd-pursuit-updated'));
};

/**
 * Play synthesizer siren for 10-99 Panic Alert using Web Audio API
 */
export const playEmergencySirenSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.75);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.0);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error('Audio playback error', e);
  }
};
