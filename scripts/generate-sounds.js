#!/usr/bin/env node
/**
 * Generate dog-themed notification sound .wav files from Web Audio API synthesis.
 * 
 * Usage:  node scripts/generate-sounds.js
 * Output: scripts/output/paws_reminder.wav, paws_urgent.wav, paws_alert.wav, paws_happy.wav
 *
 * Post-generation (macOS):
 *   for f in scripts/output/*.wav; do
 *     afconvert "$f" "${f%.wav}.caf" -d ima4 -f caff
 *   done
 *   cp scripts/output/*.caf ios/App/App/
 *   cp scripts/output/*.wav android/app/src/main/res/raw/
 *   npx cap sync
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

// ─── Helpers ───────────────────────────────────────────────────────────

function createBuffer(durationSec) {
  const length = Math.ceil(SAMPLE_RATE * durationSec);
  return new Float32Array(length);
}

function addSine(buf, freq, startSec, endSec, amplitude, freqEnd) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const endSample = Math.min(Math.floor(endSec * SAMPLE_RATE), buf.length);
  const duration = endSample - startSample;
  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const progress = (i - startSample) / duration;
    // Exponential frequency sweep
    const f = freqEnd ? freq * Math.pow(freqEnd / freq, progress) : freq;
    // Envelope: fade out
    const env = amplitude * (1 - progress);
    buf[i] += env * Math.sin(2 * Math.PI * f * t);
  }
}

function addSquare(buf, freq, startSec, endSec, amplitude, freqEnd) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const endSample = Math.min(Math.floor(endSec * SAMPLE_RATE), buf.length);
  const duration = endSample - startSample;
  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const progress = (i - startSample) / duration;
    const f = freqEnd ? freq * Math.pow(freqEnd / freq, progress) : freq;
    const env = amplitude * (1 - progress);
    buf[i] += env * (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1);
  }
}

function clamp(buf) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.max(-1, Math.min(1, buf[i]));
  }
}

// ─── Sound Definitions (matching alert-sounds.ts) ──────────────────────

function renderReminder() {
  const buf = createBuffer(1.0);
  const gain = 0.35;
  // Yip 1: 900→1400→800 Hz, 0-0.12s
  addSine(buf, 900, 0, 0.06, 0.6 * gain, 1400);
  addSine(buf, 1400, 0.06, 0.12, 0.4 * gain, 800);
  // Yip 2: 1000→1500→900 Hz, 0.15-0.27s
  addSine(buf, 1000, 0.15, 0.21, 0.5 * gain, 1500);
  addSine(buf, 1500, 0.21, 0.27, 0.35 * gain, 900);
  // Bell: 1200 Hz, 0.35-0.9s
  addSine(buf, 1200, 0.35, 0.9, 0.4 * gain);
  // Bell harmonic: 2400 Hz, 0.35-0.7s
  addSine(buf, 2400, 0.35, 0.7, 0.15 * gain);
  clamp(buf);
  return buf;
}

function renderUrgent() {
  const buf = createBuffer(1.4);
  const gain = 0.45;
  // Whimper: 700→500→650→400, 0-0.38s
  addSine(buf, 700, 0, 0.15, 0.6 * gain, 500);
  addSine(buf, 500, 0.15, 0.2, 0.4 * gain, 650);
  addSine(buf, 650, 0.2, 0.38, 0.3 * gain, 400);
  // Bell 1: 1400 Hz, 0.45-0.85s
  addSine(buf, 1400, 0.45, 0.85, 0.5 * gain);
  addSine(buf, 2800, 0.45, 0.7, 0.2 * gain);
  // Bell 2: 1600 Hz, 0.9-1.3s
  addSine(buf, 1600, 0.9, 1.3, 0.5 * gain);
  addSine(buf, 3200, 0.9, 1.15, 0.18 * gain);
  clamp(buf);
  return buf;
}

function renderAlert() {
  const buf = createBuffer(1.0);
  const gain = 0.5;
  // Bark 1: square 250→180, 0-0.1s
  addSquare(buf, 250, 0, 0.1, 0.7 * gain, 180);
  // Bark 2: square 300→200, 0.15-0.25s
  addSquare(buf, 300, 0.15, 0.25, 0.7 * gain, 200);
  // Rising siren: 400→1200, 0.35-0.95s
  addSine(buf, 400, 0.35, 0.95, 0.5 * gain, 1200);
  clamp(buf);
  return buf;
}

function renderHappy() {
  const buf = createBuffer(1.1);
  const gain = 0.4;
  // C5 (523), 0-0.4s
  addSine(buf, 523, 0, 0.4, 0.5 * gain);
  // E5 (659), 0.15-0.55s
  addSine(buf, 659, 0.15, 0.55, 0.5 * gain);
  // G5 (784), 0.3-0.8s
  addSine(buf, 784, 0.3, 0.8, 0.5 * gain);
  // C6 (1047), 0.45-1.0s
  addSine(buf, 1047, 0.45, 1.0, 0.35 * gain);
  clamp(buf);
  return buf;
}

// ─── WAV Encoder ───────────────────────────────────────────────────────

function encodeWav(samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);         // chunk size
  buffer.writeUInt16LE(1, 20);          // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(val), 44 + i * 2);
  }

  return buffer;
}

// ─── Main ──────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, 'output');
const iosDir = path.join(__dirname, '..', 'ios', 'App', 'App');
const androidDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'raw');

// Create all output directories
for (const dir of [outDir, iosDir, androidDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const sounds = [
  { name: 'paws_reminder', render: renderReminder },
  { name: 'paws_urgent',   render: renderUrgent },
  { name: 'paws_alert',    render: renderAlert },
  { name: 'paws_happy',    render: renderHappy },
];

for (const { name, render } of sounds) {
  const samples = render();
  const wav = encodeWav(samples);
  const fileName = `${name}.wav`;

  // Write to scripts/output/
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, wav);
  console.log(`✅ ${outPath} (${(wav.length / 1024).toFixed(1)} KB)`);

  // Copy to iOS native directory
  const iosPath = path.join(iosDir, fileName);
  fs.copyFileSync(outPath, iosPath);
  console.log(`   → ${iosPath}`);

  // Copy to Android native directory
  const androidPath = path.join(androidDir, fileName);
  fs.copyFileSync(outPath, androidPath);
  console.log(`   → ${androidPath}`);
}

console.log(`
🐾 Done! Sound files generated and copied to native directories.

Next steps:
  npx cap sync
  git add . && git commit -m "Add custom notification sounds"
  git push
`);
