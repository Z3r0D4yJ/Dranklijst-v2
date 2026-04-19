// Generates public/icons/icon-192.png and icon-512.png
// Run with: node scripts/generate-icons.js
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makePNG(size, drawFn) {
  // RGBA raw rows
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    row[0] = 0 // filter None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawFn(x, y, size)
      row[1 + x * 4] = r; row[2 + x * 4] = g; row[3 + x * 4] = b; row[4 + x * 4] = a
    }
    rows.push(row)
  }

  const raw = Buffer.concat(rows)
  const compressed = zlib.deflateSync(raw, { level: 9 })

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0); ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8; ihdrData[9] = 6 // RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(x, y, size) {
  const cx = size / 2, cy = size / 2, r = size / 2
  const dx = x - cx, dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const radius = size * 0.14

  // Background: circle with rounded square feel
  const inCircle = dist <= r - 1

  // "D" letter bounds
  const lx = x / size, ly = y / size
  const inD = isD(lx, ly)

  if (!inCircle) return [0, 0, 0, 0] // transparent outside

  if (inD) return [255, 255, 255, 255] // white letter

  // Gradient-ish: dark blue center → slightly lighter edge
  return [30, 58, 138, 255] // #1E3A8A
}

function isD(lx, ly) {
  // Draw a "D" shape in normalized coords [0,1]
  const cx = 0.5, cy = 0.5
  const left = 0.3, right = 0.72
  const top = 0.25, bottom = 0.75
  const stemW = 0.08
  const thick = 0.055

  // Vertical stem
  if (lx >= left && lx <= left + stemW && ly >= top && ly <= bottom) return true

  // Top bar
  if (ly >= top && ly <= top + thick && lx >= left && lx <= right - 0.08) return true
  // Bottom bar
  if (ly >= bottom - thick && ly <= bottom && lx >= left && lx <= right - 0.08) return true

  // Curved right side
  const rx = right - 0.15, ry = cy
  const rdx = lx - rx, rdy = ly - ry
  const outerR = 0.235, innerR = 0.155
  const dist2 = Math.sqrt(rdx * rdx + rdy * rdy)
  if (dist2 <= outerR && dist2 >= innerR && lx >= cx - 0.05) return true

  return false
}

const outDir = path.join(__dirname, '../public/icons')
fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const png = makePNG(size, drawIcon)
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png)
  console.log(`icon-${size}.png created`)
}

// Apple touch icon (180x180)
const applePng = makePNG(180, drawIcon)
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), applePng)
console.log('apple-touch-icon.png created')
