// Web Audio API Sound Synthesizer for Authentic Retro Theka Experience
// Zero external assets, 100% lightweight, safe against autoplay policies.

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Plays a resonant cork / bottle cap pop
 */
export function playCorkPop() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Oscillator for the "thump/pop" cavity resonance
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.1)

    // Gentle high air snap
    const bufferSize = ctx.sampleRate * 0.04
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.2, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 0.05)
  } catch {
    // Graceful fallback if audio is unavailable
  }
}

/**
 * Plays ambient liquid trickle / pouring sound for a set duration
 */
export function playPourSound(duration = 2.4) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return () => {}

    const now = ctx.currentTime
    const sampleRate = ctx.sampleRate
    const bufferLength = Math.floor(sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferLength, sampleRate)
    const output = buffer.getChannelData(0)

    // Pink-noise like random fluctuation simulating fluid stream
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.25
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Filter simulating stream hitting liquid cavity
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(600, now)
    filter.frequency.linearRampToValueAtTime(950, now + duration) // rising pitch as glass fills!
    filter.Q.value = 3.5

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.001, now)
    masterGain.gain.linearRampToValueAtTime(0.18, now + 0.2)
    masterGain.gain.setValueAtTime(0.18, now + duration - 0.3)
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(masterGain)
    masterGain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + duration)

    return () => {
      try {
        noise.stop()
      } catch (err) {
        // Ignored if sound has already ended
        void err
      }
    }
  } catch (err) {
    void err
    return () => {}
  }
}

/**
 * Plays a crystalline, warm glass clink
 */
export function playGlassClink() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(2280, now)
    osc.frequency.exponentialRampToValueAtTime(2250, now + 0.4)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.5)
  } catch (err) {
    void err
  }
}

/**
 * Plays subtle analog radio frequency tuning crackle
 */
export function playRadioStatic() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const bufferSize = ctx.sampleRate * 0.22
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    filter.Q.value = 2.0

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 0.22)
  } catch (err) {
    void err
  }
}
