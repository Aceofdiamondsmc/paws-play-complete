/**
 * Dog-themed alert sounds using Web Audio API synthesis.
 * No external files needed.
 */

let sharedCtx: AudioContext | null = null;
let unlocked = false;

/** Call once on mount to pre-warm AudioContext on first user interaction (mobile requirement). */
export function initAudioContext() {
  if (unlocked || sharedCtx) return;

  const unlock = () => {
    try {
      if (!sharedCtx) {
        sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (sharedCtx.state === 'suspended') {
        sharedCtx.resume();
      }
      unlocked = true;
    } catch {
      // unsupported
    }
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
  };

  window.addEventListener('touchstart', unlock, { once: true });
  window.addEventListener('click', unlock, { once: true });
}

function getAudioContext(): AudioContext | null {
  try {
    if (sharedCtx && sharedCtx.state !== 'closed') {
      if (sharedCtx.state === 'suspended') sharedCtx.resume();
      return sharedCtx;
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    sharedCtx = ctx;
    return ctx;
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

    // Don't close shared context
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

    const bell1 = ctx.createOscillator();
    const bell1Gain = ctx.createGain();
    bell1.type = 'sine';
    bell1.frequency.setValueAtTime(1400, now + 0.45);
    bell1Gain.gain.setValueAtTime(0.5, now + 0.45);
    bell1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
    bell1.connect(bell1Gain).connect(master);
    bell1.start(now + 0.45);
    bell1.stop(now + 0.85);

    const bell1H = ctx.createOscillator();
    const bell1HGain = ctx.createGain();
    bell1H.type = 'sine';
    bell1H.frequency.setValueAtTime(2800, now + 0.45);
    bell1HGain.gain.setValueAtTime(0.2, now + 0.45);
    bell1HGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    bell1H.connect(bell1HGain).connect(master);
    bell1H.start(now + 0.45);
    bell1H.stop(now + 0.7);

    const bell2 = ctx.createOscillator();
    const bell2Gain = ctx.createGain();
    bell2.type = 'sine';
    bell2.frequency.setValueAtTime(1600, now + 0.9);
    bell2Gain.gain.setValueAtTime(0.5, now + 0.9);
    bell2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
    bell2.connect(bell2Gain).connect(master);
    bell2.start(now + 0.9);
    bell2.stop(now + 1.3);

    const bell2H = ctx.createOscillator();
    const bell2HGain = ctx.createGain();
    bell2H.type = 'sine';
    bell2H.frequency.setValueAtTime(3200, now + 0.9);
    bell2HGain.gain.setValueAtTime(0.18, now + 0.9);
    bell2HGain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
    bell2H.connect(bell2HGain).connect(master);
    bell2H.start(now + 0.9);
    bell2H.stop(now + 1.15);
  } catch {
    // Silently fail
  }
}

/** Urgent "loud bark" + rising siren for Pack Alert (missing dog) */
export function playPackAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    // Bark 1
    const bark1 = ctx.createOscillator();
    const bark1Gain = ctx.createGain();
    bark1.type = 'square';
    bark1.frequency.setValueAtTime(250, now);
    bark1.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    bark1Gain.gain.setValueAtTime(0.7, now);
    bark1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    bark1.connect(bark1Gain).connect(master);
    bark1.start(now);
    bark1.stop(now + 0.1);

    // Bark 2
    const bark2 = ctx.createOscillator();
    const bark2Gain = ctx.createGain();
    bark2.type = 'square';
    bark2.frequency.setValueAtTime(300, now + 0.15);
    bark2.frequency.exponentialRampToValueAtTime(200, now + 0.23);
    bark2Gain.gain.setValueAtTime(0.7, now + 0.15);
    bark2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    bark2.connect(bark2Gain).connect(master);
    bark2.start(now + 0.15);
    bark2.stop(now + 0.25);

    // Rising siren sweep
    const siren = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    siren.type = 'sine';
    siren.frequency.setValueAtTime(400, now + 0.35);
    siren.frequency.exponentialRampToValueAtTime(1200, now + 0.85);
    sirenGain.gain.setValueAtTime(0.5, now + 0.35);
    sirenGain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
    siren.connect(sirenGain).connect(master);
    siren.start(now + 0.35);
    siren.stop(now + 0.95);
  } catch {
    // Silently fail
  }
}

/** Cheerful ascending chime for Pack Reunited (dog found) */
export function playReunitedSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);

    // C5
    const n1 = ctx.createOscillator();
    const n1g = ctx.createGain();
    n1.type = 'sine';
    n1.frequency.setValueAtTime(523, now);
    n1g.gain.setValueAtTime(0.5, now);
    n1g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    n1.connect(n1g).connect(master);
    n1.start(now);
    n1.stop(now + 0.4);

    // E5
    const n2 = ctx.createOscillator();
    const n2g = ctx.createGain();
    n2.type = 'sine';
    n2.frequency.setValueAtTime(659, now + 0.15);
    n2g.gain.setValueAtTime(0.5, now + 0.15);
    n2g.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    n2.connect(n2g).connect(master);
    n2.start(now + 0.15);
    n2.stop(now + 0.55);

    // G5
    const n3 = ctx.createOscillator();
    const n3g = ctx.createGain();
    n3.type = 'sine';
    n3.frequency.setValueAtTime(784, now + 0.3);
    n3g.gain.setValueAtTime(0.5, now + 0.3);
    n3g.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    n3.connect(n3g).connect(master);
    n3.start(now + 0.3);
    n3.stop(now + 0.8);

    // C6
    const n4 = ctx.createOscillator();
    const n4g = ctx.createGain();
    n4.type = 'sine';
    n4.frequency.setValueAtTime(1047, now + 0.45);
    n4g.gain.setValueAtTime(0.35, now + 0.45);
    n4g.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    n4.connect(n4g).connect(master);
    n4.start(now + 0.45);
    n4.stop(now + 1.0);
  } catch {
    // Silently fail
  }
}
