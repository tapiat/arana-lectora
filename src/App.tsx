import { useState } from 'react'
import ImageLoader from './components/ImageLoader'

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  return (
    <main style={{ padding: 24 }}>
      <h1>Araña Lectora</h1>
      <ImageLoader imageUrl={imageUrl} onImageSelected={setImageUrl} />
    </main>
  )
}

export default App