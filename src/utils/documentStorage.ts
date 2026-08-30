import { OfficialDocument } from '../types';
import { DOCUMENT_PRESET_TEMPLATES } from '../data/documentTemplates';
import { syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';

export const DOCUMENTS_STORAGE_KEY = 'hspd_official_documents_archive_v1';

export function getSavedOfficialDocuments(): OfficialDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load official documents from storage', e);
  }

  // Seed with 3 realistic initial archived documents only on first launch
  const initialDocs: OfficialDocument[] = [
    {
      ...DOCUMENT_PRESET_TEMPLATES[0].defaultDoc,
      id: 'doc-seed-001',
      createdAt: Date.now() - 3600000 * 24 * 2,
      updatedAt: Date.now() - 3600000 * 24 * 2
    },
    {
      ...DOCUMENT_PRESET_TEMPLATES[1].defaultDoc,
      id: 'doc-seed-002',
      createdAt: Date.now() - 3600000 * 18,
      updatedAt: Date.now() - 3600000 * 18
    },
    {
      ...DOCUMENT_PRESET_TEMPLATES[2].defaultDoc,
      id: 'doc-seed-003',
      createdAt: Date.now() - 3600000 * 4,
      updatedAt: Date.now() - 3600000 * 4
    }
  ];

  try {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(initialDocs));
  } catch (e) {
    console.error(e);
  }

  return initialDocs;
}

export function saveOfficialDocument(doc: OfficialDocument): OfficialDocument[] {
  try {
    const current = getSavedOfficialDocuments();
    const existingIndex = current.findIndex(d => d.id === doc.id);
    let updated: OfficialDocument[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...doc, updatedAt: Date.now() };
    } else {
      updated = [{ ...doc, createdAt: doc.createdAt || Date.now(), updatedAt: Date.now() }, ...current];
    }
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hspd-documents-updated', { detail: updated }));
    }
    syncCollectionWithFirestore('OFFICIAL_DOCUMENTS', updated).catch(console.error);
    return updated;
  } catch (e) {
    console.error('Failed to save document', e);
    return getSavedOfficialDocuments();
  }
}

export function deleteOfficialDocument(id: string): OfficialDocument[] {
  try {
    const current = getSavedOfficialDocuments();
    const updated = current.filter(d => d.id !== id);
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hspd-documents-updated', { detail: updated }));
    }
    syncCollectionWithFirestore('OFFICIAL_DOCUMENTS', updated).catch(console.error);
    return updated;
  } catch (e) {
    console.error('Failed to delete document', e);
    return getSavedOfficialDocuments();
  }
}

export function formatDocumentAsText(doc: OfficialDocument): string {
  let output = `==========================================================\n`;
  output += `   KEPOLISIAN NEGARA HIGHSTATE (HIGHSTATE POLICE DEPT)\n`;
  output += `   MARKAS BESAR KEPOLISIAN - MISSION ROW HEADQUARTERS\n`;
  output += `==========================================================\n\n`;
  output += `NOMOR DOKUMEN   : ${doc.docNumber}\n`;
  output += `KLASIFIKASI     : [ ${doc.classification} ]\n`;
  output += `TANGGAL         : ${doc.date}\n`;
  output += `MASA BERLAKU    : ${doc.validUntil || '-'}\n`;
  output += `PERIHAL / HAL   : ${doc.subject}\n\n`;
  output += `----------------------------------------------------------\n`;
  output += `              ${doc.title}\n`;
  output += `----------------------------------------------------------\n\n`;
  output += `PENERBIT (PIHAK PERTAMA):\n`;
  output += `Nama    : ${doc.issuerName} (${doc.issuerBadge})\n`;
  output += `Pangkat : ${doc.issuerRank}\n`;
  output += `Jabatan : ${doc.issuerRole}\n\n`;
  output += `PENERIMA / SUBJEK (PIHAK KEDUA):\n`;
  output += `Nama    : ${doc.recipientName}\n`;
  if (doc.recipientId) output += `ID/CID  : ${doc.recipientId}\n`;
  if (doc.recipientRoleOrStatus) output += `Status  : ${doc.recipientRoleOrStatus}\n`;
  if (doc.recipientAddress) output += `Alamat  : ${doc.recipientAddress}\n\n`;
  output += `PEMBUKA:\n${doc.openingText}\n\n`;
  output += `KETENTUAN / KLAUSUL / PASAL:\n`;
  doc.clauses.forEach((c, idx) => {
    output += `${c.clauseNumber || `${idx + 1}.`} ${c.title ? `[${c.title}]` : ''}\n${c.content}\n\n`;
  });
  output += `PENUTUP:\n${doc.closingText}\n\n`;
  if (doc.notes) {
    output += `CATATAN / DISCLAIMER:\n${doc.notes}\n\n`;
  }
  output += `==========================================================\n`;
  output += `[ TANDA TANGAN & PENGESAHAN DOKUMEN RESMI ]\n`;
  output += `Pejabat Penerbit: ${doc.issuerName} [${doc.issuerRank}]\n`;
  if (doc.recipientSignatureName) {
    output += `Pihak Penerima  : ${doc.recipientSignatureName}\n`;
  }
  if (doc.acknowledgedByName) {
    output += `Mengesahkan     : ${doc.acknowledgedByName} [${doc.acknowledgedByRank || 'Chief of Police'}]\n`;
  }
  output += `==========================================================\n`;
  return output;
}
