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
  // Mystical ascending chord
  playTone(261.63, 0.4, 'sine', 0.05); // C4
  setTimeout(() => playTone(329.63, 0.4, 'sine', 0.05), 150); // E4
  setTimeout(() => playTone(392.0, 0.5, 'sine', 0.06), 300); // G4
  setTimeout(() => playTone(523.25, 0.6, 'sine', 0.04), 500); // C5
}

export function playClick() {
  playTone(800, 0.06, 'sine', 0.04);
}

export function playMysticAmbient() {
  // Soft ethereal pad
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    [261.63, 329.63, 392].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.3);
      osc.stop(ctx.currentTime + 4);
    });
  } catch {}
}
