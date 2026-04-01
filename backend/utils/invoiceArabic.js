import { GoogleGenAI } from '@google/genai'
import SystemSettings from '../models/SystemSettings.js'

const hasArabicText = (value = '') => /[\u0600-\u06FF]/.test(String(value || ''))
const hasTranslatableText = (value = '') => /[A-Za-z\u0600-\u06FF]/.test(String(value || '').trim())

const getGeminiSettings = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('gemini').lean()
  return settings?.gemini || null
}

const translateToArabic = async ({ client, model, text }) => {
  const response = await client.models.generateContent({
    model,
    contents: `Translate the following text to Arabic. If it is a proper name, transliterate it naturally in Arabic. Return only the Arabic text with no quotes and no extra explanation.\n\nText:\n"""${text}"""`,
    config: {
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  })

  return String(response?.text || '').trim()
}

export const enrichInvoiceArabicFields = async (invoiceData = {}) => {
  const next = JSON.parse(JSON.stringify(invoiceData || {}))
  const gemini = await getGeminiSettings()

  if (!gemini?.apiKey) {
    return next
  }

  const client = new GoogleGenAI({ apiKey: gemini.apiKey })
  const model = String(gemini.model || 'gemini-2.5-flash').trim()
  const translationCache = new Map()
  const tasks = []

  const assignArabicValue = (holder, key, sourceValue) => {
    if (!holder || holder[key]) return

    const source = String(sourceValue || '').trim()
    if (!source || !hasTranslatableText(source)) return

    if (hasArabicText(source)) {
      holder[key] = source
      return
    }

    const cached = translationCache.get(source)
    if (cached) {
      tasks.push(
        cached.then((translated) => {
          if (translated && !holder[key]) holder[key] = translated
        })
      )
      return
    }

    const pending = translateToArabic({ client, model, text: source })
      .then((translated) => {
        const value = String(translated || '').trim()
        return value || ''
      })
      .catch(() => '')

    translationCache.set(source, pending)
    tasks.push(
      pending.then((translated) => {
        if (translated && !holder[key]) holder[key] = translated
      })
    )
  }

  assignArabicValue(next?.buyer, 'nameAr', next?.buyer?.name)
  assignArabicValue(next?.seller, 'nameAr', next?.seller?.name)

  for (const lineItem of Array.isArray(next?.lineItems) ? next.lineItems : []) {
    assignArabicValue(lineItem, 'productNameAr', lineItem?.productName)
    assignArabicValue(lineItem, 'descriptionAr', lineItem?.description)
  }

  if (next?.travelDetails) {
    assignArabicValue(next.travelDetails, 'travelerNameAr', next.travelDetails?.travelerName)
    assignArabicValue(next.travelDetails, 'airlineNameAr', next.travelDetails?.airlineName)
    assignArabicValue(next.travelDetails, 'routeFromAr', next.travelDetails?.routeFrom)
    assignArabicValue(next.travelDetails, 'routeToAr', next.travelDetails?.routeTo)
    assignArabicValue(next.travelDetails, 'layoverStayAr', next.travelDetails?.layoverStay)

    for (const segment of Array.isArray(next.travelDetails?.segments) ? next.travelDetails.segments : []) {
      assignArabicValue(segment, 'fromAr', segment?.from)
      assignArabicValue(segment, 'toAr', segment?.to)
    }

    for (const passenger of Array.isArray(next.travelDetails?.passengers) ? next.travelDetails.passengers : []) {
      assignArabicValue(passenger, 'nameAr', passenger?.name)
    }
  }

  await Promise.allSettled(tasks)
  return next
}
