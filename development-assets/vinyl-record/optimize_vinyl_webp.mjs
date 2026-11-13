/**
 * optimize_vinyl_webp.mjs
 * Rewrites the master vinyl GLB with WebP textures (EXT_texture_webp) at per-map sizes.
 * Geometry, node names, materials and the centred pivot are copied unchanged.
 *
 * Run from the project root:
 *   node development-assets/vinyl-record/optimize_vinyl_webp.mjs [output.glb]
 *
 * The source is the 1024px PNG model, so the textures keep their exact pixels and size.
 * Encoding the 2048px master down again visibly softened the grooves.
 *
 * Why per-map settings:
 * - Normal maps encode vectors. Near-lossless keeps the groove detail without the
 *   chroma bleed that normal lossy WebP would add between the X and Y channels.
 * - Roughness/metal maps store data in G and B, so they also avoid chroma subsampling.
 * - The vinyl base colour is almost flat black and needs very little resolution.
 */
import fs from 'node:fs'
import sharp from 'sharp'

const SOURCE = 'public/models/vinyl-record-opt.glb'
const OUTPUT = process.argv[2] || 'public/models/vinyl-record-web.glb'

// Sharp's near-lossless quality: 100 is lossless, lower allows more preprocessing. At 80 the
// rendered disc differs from the PNG model by 0.11/255 on average, and the grooves are intact.
const NORMAL_QUALITY = Number(process.env.NORMAL_QUALITY || 80)
const DATA_QUALITY = Number(process.env.DATA_QUALITY || 80)

const TEXTURE_SETTINGS = {
  vinyl_normal: { webp: { nearLossless: true, quality: NORMAL_QUALITY, effort: 6 } },
  vinyl_basecolor: { size: 128, webp: { quality: 90, effort: 6 } },
  vinyl_roughness: { webp: { nearLossless: true, quality: DATA_QUALITY, effort: 6 } },
  gold_label_normal: { webp: { nearLossless: true, quality: 80, effort: 6 } },
  gold_label_basecolor: { webp: { quality: 90, effort: 6, smartSubsample: true } },
  gold_label_roughness: { webp: { nearLossless: true, quality: 80, effort: 6 } }
}

const align4 = (n) => (n + 3) & ~3

function readGlb(path) {
  const file = fs.readFileSync(path)
  if (file.toString('utf8', 0, 4) !== 'glTF') throw new Error(`${path} is not a GLB file`)
  const jsonLength = file.readUInt32LE(12)
  const json = JSON.parse(file.toString('utf8', 20, 20 + jsonLength))
  const binStart = 20 + jsonLength + 8
  return { json, bin: file.subarray(binStart, binStart + file.readUInt32LE(20 + jsonLength)) }
}

function writeGlb(path, json, bin) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonPad = Buffer.alloc(align4(jsonBytes.length) - jsonBytes.length, 0x20)
  const binPad = Buffer.alloc(align4(bin.length) - bin.length, 0)
  const total = 12 + 8 + jsonBytes.length + jsonPad.length + 8 + bin.length + binPad.length

  const header = Buffer.alloc(12)
  header.write('glTF', 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(total, 8)

  const chunk = (length, type) => {
    const b = Buffer.alloc(8)
    b.writeUInt32LE(length, 0)
    b.write(type, 4)
    return b
  }

  fs.writeFileSync(path, Buffer.concat([
    header,
    chunk(jsonBytes.length + jsonPad.length, 'JSON'), jsonBytes, jsonPad,
    chunk(bin.length + binPad.length, 'BIN\0'), bin, binPad
  ]))
}

const { json, bin } = readGlb(SOURCE)
const imageViews = new Set(json.images.map((image) => image.bufferView))
const encoded = new Map()

for (const image of json.images) {
  const key = image.name.replace(/_opt$/, '')
  const settings = TEXTURE_SETTINGS[key]
  if (!settings) throw new Error(`No texture settings for image "${image.name}"`)
  const view = json.bufferViews[image.bufferView]
  const source = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength)
  let pipeline = sharp(source)
  if (settings.size) pipeline = pipeline.resize(settings.size, settings.size, { kernel: 'lanczos3' })
  const output = await pipeline.removeAlpha().webp(settings.webp).toBuffer()
  encoded.set(image.bufferView, output)
  console.log(`${image.name.padEnd(26)} ${String(view.byteLength).padStart(8)} -> ${String(output.length).padStart(8)} bytes`)
}

// Rebuild the binary chunk: geometry bytes unchanged, images swapped.
const parts = []
let offset = 0
json.bufferViews.forEach((view, index) => {
  const data = imageViews.has(index)
    ? encoded.get(index)
    : bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength)
  const padding = align4(offset) - offset
  if (padding) parts.push(Buffer.alloc(padding, 0))
  offset += padding
  view.byteOffset = offset
  view.byteLength = data.length
  parts.push(data)
  offset += data.length
})
const newBin = Buffer.concat(parts)

for (const image of json.images) image.mimeType = 'image/webp'
for (const texture of json.textures) {
  texture.extensions = { ...texture.extensions, EXT_texture_webp: { source: texture.source } }
  delete texture.source
}
json.extensionsUsed = [...new Set([...(json.extensionsUsed || []), 'EXT_texture_webp'])]
json.extensionsRequired = [...new Set([...(json.extensionsRequired || []), 'EXT_texture_webp'])]
json.buffers[0].byteLength = newBin.length

writeGlb(OUTPUT, json, newBin)
console.log(`${SOURCE} ${fs.statSync(SOURCE).size} bytes -> ${OUTPUT} ${fs.statSync(OUTPUT).size} bytes`)
