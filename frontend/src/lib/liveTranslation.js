import { useEffect, useRef, useState } from 'react'
import api from './api'

const normalizeLang = (lang) => {
  const l = String(lang || '').toLowerCase()
  if (l === 'ar') return 'Arabic'
  if (l === 'en') return 'English'
  return lang || 'English'
}

export const useLiveTranslation = ({
  watch,
  setValue,
  sourceField,
  targetField,
  sourceLang,
  targetLang,
  enabled = true,
  debounceMs = 700,
  minLength = 2,
}) => {
  const [isTranslating, setIsTranslating] = useState(false)
  const timerRef = useRef(null)
  const lastAutoSourceRef = useRef('')
  const lastAutoResultRef = useRef('')

  const source = watch(sourceField)
  const target = watch(targetField)

  useEffect(() => {
    if (!enabled) return

    const s = String(source || '').trim()
    const t = String(target || '').trim()

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (!s || s.length < minLength) return

    if (s === String(lastAutoSourceRef.current || '').trim() && t === String(lastAutoResultRef.current || '').trim()) {
      return
    }

    if (t && t !== String(lastAutoResultRef.current || '').trim()) {
      return
    }

    timerRef.current = setTimeout(async () => {
      try {
        setIsTranslating(true)
        const { data } = await api.post('/ai/translate', {
          text: s,
          sourceLang: normalizeLang(sourceLang),
          targetLang: normalizeLang(targetLang),
        })

        const translated = String(data?.translatedText || '').trim()
        if (!translated) return

        lastAutoSourceRef.current = s
        lastAutoResultRef.current = translated
        setValue(targetField, translated, { shouldDirty: true })
      } catch (_) {
      } finally {
        setIsTranslating(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, debounceMs, minLength, source, target, setValue, sourceField, targetField, sourceLang, targetLang, watch])

  return { isTranslating }
}

export default useLiveTranslation
