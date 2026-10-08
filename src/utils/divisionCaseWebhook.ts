import { DivisionCaseFile } from '../types';
import { getSavedWebhookConfig } from './discordWebhook';
import { dataURLtoBlob } from './imageCompressor';

/**
 * Sends a rich Operational Division Case File to Discord Webhook
 */
export async function sendDivisionCaseFileToDiscord(
  caseFile: DivisionCaseFile
): Promise<{ success: boolean; message: string }> {
  try {
    const config = getSavedWebhookConfig();
    const webhookUrl = config.webhookUrl;

    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      return {
        success: false,
        message: 'URL Webhook Discord belum diatur di Pengaturan Sistem Webhook.'
      };
    }

    // Determine status badge & color
    let color = 0x2563EB; // Blue
    let statusText = 'BERHASIL (CODE 4)';
    if (caseFile.outcomeStatus === 'BERHASIL') {
      color = 0x10B981; // Emerald
      statusText = '✅ OPERASI BERHASIL PENUH (CODE 4)';
    } else if (caseFile.outcomeStatus === 'SEBAGIAN_BERHASIL') {
      color = 0xF59E0B; // Amber
      statusText = '⚠️ SEBAGIAN BERHASIL (ADA CATATAN/DAMPAK)';
    } else if (caseFile.outcomeStatus === 'GAGAL') {
      color = 0xEF4444; // Rose/Red
      statusText = '❌ GAGAL / CODE 0 (SUSPECT KABUR / KORBAN JIWA)';
    } else {
      color = 0x6366F1; // Indigo
      statusText = '⚡ DALAM PENANGANAN AKTIF (CODE 3)';
    }

    const divisionEmojiMap: Record<string, string> = {
      SWAT: '🛡️ SWAT / METRO',
      ASD: '🚁 ASD (AIR SUPPORT)',
      K9: '🐕 K-9 CANINE SQUAD',
      TED: '🚔 TED (SATLANTAS)',
      IAD: '⚖️ IAD (PROPAM / ETIK)',
      ACADEMY: '🎓 POLICE ACADEMY / FTO',
      PATROL: '🚓 PATROLI REGULER',
      DETECTIVE: '🔍 DETECTIVE BUREAU',
      HIGH_COMMAND: '👑 HIGH COMMAND HQ'
    };

    const divisionLabel = divisionEmojiMap[caseFile.division] || caseFile.division;

    // Build fields
    const fields = [
      {
        name: '📂 No. Berkas Kasus & Divisi',
        value: `**${caseFile.caseNumber}**\n${divisionLabel}`,
        inline: true
      },
      {
        name: '📍 Lokasi Kejadian (TKP)',
        value: `**${caseFile.location}**\n🗓️ ${caseFile.incidentDate} - ⏰ ${caseFile.incidentTime}`,
        inline: true
      },
      {
        name: '🎖️ Komandan Operasi (IC)',
        value: `**${caseFile.commanderName}** (\`${caseFile.commanderBadge}\`)\n${caseFile.commanderRank}`,
        inline: true
      },
      {
        name: '👥 Tim Personel Terlibat',
        value: `**${caseFile.officersCount} Anggota Ikut**\n${caseFile.participatingOfficers.slice(0, 5).join('\n')}${caseFile.participatingOfficers.length > 5 ? `\n*+${caseFile.participatingOfficers.length - 5} personel lainnya*` : ''}`,
        inline: true
      },
      {
        name: '🎯 Situasi Suspect & Sandera',
        value: `**Suspect:** ${caseFile.suspectsCount} Orang (${caseFile.suspectAffiliation || 'N/A'})\n**Sandera:** ${caseFile.hostagesCount} Orang (${caseFile.hostageStatus})\n**Korban:** ${caseFile.policeCasualties}`,
        inline: true
      },
      {
        name: '📊 Status Akhir & Hasil Operasi',
        value: `**${statusText}**\n💰 Uang Terselamatkan: **${caseFile.lootRecovered || 'N/A'}**\n📉 Kerugian: ${caseFile.lootLoss || 'Nihil'}`,
        inline: true
      },
      {
        name: '🔫 Persenjataan Pihak Polisi',
        value: caseFile.policeWeapons.length > 0 ? caseFile.policeWeapons.map(w => `• ${w}`).join('\n') : 'Standar Patroli',
        inline: true
      },
      {
        name: '💣 Persenjataan Pihak Pelaku (Suspect)',
        value: caseFile.suspectWeapons.length > 0 ? caseFile.suspectWeapons.map(w => `• ${w}`).join('\n') : 'Tidak diketahui',
        inline: true
      },
      {
        name: '🚜 Kendaraan Taktis Penanganan',
        value: caseFile.tacticalVehicles.length > 0 ? caseFile.tacticalVehicles.join(', ') : 'Armada Standar',
        inline: false
      },
      {
        name: '📸 3 Dokumentasi Foto Bukti Penanganan',
        value: [
          `**1. Tahap Awal (Negosiasi):** ${caseFile.photoNegotiation.caption || 'Foto Terlampir'}`,
          `*Catatan:* ${caseFile.photoNegotiation.stageNotes}`,
          '',
          `**2. Lokasi Penembakan & Barikade:** ${caseFile.photoSetupShooting.caption || 'Foto Terlampir'}`,
          `*Catatan:* ${caseFile.photoSetupShooting.stageNotes}`,
          '',
          `**3. Selesai Penanganan (Hasil Akhir):** ${caseFile.photoFinalOutcome.caption || 'Foto Terlampir'}`,
          `*Catatan:* ${caseFile.photoFinalOutcome.stageNotes}`
        ].join('\n'),
        inline: false
      },
      {
        name: '📝 Kronologi Singkat Operasi',
        value: caseFile.chronologySummary ? (caseFile.chronologySummary.length > 900 ? caseFile.chronologySummary.slice(0, 900) + '...' : caseFile.chronologySummary) : 'Sesuai dengan SOP kepolisian yang berlaku.',
        inline: false
      },
      {
        name: '📋 Evaluasi Taktis Pimpinan',
        value: caseFile.tacticalEvaluation ? (caseFile.tacticalEvaluation.length > 500 ? caseFile.tacticalEvaluation.slice(0, 500) + '...' : caseFile.tacticalEvaluation) : 'Operasi telah dievaluasi dan diarsipkan.',
        inline: false
      }
    ];

    const mainEmbed: any = {
      title: `🚨 [BERKAS KASUS OPERASIONAL] ${caseFile.caseTitle}`,
      description: `Laporan penanganan operasi taktis resmi kepolisian HSPD divisi **${caseFile.division}**. Berkas telah diverifikasi dan disahkan oleh Komandan Lapangan.`,
      color,
      fields,
      footer: {
        text: `HSPD HighState Operational Case File • ${caseFile.caseNumber} • Sistem Real-Time Cloud`,
        icon_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=100&auto=format&fit=crop&q=80'
      },
      timestamp: new Date().toISOString()
    };

    // Attach primary photo if valid web URL
    if (caseFile.photoFinalOutcome.url && caseFile.photoFinalOutcome.url.startsWith('http')) {
      mainEmbed.image = { url: caseFile.photoFinalOutcome.url };
    } else if (caseFile.photoSetupShooting.url && caseFile.photoSetupShooting.url.startsWith('http')) {
      mainEmbed.image = { url: caseFile.photoSetupShooting.url };
    } else if (caseFile.photoNegotiation.url && caseFile.photoNegotiation.url.startsWith('http')) {
      mainEmbed.image = { url: caseFile.photoNegotiation.url };
    }

    // Additional photo embeds (up to 3 total)
    const embeds = [mainEmbed];

    if (caseFile.photoNegotiation.url && caseFile.photoNegotiation.url.startsWith('http')) {
      embeds.push({
        title: `📸 Foto Bukti 1: Tahap Awal / Saat Negosiasi - ${caseFile.caseNumber}`,
        description: `${caseFile.photoNegotiation.caption}\n*${caseFile.photoNegotiation.stageNotes}*`,
        url: webhookUrl,
        image: { url: caseFile.photoNegotiation.url },
        color
      });
    }

    if (caseFile.photoSetupShooting.url && caseFile.photoSetupShooting.url.startsWith('http')) {
      embeds.push({
        title: `📸 Foto Bukti 2: Lokasi Penembakan & Setup Barikade - ${caseFile.caseNumber}`,
        description: `${caseFile.photoSetupShooting.caption}\n*${caseFile.photoSetupShooting.stageNotes}*`,
        url: webhookUrl,
        image: { url: caseFile.photoSetupShooting.url },
        color
      });
    }

    // Check if there are base64 images that need FormData multipart upload
    const base64Photos: { name: string; base64: string }[] = [];
    if (caseFile.photoNegotiation.url && caseFile.photoNegotiation.url.startsWith('data:image')) {
      base64Photos.push({ name: 'foto_1_negosiasi.jpg', base64: caseFile.photoNegotiation.url });
    }
    if (caseFile.photoSetupShooting.url && caseFile.photoSetupShooting.url.startsWith('data:image')) {
      base64Photos.push({ name: 'foto_2_penembakan_barikade.jpg', base64: caseFile.photoSetupShooting.url });
    }
    if (caseFile.photoFinalOutcome.url && caseFile.photoFinalOutcome.url.startsWith('data:image')) {
      base64Photos.push({ name: 'foto_3_selesai_penanganan.jpg', base64: caseFile.photoFinalOutcome.url });
    }

    if (base64Photos.length > 0) {
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({
        username: config.botName || 'HSPD Tactical Dispatch',
        avatar_url: config.botAvatar || undefined,
        embeds: [mainEmbed]
      }));

      for (let i = 0; i < base64Photos.length; i++) {
        const item = base64Photos[i];
        const blobData = dataURLtoBlob(item.base64);
        if (blobData && blobData.blob) {
          formData.append(`file${i + 1}`, blobData.blob, item.name);
        }
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Discord merespons status ${res.status}: ${res.statusText}`);
      }

      return {
        success: true,
        message: `Laporan berkas ${caseFile.caseNumber} dan ${base64Photos.length} foto berhasil dikirim ke Discord!`
      };
    } else {
      // JSON payload
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: config.botName || 'HSPD Tactical Dispatch',
          avatar_url: config.botAvatar || undefined,
          embeds
        })
      });

      if (!res.ok) {
        throw new Error(`Discord merespons status ${res.status}: ${res.statusText}`);
      }

      return {
        success: true,
        message: `Laporan berkas ${caseFile.caseNumber} beserta 3 foto penanganan sukses disiarkan ke Discord!`
      };
    }
  } catch (err: any) {
    console.error('Failed to send division case file to Discord:', err);
    return {
      success: false,
      message: err?.message || 'Gagal mengirimkan berkas kasus ke webhook Discord.'
    };
  }
}
