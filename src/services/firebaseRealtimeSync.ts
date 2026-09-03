import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocFromServer,
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { mergeWithOfficialRoster, HSPD_OFFICIAL_ROSTER } from '../data/hspdOfficialRoster';
import { isAtasanRank } from '../types';
import { isOfficerDischarged, getDischargedOfficers } from '../utils/dischargeStorage';

export interface FirebaseSyncStatus {
  connected: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  error: string | null;
  quotaExhausted?: boolean;
}

let quotaExhaustedUntil: number = 0;

function setQuotaExhausted() {
  // Short transient backoff of 60 seconds (not a 4-hour lock)
  quotaExhaustedUntil = Date.now() + 60 * 1000;
}

export function isQuotaExhausted(): boolean {
  return quotaExhaustedUntil > Date.now();
}

export function resetQuotaExhausted() {
  quotaExhaustedUntil = 0;
}

// Global state callback for UI status banner
let syncListeners: ((status: FirebaseSyncStatus) => void)[] = [];
let currentSyncStatus: FirebaseSyncStatus = {
  connected: true,
  lastSyncTime: Date.now(),
  pendingCount: 0,
  error: null,
  quotaExhausted: false
};

export const subscribeToSyncStatus = (cb: (status: FirebaseSyncStatus) => void) => {
  syncListeners.push(cb);
  cb(currentSyncStatus);
  return () => {
    syncListeners = syncListeners.filter(l => l !== cb);
  };
};

const notifyStatus = (partial: Partial<FirebaseSyncStatus>) => {
  currentSyncStatus = { ...currentSyncStatus, ...partial };
  syncListeners.forEach(cb => cb(currentSyncStatus));
};

// Collections definition mapping with local storage keys & events
export const SYNC_COLLECTIONS = {
  ROSTER: {
    name: 'roster',
    storageKey: 'hspd_roster_database_v4',
    altStorageKeys: ['hspd_roster_database_v3', 'hspd_roster_database_v2', 'hspd_roster_accounts_v1'],
    event: 'hspd-roster-updated'
  },
  ARREST_RECORDS: {
    name: 'arrest_records',
    storageKey: 'hspd_arrest_records_v1',
    altStorageKeys: ['hspd_arrest_records'],
    event: 'hspd-records-updated'
  },
  CITIZENS: {
    name: 'citizens',
    storageKey: 'hspd_citizen_dmv_database_v1',
    event: 'hspd-citizens-updated'
  },
  FORENSICS: {
    name: 'forensics',
    storageKey: 'hspd_forensics_lab_records_v1',
    event: 'hspd-forensics-updated'
  },
  BOLOS: {
    name: 'bolos',
    storageKey: 'hspd_bolo_alerts_v1',
    event: 'hspd-bolo-updated'
  },
  IMPOUNDS: {
    name: 'impounds',
    storageKey: 'hspd_impound_records_v1',
    event: 'hspd-impound-updated'
  },
  DETECTIVE_CASES: {
    name: 'detective_cases',
    storageKey: 'hspd_detective_cases_v1',
    event: 'hspd-detective-cases-updated'
  },
  OFFICIAL_DOCUMENTS: {
    name: 'official_documents',
    storageKey: 'hspd_official_documents_archive_v1',
    event: 'hspd-documents-updated'
  },
  VAULT_ITEMS: {
    name: 'vault_items',
    storageKey: 'hspd_vault_audit_logs_v1',
    event: 'hspd-vault-updated'
  },
  DESTRUCTION_LOGS: {
    name: 'destruction_logs',
    storageKey: 'hspd_destruction_registry_v1',
    event: 'hspd-destruction-updated'
  },
  SYSTEM_CONFIGS: {
    name: 'system_configs',
    storageKey: 'hspd_system_configs_v1',
    event: 'hspd-configs-updated'
  },
  BRANDING: {
    name: 'branding',
    storageKey: 'hspd_custom_branding_v1',
    event: 'hspd-branding-updated'
  },
  RECRUITMENT_PORTAL: {
    name: 'recruitment_portal',
    storageKey: 'hspd_recruitment_portal_config_v1',
    event: 'hspd-recruitment-portal-updated'
  },
  PIN_RESET_REQUESTS: {
    name: 'pin_reset_requests',
    storageKey: 'HSPD_PIN_RESET_REQUESTS_V1',
    event: 'hspd-pin-requests-updated'
  },
  DUTY_SESSIONS: {
    name: 'duty_sessions',
    storageKey: 'hspd_duty_sessions_history_v1',
    event: 'hspd-duty-sessions-updated'
  }
} as const;

export type CollectionKey = keyof typeof SYNC_COLLECTIONS;

// Anti-Loop & Deduplication Tracking
const lastKnownFingerprints: Record<string, string> = {};
const isApplyingRemoteMap: Record<string, boolean> = {};

/**
 * Sanitizes any raw string or number into a safe Firestore document ID.
 * Replaces illegal characters like '/', '\', '#', and whitespace.
 */
export function sanitizeDocId(rawId: any, fallback: string = `item_${Date.now()}`): string {
  if (!rawId && rawId !== 0) return fallback;
  const str = String(rawId).replace(/[\/\s#\\]/g, '_').trim();
  if (!str || str === '.' || str === '..') return fallback;
  return str;
}

/**
 * Deeply sanitizes any object or array before committing to Cloud Firestore.
 * - Recursively strips all `undefined` values (which cause FirebaseError: Unsupported field value: undefined)
 * - Safely handles nested arrays and objects
 * - Preserves null, boolean, numbers, and strings
 */
export function sanitizeFirestorePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as any;
  }
  if (typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter(val => val !== undefined)
      .map(val => sanitizeFirestorePayload(val)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value === undefined) {
      continue; // Never pass undefined to Firestore
    }
    if (typeof key === 'string' && key.length > 0) {
      cleanObj[key] = sanitizeFirestorePayload(value);
    }
  }
  return cleanObj as T;
}

function computeFingerprint(items: any): string {
  try {
    if (!items) return '';
    return JSON.stringify(items);
  } catch {
    return String(Date.now());
  }
}

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err.code || err).toLowerCase();
  return (
    err.code === 'resource-exhausted' ||
    msg.includes('quota') ||
    msg.includes('resource-exhausted') ||
    msg.includes('free daily write units')
  );
}

function isUnavailableOrNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err.code || err).toLowerCase();
  return (
    err.code === 'unavailable' ||
    err.code === 'failed-precondition' ||
    err.code === 'cancelled' ||
    msg.includes('unavailable') ||
    msg.includes('could not reach cloud firestore') ||
    msg.includes('offline') ||
    msg.includes('network')
  );
}

// Active unsubs
let activeListeners: Unsubscribe[] = [];

/**
 * Helper to execute batched writes in chunks <= 400 operations
 */
async function commitBatchOperations(
  deletes: { colName: string; docId: string }[],
  sets: { colName: string; docId: string; data: any }[]
) {
  const allOps: Array<{ type: 'delete'; colName: string; docId: string } | { type: 'set'; colName: string; docId: string; data: any }> = [
    ...deletes.map(d => ({ type: 'delete' as const, colName: d.colName, docId: d.docId })),
    ...sets.map(s => ({ type: 'set' as const, colName: s.colName, docId: s.docId, data: sanitizeFirestorePayload(s.data) }))
  ];

  const CHUNK_SIZE = 350;
  for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
    const chunk = allOps.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'delete') {
        batch.delete(doc(db, op.colName, op.docId));
      } else {
        batch.set(doc(db, op.colName, op.docId), op.data, { merge: true });
      }
    }
    await batch.commit();
  }
}

/**
 * Sync entire list with Firestore (handles additions, updates, AND deletions)
 */
export async function syncCollectionWithFirestore<T extends Record<string, any>>(
  collectionKey: CollectionKey,
  items: T[],
  forcePush: boolean = false
): Promise<boolean> {
  const config = SYNC_COLLECTIONS[collectionKey];
  if (!config) return false;

  // 1. Immediately persist locally
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(items));
    if ('altStorageKeys' in config && Array.isArray((config as any).altStorageKeys)) {
      (config as any).altStorageKeys.forEach((k: string) => localStorage.setItem(k, JSON.stringify(items)));
    }
  } catch (e) {
    console.warn('Local storage write warning:', e);
  }

  // If this update was triggered by a remote Firestore listener, do NOT echo it back to Firestore
  if (!forcePush && isApplyingRemoteMap[collectionKey]) {
    return true;
  }

  // Deduplication: If the data matches what is already synced with Firestore, skip network write
  const fingerprint = computeFingerprint(items);
  if (!forcePush && lastKnownFingerprints[collectionKey] === fingerprint) {
    return true;
  }

  // Reset transient quota lock if user requested manual push
  if (forcePush) {
    resetQuotaExhausted();
  } else if (isQuotaExhausted()) {
    notifyStatus({
      connected: true,
      quotaExhausted: true,
      lastSyncTime: Date.now(),
      error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)'
    });
    return true;
  }

  try {
    // 2. Fetch current cloud docs to accurately track what's currently in cloud
    const colRef = collection(db, config.name);
    const existingSnap = await getDocs(colRef);

    const localIdSet = new Set<string>();
    const docDataList: { colName: string; docId: string; data: any }[] = [];

    items.forEach((item, index) => {
      let rawId = item.id || (item.badge ? `officer_${String(item.badge).replace(/[^a-zA-Z0-9_-]/g, '')}` : '') || `item_${index}`;
      const cleanDocId = sanitizeDocId(rawId, `item_${index}`);
      localIdSet.add(cleanDocId);
      docDataList.push({
        colName: config.name,
        docId: cleanDocId,
        data: sanitizeFirestorePayload({
          ...item,
          id: item.id || cleanDocId,
          _updatedAt: Date.now()
        })
      });
    });

    const deletes: { colName: string; docId: string }[] = [];

    // Identify cloud docs that were deleted locally
    existingSnap.forEach(d => {
      if (collectionKey === 'ROSTER') {
        const dData = d.data();
        if (isOfficerDischarged({ ...dData, id: d.id })) {
          deletes.push({ colName: config.name, docId: d.id });
          return;
        }
      }
      if (!localIdSet.has(d.id)) {
        deletes.push({ colName: config.name, docId: d.id });
      }
    });

    await commitBatchOperations(deletes, docDataList);

    lastKnownFingerprints[collectionKey] = fingerprint;

    notifyStatus({
      connected: true,
      quotaExhausted: false,
      lastSyncTime: Date.now(),
      error: null
    });
    return true;
  } catch (err: any) {
    if (isQuotaError(err)) {
      setQuotaExhausted();
      notifyStatus({
        connected: true,
        quotaExhausted: true,
        lastSyncTime: Date.now(),
        error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)'
      });
      return true;
    }

    if (isUnavailableOrNetworkError(err)) {
      notifyStatus({
        connected: false,
        lastSyncTime: Date.now(),
        error: 'Mode Offline (Data tersimpan di penyimpanan lokal)'
      });
      return true;
    }

    console.warn(`[FirebaseSync] Sync notice on ${collectionKey}:`, err?.message || err);
    return false;
  }
}

// Push a single item to Firestore and update local state
export async function pushToFirestore<T extends { id?: string }>(
  collectionKey: CollectionKey,
  item: T,
  customDocId?: string
): Promise<boolean> {
  if (isApplyingRemoteMap[collectionKey]) return true;

  if (isQuotaExhausted()) {
    notifyStatus({
      connected: true,
      quotaExhausted: true,
      lastSyncTime: Date.now(),
      error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)'
    });
    return true;
  }

  try {
    const config = SYNC_COLLECTIONS[collectionKey];
    const rawDocId = customDocId || item.id || `item_${Date.now()}`;
    const cleanDocId = sanitizeDocId(rawDocId, `item_${Date.now()}`);
    const docRef = doc(db, config.name, cleanDocId);
    
    const cleanPayload = sanitizeFirestorePayload({
      ...item,
      id: item.id || cleanDocId,
      _updatedAt: Date.now()
    });
    
    await setDoc(docRef, cleanPayload, { merge: true });

    notifyStatus({
      connected: true,
      quotaExhausted: false,
      lastSyncTime: Date.now(),
      error: null
    });
    return true;
  } catch (err: any) {
    if (isQuotaError(err)) {
      setQuotaExhausted();
      notifyStatus({
        connected: true,
        quotaExhausted: true,
        lastSyncTime: Date.now(),
        error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)'
      });
      return true;
    }
    if (isUnavailableOrNetworkError(err)) {
      notifyStatus({
        connected: false,
        lastSyncTime: Date.now(),
        error: 'Mode Offline (Data tersimpan di penyimpanan lokal)'
      });
      return true;
    }
    console.warn(`[FirebaseSync] Push notice on ${collectionKey}:`, err?.message || err);
    return false;
  }
}

export const pushSingleToFirestore = pushToFirestore;

// Push all array items in a batch to Firestore
export async function pushAllToFirestore<T extends { id?: string; badge?: string }>(
  collectionKey: CollectionKey,
  items: T[]
): Promise<boolean> {
  return syncCollectionWithFirestore(collectionKey, items, true);
}

// Delete item from Firestore
export async function deleteFromFirestore(
  collectionKey: CollectionKey,
  docId: string
): Promise<boolean> {
  if (isQuotaExhausted()) return true;

  try {
    const config = SYNC_COLLECTIONS[collectionKey];
    const cleanDocId = sanitizeDocId(docId);
    const docRef = doc(db, config.name, cleanDocId);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    if (isQuotaError(err) || isUnavailableOrNetworkError(err)) {
      if (isQuotaError(err)) setQuotaExhausted();
      return true;
    }
    console.warn(`[FirebaseSync] Delete notice on ${collectionKey}:`, err?.message || err);
    return false;
  }
}

// Pull latest records directly from Firestore collection
export async function pullLatestFromFirestore<T = any>(collectionKey: CollectionKey): Promise<T[] | null> {
  const config = SYNC_COLLECTIONS[collectionKey];
  if (!config) return null;

  try {
    resetQuotaExhausted();
    const colRef = collection(db, config.name);
    const snap = await getDocs(colRef);
    
    if (snap.empty && collectionKey === 'ROSTER') {
      // Seed official roster to cloud if completely empty
      const initial = mergeWithOfficialRoster(HSPD_OFFICIAL_ROSTER);
      await syncCollectionWithFirestore('ROSTER', initial, true);
      return initial as unknown as T[];
    }

    const items: any[] = [];
    snap.forEach(d => items.push(d.data()));

    let finalItems = items;
    if (collectionKey === 'ROSTER') {
      finalItems = mergeWithOfficialRoster(items);
    } else {
      finalItems.sort((a, b) => {
        const timeA = a.timestamp || a.registeredAt || a.createdAt || a._updatedAt || 0;
        const timeB = b.timestamp || b.registeredAt || b.createdAt || b._updatedAt || 0;
        return timeB - timeA;
      });
    }

    // Persist locally
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(finalItems));
      if ('altStorageKeys' in config && Array.isArray((config as any).altStorageKeys)) {
        (config as any).altStorageKeys.forEach((kName: string) => localStorage.setItem(kName, JSON.stringify(finalItems)));
      }
    } catch {}

    // Dispatch event
    window.dispatchEvent(new CustomEvent(config.event, { detail: finalItems }));

    notifyStatus({
      connected: true,
      lastSyncTime: Date.now(),
      error: null
    });

    return finalItems as T[];
  } catch (e: any) {
    console.warn(`[FirebaseSync] Pull failed for ${config.name}:`, e?.message || e);
    return null;
  }
}

// Webhook config keys
export const ALL_WEBHOOK_CONFIG_KEYS = [
  'hspd_discord_webhook_url',
  'hspd_discord_bot_name',
  'hspd_discord_bot_avatar',
  'hspd_auto_send_webhook_on_save',
  'hspd_duty_webhook_url',
  'hspd_duty_bot_name',
  'hspd_duty_bot_avatar',
  'hspd_duty_auto_send',
  'hspd_promotion_webhook_url',
  'hspd_promotion_bot_name',
  'hspd_promotion_bot_avatar',
  'hspd_promotion_auto_send',
  'hspd_warning_webhook_url',
  'hspd_warning_bot_name',
  'hspd_warning_bot_avatar',
  'hspd_warning_auto_send',
  'hspd_discharge_webhook_url',
  'hspd_discharge_bot_name',
  'hspd_discharge_bot_avatar',
  'hspd_discharge_auto_send',
  'hspd_pin_reset_webhook_url',
  'hspd_pin_reset_bot_name',
  'hspd_pin_reset_bot_avatar',
  'hspd_pin_reset_auto_send',
  'hspd_roster_webhook_url',
  'hspd_roster_bot_name',
  'hspd_roster_bot_avatar',
  'hspd_roster_auto_send',
  'hspd_detective_webhook_url',
  'hspd_detective_bot_name',
  'hspd_detective_bot_avatar',
  'hspd_detective_auto_send',
  'hspd_bolo_webhook_url',
  'hspd_bolo_bot_name',
  'hspd_bolo_bot_avatar',
  'hspd_bolo_auto_send',
  'hspd_impound_webhook_url',
  'hspd_impound_bot_name',
  'hspd_impound_bot_avatar',
  'hspd_impound_auto_send',
  'hspd_vault_webhook_url',
  'hspd_vault_bot_name',
  'hspd_vault_bot_avatar',
  'hspd_vault_auto_send',
  'hspd_destruction_webhook_url',
  'hspd_destruction_bot_name',
  'hspd_destruction_bot_avatar',
  'hspd_destruction_auto_send',
  'hspd_document_webhook_url',
  'hspd_document_bot_name',
  'hspd_document_bot_avatar',
  'hspd_document_auto_send',
  // Discord Bot Direct Message (PM / DM) Keys
  'hspd_discord_bot_token',
  'hspd_discord_bot_custom_name',
  'hspd_discord_bot_custom_avatar',
  'hspd_discord_bot_default_note',
  'hspd_discord_bot_embed_title',
  'hspd_discord_bot_embed_desc',
  'hspd_discord_bot_embed_color',
  'hspd_discord_bot_footer_text'
];

/**
 * Collects and syncs all webhooks to Firestore
 */
export function syncAllWebhooksToFirestore() {
  if (isQuotaExhausted()) return;
  try {
    const bundle: Record<string, string> = {};
    ALL_WEBHOOK_CONFIG_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val !== null) bundle[key] = val;
    });
    pushToFirestore('SYSTEM_CONFIGS', { id: 'all_webhooks', ...bundle }, 'all_webhooks').catch(() => {});
  } catch (e) {
    console.error('Failed to sync all webhooks to Firestore', e);
  }
}

/**
 * Permanently purges a specific officer from Cloud Firestore across all possible doc IDs and aliases.
 * Matches by doc ID, badge digits, or officer full name, plus any entries in discharged registry.
 */
export async function purgeOfficerFromCloud(
  target: { id?: string; badge?: string; name?: string }
): Promise<number> {
  if (!db) return 0;

  try {
    const colRef = collection(db, 'roster');
    const snap = await getDocs(colRef);
    const deletes: { colName: string; docId: string }[] = [];

    const targetId = (target.id || '').toLowerCase().trim();
    const targetBadgeDigits = (target.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const targetName = (target.name || '').toLowerCase().trim().replace(/\s+/g, ' ');

    snap.forEach(d => {
      const data = d.data();
      const docId = d.id.toLowerCase().trim();
      const dBadgeDigits = (data.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      const dName = (data.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
      const dId = (data.id || '').toLowerCase().trim();

      let shouldDelete = false;

      // Direct ID match
      if (targetId && (docId === targetId || dId === targetId)) {
        shouldDelete = true;
      }
      // Badge match
      if (targetBadgeDigits && dBadgeDigits) {
        if (targetBadgeDigits === dBadgeDigits) shouldDelete = true;
        const nT = parseInt(targetBadgeDigits, 10);
        const nD = parseInt(dBadgeDigits, 10);
        if (!isNaN(nT) && !isNaN(nD) && nT === nD) shouldDelete = true;
      }
      // DocId includes badge pattern
      if (targetBadgeDigits && (docId.includes(`_${targetBadgeDigits}`) || docId.endsWith(targetBadgeDigits))) {
        shouldDelete = true;
      }
      // Name match
      if (targetName && dName) {
        if (targetName === dName || targetName.replace(/\s+/g, '') === dName.replace(/\s+/g, '')) {
          shouldDelete = true;
        }
      }
      // Discharged check
      if (isOfficerDischarged({ ...data, id: d.id })) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        deletes.push({ colName: 'roster', docId: d.id });
      }
    });

    if (deletes.length > 0) {
      await commitBatchOperations(deletes, []);
    }

    // Also purge from duty registry if present
    try {
      const dutyDocRef = doc(db, 'system_configs', 'duty_registry');
      const dutySnap = await getDoc(dutyDocRef);
      if (dutySnap.exists()) {
        const dData = dutySnap.data();
        const reg = dData.registry || {};
        let modified = false;
        Object.keys(reg).forEach(b => {
          const bDigits = b.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
          if (bDigits === targetBadgeDigits || (target.badge && b === target.badge)) {
            delete reg[b];
            modified = true;
          }
        });
        if (modified) {
          await setDoc(dutyDocRef, { ...dData, registry: reg, updatedAt: Date.now() }, { merge: true });
        }
      }
    } catch {}

    return deletes.length;
  } catch (e) {
    console.error('Failed to purge officer from cloud:', e);
    return 0;
  }
}

/**
 * Permanently deletes all non-atasan accounts from Cloud Firestore roster collection.
 * Only keeps command ranks (Chief, Deputy Chief, Commander, Captain, Lieutenant).
 */
export async function purgeAllNonAtasanFromCloud(): Promise<number> {
  if (!db) return 0;

  try {
    const colRef = collection(db, 'roster');
    const snap = await getDocs(colRef);
    const deletes: { colName: string; docId: string }[] = [];

    snap.forEach(d => {
      const data = d.data();
      const rank = data.rank || '';
      // If NOT an Atasan rank, mark for cloud deletion
      if (!isAtasanRank(rank)) {
        deletes.push({ colName: 'roster', docId: d.id });
      }
    });

    if (deletes.length > 0) {
      await commitBatchOperations(deletes, []);
    }
    return deletes.length;
  } catch (e) {
    console.error('Failed to purge non-atasan from cloud:', e);
    return 0;
  }
}

// Validate initial connection as recommended by Firebase integration guidelines
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'system_configs', 'connection_health');
    await getDocFromServer(testDocRef);
    notifyStatus({ connected: true, error: null });
    return true;
  } catch (err: any) {
    if (isQuotaError(err)) {
      setQuotaExhausted();
      notifyStatus({ connected: true, quotaExhausted: true, error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)' });
      return true;
    }
    if (isUnavailableOrNetworkError(err)) {
      notifyStatus({ connected: false, error: 'Mode Offline (Menggunakan data lokal)' });
      return false;
    }
    return true;
  }
}

// Setup real-time listeners for all collections
let isInitialized = false;
export function initRealtimeFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  resetQuotaExhausted();
  notifyStatus({ connected: true, lastSyncTime: Date.now() });

  // Test backend connection smoothly
  validateFirestoreConnection().catch(() => {});

  // Iterate over each collection and attach onSnapshot
  Object.keys(SYNC_COLLECTIONS).forEach((k) => {
    const key = k as CollectionKey;
    const config = SYNC_COLLECTIONS[key];

    try {
      const colRef = collection(db, config.name);
      const unsub = onSnapshot(colRef, (snapshot) => {
        // If the collection is empty and it is the ROSTER, auto-seed the official roster
        if (snapshot.empty) {
          if (key === 'ROSTER') {
            const initialRoster = mergeWithOfficialRoster(HSPD_OFFICIAL_ROSTER);
            syncCollectionWithFirestore('ROSTER', initialRoster, true).catch(() => {});
          }
          return;
        }

        // Special handling for SYSTEM_CONFIGS single docs
        if (key === 'SYSTEM_CONFIGS') {
          isApplyingRemoteMap[key] = true;
          snapshot.forEach((d) => {
            const data = d.data();
            if (d.id === 'all_webhooks') {
              ALL_WEBHOOK_CONFIG_KEYS.forEach(kName => {
                if (data[kName] !== undefined) {
                  localStorage.setItem(kName, String(data[kName]));
                }
              });
              window.dispatchEvent(new Event('hspd-webhook-updated'));
              window.dispatchEvent(new Event('hspd-duty-webhook-updated'));
            } else if (d.id === 'authority_pin') {
              localStorage.setItem('hspd_authority_pin_config_v2', JSON.stringify(data));
              window.dispatchEvent(new Event('hspd-pin-updated'));
            } else if (d.id === 'duty_registry') {
              if (data.registry) {
                localStorage.setItem('hspd_duty_registry_all_officers_v2', JSON.stringify(data.registry));
                window.dispatchEvent(new CustomEvent('hspd-officer-duty-changed', { detail: { state: data.registry } }));
              }
            } else if (d.id === 'discharged_officers') {
              const list = data.data?.list || data.list;
              if (Array.isArray(list)) {
                try {
                  localStorage.setItem('hspd_discharged_officers_v1', JSON.stringify(list));
                  localStorage.setItem('hspd_discharged_officers_backup', JSON.stringify(list));
                  window.dispatchEvent(new CustomEvent('hspd-discharged-updated', { detail: list }));
                } catch {}
              }
            } else if (d.id === 'recruitment_portal') {
              try {
                localStorage.setItem('hspd_recruitment_portal_config_v1', JSON.stringify(data));
                window.dispatchEvent(new CustomEvent('hspd-recruitment-portal-updated', { detail: data }));
              } catch {}
            } else if (d.id === 'active_otps') {
              try {
                const list = data.list || (Array.isArray(data) ? data : null);
                if (Array.isArray(list)) {
                  localStorage.setItem('hspd_otp_clearance_list_v1', JSON.stringify(list));
                  window.dispatchEvent(new Event('hspd-otp-updated'));
                }
              } catch {}
            } else if (d.id === 'specialized_divisions') {
              try {
                if (data.asd) localStorage.setItem('hspd_asd_helicopters_v1', JSON.stringify(data.asd));
                if (data.k9) localStorage.setItem('hspd_k9_partners_v1', JSON.stringify(data.k9));
                if (data.k9Logs) localStorage.setItem('hspd_k9_deployment_logs_v1', JSON.stringify(data.k9Logs));
                if (data.swat) localStorage.setItem('hspd_swat_operations_v1', JSON.stringify(data.swat));
                if (data.iad) localStorage.setItem('hspd_iad_complaints_v1', JSON.stringify(data.iad));
                if (data.academy) localStorage.setItem('hspd_academy_evaluations_v1', JSON.stringify(data.academy));
                if (data.ted) localStorage.setItem('hspd_ted_records_v1', JSON.stringify(data.ted));
                window.dispatchEvent(new Event('hspd-asd-updated'));
                window.dispatchEvent(new Event('hspd-k9-updated'));
                window.dispatchEvent(new Event('hspd-k9-logs-updated'));
                window.dispatchEvent(new Event('hspd-swat-updated'));
                window.dispatchEvent(new Event('hspd-iad-updated'));
                window.dispatchEvent(new Event('hspd-academy-updated'));
                window.dispatchEvent(new Event('hspd-ted-updated'));
              } catch {}
            }
          });
          setTimeout(() => { isApplyingRemoteMap[key] = false; }, 200);
          notifyStatus({ connected: true, lastSyncTime: Date.now(), error: null });
          return;
        }

        const items: any[] = [];
        const dischargedList = key === 'ROSTER' ? getDischargedOfficers() : [];
        const staleDischargedDocIds: string[] = [];

        snapshot.forEach((d) => {
          const data = d.data();
          if (key === 'ROSTER') {
            const officerObj = { ...data, id: data.id || d.id };
            // If officer was discharged, do NOT include them and immediately purge from Firestore
            if (isOfficerDischarged(officerObj, dischargedList)) {
              staleDischargedDocIds.push(d.id);
              return;
            }
          }
          items.push(data);
        });

        // Trigger immediate background deletion of discharged officer documents from Firestore
        if (staleDischargedDocIds.length > 0) {
          staleDischargedDocIds.forEach(staleId => {
            deleteFromFirestore('ROSTER', staleId).catch(() => {});
          });
        }

        // Special handling for BRANDING singleton object
        if (key === 'BRANDING') {
          const brandingObj = items[0] || (items.length > 0 ? items[0] : null);
          if (brandingObj) {
            try {
              localStorage.setItem(config.storageKey, JSON.stringify(brandingObj));
              window.dispatchEvent(new CustomEvent(config.event, { detail: brandingObj }));
            } catch {}
          }
          notifyStatus({ connected: true, lastSyncTime: Date.now(), error: null });
          return;
        }

        let finalItems: any[] = items;
        if (key === 'ROSTER') {
          finalItems = mergeWithOfficialRoster(items, dischargedList);
        }

        // Sort by timestamp, registeredAt, or _updatedAt (newest first)
        if (key !== 'ROSTER') {
          finalItems.sort((a, b) => {
            const timeA = a.timestamp || a.registeredAt || a.createdAt || a._updatedAt || 0;
            const timeB = b.timestamp || b.registeredAt || b.createdAt || b._updatedAt || 0;
            return timeB - timeA;
          });
        }

        const incomingFingerprint = computeFingerprint(finalItems);

        // If incoming remote snapshot is identical to what we already hold, don't trigger re-render cycle
        if (lastKnownFingerprints[key] === incomingFingerprint) {
          return;
        }

        lastKnownFingerprints[key] = incomingFingerprint;
        isApplyingRemoteMap[key] = true;

        // Update localStorage
        try {
          localStorage.setItem(config.storageKey, JSON.stringify(finalItems));
          if ('altStorageKeys' in config && Array.isArray((config as any).altStorageKeys)) {
            (config as any).altStorageKeys.forEach((kName: string) => localStorage.setItem(kName, JSON.stringify(finalItems)));
          }
        } catch (e) {}
        
        // Trigger UI update event safely
        window.dispatchEvent(new CustomEvent(config.event, { detail: finalItems }));

        // If newly updated collection is PIN_RESET_REQUESTS and contains pending items, alert supervisor
        if (key === 'PIN_RESET_REQUESTS' && Array.isArray(finalItems)) {
          const pendingItem = finalItems.find(r => r && r.status === 'PENDING');
          if (pendingItem) {
            window.dispatchEvent(new CustomEvent('hspd-pin-reset-requested', { detail: pendingItem }));
          }

          // Auto-reconcile any approved / resolved PIN resets into the local roster storage
          try {
            const rawRoster = localStorage.getItem('hspd_roster_database_v4') || localStorage.getItem('hspd_roster_database_v3');
            if (rawRoster) {
              const currentRoster: any[] = JSON.parse(rawRoster);
              let rosterModified = false;
              finalItems.forEach(req => {
                if (req && req.status === 'RESOLVED' && req.resolvedNewPin) {
                  const targetPin = String(req.resolvedNewPin).trim();
                  const targetBadge = String(req.officerBadge || '').trim().toLowerCase();
                  const targetName = String(req.officerName || '').trim().toLowerCase();

                  currentRoster.forEach(officer => {
                    const oBadge = String(officer.badge || '').trim().toLowerCase();
                    const oName = String(officer.name || '').trim().toLowerCase();
                    const cleanBadgeId = targetBadge.replace(/[^a-z0-9]/g, '');
                    const cleanOBadge = oBadge.replace(/[^a-z0-9]/g, '');

                    const isMatch = 
                      (cleanBadgeId && cleanOBadge && cleanBadgeId === cleanOBadge) ||
                      oBadge === targetBadge ||
                      oName === targetName ||
                      (targetName && oName && (oName.includes(targetName) || targetName.includes(oName)));

                    if (isMatch && officer.pin !== targetPin) {
                      officer.pin = targetPin;
                      rosterModified = true;
                    }
                  });
                }
              });

              if (rosterModified) {
                const serialized = JSON.stringify(currentRoster);
                ['hspd_roster_database_v4', 'hspd_roster_database_v3', 'hspd_roster_database_v2', 'hspd_roster_accounts_v1'].forEach(k => {
                  try { localStorage.setItem(k, serialized); } catch {}
                });
                window.dispatchEvent(new CustomEvent('hspd-roster-updated', { detail: currentRoster }));
              }
            }
          } catch {}
        }
        
        setTimeout(() => {
          isApplyingRemoteMap[key] = false;
        }, 300);

        notifyStatus({
          connected: true,
          lastSyncTime: Date.now(),
          error: null
        });
      }, (error) => {
        if (isQuotaError(error)) {
          setQuotaExhausted();
          notifyStatus({
            connected: true,
            quotaExhausted: true,
            error: 'Penyimpanan lokal aktif (Batas kuota cloud tercapai)'
          });
          return;
        }
        if (isUnavailableOrNetworkError(error)) {
          notifyStatus({
            connected: false,
            error: 'Mode Offline (Menggunakan data lokal)'
          });
          return;
        }
        console.warn(`[FirebaseSync] Listener notice for ${config.name}:`, error?.message || error);
      });

      activeListeners.push(unsub);
    } catch (e: any) {
      console.warn(`[FirebaseSync] Listener setup notice for ${config.name}:`, e?.message || e);
    }
  });
}
