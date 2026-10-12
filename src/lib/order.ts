import type { OcrWord } from './ocr'

// Agrupa las palabras por línea y las ordena de abajo hacia arriba.
// Dentro de cada línea van de izquierda a derecha.
export function upwardOrder(words: OcrWord[]): OcrWord[] {
  const centerY = (w: OcrWord) => (w.bbox.y0 + w.bbox.y1) / 2
  const sorted = [...words].sort((a, b) => centerY(a) - centerY(b))

  const lines: OcrWord[][] = []
  for (const w of sorted) {
    const last = lines[lines.length - 1]
    const height = w.bbox.y1 - w.bbox.y0
    if (last && Math.abs(centerY(w) - centerY(last[0])) < height * 0.6) {
      last.push(w)
    } else {
      lines.push([w])
    }
  }

    return lines.reverse().flatMap((line, i) => {
    const ordered = line.sort((a, b) => a.bbox.x0 - b.bbox.x0)
    return i % 2 === 0 ? ordered : ordered.reverse()
  })
}