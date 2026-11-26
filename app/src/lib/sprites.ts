// Motor de sprites 8-bit. Cada camada é uma matriz de caracteres (20×22);
// cada caractere aponta pra uma cor fixa ou dinâmica (pele, cabelo, roupa…).
// '.' = transparente. As ids de itens batem com public.shop_items.

export const GRID_W = 20
export const GRID_H = 22

export type Slot = 'hat' | 'face' | 'outfit' | 'held' | 'pet' | 'bg'
export const SLOTS: Slot[] = ['hat', 'face', 'outfit', 'held', 'pet', 'bg']

export type Avatar = {
  skin: number
  hairStyle: number
  hairColor: number
  eyes: number
  shirt: number
  pants: number
} & Partial<Record<Slot, string | null>>

export const SKIN = ['#fcd8a8', '#f0b888', '#d89060', '#a86838', '#7c4820', '#4c2c14']
export const HAIR_COLORS = ['#181020', '#503000', '#a84c10', '#f8b800', '#d82800', '#f878f8', '#0078f8', '#e8e8e8']
export const SHIRT = ['#d82800', '#0078f8', '#00a844', '#f8b800', '#6844fc', '#f87858', '#3a3046', '#fcfcfc']
export const PANTS = ['#004058', '#242424', '#503000', '#7c7c7c', '#881400', '#0058f8']
export const HAIR_NAMES = ['Curto', 'Espetado', 'Comprido', 'Tigela', 'Moicano', 'Rabo', 'Careca']
export const EYE_NAMES = ['Normal', 'Brilhando', 'Sono', 'Bravo']

const FIXED: Record<string, string> = {
  k: '#181020',
  e: '#181020',
  w: '#fcfcfc',
  m: '#a83c3c',
  Y: '#f8b800',
  y: '#ac7c00',
  R: '#d82800',
  r: '#881400',
  C: '#0078f8',
  G: '#bcbcbc',
  g: '#7c7c7c',
  D: '#2c2c34',
  V: '#6844fc',
  v: '#4428bc',
  O: '#e45c10',
  o: '#a03c00',
  L: '#58d854',
  l: '#00a800',
  N: '#00a844',
  B: '#6c4410',
  M: '#5c3418',
  F: '#fca044',
}

export function shade(hex: string, f = 0.72): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

type Layer = Record<number, string>

// ───── corpo base ─────
const BODY: Layer = {
  4: '......kkkkkkkk',
  5: '.....kSSSSSSSSk',
  6: '.....kSSSSSSSSk',
  7: '.....kSSSSSSSSk',
  8: '.....kSSSSSSSSk',
  9: '.....kSSSSSSSsk',
  10: '.....ksSSSSSSsk',
  11: '......kksssskk',
  12: '.....kkTTTTTTkk',
  13: '....kTTTTTTTTTtk',
  14: '....kSkTTTTTTkSk',
  15: '....kSkTTTTTtkSk',
  16: '....kkkUUUUUUkkk',
  17: '......kUUUUUUk',
  18: '......kUUkkUuk',
  19: '......kuUkkUuk',
  20: '......kDDkkDDk',
  21: '......kkkkkkkk',
}

const MOUTH: Layer = { 10: '.........mm' }

const EYES: Layer[] = [
  { 7: '........e..e', 8: '........e..e' },
  { 7: '.......ew..ew', 8: '.......ee..ee' },
  { 8: '.......ee..ee' },
  { 7: '.......e....e', 8: '........e..e' },
]

const HAIR: Layer[] = [
  // curto
  {
    2: '......kkkkkkkk',
    3: '.....kHHHHHHHHk',
    4: '....kHHHHHHHHHHk',
    5: '....kHHHHHHHHHhk',
    6: '....kHh......hHk',
  },
  // espetado
  {
    1: '......k.k..k.k',
    2: '.....kHkHkkHkHk',
    3: '....kHHHHHHHHHHk',
    4: '....kHHHHHHHHHHk',
    5: '....kHHHHHHHHHhk',
    6: '....kHh......hHk',
  },
  // comprido
  {
    2: '......kkkkkkkk',
    3: '.....kHHHHHHHHk',
    4: '....kHHHHHHHHHHk',
    5: '....kHHHHHHHHHhk',
    6: '....kHh......hHk',
    7: '....kH........Hk',
    8: '....kH........Hk',
    9: '....kH........hk',
    10: '....kh........hk',
    11: '....kH........Hk',
    12: '....kh........hk',
    13: '....kk........kk',
  },
  // tigela
  {
    2: '......kkkkkkkk',
    3: '.....kHHHHHHHHk',
    4: '....kHHHHHHHHHHk',
    5: '....kHHHHHHHHHHk',
    6: '....kHHHHHHHHHhk',
    7: '....kHk......kHk',
  },
  // moicano
  {
    0: '........kkkk',
    1: '.......kHHHHk',
    2: '.......kHHHhk',
    3: '.......kHHHhk',
    4: '........HHHh',
  },
  // rabo de cavalo
  {
    2: '......kkkkkkkk',
    3: '.....kHHHHHHHHk',
    4: '....kHHHHHHHHHHkk',
    5: '....kHHHHHHHHHhkHk',
    6: '....kHh......hHkHhk',
    7: '................kHk',
    8: '................kk',
  },
  // careca
  {},
]

type ItemSprite = { layer: Layer; behind?: boolean }

export const ITEM_SPRITES: Record<string, ItemSprite> = {
  // chapéus
  crown: {
    layer: {
      0: '......k..kk..k',
      1: '.....kYkkYYkkYk',
      2: '.....kYYYYYYYYk',
      3: '.....kYRYYYYRYk',
      4: '.....kyyyyyyyyk',
    },
  },
  cap: {
    layer: {
      2: '......kkkkkkk',
      3: '.....kRRRwRRRk',
      4: '....kRRRRRRRRRRRRk',
      5: '....kkkkkkkkkkrrrk',
    },
  },
  wizard: {
    layer: {
      0: '..........kk',
      1: '.........kVk',
      2: '........kVVvk',
      3: '.......kVYVVvk',
      4: '...kVVVVVVVVVVVVvk',
      5: '...kkkkkkkkkkkkkkk',
    },
  },
  viking: {
    layer: {
      1: '...kk..........kk',
      2: '...kwk.kkkkkk.kwk',
      3: '...kwkkGGGGGGkkwk',
      4: '....kkGGGGGGGGkk',
      5: '.....kggggggggk',
    },
  },
  headset: {
    layer: {
      3: '.....kkkkkkkkkk',
      4: '....kDk......kDk',
      5: '....kDk......kDk',
      6: '...kRRk......kRRk',
      7: '...kRRk......kRRk',
      8: '....kDk',
      9: '....kDk',
      10: '.....kDDR',
    },
  },
  halo: {
    layer: {
      0: '......kkkkkkkk',
      1: '.....kYYYYYYYYk',
      2: '......kkkkkkkk',
    },
  },
  // rosto
  shades: {
    layer: {
      7: '.....kkkkkkkkkk',
      8: '......kwDkkwDk',
      9: '.......kk..kk',
    },
  },
  eyepatch: {
    layer: {
      6: '..........kkkk',
      7: '......kDDDk',
      8: '......kDDDk',
      9: '.......kkk',
    },
  },
  mustache: {
    layer: {
      9: '.......MMMMMM',
      10: '.......M....M',
    },
  },
  glasses3d: {
    layer: {
      7: '......kkkkkkkk',
      8: '......kRRkkCCk',
    },
  },
  // roupas
  hoodie: {
    layer: {
      11: '......kOk..kOk',
      12: '.....kOOOOOOOOk',
      13: '....kOOOOwwOOOok',
      14: '.......OOOOOO',
      15: '.......OkkkkO',
    },
  },
  jersey: {
    layer: {
      12: '.......NNNNNN',
      13: '.....NNNNNNNNNN',
      14: '.......NwNwwN',
      15: '.......NwNwwN',
    },
  },
  tux: {
    layer: {
      12: '.......DwRRwD',
      13: '.....DDDDwwDDDD',
      14: '.......DDwwDD',
      15: '.......DDwwDD',
    },
  },
  cape: {
    behind: true,
    layer: {
      12: '...kRR........RRk',
      13: '..kRR..........RRk',
      14: '..kRR..........RRk',
      15: '..kRR..........RRk',
      16: '..kRR..........RRk',
      17: '..kRRr........rRRk',
      18: '..kRRr........rRRk',
      19: '..kRRr........rRRk',
      20: '..kkkkk......kkkkk',
    },
  },
  armor: {
    layer: {
      12: '.....kGGGGGGGGk',
      13: '....kGwGGGGGGgGk',
      14: '.......GgGGgG',
      15: '.......GGGGGG',
      16: '.......YYYYYY',
    },
  },
  // na mão
  controller: {
    layer: {
      14: '.............kkkkkkk',
      15: '.............kDRDCDk',
      16: '.............kkk.kkk',
    },
  },
  sword: {
    layer: {
      5: '................k',
      6: '...............kGk',
      7: '...............kwk',
      8: '...............kGk',
      9: '...............kGk',
      10: '...............kGk',
      11: '...............kGk',
      12: '...............kGk',
      13: '..............kYYYk',
      14: '...............kBk',
      15: '...............kBk',
      16: '................k',
    },
  },
  trophy: {
    layer: {
      9: '..............kkkkkk',
      10: '..............kYYwYk',
      11: '..............kYYYYk',
      12: '...............kYYk',
      13: '................Yk',
      14: '...............kYYk',
      15: '..............kyyyyk',
    },
  },
  torch: {
    layer: {
      8: '................R',
      9: '...............RFR',
      10: '...............RYR',
      11: '...............kYk',
      12: '...............kBk',
      13: '...............kBk',
      14: '...............kBk',
      15: '...............kBk',
    },
  },
  // pets
  heart: {
    layer: {
      10: '.R.R.',
      11: 'RwRRR',
      12: 'RRRRR',
      13: '.RRR.',
      14: '..R..',
    },
  },
  cat: {
    layer: {
      16: 'k...k',
      17: 'OkkkO',
      18: 'OeOeO',
      19: 'OOwOO',
      20: 'OOOOOk',
      21: 'O.O.Ok',
    },
  },
  slime: {
    layer: {
      17: '..kk',
      18: '.kLwk',
      19: 'kLLLLk',
      20: 'kLeLek',
      21: 'kkkkkk',
    },
  },
  ghost: {
    layer: {
      15: '.kkk.',
      16: 'kwwwk',
      17: 'kewek',
      18: 'kwwwk',
      19: 'kwwwk',
      20: 'kwkwk',
    },
  },
  dragon: {
    layer: {
      15: 'R...R.',
      16: 'RRkkRR',
      17: '.kLLk.',
      18: 'kLeLLk',
      19: 'kLLLwk',
      20: '.kLLk',
      21: '.k.k',
    },
  },
}

// ───── cenários: geram a matriz inteira ─────
type Grid = (string | null)[][]

function fill(grid: Grid, color: string, r0 = 0, r1 = GRID_H - 1) {
  for (let r = r0; r <= r1; r++) for (let c = 0; c < GRID_W; c++) grid[r][c] = color
}

const BACKGROUNDS: Record<string, (g: Grid) => void> = {
  default: (g) => fill(g, '#a4e4fc'),
  sunset: (g) => {
    fill(g, '#881400', 0, 4)
    fill(g, '#e45c10', 5, 9)
    fill(g, '#f8b800', 10, 14)
    fill(g, '#fca044', 15, 21)
    for (const [r, c] of [[12, 1], [12, 2], [13, 1], [13, 2], [13, 3], [14, 1], [14, 2], [14, 3]]) g[r][c] = '#fcfcfc'
  },
  starfield: (g) => {
    fill(g, '#0f0e2a')
    const stars = [[1, 2], [3, 17], [6, 1], [9, 18], [2, 10], [15, 2], [18, 17], [12, 0], [20, 4], [0, 15], [7, 19]]
    stars.forEach(([r, c], i) => (g[r][c] = i % 3 === 0 ? '#f8b800' : '#fcfcfc'))
  },
  arcade: (g) => {
    fill(g, '#181020', 0, 14)
    fill(g, '#2c1444', 15, 21)
    for (let c = 0; c < GRID_W; c++) g[15][c] = '#f878f8'
    for (let r = 16; r < GRID_H; r++) for (let c = 0; c < GRID_W; c += 3) g[r][c] = '#a03ca0'
    for (const c of [0, 2, 17, 19]) for (let r = 2; r < 14; r += 2) g[r][c] = '#00e8d8'
  },
  castle: (g) => {
    fill(g, '#8c8c94')
    for (let r = 0; r < GRID_H; r += 3) for (let c = 0; c < GRID_W; c++) g[r][c] = '#5c5c64'
    for (let r = 0; r < GRID_H; r++) {
      const off = Math.floor(r / 3) % 2 === 0 ? 0 : 2
      if (r % 3 !== 0) for (let c = off; c < GRID_W; c += 4) g[r][c] = '#5c5c64'
    }
    fill(g, '#3c3c44', 20, 21)
  },
  stage: (g) => {
    fill(g, '#181020')
    for (let r = 0; r < GRID_H; r++) {
      const spread = Math.floor(r / 3)
      for (let c = 9 - spread; c <= 10 + spread; c++) if (c >= 0 && c < GRID_W) g[r][c] = '#3c3046'
    }
    for (let r = 0; r < GRID_H; r++) {
      g[r][0] = '#d82800'; g[r][1] = r % 2 ? '#881400' : '#d82800'
      g[r][18] = r % 2 ? '#881400' : '#d82800'; g[r][19] = '#d82800'
    }
    for (let c = 0; c < GRID_W; c++) { g[0][c] = '#d82800'; g[21][c] = '#6c4410' }
  },
}

function paint(grid: Grid, layer: Layer, dyn: Record<string, string>) {
  for (const key in layer) {
    const r = Number(key)
    const row = layer[r]
    for (let c = 0; c < row.length && c < GRID_W; c++) {
      const ch = row[c]
      if (ch === '.' || ch === ' ') continue
      const color = dyn[ch] ?? FIXED[ch]
      if (color && r >= 0 && r < GRID_H) grid[r][c] = color
    }
  }
}

export function composeGrid(a: Avatar, opts: { transparent?: boolean } = {}): Grid {
  const grid: Grid = Array.from({ length: GRID_H }, () => Array<string | null>(GRID_W).fill(null))
  const skin = SKIN[a.skin] ?? SKIN[0]
  const hair = HAIR_COLORS[a.hairColor] ?? HAIR_COLORS[0]
  const shirt = SHIRT[a.shirt] ?? SHIRT[0]
  const pants = PANTS[a.pants] ?? PANTS[0]
  const dyn: Record<string, string> = {
    S: skin, s: shade(skin, 0.82),
    H: hair, h: shade(hair, 0.7),
    T: shirt, t: shade(shirt),
    U: pants, u: shade(pants),
  }

  if (!opts.transparent) (BACKGROUNDS[a.bg ?? 'default'] ?? BACKGROUNDS.default)(grid)

  const items = (['outfit', 'pet', 'held', 'face', 'hat'] as Slot[])
    .map((s) => a[s])
    .filter((id): id is string => !!id && !!ITEM_SPRITES[id])
    .map((id) => ITEM_SPRITES[id])

  items.filter((i) => i.behind).forEach((i) => paint(grid, i.layer, dyn))
  paint(grid, BODY, dyn)
  paint(grid, EYES[a.eyes] ?? EYES[0], dyn)
  paint(grid, MOUTH, dyn)
  const outfit = a.outfit && ITEM_SPRITES[a.outfit]
  if (outfit && !outfit.behind) paint(grid, outfit.layer, dyn)
  paint(grid, HAIR[a.hairStyle] ?? HAIR[0], dyn)
  for (const s of ['face', 'hat', 'held', 'pet'] as Slot[]) {
    const id = a[s]
    if (id && ITEM_SPRITES[id]) paint(grid, ITEM_SPRITES[id].layer, dyn)
  }
  return grid
}

/** Retângulos agrupados por linha (menos nós no SVG). */
export function gridToRects(grid: Grid) {
  const rects: { x: number; y: number; w: number; fill: string }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = row[x]
      if (!color) { x++; continue }
      let w = 1
      while (x + w < row.length && row[x + w] === color) w++
      rects.push({ x, y, w, fill: color })
      x += w
    }
  })
  return rects
}

export const DEFAULT_AVATAR: Avatar = {
  skin: 1, hairStyle: 0, hairColor: 1, eyes: 0, shirt: 0, pants: 0,
  hat: null, face: null, outfit: null, held: null, pet: null, bg: null,
}

export function randomAvatar(keepItems?: Avatar): Avatar {
  const pick = (n: number) => Math.floor(Math.random() * n)
  return {
    ...(keepItems ?? DEFAULT_AVATAR),
    skin: pick(SKIN.length),
    hairStyle: pick(HAIR.length),
    hairColor: pick(HAIR_COLORS.length),
    eyes: pick(EYES.length),
    shirt: pick(SHIRT.length),
    pants: pick(PANTS.length),
  }
}

export const HAIR_COUNT = HAIR.length
export const EYE_COUNT = EYES.length

export const SLOT_LABEL: Record<Slot, string> = {
  hat: 'Cabeça',
  face: 'Rosto',
  outfit: 'Roupa',
  held: 'Na mão',
  pet: 'Parceiro',
  bg: 'Cenário',
}

export const RARITY: Record<string, { label: string; color: string }> = {
  comum: { label: 'Comum', color: '#5c5c64' },
  raro: { label: 'Raro', color: '#0078f8' },
  epico: { label: 'Épico', color: '#a03ca0' },
  lendario: { label: 'Lendário', color: '#c84c0c' },
}
