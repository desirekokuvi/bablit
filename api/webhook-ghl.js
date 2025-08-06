export default async function handler(req, res) {
  try {
    const { messageBody, phone, direction, contactId } = req.body;
    
    // Get contact's preferred language from GHL
    const preferredLang = await getContactLanguage(contactId);
    
    let sourceLang, targetLang;
    
    if (direction === 'inbound') {
      // Customer to business: translate TO English
      sourceLang = 'auto';
      targetLang = 'en';
    } else {
      // Business to customer: translate FROM English to their language
      sourceLang = 'en';
      targetLang = preferredLang || 'en';
    }
    
    const translation = await translateText(messageBody, sourceLang, targetLang);
    
    // If it's outbound and customer has different language, send translation
    if (direction === 'outbound' && targetLang !== 'en') {
      await sendTranslatedSMS(contactId, translation.translatedText);
    }
    
    res.json({
      success: true,
      original: messageBody,
      translated: translation.translatedText,
      direction,
      shouldAutoSend: direction === 'outbound' && targetLang !== 'en'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
