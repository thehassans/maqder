import { useState, useCallback } from 'react';

/**
 * A hook to automatically translate text between English and Arabic using MyMemory Free API.
 * In a production environment, this should be replaced with Google Translate API or AWS Translate.
 */
export function useAutoTranslate() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(async (text, fromLang, toLang) => {
    if (!text || !text.trim()) return '';
    
    setIsTranslating(true);
    try {
      // MyMemory translation API (free tier limits apply)
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
      const data = await res.json();
      
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
      return '';
    } catch (error) {
      console.error('Translation failed:', error);
      return '';
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating };
}
