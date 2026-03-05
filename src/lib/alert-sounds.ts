/**
 * Dog-themed alert sounds using Web Audio API synthesis.
 * No external files needed.
 */

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Playful dog yip + soft bell chime for regular reminders */
export function playReminderSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // Yip 1 — short high chirp
    const yip1 = ctx.createOscillator();
    const yip1Gain = ctx.createGain();
    yip1.type = 'sine';
    yip1.frequency.setValueAtTime(900, now);
    yip1.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    yip1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    yip1Gain.gain.setValueAtTime(0.6, now);
    yip1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    yip1.connect(yip1Gain).connect(master);
    yip1.start(now);
    yip1.stop(now + 0.12);

    // Yip 2 — slightly higher
    const yip2 = ctx.createOscillator();
    const yip2Gain = ctx.createGain();
    yip2.type = 'sine';
    yip2.frequency.setValueAtTime(1000, now + 0.15);
    yip2.frequency.exponentialRampToValueAtTime(1500, now + 0.21);
    yip2.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    yip2Gain.gain.setValueAtTime(0.5, now + 0.15);
    yip2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.27);
    yip2.connect(yip2Gain).connect(master);
    yip2.start(now + 0.15);
    yip2.stop(now + 0.27);

    // Soft bell chime
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1200, now + 0.35);
    bellGain.gain.setValueAtTime(0.4, now + 0.35);
    bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    bell.connect(bellGain).connect(master);
    bell.start(now + 0.35);
    bell.stop(now + 0.9);

    // Bell harmonic overtone
    const bellH = ctx.createOscillator();
    const bellHGain = ctx.createGain();
    bellH.type = 'sine';
    bellH.frequency.setValueAtTime(2400, now + 0.35);
    bellHGain.gain.setValueAtTime(0.15, now + 0.35);
    bellHGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    bellH.connect(bellHGain).connect(master);
    bellH.start(now + 0.35);
    bellH.stop(now + 0.7);

    // Auto-close context
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    // Silently fail — autoplay restrictions or unsupported browser
  }
}

/** Urgent whimper + double bell for missed medication alerts */
export function playUrgentSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);

    // Whimper — descending wobble
    const whimper = ctx.createOscillator();
    const whimperGain = ctx.createGain();
    whimper.type = 'sine';
    whimper.frequency.setValueAtTime(700, now);
    whimper.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    whimper.frequency.exponentialRampToValueAtTime(650, now + 0.2);
    whimper.frequency.exponentialRampToValueAtTime(400, now + 0.35);
    whimperGain.gain.setValueAtTime(0.6, now);
    whimperGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    whimper.connect(whimperGain).connect(master);
    whimper.start(now);
    whimper.stop(now + 0.38);

    // Bell 1
    const bell1 = ctx.createOscillator();
    const bell1Gain = ctx.createGain();
    bell1.type = 'sine';
    bell1.frequency.setValueAtTime(1400, now + 0.45);
    bell1Gain.gain.setValueAtTime(0.5, now + 0.45);
    bell1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
    bell1.connect(bell1Gain).connect(master);
    bell1.start(now + 0.45);
    bell1.stop(now + 0.85);

    // Bell 1 harmonic
    const bell1H = ctx.createOscillator();
    const bell1HGain = ctx.createGain();
    bell1H.type = 'sine';
    bell1H.frequency.setValueAtTime(2800, now + 0.45);
    bell1HGain.gain.setValueAtTime(0.2, now + 0.45);
    bell1HGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    bell1H.connect(bell1HGain).connect(master);
    bell1H.start(now + 0.45);
    bell1H.stop(now + 0.7);

    // Bell 2 (repeat, slightly higher)
    const bell2 = ctx.createOscillator();
    const bell2Gain = ctx.createGain();
    bell2.type = 'sine';
    bell2.frequency.setValueAtTime(1600, now + 0.9);
    bell2Gain.gain.setValueAtTime(0.5, now + 0.9);
    bell2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
    bell2.connect(bell2Gain).connect(master);
    bell2.start(now + 0.9);
    bell2.stop(now + 1.3);

    // Bell 2 harmonic
    const bell2H = ctx.createOscillator();
    const bell2HGain = ctx.createGain();
    bell2H.type = 'sine';
    bell2H.frequency.setValueAtTime(3200, now + 0.9);
    bell2HGain.gain.setValueAtTime(0.18, now + 0.9);
    bell2HGain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
    bell2H.connect(bell2HGain).connect(master);
    bell2H.start(now + 0.9);
    bell2H.stop(now + 1.15);

    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch {
    // Silently fail
  }
}
