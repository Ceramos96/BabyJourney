import { useState } from 'react'
import { compressImage, formatFileSize } from '../lib/compress.js'

export function useImageCompress() {
  const [compressing, setCompressing] = useState(false)
  const [compressedSize, setCompressedSize] = useState(null)

  const compress = async (file) => {
    setCompressing(true)
    setCompressedSize(null)
    try {
      const result = await compressImage(file)
      setCompressedSize(formatFileSize(result.compressedSize ?? result.size))
      return result
    } finally {
      setCompressing(false)
    }
  }

  return { compress, compressing, compressedSize }
}
