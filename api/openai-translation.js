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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Create the prompt for OpenAI
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

    const translatedText = response.data.choices[0].message.content.trim();

    res.status(200).json({
      success: true,
      originalText: text,
      translatedText: translatedText,
      sourceLang: sourceLang === 'auto' ? 'detected' : sourceLang,
      targetLang,
      service: 'openai',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI translation error:', error.message);
    res.status(500).json({ 
      error: 'Translation failed', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
} 