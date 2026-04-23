const waitForElementImages = async (sourceElement) => {
  if (!sourceElement) return
  const images = Array.from(sourceElement.querySelectorAll('img'))
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise((resolve) => {
      const cleanup = () => {
        img.removeEventListener('load', cleanup)
        img.removeEventListener('error', cleanup)
        resolve()
      }
      img.addEventListener('load', cleanup)
      img.addEventListener('error', cleanup)
    })
  }))
}

const printDataUrl = async ({ dataUrl, title = 'Document' }) => {
  if (!dataUrl || typeof window === 'undefined' || typeof document === 'undefined') return false

  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.title = title
  document.body.appendChild(frame)

  const printWindow = frame.contentWindow
  if (!printWindow) {
    if (frame.parentNode) frame.parentNode.removeChild(frame)
    return false
  }

  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { display: flex; justify-content: center; align-items: flex-start; padding: 16px; }
  img { width: 100%; max-width: 190mm; height: auto; display: block; }
</style>
</head>
<body>
<img src="${dataUrl}" alt="${title}" />
<script>
window.onload = function () {
  setTimeout(function () {
    window.focus();
    window.print();
  }, 120);
}
</script>
</body>
</html>`)
  printWindow.document.close()

  setTimeout(() => {
    if (frame.parentNode) frame.parentNode.removeChild(frame)
  }, 1500)

  return true
}

export const printElementHtml = async ({ element, title = 'Document' }) => {
  if (!element || typeof window === 'undefined' || typeof document === 'undefined') return false

  await waitForElementImages(element)
  const html2canvasModule = await import('html2canvas')
  const html2canvas = html2canvasModule?.default || html2canvasModule
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
  })
  return await printDataUrl({ dataUrl: canvas.toDataURL('image/png'), title })
}
