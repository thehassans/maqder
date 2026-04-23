// Saudi National ID / Iqama validation — mirror of backend/utils/saudiId.js
// so form fields can validate instantly in the browser.
//
// Rules: 10 digits, starts with 1 (Saudi) or 2 (Iqama), Luhn-style checksum
// where odd-positioned digits are doubled and digit-split before summing.

export const SAUDI_ID_LENGTH = 10

export const normalizeSaudiId = (raw) => {
  if (raw == null) return ''
  return String(raw).replace(/\D+/g, '')
}

export const getSaudiIdType = (raw) => {
  const id = normalizeSaudiId(raw)
  if (id.length !== SAUDI_ID_LENGTH) return null
  if (id.startsWith('1')) return 'national_id'
  if (id.startsWith('2')) return 'iqama'
  return null
}

export const validateSaudiIdChecksum = (raw) => {
  const id = normalizeSaudiId(raw)
  if (id.length !== SAUDI_ID_LENGTH) return false
  if (!/^[12]/.test(id)) return false

  let sum = 0
  for (let i = 0; i < SAUDI_ID_LENGTH; i += 1) {
    let digit = Number(id[i])
    if (Number.isNaN(digit)) return false
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export const describeSaudiId = (raw) => {
  const id = normalizeSaudiId(raw)
  const type = getSaudiIdType(id)
  const valid = validateSaudiIdChecksum(id)
  return {
    value: id,
    type,
    isSaudi: type === 'national_id',
    isIqama: type === 'iqama',
    valid,
  }
}
