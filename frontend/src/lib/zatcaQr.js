const encoder = new TextEncoder()

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
    encodeTlvField(4, Number(totalWithVat || 0).toFixed(2)),
    encodeTlvField(5, Number(vatTotal || 0).toFixed(2)),
  ]

  return bytesToBase64(fields.flat())
}
