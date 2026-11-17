// Browser audio stays outside the simulation, so battles also work without audio.
export function createSpartanAudio() {
  let context: AudioContext | null = null, lastScream = -10
  const unlock = () => {
    if (typeof AudioContext === 'undefined') return
    try {
      context ??= new AudioContext()
      if (context.state === 'suspended') void context.resume().catch(() => {})
    } catch { /* Audio may be unavailable; the visual scream still plays. */ }
  }
  const scream = () => {
    if (!context || context.state !== 'running' || context.currentTime - lastScream < 0.4) return
    const now = context.currentTime, duration = 1.1
    lastScream = now
    const voice = context.createOscillator(), vibrato = context.createOscillator()
    const vibratoDepth = context.createGain(), filter = context.createBiquadFilter(), envelope = context.createGain()
    voice.type = 'sawtooth'
    voice.frequency.setValueAtTime(140, now)
    voice.frequency.exponentialRampToValueAtTime(340, now + 0.18)
    voice.frequency.exponentialRampToValueAtTime(75, now + duration)
    vibrato.frequency.value = 32; vibratoDepth.gain.value = 24
    vibrato.connect(vibratoDepth); vibratoDepth.connect(voice.frequency)
    filter.type = 'lowpass'; filter.frequency.value = 1500; filter.Q.value = 2
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(0.055, now + 0.06)
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)
    voice.connect(filter); filter.connect(envelope); envelope.connect(context.destination)
    const noise = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35
    const breath = context.createBufferSource()
    breath.buffer = noise; breath.connect(filter)
    voice.start(now); vibrato.start(now); breath.start(now)
    voice.stop(now + duration); vibrato.stop(now + duration); breath.stop(now + duration)
    voice.onended = () => {
      voice.disconnect(); vibrato.disconnect(); vibratoDepth.disconnect()
      breath.disconnect(); filter.disconnect(); envelope.disconnect()
    }
  }
  const setRunning = (running: boolean) => {
    if (!context) return
    if (running && context.state === 'suspended') void context.resume().catch(() => {})
    else if (!running && context.state === 'running') void context.suspend().catch(() => {})
  }
  const dispose = () => { if (context) void context.close().catch(() => {}); context = null }
  return { unlock, scream, setRunning, dispose }
}
