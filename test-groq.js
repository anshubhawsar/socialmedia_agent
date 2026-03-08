#!/usr/bin/env node

/**
 * Groq API Test Script
 * Tests Groq's free, ultra-fast LLM inference API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load from env or .env.local
let GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/GROQ_API_KEY=(.+)/);
      if (match) {
        GROQ_API_KEY = match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }
}

if (!GROQ_API_KEY) {
  console.error('❌ Error: GROQ_API_KEY not found');
  console.error('Get a free API key at: https://console.groq.com/keys');
  console.error('Then add it to .env.local or run: node test-groq.js <API_KEY>');
  process.exit(1);
}

const MODELS_TO_TEST = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

async function testGroqModel(model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Write a concise, engaging tweet about AI innovation (max 280 chars):',
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': data.length,
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);

          if (res.statusCode === 200) {
            const text = parsed.choices?.[0]?.message?.content || '';
            if (text) {
              resolve({ success: true, text, model, statusCode: res.statusCode });
            } else {
              resolve({
                success: false,
                error: 'No text generated',
                response: JSON.stringify(parsed).slice(0, 200),
                model,
                statusCode: res.statusCode,
              });
            }
          } else {
            const errorMsg = parsed.error?.message || responseData.slice(0, 200);
            resolve({
              success: false,
              error: errorMsg,
              model,
              statusCode: res.statusCode,
            });
          }
        } catch (e) {
          resolve({
            success: false,
            error: `Parse error: ${responseData.slice(0, 200)}`,
            model,
            statusCode: res.statusCode,
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message, model });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout', model });
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('🧪 Testing Groq API (Free Tier - Ultra Fast)...\n');
  console.log(`API Key: ${GROQ_API_KEY.slice(0, 15)}...${GROQ_API_KEY.slice(-10)}`);
  console.log('');

  let workingModel = null;

  for (const modelName of MODELS_TO_TEST) {
    console.log(`Testing: ${modelName}...`);
    const result = await testGroqModel(modelName);

    if (result.success) {
      console.log(`✅ Success`);
      console.log(`   Response: "${result.text.slice(0, 200)}"`);
      console.log(`   Status: Ultra-fast inference working`);
      console.log('');
      workingModel = result;
      break;
    } else {
      const statusCode = result.statusCode || 'unknown';
      const errorMsg = result.error || 'Unknown error';

      if (statusCode === 401) {
        console.log(`❌ Authentication Error`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
        console.log(`   Solution: Check GROQ_API_KEY at https://console.groq.com/keys`);
        break;
      } else if (statusCode === 429) {
        console.log(`⚠️  Rate Limit`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
      } else {
        console.log(`⚠️  Error (${statusCode})`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(60));
  if (workingModel) {
    console.log(`✅ Groq API is working!`);
    console.log(`   Best model: ${workingModel.model}`);
    console.log(`   Speed: Ultra-fast (500+ tokens/sec)`);
    console.log(`   Perfect for research & tweet generation`);
  } else {
    console.log(`❌ Groq API is not working.`);
    console.log(`   Get a free API key: https://console.groq.com/keys`);
  }
  console.log('='.repeat(60) + '\n');

  process.exit(workingModel ? 0 : 1);
})();
