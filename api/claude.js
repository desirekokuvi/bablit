import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests for the interface
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return the HTML content directly
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Translation Test - Bablit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        textarea:focus, select:focus {
            outline: none;
            border-color: #007bff;
        }
        textarea {
            min-height: 120px;
            resize: vertical;
        }
        .service-selector {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        .service-option {
            flex: 1;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        .service-option:hover {
            border-color: #007bff;
            background-color: #f8f9fa;
        }
        .service-option.selected {
            border-color: #007bff;
            background-color: #e3f2fd;
        }
        .button-group {
            display: flex;
            gap: 15px;
        }
        .button-group button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .demo-btn {
            background-color: #28a745;
            color: white;
        }
        .demo-btn:hover {
            background-color: #218838;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        #translateBtn {
            background-color: #007bff;
            color: white;
        }
        #translateBtn:hover {
            background-color: #0056b3;
        }
        #translateBtn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
            display: none;
        }
        .result.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .result.error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .language-pair {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .language-pair select {
            flex: 1;
        }
        .arrow {
            font-size: 20px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Claude Translation Test</h1>
        
        <div class="service-selector">
            <div class="service-option" data-service="google">
                <strong>Google Translate</strong><br>
                <small>Fast & reliable</small>
            </div>
            <div class="service-option selected" data-service="claude">
                <strong>Claude AI</strong><br>
                <small>Context-aware</small>
            </div>
            <div class="service-option" data-service="openai">
                <strong>OpenAI GPT-4</strong><br>
                <small>Advanced AI</small>
            </div>
        </div>

        <form id="translationForm">
            <div class="form-group">
                <label for="sourceText">Text to Translate:</label>
                <textarea id="sourceText" placeholder="Enter text to translate..." required></textarea>
            </div>

            <div class="form-group">
                <label>Language Pair:</label>
                <div class="language-pair">
                    <select id="sourceLang">
                        <option value="auto">Auto-detect</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                        <option value="vi">Vietnamese</option>
                    </select>
                    <span class="arrow">→</span>
                    <select id="targetLang">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                        <option value="vi">Vietnamese</option>
                    </select>
                </div>
            </div>

            <div class="button-group">
                <button type="button" id="demoBtn" class="demo-btn">🚀 Try Demo</button>
                <button type="submit" id="translateBtn">Translate</button>
            </div>
        </form>

        <div id="result" class="result"></div>
    </div>

    <script>
        let selectedService = 'claude';

        // Service selector
        document.querySelectorAll('.service-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedService = option.dataset.service;
            });
        });

        // Demo button functionality
        document.getElementById('demoBtn').addEventListener('click', () => {
            const demoTexts = [
                {
                    text: "Hello! How are you today? I hope you're having a wonderful day.",
                    sourceLang: "en",
                    targetLang: "es"
                },
                {
                    text: "Bonjour! Comment allez-vous? J'espère que vous passez une excellente journée.",
                    sourceLang: "fr",
                    targetLang: "en"
                },
                {
                    text: "Xin chào! Bạn khỏe không? Tôi hy vọng bạn có một ngày tuyệt vời.",
                    sourceLang: "vi",
                    targetLang: "en"
                },
                {
                    text: "こんにちは！お元気ですか？素晴らしい一日をお過ごしください。",
                    sourceLang: "ja",
                    targetLang: "en"
                },
                {
                    text: "Hola! ¿Cómo estás hoy? Espero que tengas un día maravilloso.",
                    sourceLang: "es",
                    targetLang: "vi"
                }
            ];
            
            const randomDemo = demoTexts[Math.floor(Math.random() * demoTexts.length)];
            
            document.getElementById('sourceText').value = randomDemo.text;
            document.getElementById('sourceLang').value = randomDemo.sourceLang;
            document.getElementById('targetLang').value = randomDemo.targetLang;
            
            // Trigger translation
            document.getElementById('translationForm').dispatchEvent(new Event('submit'));
        });

        // Form submission
        document.getElementById('translationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const sourceText = document.getElementById('sourceText').value;
            const sourceLang = document.getElementById('sourceLang').value;
            const targetLang = document.getElementById('targetLang').value;
            const translateBtn = document.getElementById('translateBtn');
            const resultDiv = document.getElementById('result');

            if (!sourceText.trim()) {
                showResult('Please enter text to translate.', 'error');
                return;
            }

            // Disable button and show loading
            translateBtn.disabled = true;
            translateBtn.textContent = 'Translating...';
            showResult('<div class="loading">Translating with ' + selectedService + '...</div>', '');

            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: sourceText,
                        sourceLang: sourceLang,
                        targetLang: targetLang,
                        service: selectedService
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showResult(\`
                        <h3>Translation Result:</h3>
                        <p><strong>Original:</strong> \${data.originalText}</p>
                        <p><strong>Translated:</strong> \${data.translatedText}</p>
                        <p><strong>Service:</strong> \${data.service}</p>
                        <p><strong>Source Language:</strong> \${data.sourceLang}</p>
                        <p><strong>Target Language:</strong> \${data.targetLang}</p>
                        <p><strong>Timestamp:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
                    \`, 'success');
                } else {
                    showResult(\`Error: \${data.error}\`, 'error');
                }
            } catch (error) {
                showResult(\`Network error: \${error.message}\`, 'error');
            } finally {
                translateBtn.disabled = false;
                translateBtn.textContent = 'Translate';
            }
        });

        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = message;
            resultDiv.className = \`result \${type}\`;
            resultDiv.style.display = 'block';
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlContent);
} 