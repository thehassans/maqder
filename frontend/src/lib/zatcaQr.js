const encoder = new TextEncoder()

const toNumber = (value, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const encodeTlvField = (tag, value) => {
  const buffer = encoder.encode(String(value || ''))
  return [tag, buffer.length, ...buffer]
}

const bytesToBase64 = (bytes) => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export const generateZatcaQrValue = ({ sellerName, vatNumber, timestamp, totalWithVat, vatTotal }) => {
  const fields = [
    encodeTlvField(1, sellerName || ''),
    encodeTlvField(2, vatNumber || ''),
    encodeTlvField(3, timestamp || new Date().toISOString()),
    encodeTlvField(4, toNumber(totalWithVat).toFixed(2)),
    encodeTlvField(5, toNumber(vatTotal).toFixed(2)),
  ]

  return bytesToBase64(fields.flat())
}
