// ============================================================
// 程序化音效（Web Audio，无需音频文件，零版权风险）
// ============================================================

export type SoundName =
  | 'battle'
  | 'item'
  | 'key'
  | 'door'
  | 'stairs'
  | 'denied'
  | 'buy'
  | 'victory'
  | 'gameover'

const MUTE_KEY = 'mota.muted'
const BASE_VOL = 0.25

let ctx: AudioContext | null = null
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1'

function audio(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  return ctx
}

type Note = [freq: number, start: number, dur: number]

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const c = audio()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function seq(notes: Note[], type: OscillatorType, gain: number) {
  for (const [f, s, d] of notes) tone(f, s, d, type, gain)
}

export const sfx = {
  isMuted: () => muted,
  setMuted(m: boolean) {
    muted = m
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    } catch {
      /* ignore */
    }
  },
  resume() {
    try {
      audio().resume()
    } catch {
      /* ignore */
    }
  },
  play(name: SoundName) {
    if (muted) return
    try {
      switch (name) {
        case 'battle':
          tone(150, 0, 0.12, 'sawtooth', 0.28)
          tone(90, 0.05, 0.1, 'square', 0.2)
          break
        case 'item':
          seq([[660, 0, 0.08], [990, 0.07, 0.1]], 'sine', BASE_VOL)
          break
        case 'key':
          seq([[880, 0, 0.07], [1175, 0.06, 0.09]], 'sine', BASE_VOL)
          break
        case 'door':
          tone(330, 0, 0.12, 'square', 0.22)
          tone(220, 0.08, 0.12, 'square', 0.18)
          break
        case 'stairs':
          seq([[440, 0, 0.06], [620, 0.05, 0.06], [880, 0.1, 0.1]], 'sine', 0.22)
          break
        case 'denied':
          tone(120, 0, 0.14, 'square', 0.22)
          break
        case 'buy':
          seq([[1320, 0, 0.05], [1760, 0.05, 0.07]], 'square', 0.18)
          break
        case 'victory':
          seq([[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1046, 0.36, 0.3]], 'sine', 0.3)
          break
        case 'gameover':
          seq([[392, 0, 0.18], [330, 0.18, 0.18], [262, 0.36, 0.18], [196, 0.54, 0.4]], 'sawtooth', 0.24)
          break
      }
    } catch {
      /* 音频不可用时静默 */
    }
  },
}
