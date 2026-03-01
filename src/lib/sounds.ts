// Lightweight interaction sounds using Web Audio API
// No external files needed — generates tones programmatically

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail — sounds are non-critical
  }
}

// Binaural-style pad for deep relaxation
function playPad(freq: number, duration: number, volume = 0.02) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq + 2; // slight detune for warmth
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    osc1.connect(gain).connect(ctx.destination);
    osc2.connect(gain).connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch {}
}

export function playStartRecord() {
  playTone(523.25, 0.15, 'sine', 0.1); // C5
  setTimeout(() => playTone(659.25, 0.2, 'sine', 0.08), 100); // E5
}

export function playStopRecord() {
  playTone(659.25, 0.12, 'sine', 0.08);
  setTimeout(() => playTone(523.25, 0.25, 'sine', 0.06), 80);
}

export function playSend() {
  playTone(440, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(554.37, 0.08, 'sine', 0.06), 60);
  setTimeout(() => playTone(659.25, 0.15, 'sine', 0.08), 120);
}

export function playReveal() {
  // Mystical ascending chord — longer & more ethereal
  playPad(130.81, 3, 0.015); // C3 bass pad
  playTone(261.63, 0.6, 'sine', 0.04); // C4
  setTimeout(() => playTone(329.63, 0.6, 'sine', 0.04), 200); // E4
  setTimeout(() => playTone(392.0, 0.7, 'sine', 0.05), 400); // G4
  setTimeout(() => playTone(523.25, 0.8, 'sine', 0.04), 650); // C5
  setTimeout(() => playTone(659.25, 1.0, 'sine', 0.03), 900); // E5
}

export function playClick() {
  playTone(800, 0.06, 'sine', 0.04);
}

export function playMysticAmbient() {
  // Soft ethereal pad — deeper & longer
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    [130.81, 196.0, 261.63, 329.63, 392].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 1.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + 5);
    });
  } catch {}
}

// Navigation transition sound — gentle whoosh
export function playTransition() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// Error/warning sound — soft descending tone
export function playError() {
  playTone(440, 0.15, 'sine', 0.06);
  setTimeout(() => playTone(330, 0.2, 'sine', 0.05), 120);
  setTimeout(() => playTone(220, 0.3, 'sine', 0.04), 250);
}

// Success chime
export function playSuccess() {
  playTone(523.25, 0.1, 'sine', 0.06); // C5
  setTimeout(() => playTone(659.25, 0.1, 'sine', 0.06), 80); // E5
  setTimeout(() => playTone(783.99, 0.2, 'sine', 0.07), 160); // G5
}

// Emoji/reaction pop
export function playReaction() {
  playTone(880, 0.05, 'sine', 0.05);
  setTimeout(() => playTone(1108.73, 0.08, 'sine', 0.04), 40);
}

// Comment submitted
export function playComment() {
  playTone(660, 0.08, 'sine', 0.04);
  setTimeout(() => playTone(880, 0.1, 'sine', 0.04), 60);
}

// Loading phase transition
export function playPhaseTransition() {
  playPad(220, 2, 0.012);
  playTone(440, 0.3, 'triangle', 0.03);
}
