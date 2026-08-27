import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface FirebaseSyncStatus {
  connected: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  error: string | null;
  quotaExhausted?: boolean;
}

// Global state callback for UI status banner
let syncListeners: ((status: FirebaseSyncStatus) => void)[] = [];
let currentSyncStatus: FirebaseSyncStatus = {
  connected: false,
  lastSyncTime: null,
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
    altStorageKeys: ['hspd_roster_database_v3', 'hspd_roster_database_v2'],
    event: 'hspd-roster-updated'
  },
  ARREST_RECORDS: {
    name: 'arrest_records',
    storageKey: 'hspd_arrest_records_v1',
    altStorageKeys: ['hspd_arrest_records'],
    event: 'hspd-records-updated'
  },
  CAD_CALLS: {
    name: 'cad_calls',
    storageKey: 'hspd_cad_911_calls_v1',
    event: 'hspd-cad-calls-updated'
  },
  PANIC_ALERTS: {
    name: 'panic_alerts',
    storageKey: 'hspd_cad_panic_alerts_v1',
    event: 'hspd-panic-alerts-updated'
  },
  CAD_UNITS: {
    name: 'cad_units',
    storageKey: 'hspd_cad_active_units_v1',
    event: 'hspd-cad-units-updated'
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
  }
} as const;

export type CollectionKey = keyof typeof SYNC_COLLECTIONS;

// Anti-Loop & Deduplication Tracking
const lastKnownFingerprints: Record<string, string> = {};
const isApplyingRemoteMap: Record<string, boolean> = {};
let quotaExhaustedUntil: number = 0;

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

/**
 * Sync entire list with Firestore (handles additions, updates, AND deletions)
 */
export async function syncCollectionWithFirestore<T extends { id?: string; badge?: string; citizenId?: string; plate?: string; labNumber?: string; callNumber?: string }>(
  collectionKey: CollectionKey,
  items: T[]
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
  if (isApplyingRemoteMap[collectionKey]) {
    return true;
  }

  // Deduplication: If the data matches what is already synced with Firestore, skip network write
  const fingerprint = computeFingerprint(items);
  if (lastKnownFingerprints[collectionKey] === fingerprint) {
    return true;
  }

  // If Firestore Free Tier quota is currently exceeded, operate smoothly in Local Fallback Mode
  if (Date.now() < quotaExhaustedUntil) {
    notifyStatus({
      connected: true,
      quotaExhausted: true,
      lastSyncTime: Date.now(),
      error: 'Penyimpanan lokal aktif (Kuota Cloud mencapai batas harian)'
    });
    return true;
  }

  try {
    // 2. Fetch current cloud docs to accurately remove deleted records
    const colRef = collection(db, config.name);
    const existingSnap = await getDocs(colRef);

    const localIdSet = new Set<string>();
    const docDataList: { docId: string; data: any }[] = [];

    items.forEach((item, index) => {
      let rawId = item.id || (item.badge ? `officer_${String(item.badge).replace(/[^a-zA-Z0-9_-]/g, '')}` : '') || `item_${index}`;
      const cleanDocId = String(rawId).replace(/[\/\s#]/g, '_').trim() || `item_${index}`;
      localIdSet.add(cleanDocId);
      docDataList.push({
        docId: cleanDocId,
        data: {
          ...item,
          id: item.id || cleanDocId,
          _updatedAt: Date.now()
        }
      });
    });

    const batch = writeBatch(db);

    // Delete Firestore docs that were removed locally (e.g. fired officer, deleted case)
    existingSnap.forEach(d => {
      if (!localIdSet.has(d.id)) {
        batch.delete(doc(db, config.name, d.id));
      }
    });

    // Save/update existing local docs to Firestore
    docDataList.forEach(({ docId, data }) => {
      batch.set(doc(db, config.name, docId), data, { merge: true });
    });

    await batch.commit();

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
      quotaExhaustedUntil = Date.now() + 10 * 60 * 1000; // Pause cloud writes for 10 minutes
      console.warn(`[FirebaseSync] Firestore write quota reached for ${collectionKey}. Operating in local fallback mode.`);
      notifyStatus({
        connected: true,
        quotaExhausted: true,
        lastSyncTime: Date.now(),
        error: 'Penyimpanan lokal aktif (Batas kuota cloud gratis tercapai)'
      });
      return true; // Return true because local data is safely saved
    }

    console.error(`[FirebaseSync] Error syncing collection ${collectionKey}:`, err);
    notifyStatus({ error: err.message || 'Sync failed' });
    return false;
  }
}

// Push a single item or bulk items to Firestore and update local state
export async function pushToFirestore<T extends { id?: string }>(
  collectionKey: CollectionKey,
  item: T,
  customDocId?: string
): Promise<boolean> {
  if (isApplyingRemoteMap[collectionKey]) return true;

  if (Date.now() < quotaExhaustedUntil) {
    notifyStatus({
      connected: true,
      quotaExhausted: true,
      lastSyncTime: Date.now(),
      error: 'Penyimpanan lokal aktif'
    });
    return true;
  }

  try {
    const config = SYNC_COLLECTIONS[collectionKey];
    let docId = customDocId || item.id || `item_${Date.now()}`;
    docId = String(docId).replace(/[\/\s#]/g, '_').trim();
    const docRef = doc(db, config.name, docId);
    
    await setDoc(docRef, {
      ...item,
      id: item.id || docId,
      _updatedAt: Date.now()
    }, { merge: true });

    notifyStatus({
      connected: true,
      quotaExhausted: false,
      lastSyncTime: Date.now(),
      error: null
    });
    return true;
  } catch (err: any) {
    if (isQuotaError(err)) {
      quotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
      console.warn(`[FirebaseSync] Quota limit reached on single push. Using local storage.`);
      notifyStatus({
        connected: true,
        quotaExhausted: true,
        lastSyncTime: Date.now(),
        error: 'Penyimpanan lokal aktif'
      });
      return true;
    }
    console.error(`[FirebaseSync] Error pushing to ${collectionKey}:`, err);
    notifyStatus({ error: err.message || 'Sync failed' });
    return false;
  }
}

// Push all array items in a batch to Firestore
export async function pushAllToFirestore<T extends { id?: string; badge?: string }>(
  collectionKey: CollectionKey,
  items: T[]
): Promise<boolean> {
  return syncCollectionWithFirestore(collectionKey, items);
}

// Delete item from Firestore
export async function deleteFromFirestore(
  collectionKey: CollectionKey,
  docId: string
): Promise<boolean> {
  if (Date.now() < quotaExhaustedUntil) return true;

  try {
    const config = SYNC_COLLECTIONS[collectionKey];
    const cleanDocId = String(docId).replace(/[\/\s#]/g, '_').trim();
    const docRef = doc(db, config.name, cleanDocId);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    if (isQuotaError(err)) {
      quotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
      return true;
    }
    console.error(`[FirebaseSync] Error deleting from ${collectionKey}:`, err);
    return false;
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
  'hspd_destruction_auto_send'
];

/**
 * Collects and syncs all webhooks to Firestore
 */
export function syncAllWebhooksToFirestore() {
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

// Setup real-time listeners for all collections
let isInitialized = false;
export function initRealtimeFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  notifyStatus({ connected: true, lastSyncTime: Date.now() });

  // Iterate over each collection and attach onSnapshot
  Object.keys(SYNC_COLLECTIONS).forEach((k) => {
    const key = k as CollectionKey;
    const config = SYNC_COLLECTIONS[key];

    try {
      const colRef = collection(db, config.name);
      onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
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
              }
            });
            setTimeout(() => { isApplyingRemoteMap[key] = false; }, 200);
            notifyStatus({ connected: true, lastSyncTime: Date.now(), error: null });
            return;
          }

          const items: any[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            items.push(data);
          });

          // Sort by timestamp, registeredAt, or _updatedAt (newest first)
          items.sort((a, b) => {
            const timeA = a.timestamp || a.registeredAt || a.createdAt || a._updatedAt || 0;
            const timeB = b.timestamp || b.registeredAt || b.createdAt || b._updatedAt || 0;
            return timeB - timeA;
          });

          const incomingFingerprint = computeFingerprint(items);

          // If incoming remote snapshot is identical to what we already hold, don't trigger re-render cycle
          if (lastKnownFingerprints[key] === incomingFingerprint) {
            return;
          }

          lastKnownFingerprints[key] = incomingFingerprint;
          isApplyingRemoteMap[key] = true;

          // Update localStorage
          try {
            localStorage.setItem(config.storageKey, JSON.stringify(items));
            if ('altStorageKeys' in config && Array.isArray((config as any).altStorageKeys)) {
              (config as any).altStorageKeys.forEach((kName: string) => localStorage.setItem(kName, JSON.stringify(items)));
            }
          } catch (e) {}
          
          // Trigger UI update event safely
          window.dispatchEvent(new CustomEvent(config.event, { detail: items }));
          
          setTimeout(() => {
            isApplyingRemoteMap[key] = false;
          }, 300);

          notifyStatus({
            connected: true,
            lastSyncTime: Date.now(),
            error: null
          });
        } else {
          // If Firestore is empty on initial bootstrap and quota is available, seed it with current localStorage
          if (Date.now() >= quotaExhaustedUntil) {
            const localRaw = localStorage.getItem(config.storageKey);
            if (localRaw) {
              try {
                const localItems = JSON.parse(localRaw);
                if (Array.isArray(localItems) && localItems.length > 0) {
                  pushAllToFirestore(key, localItems);
                }
              } catch (e) {}
            }
          }
        }
      }, (error) => {
        if (isQuotaError(error)) {
          quotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
          notifyStatus({
            connected: true,
            quotaExhausted: true,
            error: 'Penyimpanan lokal aktif'
          });
          return;
        }
        console.warn(`[FirebaseSync] Snapshot listener error on ${config.name}:`, error);
        notifyStatus({ error: error.message });
      });
    } catch (e: any) {
      console.warn(`[FirebaseSync] Failed to attach listener for ${config.name}:`, e);
    }
  });
}
