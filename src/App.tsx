import { useState } from 'react'
import ImageLoader from './components/ImageLoader'
import { runOcr } from './lib/ocr'
import type { OcrWord } from './lib/ocr'

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [words, setWords] = useState<OcrWord[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [spiderCount, setSpiderCount] = useState(0)

  const handleRead = async () => {
    if (!imageUrl) return
    setLoading(true)
    setError(null)
    setProgress(0)
    setPlayKey(0)
    setSpiderCount(0)
    try {
      setWords(await runOcr(imageUrl, setProgress))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido en el OCR')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelected = (url: string) => {
    setImageUrl(url)
    setWords([])
    setPlayKey(0)
    setSpiderCount(0)
  }

  const handleSpider = () => {
    setSpiderCount(0)
    setPlayKey((k) => k + 1)
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Araña Lectora</h1>
      <ImageLoader
        imageUrl={imageUrl}
        words={words}
        playKey={playKey}
        onCount={setSpiderCount}
        onImageSelected={handleImageSelected}
      />

      {imageUrl && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleRead} disabled={loading}>
            {loading ? 'Leyendo...' : 'Leer texto'}
          </button>
          <button onClick={handleSpider} disabled={loading || words.length === 0}>
            Soltar la araña
          </button>
          {loading && <span>{Math.round(progress * 100)}%</span>}
          {words.length > 0 && (
            <span>
              Palabras: {spiderCount} / {words.length}
            </span>
          )}
        </div>
      )}

      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
    </main>
  )
}

export default App