interface ResizeOptions {
  /** Recorta no centro e devolve um PNG quadrado de NxN (ícones dos atalhos). */
  square?: number
  /** Largura máxima, mantendo a proporção. Devolve JPEG 0,85 (banners). */
  maxWidth?: number
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem'))
    }
    image.src = url
  })

/**
 * Redimensiona no navegador e devolve um data URL, que é guardado dentro da
 * própria config — o app não tem pasta de uploads para imagens de conteúdo.
 */
export const resizeImage = async (file: File, options: ResizeOptions = {}): Promise<string> => {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível neste navegador')

  if (options.square) {
    const size = options.square
    canvas.width = size
    canvas.height = size
    // Recorte central: o lado menor vira o quadrado, sem distorcer a imagem.
    const side = Math.min(image.width, image.height)
    const offsetX = (image.width - side) / 2
    const offsetY = (image.height - side) / 2
    context.drawImage(image, offsetX, offsetY, side, side, 0, 0, size, size)
    return canvas.toDataURL('image/png')
  }

  const maxWidth = options.maxWidth || 1280
  const scale = Math.min(1, maxWidth / image.width)
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}
