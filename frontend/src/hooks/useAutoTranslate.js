import { useState, useCallback } from 'react';
import api from '../lib/api';

/**
 * A hook to automatically translate text between English and Arabic.
 * Uses the backend /api/ai/translate endpoint (Gemini/Grok/Groq/OpenAI fallbacks).
 */
export function useAutoTranslate() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(async (text, fromLang, toLang) => {
    if (!text || !text.trim()) return '';

    setIsTranslating(true);
    try {
      const { data } = await api.post('/ai/translate', {
        text: text.trim(),
        sourceLang: fromLang,
        targetLang: toLang,
      });
      return String(data?.translatedText || '').trim();
    } catch (error) {
      console.error('Translation failed:', error);
      return '';
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating };
}
