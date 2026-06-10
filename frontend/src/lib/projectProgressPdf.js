const sanitizeFileName = (value) => {
  return String(value || 'project_progress')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export const downloadProjectProgressPdf = async ({ elementId = 'project-report-container', filename = 'project_report' }) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Report container not found in DOM')

    // Dynamically import to avoid large bundle size
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule?.default || html2canvasModule
    
    const jspdfModule = await import('jspdf')
    const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule

    // Store original styles to restore later
    const originalStyle = element.style.cssText
    
    // Force a specific width so the PDF looks standard A4-ish
    element.style.width = '1000px'
    element.style.maxWidth = '1000px'
    element.style.padding = '20px'
    element.style.backgroundColor = '#ffffff' // Ensure white background

    // Hide any buttons inside the report using a class
    const noPrintElements = element.querySelectorAll('.no-print')
    noPrintElements.forEach(el => el.style.display = 'none')

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Restore original styles
    element.style.cssText = originalStyle
    noPrintElements.forEach(el => el.style.display = '')

    const imgData = canvas.toDataURL('image/png')
    
    // A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    
    // If the content is longer than one page, add new pages
    let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight()
    let position = 0

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
    }

    const safeName = sanitizeFileName(filename) || 'project'
    pdf.save(`${safeName}_report.pdf`)
  } catch (error) {
    console.error('PDF Generation Error:', error)
    throw error
  }
}
