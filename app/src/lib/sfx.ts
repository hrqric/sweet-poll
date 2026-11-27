// Bipes 8-bit gerados na hora com WebAudio (onda quadrada). Sem arquivos de áudio.

let ctx: AudioContext | null = null
const KEY = 'goty-muted'

export function isMuted() {
  return localStorage.getItem(KEY) === '1'
}
export function setMuted(m: boolean) {
  localStorage.setItem(KEY, m ? '1' : '0')
}

function tone(freqs: number[], step = 0.06, type: OscillatorType = 'square', vol = 0.06) {
  if (isMuted()) return
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, t0 + i * step))
    gain.gain.setValueAtTime(vol, t0)
    gain.gain.setValueAtTime(0, t0 + freqs.length * step)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + freqs.length * step + 0.02)
  } catch {
    /* navegador sem áudio: segue o jogo */
  }
}

export const sfx = {
  select: () => tone([660, 880], 0.04),
  confirm: () => tone([523, 659, 784, 1047], 0.05),
  coin: () => tone([988, 1319], 0.07),
  buy: () => tone([784, 988, 1175, 1568], 0.06),
  error: () => tone([220, 165], 0.09, 'square', 0.05),
  win: () => tone([523, 659, 784, 1047, 784, 1047, 1319], 0.08),
  // motor subindo de giro: vitória solitária
  drive: () => tone([98, 110, 131, 147, 175, 196, 233, 262, 330, 392, 523, 659], 0.06, 'sawtooth', 0.045),
  // descendo devagar: ninguém acertou
  sad: () => tone([392, 370, 349, 330, 311, 262], 0.22, 'triangle', 0.08),
}
