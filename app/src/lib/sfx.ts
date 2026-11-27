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
  // pancada grave (espadão no chão)
  thud: () => tone([131, 98, 73, 55, 41], 0.09, 'square', 0.1),
  // freada + batida
  crash: () => tone([1047, 988, 932, 880, 220, 110, 82], 0.05, 'sawtooth', 0.06),
  // chiado curto
  hiss: () => tone([1760, 1661, 1760, 1661, 1760, 1661], 0.08, 'sawtooth', 0.025),
  // explosão
  boom: () => tone([196, 165, 131, 110, 87, 65, 49], 0.08, 'sawtooth', 0.09),
  // anúncio sombrio (letreiro de derrota)
  doom: () => tone([147, 139, 131, 123], 0.35, 'triangle', 0.09),
  // carimbo batendo
  stamp: () => tone([196, 98], 0.06, 'square', 0.1),
  // assobio de faroeste
  whistle: () => tone([988, 1175, 1319, 1175, 988, 880], 0.14, 'sine', 0.05),
  // fanfarra de item raro (melodia própria)
  fanfare: () => tone([523, 659, 784, 659, 784, 1047, 1047, 1319, 1568], 0.11, 'square', 0.06),
  // vento cortando (machado girando)
  whoosh: () => tone([440, 523, 622, 740, 880, 740, 622, 523, 440, 523, 622, 740, 880], 0.05, 'triangle', 0.04),
  // brilho de gelo
  ice: () => tone([1568, 2093, 1760, 2349, 2093, 2637], 0.06, 'sine', 0.04),
  // nave descendo
  land: () => tone([880, 784, 698, 622, 554, 494, 440, 392], 0.08, 'triangle', 0.05),
  // fogos estourando
  pop: () => tone([1319, 1047, 784, 523], 0.04, 'square', 0.05),
  // energia carregando (fusão)
  charge: () => tone([220, 262, 330, 392, 494, 587, 698, 880, 1047, 1319, 1568], 0.07, 'square', 0.05),
  // tiro de desenho antigo
  shot: () => tone([1568, 1175], 0.03, 'square', 0.04),
  // portal abrindo
  portal: () => tone([330, 440, 587, 784, 587, 440], 0.05, 'sine', 0.06),
  // palmas (high five)
  clap: () => tone([2093, 1047], 0.03, 'square', 0.07),
}

/** Toca uma sequência de sons em tempos marcados (segundos desde o começo da cena). */
export function cue(...pairs: [number, () => void][]) {
  return () => pairs.forEach(([t, f]) => setTimeout(f, t * 1000))
}
