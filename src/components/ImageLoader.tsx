import { useEffect } from 'react'
import type { ChangeEvent } from 'react'

interface Props {
  imageUrl: string | null
  onImageSelected: (url: string) => void
}

function ImageLoader({ imageUrl, onImageSelected }: Props) {
  // Libera la memoria de la URL anterior cuando cambia o el componente se cierra
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onImageSelected(URL.createObjectURL(file))
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Imagen cargada"
          style={{ display: 'block', maxWidth: '100%', marginTop: 16 }}
        />
      )}
    </div>
  )
}

export default ImageLoader