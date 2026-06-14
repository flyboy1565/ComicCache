// src/utilities/audio.js

// Initialize a single global audio context lazily after user interaction
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a quick, clean synthesized note
 */
function playTone(frequency, type, duration, startTimeOffset = 0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTimeOffset);
    
    // Smooth volume envelope to prevent harsh pops
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime + startTimeOffset);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  } catch (e) {
    print("Audio playback blocked by browser security rules:", e);
  }
}

export const soundFX = {
  // 1. Double rapid chirp when camera captures any barcode sequence
  playCaptureBeep: () => {
    playTone(987.77, 'sine', 0.08, 0);       // B5 note
    playTone(1318.51, 'sine', 0.08, 0.04);   // E6 note
  },

  // 2. Rising triumphant arpeggio when database metadata successfully updates
  playLookupSuccess: () => {
    playTone(523.25, 'triangle', 0.1, 0);    // C5
    playTone(659.25, 'triangle', 0.1, 0.06); // E5
    playTone(783.99, 'triangle', 0.1, 0.12); // G5
    playTone(1046.50, 'triangle', 0.2, 0.18);// C6
  },

  // 3. Low, sweeping flat buzz when a barcode scan execution fails or errors
  playFailureBuzz: () => {
    playTone(130.81, 'sawtooth', 0.25, 0);   // C3 low buzz
    playTone(123.47, 'sawtooth', 0.25, 0.05);  // B2 slightly discordant lower buzz
  }
};