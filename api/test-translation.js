import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang = 'auto', targetLang = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return res.status(500).json({ error: 'Google Translate API key not configured' });
    }

    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        target: targetLang,
        format: 'text'
      }
    );

    res.status(200).json({
      success: true,
      originalText: text,
      translatedText: response.data.data.translations[0].translatedText,
      sourceLang: response.data.data.translations[0].detectedSourceLanguage || sourceLang,
      targetLang,
      service: 'google',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ 
      error: 'Translation failed', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
}
