import * as XLSX from 'xlsx';
import { OfficerAccount } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';

export interface AccountExportOptions {
  includePin?: boolean;
  departmentName?: string;
  exportedBy?: string;
  exportedByBadge?: string;
  exportedByRank?: string;
}

/**
 * Generates an Excel (.xlsx) file containing complete officer accounts & login credentials.
 */
export function exportAccountsToExcel(
  officers: OfficerAccount[],
  options: AccountExportOptions = {}
): void {
  const includePin = options.includePin ?? true;
  const dept = options.departmentName || 'State of HighState Police Department (HSPD)';
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rows = officers.map((off, idx) => {
    const warnCount = Array.isArray(off.warnings) ? off.warnings.length : 0;
    const warnDetails = Array.isArray(off.warnings) && off.warnings.length > 0
      ? off.warnings.map(w => `SP-${w.strikeNumber}: ${w.reason}`).join(' | ')
      : 'Bebas Peringatan';

    return {
      'No': idx + 1,
      'Lencana (Badge)': off.badge || '-',
      'Nama Karakter (IC)': off.name || '-',
      'Pangkat (Rank)': off.rank || '-',
      'Divisi (Division)': off.division || 'Patrol Division',
      'PIN Login': includePin ? (off.pin || '10-4') : '****** (Dirahasiakan)',
      'No. Telepon': off.phone || '-',
      'Tag Discord': off.discordTag || '-',
      'Jumlah Warn': warnCount > 0 ? `${warnCount} Strike` : '0',
      'Riwayat Peringatan (SP)': warnDetails,
      'Tanggal Registrasi': off.registeredAt ? new Date(off.registeredAt).toLocaleDateString('id-ID') : '-',
      'Dipromosikan Oleh': off.promotedBy || 'Markas Besar Kepolisian'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // Badge
    { wch: 28 }, // Nama
    { wch: 28 }, // Pangkat
    { wch: 32 }, // Divisi
    { wch: 18 }, // PIN
    { wch: 14 }, // Phone
    { wch: 22 }, // Discord
    { wch: 14 }, // Warn Count
    { wch: 40 }, // Riwayat Warn
    { wch: 18 }, // Tanggal
    { wch: 35 }  // Promoted By
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kredensial_Akun_HSPD');

  const filename = `HSPD_Master_Akun_${includePin ? 'Lengkap_PIN' : 'Tanpa_PIN'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and downloads a CSV file with officer accounts.
 */
export function exportAccountsToCSV(
  officers: OfficerAccount[],
  options: AccountExportOptions = {}
): void {
  const includePin = options.includePin ?? true;

  const headers = [
    'No',
    'Badge',
    'Nama Lengkap',
    'Pangkat',
    'Divisi',
    'PIN Login',
    'No Telepon',
    'Discord Tag',
    'Jumlah Warn',
    'Keterangan Peringatan',
    'Tanggal Registrasi',
    'Dipromosikan Oleh'
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    const s = String(val ?? '').trim();
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines: string[] = [headers.join(',')];

  officers.forEach((off, idx) => {
    const warnCount = Array.isArray(off.warnings) ? off.warnings.length : 0;
    const warnDetails = Array.isArray(off.warnings) && off.warnings.length > 0
      ? off.warnings.map(w => `SP-${w.strikeNumber}: ${w.reason}`).join(' ; ')
      : 'Tidak ada';

    const row = [
      idx + 1,
      escapeCSV(off.badge),
      escapeCSV(off.name),
      escapeCSV(off.rank),
      escapeCSV(off.division),
      escapeCSV(includePin ? off.pin : '******'),
      escapeCSV(off.phone),
      escapeCSV(off.discordTag),
      warnCount,
      escapeCSV(warnDetails),
      escapeCSV(off.registeredAt ? new Date(off.registeredAt).toLocaleDateString('id-ID') : '-'),
      escapeCSV(off.promotedBy || '-')
    ];
    lines.push(row.join(','));
  });

  // Include UTF-8 BOM so Excel opens it with proper encoding
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HSPD_Akun_Roster_${includePin ? 'Master' : 'Publik'}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a structured JSON backup of all accounts.
 */
export function exportAccountsToJSON(
  officers: OfficerAccount[],
  options: AccountExportOptions = {}
): void {
  const includePin = options.includePin ?? true;
  const payload = {
    metadata: {
      title: 'HSPD Official MDC Roster Accounts Backup',
      exportedAt: new Date().toISOString(),
      exportedBy: options.exportedBy || 'HSPD Superior Staff',
      exportedByBadge: options.exportedByBadge || '',
      includePin,
      totalOfficers: officers.length
    },
    officers: officers.map(o => ({
      id: o.id,
      name: o.name,
      badge: o.badge,
      rank: o.rank,
      division: o.division,
      pin: includePin ? o.pin : '******',
      phone: o.phone || '',
      discordTag: o.discordTag || '',
      registeredAt: o.registeredAt,
      promotedBy: o.promotedBy || '',
      warnings: o.warnings || []
    }))
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HSPD_Roster_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted Discord Markdown text grouped by hierarchical rank categories.
 */
export function formatAccountsToDiscordText(
  officers: OfficerAccount[],
  options: AccountExportOptions = {}
): string {
  const includePin = options.includePin ?? false;
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rankGroups: Record<string, { title: string; officers: OfficerAccount[] }> = {
    rank6: { title: 'COMMAND STAFF // RANK 6', officers: [] },
    rank5: { title: 'EXECUTIVE STAFF // RANK 5', officers: [] },
    rank4: { title: 'FIELD COMMAND // RANK 4', officers: [] },
    rank3: { title: 'SUPERVISORS // RANK 3', officers: [] },
    rank2: { title: 'POLICE OFFICERS // RANK 2', officers: [] },
    rank1: { title: 'CADET // RANK 1', officers: [] },
    other: { title: 'ANGGOTA LAINNYA', officers: [] }
  };

  officers.forEach(off => {
    const r = (off.rank || '').toUpperCase();
    if (r.includes('CHIEF OF POLICE') || r.includes('[COP]')) {
      rankGroups.rank6.officers.push(off);
    } else if (r.includes('ASSISTANT CHIEF') || r.includes('DEPUTY CHIEF') || r.includes('COMMANDER')) {
      rankGroups.rank5.officers.push(off);
    } else if (r.includes('CAPTAIN') || r.includes('LIEUTENANT')) {
      rankGroups.rank4.officers.push(off);
    } else if (r.includes('SERGEANT') || r.includes('SGT')) {
      rankGroups.rank3.officers.push(off);
    } else if (r.includes('POLICE OFFICER') || r.includes('PO ') || r.includes('LEAD OFFICER') || r.includes('SLO')) {
      rankGroups.rank2.officers.push(off);
    } else if (r.includes('CADET')) {
      rankGroups.rank1.officers.push(off);
    } else {
      rankGroups.other.officers.push(off);
    }
  });

  let text = `# HIGH STATE POLICE DEPARTMENT ORGANIZATIONAL ROSTER\n`;
  text += `> 📅 **Waktu Rilis Data:** \`${dateStr}\`\n`;
  text += `> 👥 **Total Personel:** \`${officers.length} Anggota\`\n`;
  if (includePin) {
    text += `> 🔒 **DOKUMEN RAHASIA (CONFIDENTIAL MASTER LIST BESERTA PIN LOGIN)**\n`;
  }
  text += `\n---\n\n`;

  Object.values(rankGroups).forEach(group => {
    if (group.officers.length === 0) return;

    text += `## **[${group.title}]**\n\n`;

    // Group by rank title within group
    const byRank = new Map<string, OfficerAccount[]>();
    group.officers.forEach(o => {
      const rKey = o.rank || 'OFFICER';
      if (!byRank.has(rKey)) byRank.set(rKey, []);
      byRank.get(rKey)!.push(o);
    });

    for (const [rankName, list] of byRank.entries()) {
      text += `**${rankName}**\n`;
      list.forEach((o, i) => {
        const warnTag = (o.warnings && o.warnings.length > 0) ? ` *(WARN ${o.warnings.length})*` : '';
        const pinTag = includePin ? ` — PIN: \`${o.pin || '10-4'}\`` : '';
        const badgeTag = o.badge ? `(\`${o.badge}\`) ` : '';
        text += `> ${i + 1}. ${badgeTag}**${o.name}**${warnTag}${pinTag}\n`;
      });
      text += `\n`;
    }
    text += `---\n\n`;
  });

  return text.trim();
}

/**
 * Opens a printable HTML window for printing or saving to PDF.
 */
export function printAccountsDocument(
  officers: OfficerAccount[],
  options: AccountExportOptions = {}
): void {
  const includePin = options.includePin ?? false;
  const dept = options.departmentName || 'HIGH STATE POLICE DEPARTMENT';
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir peramban. Harap izinkan popup untuk mencetak dokumen akun.');
    return;
  }

  const rowsHtml = officers.map((off, idx) => {
    const warnCount = Array.isArray(off.warnings) ? off.warnings.length : 0;
    return `
      <tr style="border-bottom: 1px solid #ddd; ${idx % 2 === 0 ? 'background-color: #fafafa;' : ''}">
        <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; font-family: monospace;">${off.badge || '-'}</td>
        <td style="padding: 6px 8px; font-weight: bold;">${off.name || '-'}</td>
        <td style="padding: 6px 8px;">${off.rank || '-'}</td>
        <td style="padding: 6px 8px;">${off.division || '-'}</td>
        ${includePin ? `<td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #b45309;">${off.pin || '10-4'}</td>` : ''}
        <td style="padding: 6px 8px; font-family: monospace;">${off.phone || '-'}</td>
        <td style="padding: 6px 8px; text-align: center; color: ${warnCount > 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">
          ${warnCount > 0 ? `${warnCount} Strike` : 'Bebas SP'}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Dokumen Master Akun Anggota - ${dept}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 30px; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { width: 75px; height: 75px; margin-right: 20px; }
          .title-box { flex: 1; }
          .title-box h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
          .title-box p { margin: 3px 0 0; font-size: 12px; color: #475569; }
          .meta-bar { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 15px; color: #334155; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background-color: #0f172a; color: white; padding: 8px; text-align: left; font-weight: 600; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 15px; }
          @media print {
            body { margin: 15px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${HSPD_LOGO_URL}" class="logo" alt="HSPD Emblem" />
          <div class="title-box">
            <h1>${dept}</h1>
            <p>DOKUMEN RESMI REKAPITULASI DATA AKUN & STRUKTUR ROSTER ANGGOTA KEPOLISIAN</p>
          </div>
        </div>
        <div class="meta-bar">
          <div><strong>Waktu Cetak:</strong> ${dateStr}</div>
          <div><strong>Total Personel:</strong> ${officers.length} Anggota</div>
          <div><strong>Klasifikasi:</strong> ${includePin ? '<span style="color:red; font-weight:bold;">CONFIDENTIAL (DENGAN PIN)</span>' : 'OFFICIAL STAFF ROSTER'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">No</th>
              <th style="width: 80px;">Badge</th>
              <th>Nama Lengkap</th>
              <th>Pangkat</th>
              <th>Divisi</th>
              ${includePin ? '<th style="width: 70px;">PIN</th>' : ''}
              <th style="width: 90px;">Telepon</th>
              <th style="width: 80px; text-align: center;">Peringatan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          <div>Dicetak dari Terminal MDC/MDT Kepolisian High State</div>
          <div>Tanda Tangan Otoritas Komando: ________________________</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
