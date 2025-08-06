import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang = 'auto', targetLang = 'en', service = 'google' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let translatedText, detectedSourceLang;

    if (service === 'claude') {
      // Use Claude for translation
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
      }

      const prompt = `You are a professional translator. Please translate the following text from ${sourceLang === 'auto' ? 'its detected language' : sourceLang} to ${targetLang}. 

Text to translate: "${text}"

Please respond with only the translated text, nothing else.`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      translatedText = response.data.content[0].text.trim();
      detectedSourceLang = sourceLang === 'auto' ? 'detected' : sourceLang;

    } else if (service === 'openai') {
      // Use OpenAI for translation
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      const prompt = `You are a professional translator. Please translate the following text from ${sourceLang === 'auto' ? 'its detected language' : sourceLang} to ${targetLang}. 

Text to translate: "${text}"

Please respond with only the translated text, nothing else.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      translatedText = response.data.choices[0].message.content.trim();
      detectedSourceLang = sourceLang === 'auto' ? 'detected' : sourceLang;

    } else {
      // Use Google Translate (default)
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

      translatedText = response.data.data.translations[0].translatedText;
      detectedSourceLang = response.data.data.translations[0].detectedSourceLanguage || sourceLang;
    }

    res.status(200).json({
      success: true,
      originalText: text,
      translatedText: translatedText,
      sourceLang: detectedSourceLang,
      targetLang,
      service: service,
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