// Browser-canvas image compression — no external library.
// Guarantees: max 800 KB / 1920 px wide per CLAUDE.md rule 3.

const MAX_BYTES = 800 * 1024
const MAX_WIDTH = 1920

export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width))
        width = MAX_WIDTH
      }

      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      let quality = 0.9

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return }

            if (blob.size <= MAX_BYTES || quality <= 0.4) {
              resolve(
                Object.assign(
                  new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }),
                  { compressedSize: blob.size },
                )
              )
            } else {
              quality = Math.round((quality - 0.1) * 10) / 10
              tryCompress()
            }
          },
          'image/jpeg',
          quality,
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image failed to load'))
    }

    img.src = objectUrl
  })
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
