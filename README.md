# bablit
The worlds first real time language sms translation app for crms

## Features

- Real-time SMS translation for CRM systems
- Support for multiple translation services:
  - **Google Translate** - Fast and reliable
  - **Claude AI** - Context-aware translations with better understanding
  - **OpenAI GPT-4** - Advanced AI with excellent translation quality
- Auto-language detection
- Support for 13+ languages

## API Endpoints

### Translation Services

#### 1. Unified Translation Endpoint
`POST /api/translate`

Use Google Translate, Claude AI, or OpenAI for translation:

```json
{
  "text": "Hello, how are you?",
  "sourceLang": "auto",
  "targetLang": "es",
  "service": "claude"  // "google", "claude", or "openai"
}
```

#### 2. Claude-only Translation
`POST /api/claude-translation.js`

Use Claude AI specifically for translation:

```json
{
  "text": "Hello, how are you?",
  "sourceLang": "auto",
  "targetLang": "es"
}
```

#### 3. OpenAI-only Translation
`POST /api/openai-translation.js`

Use OpenAI GPT-4 specifically for translation:

```json
{
  "text": "Hello, how are you?",
  "sourceLang": "auto",
  "targetLang": "es"
}
```

#### 4. Google Translate (existing)
`POST /api/test-translation.js`

Use Google Translate for translation.

## Environment Variables

Add these to your environment configuration:

```bash
# For Google Translate
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# For Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# For OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Testing

Visit `/public/claude-test.html` to test both translation services with a beautiful web interface.

## Getting Started

1. Set up your environment variables
2. Install dependencies: `npm install`
3. Start your server
4. Test the integration at `/public/claude-test.html`

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)
- Arabic (ar)
- Hindi (hi)
- Vietnamese (vi)
- Auto-detection (auto)
