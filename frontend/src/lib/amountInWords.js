const EN_ONES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const EN_TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const EN_SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion']

const AR_ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
const AR_TEENS = {
  10: 'عشرة',
  11: 'أحد عشر',
  12: 'اثنا عشر',
  13: 'ثلاثة عشر',
  14: 'أربعة عشر',
  15: 'خمسة عشر',
  16: 'ستة عشر',
  17: 'سبعة عشر',
  18: 'ثمانية عشر',
  19: 'تسعة عشر',
}
const AR_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
const AR_HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']
const AR_SCALES = [
  { singular: '', dual: '', plural: '', singularAfterTen: '' },
  { singular: 'ألف', dual: 'ألفان', plural: 'آلاف', singularAfterTen: 'ألف' },
  { singular: 'مليون', dual: 'مليونان', plural: 'ملايين', singularAfterTen: 'مليون' },
  { singular: 'مليار', dual: 'ملياران', plural: 'مليارات', singularAfterTen: 'مليار' },
  { singular: 'تريليون', dual: 'تريليونان', plural: 'تريليونات', singularAfterTen: 'تريليون' },
]

const normalizeAmount = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.max(0, Math.round(amount * 100) / 100)
}

const splitAmount = (value) => {
  const normalized = normalizeAmount(value)
  const major = Math.floor(normalized)
  const minor = Math.round((normalized - major) * 100)
  return { major, minor }
}

const convertHundredsEn = (value) => {
  const number = Number(value)
  if (!number) return ''

  const hundreds = Math.floor(number / 100)
  const remainder = number % 100
  const parts = []

  if (hundreds) {
    parts.push(`${EN_ONES[hundreds]} Hundred${remainder ? ' and' : ''}`)
  }

  if (remainder >= 20) {
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10
    parts.push([EN_TENS[tens], ones ? EN_ONES[ones] : ''].filter(Boolean).join(' '))
  } else if (remainder >= 10) {
    parts.push(EN_TEENS[remainder - 10])
  } else if (remainder > 0) {
    parts.push(EN_ONES[remainder])
  }

  return parts.join(' ')
}

const numberToWordsEn = (value) => {
  const number = Number(value)
  if (!number) return EN_ONES[0]

  const parts = []
  let remainder = number
  let scaleIndex = 0

  while (remainder > 0) {
    const chunk = remainder % 1000
    if (chunk) {
      const chunkText = convertHundredsEn(chunk)
      const scale = EN_SCALES[scaleIndex]
      parts.unshift([chunkText, scale].filter(Boolean).join(' '))
    }
    remainder = Math.floor(remainder / 1000)
    scaleIndex += 1
  }

  return parts.join(' ')
}

const convertBelow100Ar = (value) => {
  const number = Number(value)
  if (!number) return ''
  if (number < 10) return AR_ONES[number]
  if (number < 20) return AR_TEENS[number]

  const tens = Math.floor(number / 10)
  const ones = number % 10
  if (!ones) return AR_TENS[tens]
  return `${AR_ONES[ones]} و${AR_TENS[tens]}`
}

const convertHundredsAr = (value) => {
  const number = Number(value)
  if (!number) return ''

  const hundreds = Math.floor(number / 100)
  const remainder = number % 100
  const parts = []

  if (hundreds) parts.push(AR_HUNDREDS[hundreds])
  if (remainder) parts.push(convertBelow100Ar(remainder))

  return parts.join(' و')
}

const applyArabicScale = (chunk, scaleIndex) => {
  const chunkValue = Number(chunk)
  if (!chunkValue) return ''
  if (scaleIndex === 0) return convertHundredsAr(chunkValue)

  const scale = AR_SCALES[scaleIndex]
  if (chunkValue === 1) return scale.singular
  if (chunkValue === 2) return scale.dual

  const chunkWords = convertHundredsAr(chunkValue)
  const scaleWord = chunkValue >= 3 && chunkValue <= 10 ? scale.plural : scale.singularAfterTen
  return [chunkWords, scaleWord].filter(Boolean).join(' ')
}

const numberToWordsAr = (value) => {
  const number = Number(value)
  if (!number) return 'صفر'

  const parts = []
  let remainder = number
  let scaleIndex = 0

  while (remainder > 0) {
    const chunk = remainder % 1000
    if (chunk) parts.unshift(applyArabicScale(chunk, scaleIndex))
    remainder = Math.floor(remainder / 1000)
    scaleIndex += 1
  }

  return parts.filter(Boolean).join(' و')
}

const getCurrencyLabels = (currency = 'SAR', language = 'en', type = 'major', count = 0) => {
  const normalized = String(currency || 'SAR').trim().toUpperCase()

  if (language === 'ar') {
    if (normalized === 'SAR') {
      return type === 'major' ? 'ريال سعودي' : 'هللة'
    }
    return type === 'major' ? normalized : (type === 'minor' ? 'جزء' : normalized)
  }

  if (normalized === 'SAR') {
    if (type === 'major') return count === 1 ? 'Saudi Riyal' : 'Saudi Riyals'
    return count === 1 ? 'Halala' : 'Halalas'
  }

  if (type === 'major') return normalized
  return 'Cents'
}

export const getAmountInWords = (value, currency = 'SAR', language = 'en') => {
  const { major, minor } = splitAmount(value)

  if (language === 'ar') {
    const majorWords = `${numberToWordsAr(major)} ${getCurrencyLabels(currency, 'ar', 'major', major)}`.trim()
    const minorWords = minor ? ` و${numberToWordsAr(minor)} ${getCurrencyLabels(currency, 'ar', 'minor', minor)}` : ''
    return `فقط ${majorWords}${minorWords}`.trim()
  }

  const majorWords = `${numberToWordsEn(major)} ${getCurrencyLabels(currency, 'en', 'major', major)}`.trim()
  const minorWords = minor ? ` and ${numberToWordsEn(minor)} ${getCurrencyLabels(currency, 'en', 'minor', minor)}` : ''
  return `${majorWords}${minorWords} Only`.trim()
}
