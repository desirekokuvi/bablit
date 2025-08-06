// bablit - Core Translation Engine
// "Just bablit it!" - Instant SMS Translation
// Supports GoHighLevel and universal webhook integrations

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
  GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY,
  DEEPL_API_KEY: process.env.DEEPL_API_KEY,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'babel-secret-key'
};

// In-memory storage (replace with database in production)
const conversationStore = new Map();
const userLanguagePreferences = new Map();

app.use(express.json());

// Language detection and translation service
class TranslationService {
  constructor() {
    this.supportedLanguages = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
      'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
      'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi'
    };
  }

  async detectLanguage(text) {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${CONFIG.GOOGLE_TRANSLATE_API_KEY}`,
        { q: text },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const detection = response.data.data.detections[0][0];
      return {
        language: detection.language,
        confidence: detection.confidence,
        isReliable: detection.isReliable
      };
    } catch (error) {
      console.error('Language detection failed:', error.message);
      return { language: 'en', confidence: 0.5, isReliable: false };
    }
  }

  async translateText(text, sourceLang, targetLang) {
    if (sourceLang === targetLang) {
      return { translatedText: text, confidence: 1.0, service: 'no-translation' };
    }

    try {
      // Primary: Google Translate
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${CONFIG.GOOGLE_TRANSLATE_API_KEY}`,
        {
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return {
        translatedText: response.data.data.translations[0].translatedText,
        confidence: 0.9,
        service: 'google',
        originalText: text,
        sourceLang,
        targetLang
      };
    } catch (error) {
      console.error('Google Translate failed:', error.message);
      
      // Fallback: DeepL (if API key provided)
      if (CONFIG.DEEPL_API_KEY) {
        return await this.translateWithDeepL(text, sourceLang, targetLang);
      }
      
      throw new Error('Translation failed');
    }
  }

  async translateWithDeepL(text, sourceLang, targetLang) {
    try {
      const response = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        new URLSearchParams({
          auth_key: CONFIG.DEEPL_API_KEY,
          text: text,
          source_lang: sourceLang.toUpperCase(),
          target_lang: targetLang.toUpperCase()
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return {
        translatedText: response.data.translations[0].text,
        confidence: 0.95,
        service: 'deepl',
        originalText: text,
        sourceLang,
        targetLang
      };
    } catch (error) {
      console.error('DeepL translation failed:', error.message);
      throw new Error('DeepL translation failed');
    }
  }
}

// Conversation context manager
class ConversationManager {
  constructor() {
    this.translationService = new TranslationService();
  }

  getConversationContext(conversationId) {
    return conversationStore.get(conversationId) || {
      id: conversationId,
      participants: {},
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };
  }

  updateConversationContext(conversationId, data) {
    const context = this.getConversationContext(conversationId);
    Object.assign(context, data, { lastActivity: new Date() });
    conversationStore.set(conversationId, context);
    return context;
  }

  async processMessage(messageData) {
    const { conversationId, fromNumber, toNumber, message, platform = 'generic' } = messageData;
    
    // Get conversation context
    const conversation = this.getConversationContext(conversationId);
    
    // Detect sender's language if not known
    let senderLang = userLanguagePreferences.get(fromNumber);
    if (!senderLang) {
      const detection = await this.translationService.detectLanguage(message);
      senderLang = detection.language;
      userLanguagePreferences.set(fromNumber, senderLang);
    }

    // Get receiver's preferred language
    let receiverLang = userLanguagePreferences.get(toNumber) || 'en';

    // Translate if languages are different
    let translation = null;
    if (senderLang !== receiverLang) {
      translation = await this.translationService.translateText(message, senderLang, receiverLang);
    }

    // Store message in conversation history
    const messageRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      fromNumber,
      toNumber,
      originalMessage: message,
      originalLanguage: senderLang,
      translatedMessage: translation?.translatedText || null,
      targetLanguage: receiverLang,
      platform,
      confidence: translation?.confidence || 1.0
    };

    conversation.messages.push(messageRecord);
    this.updateConversationContext(conversationId, conversation);

    return {
      messageRecord,
      shouldTranslate: !!translation,
      translatedText: translation?.translatedText || message,
      confidence: translation?.confidence || 1.0
    };
  }
}

// Initialize services
const conversationManager = new ConversationManager();

// GoHighLevel webhook handler
app.post('/webhook/gohighlevel', async (req, res) => {
  try {
    console.log('GHL Webhook received:', JSON.stringify(req.body, null, 2));
    
    // Extract message data from GHL webhook
    const { 
      contactId, 
      locationId,
      messageBody,
      phone,
      direction, // 'inbound' or 'outbound'
      conversationId: ghlConversationId
    } = req.body;

    if (!messageBody || !phone) {
      return res.status(400).json({ error: 'Missing required fields: messageBody, phone' });
    }

    // Create conversation ID
    const conversationId = ghlConversationId || `${locationId}-${contactId}`;
    
    // Determine from/to numbers based on direction
    const fromNumber = direction === 'inbound' ? phone : 'business';
    const toNumber = direction === 'inbound' ? 'business' : phone;

    // Process the message
    const result = await conversationManager.processMessage({
      conversationId,
      fromNumber,
      toNumber,
      message: messageBody,
      platform: 'gohighlevel'
    });

    // If translation is needed, send it back to GHL
    if (result.shouldTranslate) {
      // Here you would send the translated message back to GHL
      // This requires GHL API integration which we'll add next
      console.log('Translation needed:', result.translatedText);
      
      // For now, just return the translation
      return res.json({
        success: true,
        originalMessage: messageBody,
        translatedMessage: result.translatedText,
        confidence: result.confidence,
        action: 'translate_and_send'
      });
    }

    res.json({ success: true, action: 'no_translation_needed' });

  } catch (error) {
    console.error('GHL webhook error:', error);
    res.status(500).json({ error: 'Translation processing failed' });
  }
});

// Universal webhook handler (for other platforms)
app.post('/webhook/universal', async (req, res) => {
  try {
    // Flexible message extraction
    const messageData = extractMessageData(req.body);
    
    if (!messageData) {
      return res.status(400).json({ error: 'Could not extract message data' });
    }

    const result = await conversationManager.processMessage(messageData);

    res.json({
      success: true,
      originalMessage: messageData.message,
      translatedMessage: result.translatedText,
      confidence: result.confidence,
      shouldTranslate: result.shouldTranslate
    });

  } catch (error) {
    console.error('Universal webhook error:', error);
    res.status(500).json({ error: 'Translation processing failed' });
  }
});

// Helper function to extract message data from various webhook formats
function extractMessageData(body) {
  // Twilio format
  if (body.From && body.Body) {
    return {
      conversationId: `${body.From}-${body.To}`,
      fromNumber: body.From,
      toNumber: body.To,
      message: body.Body,
      platform: 'twilio'
    };
  }

  // Generic format
  if (body.from && body.message) {
    return {
      conversationId: `${body.from}-${body.to || 'unknown'}`,
      fromNumber: body.from,
      toNumber: body.to || 'business',
      message: body.message,
      platform: body.platform || 'generic'
    };
  }

  return null;
}

// API endpoints for management
app.get('/api/conversations', (req, res) => {
  const conversations = Array.from(conversationStore.values());
  res.json(conversations);
});

app.get('/api/conversation/:id', (req, res) => {
  const conversation = conversationStore.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conversation);
});

app.post('/api/language-preference', (req, res) => {
  const { phoneNumber, language } = req.body;
  
  if (!phoneNumber || !language) {
    return res.status(400).json({ error: 'Phone number and language required' });
  }

  userLanguagePreferences.set(phoneNumber, language);
  res.json({ success: true, phoneNumber, language });
});

app.get('/api/language-preferences', (req, res) => {
  const preferences = Object.fromEntries(userLanguagePreferences);
  res.json(preferences);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'bablit Translation Engine - Just bablit it!',
    timestamp: new Date().toISOString()
  });
});

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test endpoint
app.post('/api/test-translation', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    const translationService = new TranslationService();
    
    const result = await translationService.translateText(text, sourceLang, targetLang);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(CONFIG.PORT, () => {
  console.log(`🌍 bablit Translation Engine running on port ${CONFIG.PORT}`);
  console.log(`📍 GHL Webhook: http://localhost:${CONFIG.PORT}/webhook/gohighlevel`);
  console.log(`📍 Universal Webhook: http://localhost:${CONFIG.PORT}/webhook/universal`);
  console.log(`📍 Health Check: http://localhost:${CONFIG.PORT}/health`);
  console.log(`🚀 Just bablit it! - Instant SMS Translation`);
});

module.exports = app;
