import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export function isAtasanRank(rank?: string): boolean {
  if (!rank) return false;
  const r = rank.toUpperCase().trim();
  return (
    r.includes('CHIEF OF POLICE') ||
    r.includes('[COP]') ||
    r.includes('ASSISTANT CHIEF') ||
    r.includes('[A/C]') ||
    r.includes('DEPUTY CHIEF') ||
    r.includes('[D/C]') ||
    r.includes('COMMANDER') ||
    r.includes('[CDR]') ||
    r.includes('CAPTAIN') ||
    r.includes('[CPT]') ||
    r.includes('LIEUTENANT') ||
    r.includes('[LT]')
  );
}

export interface DiscordUserContext {
  id: string;
  username: string;
  globalName?: string | null;
  discriminator?: string;
  avatarUrl?: string;
}

export interface NewOfficerRegistrationData {
  icName: string;
  pin: string;
  badge?: string;
  phone?: string;
  discordUser: DiscordUserContext;
}

export interface OfficerRecord {
  id: string;
  name: string;
  badge: string;
  rank: string;
  division: string;
  pin: string;
  phone?: string;
  discordTag?: string;
  registeredAt: number;
  promotedBy?: string;
  isDuty?: boolean;
  dutyStatus?: string;
  _updatedAt?: number;
}

const LOCAL_ROSTER_BACKUP_PATH = path.join(process.cwd(), '.discord_registered_officers.json');

class DiscordRosterService {
  private db: any = null;
  private isInitialized = false;

  constructor() {
    this.initDb();
  }

  private initDb() {
    if (this.isInitialized && this.db) return;
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const app = getApps().length === 0 ? initializeApp(config) : getApp();
        const dbId = config.firestoreDatabaseId || '(default)';
        this.db = initializeFirestore(app, {}, dbId);
        this.isInitialized = true;
        console.log('[Discord Roster Service] Firestore initialized successfully.');
      }
    } catch (err: any) {
      console.warn('[Discord Roster Service] Error initializing Firestore:', err?.message || err);
    }
  }

  private sanitizeDocId(rawId: string): string {
    return String(rawId).replace(/[\/\s#\\]/g, '_').trim();
  }

  private cleanName(name: string): string {
    return name
      .replace(/_/g, ' ')
      .trim()
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private saveLocalBackup(officer: OfficerRecord) {
    try {
      let list: OfficerRecord[] = [];
      if (fs.existsSync(LOCAL_ROSTER_BACKUP_PATH)) {
        list = JSON.parse(fs.readFileSync(LOCAL_ROSTER_BACKUP_PATH, 'utf-8'));
      }
      const filtered = list.filter(o => o.badge !== officer.badge && o.name.toLowerCase() !== officer.name.toLowerCase());
      filtered.unshift(officer);
      fs.writeFileSync(LOCAL_ROSTER_BACKUP_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Discord Roster Service] Failed to save local roster backup:', e);
    }
  }

  public getLocalBackups(): OfficerRecord[] {
    try {
      if (fs.existsSync(LOCAL_ROSTER_BACKUP_PATH)) {
        return JSON.parse(fs.readFileSync(LOCAL_ROSTER_BACKUP_PATH, 'utf-8'));
      }
    } catch {}
    return [];
  }

  public async getAllOfficers(): Promise<OfficerRecord[]> {
    this.initDb();
    const map = new Map<string, OfficerRecord>();

    // Load local backup first
    const local = this.getLocalBackups();
    local.forEach(o => map.set(o.badge, o));

    if (!this.db) return Array.from(map.values());

    try {
      const colRef = collection(this.db, 'roster');
      const snap = await getDocs(colRef);
      snap.forEach(d => {
        const data = d.data() as OfficerRecord;
        if (data && data.name && data.badge) {
          map.set(data.badge, { ...data, id: data.id || d.id });
        }
      });
    } catch (err: any) {
      console.warn('[Discord Roster Service] Failed to read officers from Firestore:', err?.message || err);
    }

    return Array.from(map.values());
  }

  public async findOfficer(query: {
    name?: string;
    badge?: string;
    discordId?: string;
    discordUsername?: string;
  }): Promise<OfficerRecord | null> {
    const officers = await this.getAllOfficers();
    const cleanQueryName = query.name ? this.cleanName(query.name).toLowerCase() : null;
    const cleanBadge = query.badge ? query.badge.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() : null;
    const discordId = query.discordId?.trim();
    const discordUsername = query.discordUsername ? query.discordUsername.replace('@', '').toLowerCase().trim() : null;

    for (const off of officers) {
      const offName = (off.name || '').toLowerCase();
      const offBadge = (off.badge || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      const offDiscord = (off.discordTag || '').replace('@', '').toLowerCase();

      if (cleanQueryName && (offName === cleanQueryName || offName.replace(/\s+/g, '') === cleanQueryName.replace(/\s+/g, ''))) {
        return off;
      }
      if (cleanBadge && offBadge === cleanBadge) {
        return off;
      }
      if (discordId && off.discordTag && off.discordTag.includes(discordId)) {
        return off;
      }
      if (discordUsername && offDiscord.includes(discordUsername)) {
        return off;
      }
    }
    return null;
  }

  public async getNextAvailableBadge(preferredBadge?: string): Promise<string> {
    const officers = await this.getAllOfficers();
    const usedBadges = new Set<string>();

    officers.forEach(o => {
      if (o.badge) {
        usedBadges.add(o.badge.replace(/[^0-9]/g, ''));
      }
    });

    if (preferredBadge) {
      const numOnly = preferredBadge.replace(/[^0-9]/g, '');
      if (numOnly && !usedBadges.has(numOnly)) {
        return `#${numOnly.padStart(3, '0')}`;
      }
    }

    // Default Cadet badge range starting at 701, 702, ...
    for (let i = 701; i <= 999; i++) {
      const numStr = String(i);
      if (!usedBadges.has(numStr)) {
        return `#${numStr}`;
      }
    }

    return `#${Math.floor(1000 + Math.random() * 9000)}`;
  }

  public async registerOfficer(data: NewOfficerRegistrationData): Promise<{
    success: boolean;
    message: string;
    officer?: OfficerRecord;
  }> {
    const rawName = data.icName?.trim();
    const rawPin = data.pin?.trim();

    if (!rawName || rawName.length < 3) {
      return { success: false, message: 'Nama IC tidak valid! Minimal 3 karakter (contoh: Alex Vance atau John_Doe).' };
    }

    if (!rawPin || rawPin.length < 4) {
      return { success: false, message: 'PIN login akun minimal harus 4 karakter/angka!' };
    }

    const formattedName = this.cleanName(rawName);

    // Check if officer with same name already exists
    const existingOfficer = await this.findOfficer({ name: formattedName });
    if (existingOfficer) {
      return {
        success: false,
        message: `Nama IC "${formattedName}" sudah terdaftar di Roster Kepolisian dengan Badge ${existingOfficer.badge}. Jika ini akun Anda, silakan hubungi atasan atau gunakan tombol 'Resend Code'.`
      };
    }

    // Determine badge
    const badge = await this.getNextAvailableBadge(data.badge);

    const officerId = `roster-cadet-${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${badge.replace(/[^0-9]/g, '')}`;

    const newOfficer: OfficerRecord = {
      id: officerId,
      name: formattedName,
      badge: badge,
      rank: 'CADET [CDT]',
      division: 'Patrol Division',
      pin: rawPin,
      phone: data.phone?.trim() || `555-${badge.replace(/[^0-9]/g, '').padStart(4, '0')}`,
      discordTag: `@${data.discordUser.username} (ID: ${data.discordUser.id})`,
      registeredAt: Date.now(),
      promotedBy: 'Discord Bot UCP Registration Panel',
      isDuty: false,
      dutyStatus: '8-1-0',
      _updatedAt: Date.now()
    };

    // 1. Save local backup
    this.saveLocalBackup(newOfficer);

    // 2. Commit directly to Firestore collection 'roster'
    this.initDb();
    if (this.db) {
      try {
        const docKey = this.sanitizeDocId(badge);
        const docRef = doc(this.db, 'roster', docKey);
        await setDoc(docRef, newOfficer, { merge: true });
        console.log(`[Discord Roster Service] ✅ Officer ${formattedName} (${badge}) saved to Firestore!`);
      } catch (err: any) {
        console.error('[Discord Roster Service] Error writing to Firestore:', err?.message || err);
      }
    }

    return {
      success: true,
      message: `Akun MDT untuk ${formattedName} (${badge}) berhasil dibuat dan disimpan ke database!`,
      officer: newOfficer
    };
  }

  public async submitPinResetTicket(params: {
    icName: string;
    reason: string;
    discordUser: DiscordUserContext;
  }): Promise<{ success: boolean; message: string; ticketId?: string }> {
    this.initDb();
    const ticketId = `ticket_${Date.now()}`;
    const cleanName = this.cleanName(params.icName);

    const ticketData = {
      id: ticketId,
      officerName: cleanName,
      reason: params.reason || 'Permohonan Lupa Password via Discord Bot Panel',
      discordUser: `@${params.discordUser.username}`,
      discordUserId: params.discordUser.id,
      status: 'PENDING',
      createdAt: Date.now(),
      requestedFrom: 'discord_bot_panel'
    };

    if (this.db) {
      try {
        const docRef = doc(this.db, 'pin_reset_requests', ticketId);
        await setDoc(docRef, ticketData);
        console.log(`[Discord Roster Service] Pin reset ticket created for ${cleanName}`);
      } catch (err: any) {
        console.warn('[Discord Roster Service] Failed to write ticket to Firestore:', err?.message || err);
      }
    }

    return {
      success: true,
      message: `Permohonan Lupa Password untuk ${cleanName} berhasil dikirim ke Komando Tinggi MDT.`,
      ticketId
    };
  }

  public async sendDirectMessageToUser(
    botToken: string,
    recipientUserId: string,
    payload: {
      content?: string;
      embeds?: any[];
    }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const cleanToken = (botToken || process.env.DISCORD_BOT_TOKEN || '').trim();
      if (!cleanToken) {
        console.warn('[Discord Roster Service] Cannot send DM: Bot token is missing.');
        return { success: false, message: 'Bot Token belum dikonfigurasi.' };
      }

      const cleanUserId = String(recipientUserId || '').replace(/[^\d]/g, '').trim();
      if (!cleanUserId || cleanUserId.length < 16) {
        console.warn(`[Discord Roster Service] Invalid recipient Discord User ID: "${recipientUserId}"`);
        return { success: false, message: `User ID Discord tidak valid: "${recipientUserId}"` };
      }

      // 1. Open DM channel
      const openRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          Authorization: `Bot ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: cleanUserId })
      });

      if (!openRes.ok) {
        const errText = await openRes.text().catch(() => '');
        console.warn(`[Discord Roster Service] Cannot open DM channel with ${cleanUserId}: HTTP ${openRes.status} - ${errText}`);
        return { success: false, message: `Gagal membuka DM (HTTP ${openRes.status}): ${errText}` };
      }

      const dmChannel = await openRes.json();
      const dmChannelId = dmChannel.id;

      // 2. Send DM message
      const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text().catch(() => '');
        console.warn(`[Discord Roster Service] Failed to deliver DM message to channel ${dmChannelId}: HTTP ${sendRes.status} - ${errText}`);
        return { success: false, message: `Gagal mengirim pesan (HTTP ${sendRes.status}): ${errText}` };
      }

      console.log(`[Discord Roster Service] ✅ DM credentials successfully delivered to Discord User ${cleanUserId}!`);
      return { success: true };
    } catch (e: any) {
      console.warn(`[Discord Roster Service] Failed to send DM to ${recipientUserId}:`, e?.message || e);
      return { success: false, message: e?.message || 'Error koneksi' };
    }
  }

  public async purgeNonAtasanOfficers(): Promise<{
    success: boolean;
    deletedCount: number;
    keptCount: number;
    deletedOfficers: string[];
    keptOfficers: string[];
  }> {
    this.initDb();
    const deletedOfficers: string[] = [];
    const keptOfficers: string[] = [];

    // Clear local backup file so no old non-atasan persist
    try {
      if (fs.existsSync(LOCAL_ROSTER_BACKUP_PATH)) {
        const local = this.getLocalBackups();
        const keptLocal = local.filter(o => isAtasanRank(o.rank));
        fs.writeFileSync(LOCAL_ROSTER_BACKUP_PATH, JSON.stringify(keptLocal, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('[Discord Roster Service] Error cleaning local backup:', e);
    }

    if (!this.db) {
      return {
        success: true,
        deletedCount: 0,
        keptCount: 0,
        deletedOfficers: [],
        keptOfficers: []
      };
    }

    try {
      const colRef = collection(this.db, 'roster');
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        const data = d.data() as OfficerRecord;
        if (data && isAtasanRank(data.rank)) {
          keptOfficers.push(`${data.name} (${data.badge} - ${data.rank})`);
        } else {
          deletedOfficers.push(`${data?.name || d.id} (${data?.badge || '-'} - ${data?.rank || '-'})`);
          await deleteDoc(doc(this.db, 'roster', d.id));
        }
      }
    } catch (err: any) {
      console.error('[Discord Roster Service] Error purging non-atasan officers:', err);
      return {
        success: false,
        deletedCount: deletedOfficers.length,
        keptCount: keptOfficers.length,
        deletedOfficers,
        keptOfficers
      };
    }

    console.log(`[Discord Roster Service] Purge complete. Kept: ${keptOfficers.length}, Deleted: ${deletedOfficers.length}`);
    return {
      success: true,
      deletedCount: deletedOfficers.length,
      keptCount: keptOfficers.length,
      deletedOfficers,
      keptOfficers
    };
  }
}

export const discordRosterService = new DiscordRosterService();
