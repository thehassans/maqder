import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import SystemSettings from '../models/SystemSettings.js';

export const getAISettings = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' }).select('gemini openai grok groq').lean();
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
        config: { temperature: 0.1 }
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

  // 3. Try Groq
  if (settings?.groq?.enabled !== false && settings?.groq?.apiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.groq.apiKey, baseURL: "https://api.groq.com/openai/v1" });
      const response = await client.chat.completions.create({
        model: settings.groq.model || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      if (response.choices?.[0]?.message?.content) return response.choices[0].message.content.trim();
    } catch (e) {
      lastError = e;
      console.warn('[Translation] Groq failed, falling back...', e.message);
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

export const extractKhayyatMeasurements = async ({ base64Image, mimeType }) => {
  const settings = await getAISettings();
  let lastError = null;
  
  const systemPrompt = `You are an expert AI for a tailoring (khayyat) shop. Extract tailoring measurements from hand-written sketches or measurement sheets. Return a JSON object with a "measurements" object containing the extracted fields (e.g., length, shoulderWidth, chest, waist, hips, bottom, sleeveLength, armhole, bicep, forearm, wrist, cuffWidth, neck, expansion). All values should be numbers (centimeters) or null if not found. Also extract any additional notes into a "notes" string field. Return only valid JSON.`;

  // 1. Try Gemini
  if (settings?.gemini?.enabled !== false && settings?.gemini?.apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey: settings.gemini.apiKey });
      const response = await client.models.generateContent({
        model: settings.gemini.model || 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [
              { text: systemPrompt + '\n\nExtract tailoring measurements from this image. Return structured JSON.' },
              { inlineData: { data: base64Image, mimeType } }
            ]
          }
        ],
        config: { temperature: 0.1, responseMimeType: 'application/json' }
      });
      if (response?.text) return JSON.parse(response.text.trim());
    } catch (e) {
      lastError = e;
      console.warn('[OCR] Gemini failed, falling back...', e.message);
    }
  }

  // 2. Try OpenAI
  if (settings?.openai?.enabled !== false && settings?.openai?.apiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.openai.apiKey });
      const response = await client.chat.completions.create({
        model: settings.openai.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [
              { type: 'text', text: 'Extract tailoring measurements from this image. Return structured JSON.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      if (response.choices?.[0]?.message?.content) {
        return JSON.parse(response.choices[0].message.content.trim());
      }
    } catch (e) {
      lastError = e;
      console.warn('[OCR] OpenAI failed...', e.message);
    }
  }

  throw lastError || new Error('No AI provider configured for OCR or all providers failed');
};
