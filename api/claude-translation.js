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

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Create the prompt for Claude
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

    const translatedText = response.data.content[0].text.trim();

    res.status(200).json({
      success: true,
      originalText: text,
      translatedText: translatedText,
      sourceLang: sourceLang === 'auto' ? 'detected' : sourceLang,
      targetLang,
      service: 'claude',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude translation error:', error.message);
    res.status(500).json({ 
      error: 'Translation failed', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
} 