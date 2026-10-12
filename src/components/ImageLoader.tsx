import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { OcrWord } from '../lib/ocr'
import { upwardOrder } from '../lib/order'

interface Props {
  imageUrl: string | null
  words: OcrWord[]
  playKey: number
  onCount: (count: number) => void
  onImageSelected: (url: string) => void
}

const MS_PER_WORD = 40

function ImageLoader({ imageUrl, words, playKey, onCount, onImageSelected }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const boxesRef = useRef<HTMLCanvasElement>(null)
  const spiderRef = useRef<HTMLCanvasElement>(null)

  // Libera la memoria de la URL anterior cuando cambia o el componente se cierra
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  // Cajas: una por palabra, escaladas de la imagen original a la mostrada
  useEffect(() => {
    const img = imgRef.current
    if (!img) return


    const draw = () => {
      const canvas = boxesRef.current
      if (!canvas || !img.naturalWidth) return
      const w = img.clientWidth
      const h = img.clientHeight
      canvas.width = w
      canvas.height = h
      const scale = w / img.naturalWidth
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = '#7c5cff'
      ctx.lineWidth = 1
      for (const word of words) {
        const { x0, y0, x1, y1 } = word.bbox
        ctx.strokeRect(x0 * scale, y0 * scale, (x1 - x0) * scale, (y1 - y0) * scale)
      }
    }

    draw()
    img.addEventListener('load', draw)
    window.addEventListener('resize', draw)
    return () => {
      img.removeEventListener('load', draw)
      window.removeEventListener('resize', draw)
    }
  }, [words, imageUrl])

  // Araña: trepa por el texto en zigzag, con patas y un hilo de seda
  useEffect(() => {
    const img = imgRef.current
    const canvas = spiderRef.current

    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (playKey === 0 || words.length === 0 || !img.naturalWidth) return

    const w = img.clientWidth
    const h = img.clientHeight
    canvas.width = w
    canvas.height = h
    const scale = w / img.naturalWidth
    const path = upwardOrder(words)
    const center = (word: OcrWord) => ({
      x: ((word.bbox.x0 + word.bbox.x1) / 2) * scale,
      y: ((word.bbox.y0 + word.bbox.y1) / 2) * scale,
    })

    const start = performance.now()
    let frame = 0
    let lastCount = 0
    let angle = -Math.PI / 2
    const thread: { x: number; y: number }[] = []

    const drawSpider = (x: number, y: number, phase: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.strokeStyle = '#ffd400'
      ctx.fillStyle = '#ffd400'
      ctx.shadowColor = '#ffd400'
      ctx.shadowBlur = 12
      ctx.lineWidth = 1.5

      ctx.lineCap = 'round'

      // Ocho patas: cuatro por lado, con movimiento alternado
      for (const side of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
          const base = side * (Math.PI / 2 + (k - 1.5) * 0.5)
          const swing = Math.sin(phase + k * 1.6 + (side > 0 ? 0 : Math.PI)) * 0.35
          const ang = base + swing
          const kneeX = Math.cos(ang) * 9
          const kneeY = Math.sin(ang) * 9
          const tipX = kneeX + Math.cos(ang - side * 0.6) * 10
          const tipY = kneeY + Math.sin(ang - side * 0.6) * 10
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(kneeX, kneeY)
          ctx.lineTo(tipX, tipY)
          ctx.stroke()
        }
      }

      // Abdomen y cabeza
      ctx.beginPath()
      ctx.ellipse(-6, 0, 7, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(5, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const step = (now: number) => {
      const p = Math.max(0, (now - start) / MS_PER_WORD)

      const i = Math.min(path.length - 1, Math.floor(p))
      const next = Math.min(path.length - 1, i + 1)
      const frac = i === next ? 0 : p - i
      const a = center(path[i])
      const b = center(path[next])
      const x = a.x + (b.x - a.x) * frac
      const y = a.y + (b.y - a.y) * frac
      const count = i + 1

      ctx.clearRect(0, 0, w, h)

      // Palabras ya visitadas
      ctx.fillStyle = 'rgba(124, 92, 255, 0.25)'
      for (let j = 0; j < count; j++) {
        const bb = path[j].bbox
        ctx.fillRect(bb.x0 * scale, bb.y0 * scale, (bb.x1 - bb.x0) * scale, (bb.y1 - bb.y0) * scale)
      }

      // Hilo de seda
      thread.push({ x, y })
      if (thread.length > 300) thread.shift()
      ctx.beginPath()
      thread.forEach((pt, n) => (n === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)))
      ctx.strokeStyle = 'rgba(92, 200, 255, 0.6)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Giro suave hacia donde avanza
      if (Math.hypot(b.x - a.x, b.y - a.y) > 0.5) {
        const target = Math.atan2(b.y - a.y, b.x - a.x)
        let diff = target - angle
        while (diff > Math.PI) diff -= Math.PI * 2

        while (diff < -Math.PI) diff += Math.PI * 2
        angle += diff * 0.2
      }

      drawSpider(x, y, now / 45)

      if (count !== lastCount) {
        lastCount = count
        onCount(count)
      }
      if (p < path.length) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [playKey, words, onCount])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onImageSelected(URL.createObjectURL(file))
  }

  const overlay = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    pointerEvents: 'none' as const,
  }

  return (
    <div>

      <input type="file" accept="image/*" onChange={handleChange} />
      {imageUrl && (
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%',
            marginTop: 16,
          }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Imagen cargada"
            style={{ display: 'block', maxWidth: '100%' }}
          />
          <canvas ref={boxesRef} style={overlay} />
          <canvas ref={spiderRef} style={overlay} />
        </div>
      )}
    </div>
  )
}

export default ImageLoader