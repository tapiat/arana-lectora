import { createWorker } from 'tesseract.js'

export interface OcrWord {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export async function runOcr(
  imageUrl: string,
  onProgress?: (progress: number) => void,
  lang = 'spa',
): Promise<OcrWord[]> {
  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress)
    },
  })

  try {
    const { data } = await worker.recognize(imageUrl, {}, { blocks: true })
    const words: OcrWord[] = []

    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            words.push({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
            })
          }
        }
      }
    }
    return words
  } finally {
    await worker.terminate()
  }
}