import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import SystemSettings from '../models/SystemSettings.js';

export const getAISettings = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('gemini openai grok').lean();
  return settings || {};
};

export const translateWithFallback = async ({ text, targetLanguage }) => {
  const settings = await getAISettings();
  const sourceLang = targetLanguage === 'en' ? 'Arabic' : 'English';
  const targetLangStr = targetLanguage === 'en' ? 'English' : 'Arabic';
  
  const prompt = `Translate the following text from ${sourceLang} to ${targetLangStr}. If the text is a proper name, transliterate it appropriately. Return only the translated text without quotes or extra commentary.\n\nText:\n"""${text}"""`;

  let lastError = null;

  // 1. Try Gemini
  if (settings?.gemini?.enabled !== false && settings?.gemini?.apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey: settings.gemini.apiKey });
      const response = await client.models.generateContent({
        model: settings.gemini.model || 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.1, maxOutputTokens: 256 }
      });
      if (response?.text) return response.text.trim();
    } catch (e) {
      lastError = e;
      console.warn('[Translation] Gemini failed, falling back...', e.message);
    }
  }

  // 2. Try Grok
  if (settings?.grok?.enabled !== false && settings?.grok?.apiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.grok.apiKey, baseURL: "https://api.x.ai/v1" });
      const response = await client.chat.completions.create({
        model: settings.grok.model || 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      if (response.choices?.[0]?.message?.content) return response.choices[0].message.content.trim();
    } catch (e) {
      lastError = e;
      console.warn('[Translation] Grok failed, falling back...', e.message);
    }
  }

  // 3. Try OpenAI
  if (settings?.openai?.enabled !== false && settings?.openai?.apiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.openai.apiKey });
      const response = await client.chat.completions.create({
        model: settings.openai.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      if (response.choices?.[0]?.message?.content) return response.choices[0].message.content.trim();
    } catch (e) {
      lastError = e;
      console.warn('[Translation] OpenAI failed...', e.message);
    }
  }

  throw lastError || new Error('No AI provider configured or all providers failed');
};
