// Small Web Audio sound effects for the cassette rewind game. No audio files: every sound
// is synthesized, and every call is made from a user gesture, so autoplay rules allow it.

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

/** One soft ratchet click of a cassette reel turning. */
export function playReelTick() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const length = Math.floor(ctx.sampleRate * 0.018)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.22))
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2400 + Math.random() * 500
    filter.Q.value = 1.6

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.025)
  } catch {
    // Sound is decoration. The game works without it.
  }
}

/** The mechanical clunk of a tape reaching its start. */
export function playTapeClunk() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const thump = ctx.createOscillator()
    const thumpGain = ctx.createGain()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(190, now)
    thump.frequency.exponentialRampToValueAtTime(58, now + 0.09)
    thumpGain.gain.setValueAtTime(0.22, now)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    thump.connect(thumpGain)
    thumpGain.connect(ctx.destination)
    thump.start(now)
    thump.stop(now + 0.13)

    const length = Math.floor(ctx.sampleRate * 0.03)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.18))
    }
    const click = ctx.createBufferSource()
    click.buffer = buffer
    const clickFilter = ctx.createBiquadFilter()
    clickFilter.type = 'highpass'
    clickFilter.frequency.value = 1500
    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(0.12, now)
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
    click.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(ctx.destination)
    click.start(now)
    click.stop(now + 0.04)
  } catch {
    // Sound is decoration. The game works without it.
  }
}
