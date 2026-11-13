/**
 * make_cassette_labels.mjs
 * Draws the front and back faces of five 90s mix-tapes into one texture atlas, one per
 * playlist mood, with handwritten-style Devanagari titles.
 *
 * Text goes through sharp's SVG renderer (librsvg + Pango), which shapes Devanagari
 * correctly. Blender's own text objects do not: matras and conjuncts come out broken.
 * The fonts are Windows system fonts (Kokila, Utsaah, Nirmala UI), rendered to pixels.
 *
 * Run from the project root:
 *   node development-assets/studio-scene/make_cassette_labels.mjs
 * Output: development-assets/studio-scene/textures/cassette_atlas.png (2048 x 3225)
 *
 * Atlas layout: a 2 x 5 grid of 1024 x 645 cells, the 100 x 63 mm shape of a cassette
 * face, so text is not stretched on the model. Row i holds tape i: front face on the
 * left, back face on the right. generate_studio_scene.py maps UVs to the same cells.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const OUT_DIR = 'development-assets/studio-scene/textures'
const CELL_W = 1024
const CELL_H = 645
const WIDTH = CELL_W * 2
const HEIGHT = CELL_H * 5

// Shell colours and label inks are period cassette brands in spirit only: no real logos.
const TAPES = [
  { title: '90s की बोतल', sub: 'किशोर • सानू • रफ़ी', shell: '#1d1a17', label: '#efe2c4', ink: '#2a3a7a', stripe: '#b8894a', side: 'A' },
  { title: 'दर्द-ए-दिल', sub: 'टूटे दिल की महफ़िल', shell: '#3a1712', label: '#f1e6cf', ink: '#7c2d24', stripe: '#7c2d24', side: 'B' },
  { title: 'महफ़िल', sub: 'ग़ज़ल • जगजीत सिंह', shell: '#22201c', label: '#e9dcbc', ink: '#1f2a52', stripe: '#c8a35a', side: 'A' },
  { title: 'बारिश और यादें', sub: 'मानसून के नग़मे', shell: '#16211f', label: '#e6ead8', ink: '#244a44', stripe: '#5f8a7a', side: 'A' },
  { title: 'रात का नशा', sub: 'आधी रात के क्लासिक्स', shell: '#120f18', label: '#e8dfcf', ink: '#3b2a6a', stripe: '#8a6fb8', side: 'B' }
]

const HAND = "Kokila, Utsaah, 'Nirmala UI', sans-serif"

function windows(w, h, ink) {
  // Two reel windows with visible brown tape and white hubs, like the real thing.
  const reels = [0.31, 0.69].map((cx) => {
    const x = w * cx, y = h * 0.62, r = h * 0.17
    return `
      <circle cx="${x}" cy="${y}" r="${r}" fill="#3b2416"/>
      <circle cx="${x}" cy="${y}" r="${r * 0.56}" fill="#5a3a24"/>
      <circle cx="${x}" cy="${y}" r="${r * 0.34}" fill="#e9e4d8"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="${x - 3}" y="${y - r * 0.34}" width="6" height="${r * 0.16}" fill="#9a958a" transform="rotate(${a} ${x} ${y})"/>`).join('')}
      <circle cx="${x}" cy="${y}" r="${r * 0.1}" fill="#1a1612"/>`
  }).join('')
  return `
    <rect x="${w * 0.2}" y="${h * 0.47}" width="${w * 0.6}" height="${h * 0.3}" rx="${h * 0.05}" fill="#0b0908" stroke="${ink}" stroke-opacity="0.25" stroke-width="3"/>
    ${reels}
    <rect x="${w * 0.2}" y="${h * 0.47}" width="${w * 0.6}" height="${h * 0.3}" rx="${h * 0.05}" fill="url(#glass)"/>`
}

function face(tape, back) {
  const w = CELL_W, h = CELL_H
  const screws = [[0.05, 0.08], [0.95, 0.08], [0.05, 0.92], [0.95, 0.92], [0.5, 0.92]]
    .map(([x, y]) => `<circle cx="${w * x}" cy="${h * y}" r="9" fill="#6f6a62"/><line x1="${w * x - 6}" y1="${h * y}" x2="${w * x + 6}" y2="${h * y}" stroke="#2b2824" stroke-width="2"/>`).join('')
  const ruled = [0.3, 0.38].map((y) => `<line x1="${w * 0.12}" y1="${h * y}" x2="${w * 0.88}" y2="${h * y}" stroke="${tape.ink}" stroke-opacity="0.18" stroke-width="2"/>`).join('')
  const title = back ? tape.sub : tape.title
  const side = back ? (tape.side === 'A' ? 'B' : 'A') : tape.side
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.06"/>
      </linearGradient>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${back ? 7 : 3}"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.10 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="${tape.shell}"/>
    <rect x="${w * 0.07}" y="${h * 0.12}" width="${w * 0.86}" height="${h * 0.72}" rx="10" fill="${tape.label}"/>
    <rect x="${w * 0.07}" y="${h * 0.12}" width="${w * 0.86}" height="${h * 0.72}" rx="10" filter="url(#paper)"/>
    <rect x="${w * 0.07}" y="${h * 0.12}" width="${w * 0.86}" height="${h * 0.055}" fill="${tape.stripe}"/>
    ${ruled}
    <text x="${w * 0.13}" y="${h * 0.355}" font-family="${HAND}" font-style="italic" font-size="${h * 0.15}" fill="${tape.ink}">${title}</text>
    <text x="${w * 0.86}" y="${h * 0.3}" font-family="Georgia, serif" font-size="${h * 0.11}" font-weight="bold" fill="${tape.stripe}" text-anchor="end">${side}</text>
    <text x="${w * 0.13}" y="${h * 0.44}" font-family="Georgia, serif" font-size="${h * 0.036}" letter-spacing="3" fill="${tape.ink}" fill-opacity="0.55">KAANCH KE THEKE · C-90</text>
    ${windows(w, h, tape.ink)}
    <rect x="${w * 0.3}" y="${h * 0.86}" width="${w * 0.4}" height="${h * 0.1}" fill="${tape.shell}" stroke="#000" stroke-opacity="0.4" stroke-width="3"/>
    ${screws}
  </svg>`
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const tiles = []
for (let i = 0; i < TAPES.length; i++) {
  for (const back of [false, true]) {
    tiles.push({
      input: await sharp(Buffer.from(face(TAPES[i], back))).resize(CELL_W, Math.round(CELL_H)).png().toBuffer(),
      left: back ? CELL_W : 0,
      top: Math.round(i * CELL_H)
    })
  }
}
const out = path.join(OUT_DIR, 'cassette_atlas.png')
await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#111' } }).composite(tiles).png().toFile(out)
console.log('wrote', out)
