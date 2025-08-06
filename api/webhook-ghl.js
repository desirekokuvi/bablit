export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('GHL Webhook received:', req.body);
    
    const { messageBody, phone, direction } = req.body;
    
    if (!messageBody) {
      return res.status(400).json({ error: 'No message to translate' });
    }

    // Translate the message
    const translateResponse = await fetch(`${req.headers.origin}/api/test-translation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: messageBody,
        sourceLang: 'auto',
        targetLang: 'en'
      })
    });

    const translation = await translateResponse.json();

    res.status(200).json({
      success: true,
      original: messageBody,
      translated: translation.translatedText,
      from: phone,
      direction: direction
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
