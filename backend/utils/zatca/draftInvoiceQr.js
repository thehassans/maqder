import ZatcaService from './ZatcaService.js'

const qrService = new ZatcaService()

export async function buildDraftInvoiceQr({ seller, issueDate, grandTotal, totalTax }) {
  const sellerName = seller?.legalNameAr || seller?.legalNameEn || seller?.nameAr || seller?.name || ''
  const vatNumber = seller?.vatNumber || ''
  const timestamp = new Date(issueDate || new Date()).toISOString()
  const totalWithVat = Number(grandTotal || 0).toFixed(2)
  const vatTotal = Number(totalTax || 0).toFixed(2)

  const qrCodeData = qrService.generateTLV({
    sellerName,
    vatNumber,
    timestamp,
    totalWithVat,
    vatTotal,
  })

  const qrCodeImage = await qrService.generateQRCode(qrCodeData)

  return {
    qrCodeData,
    qrCodeImage,
    submissionStatus: 'pending',
  }
}
