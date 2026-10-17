import { AnnouncementSeverity } from './systemAnnouncementStorage';

/**
 * Generates an audio notification chime using the browser's Web Audio API.
 * Does not require external audio files or internet connectivity.
 */
export function playSystemNotificationChime(severity: AnnouncementSeverity = 'IMPORTANT'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Frequencies tailored to notification urgency
    let freqs: number[] = [523.25, 659.25, 783.99]; // C5, E5, G5 (Chime harmonik)
    let waveType: OscillatorType = 'sine';
    let duration = 0.14;

    if (severity === 'CRITICAL') {
      freqs = [880, 1046.5, 1318.51]; // A5, C6, E6 (High alert urgent)
      waveType = 'triangle';
      duration = 0.16;
    } else if (severity === 'URGENT') {
      freqs = [659.25, 880, 1174.66]; // E5, A5, D6
      waveType = 'sine';
      duration = 0.15;
    } else if (severity === 'NORMAL') {
      freqs = [440, 554.37, 659.25]; // A4, C#5, E5 (Soft warm tone)
      waveType = 'sine';
      duration = 0.12;
    }

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now + idx * duration);

      const startTime = now + idx * duration;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration * 2.0);
    });
  } catch (err) {
    console.debug('System notification chime skipped or unavailable:', err);
  }
}
