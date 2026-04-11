import { GoogleGenAI } from '@google/genai'
import SystemSettings from '../models/SystemSettings.js'

const hasArabicText = (value = '') => /[\u0600-\u06FF]/.test(String(value || ''))
const hasTranslatableText = (value = '') => /[A-Za-z\u0600-\u06FF]/.test(String(value || '').trim())
const translationTimeoutMs = 2500
const enrichmentTimeoutMs = 4000

const resolveWithin = (promise, timeoutMs, fallbackValue = '') => Promise.race([
  promise,
  new Promise((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
])

const getGeminiSettings = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('gemini').lean()
  return settings?.gemini || null
}

const translateText = async ({ client, model, text, targetLanguage }) => {
  const prompt = targetLanguage === 'en'
    ? `Translate the following text to natural English. If it is a proper name, transliterate it naturally in English. Return only the English text with no quotes and no extra explanation.\n\nText:\n"""${text}"""`
    : `Translate the following text to Arabic. If it is a proper name, transliterate it naturally in Arabic. Return only the Arabic text with no quotes and no extra explanation.\n\nText:\n"""${text}"""`

  const response = await client.models.generateContent({
    model,
    contents: prompt,
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

  const queueTranslation = ({ sourceValue, targetLanguage, onResolved }) => {
    const source = String(sourceValue || '').trim()
    if (!source || !hasTranslatableText(source)) return

    const cacheKey = `${targetLanguage}:${source}`
    const cached = translationCache.get(cacheKey)
    if (cached) {
      tasks.push(
        cached.then((translated) => {
          if (translated) onResolved(translated)
        })
      )
      return
    }

    const pending = resolveWithin(
      translateText({ client, model, text: source, targetLanguage }),
      translationTimeoutMs,
      ''
    )
      .then((translated) => {
        const value = String(translated || '').trim()
        return value || ''
      })
      .catch(() => '')

    translationCache.set(cacheKey, pending)
    tasks.push(
      pending.then((translated) => {
        if (translated) onResolved(translated)
      })
    )
  }

  const assignBilingualValue = (holder, primaryKey, arabicKey) => {
    if (!holder) return

    const primaryValue = String(holder[primaryKey] || '').trim()
    const arabicValue = String(holder[arabicKey] || '').trim()

    if (primaryValue && hasArabicText(primaryValue)) {
      if (!arabicValue) {
        holder[arabicKey] = primaryValue
      }

      queueTranslation({
        sourceValue: primaryValue,
        targetLanguage: 'en',
        onResolved: (translated) => {
          if (translated && (!holder[primaryKey] || hasArabicText(holder[primaryKey]))) {
            holder[primaryKey] = translated
          }
        },
      })
      return
    }

    if (primaryValue && !arabicValue) {
      queueTranslation({
        sourceValue: primaryValue,
        targetLanguage: 'ar',
        onResolved: (translated) => {
          if (translated && !holder[arabicKey]) {
            holder[arabicKey] = translated
          }
        },
      })
      return
    }

    if (!primaryValue && arabicValue) {
      queueTranslation({
        sourceValue: arabicValue,
        targetLanguage: 'en',
        onResolved: (translated) => {
          if (translated && !holder[primaryKey]) {
            holder[primaryKey] = translated
          }
        },
      })
    }
  }

  assignBilingualValue(next?.buyer, 'name', 'nameAr')
  assignBilingualValue(next?.seller, 'name', 'nameAr')

  for (const lineItem of Array.isArray(next?.lineItems) ? next.lineItems : []) {
    assignBilingualValue(lineItem, 'productName', 'productNameAr')
    assignBilingualValue(lineItem, 'description', 'descriptionAr')
  }

  if (next?.travelDetails) {
    assignBilingualValue(next.travelDetails, 'travelerName', 'travelerNameAr')
    assignBilingualValue(next.travelDetails, 'airlineName', 'airlineNameAr')
    assignBilingualValue(next.travelDetails, 'routeFrom', 'routeFromAr')
    assignBilingualValue(next.travelDetails, 'routeTo', 'routeToAr')
    assignBilingualValue(next.travelDetails, 'layoverStay', 'layoverStayAr')

    for (const segment of Array.isArray(next.travelDetails?.segments) ? next.travelDetails.segments : []) {
      assignBilingualValue(segment, 'from', 'fromAr')
      assignBilingualValue(segment, 'to', 'toAr')
    }

    for (const passenger of Array.isArray(next.travelDetails?.passengers) ? next.travelDetails?.passengers : []) {
      assignBilingualValue(passenger, 'name', 'nameAr')
    }
  }

  await resolveWithin(Promise.allSettled(tasks), enrichmentTimeoutMs, [])
  return next
}
