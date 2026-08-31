function getAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, volume = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.frequency.value = frequency;
  osc.type = "sine";

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playStartBeep(): void {
  playTone(880, 0.08);
}

export function playStopBeep(): void {
  playTone(440, 0.12);
}
