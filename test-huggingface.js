#!/usr/bin/env node

/**
 * Hugging Face Inference API Test Script
 * Tests free models for text generation (no API key needed for public models)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load HF token from env or .env.local
let HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/(?:HF_TOKEN|HUGGINGFACE_TOKEN)=(.+)/);
      if (match) {
        HF_TOKEN = match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }
}

const MODELS_TO_TEST = [
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/Phi-3-mini-4k-instruct',
  'google/gemma-2-2b-it',
  'HuggingFaceH4/zephyr-7b-beta',
  'meta-llama/Llama-3.2-3B-Instruct',
];

async function testHuggingFaceModel(model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      inputs: 'Write a tweet about AI innovation in one sentence:',
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    };

    if (HF_TOKEN) {
      headers['Authorization'] = `Bearer ${HF_TOKEN}`;
    }

    const options = {
      hostname: 'api-inference.huggingface.co',
      port: 443,
      path: `/models/${model}`,
      method: 'POST',
      headers: headers,
      timeout: 30000,
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
            const text = Array.isArray(parsed)
              ? parsed[0]?.generated_text || ''
              : parsed.generated_text || parsed[0]?.generated_text || '';
            
            if (text) {
              resolve({ success: true, text, model, statusCode: res.statusCode });
            } else {
              resolve({ 
                success: false, 
                error: 'No text generated', 
                response: JSON.stringify(parsed).slice(0, 200),
                model, 
                statusCode: res.statusCode 
              });
            }
          } else if (res.statusCode === 503) {
            resolve({
              success: false,
              error: parsed.error || 'Model is loading, retry in ~20s',
              model,
              statusCode: res.statusCode,
              retryable: true,
            });
          } else {
            resolve({
              success: false,
              error: parsed.error || responseData.slice(0, 200),
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
  console.log('🧪 Testing Hugging Face Inference API (Free Tier)...\n');
  
  if (HF_TOKEN) {
    console.log(`API Token: ${HF_TOKEN.slice(0, 10)}...${HF_TOKEN.slice(-5)}`);
  } else {
    console.log('API Token: None (using public access)');
    console.log('Note: Some models may require a free HF token from https://huggingface.co/settings/tokens\n');
  }
  
  console.log('Testing models for research & text generation:\n');

  let workingModel = null;
  const loadingModels = [];

  for (const modelName of MODELS_TO_TEST) {
    console.log(`Testing: ${modelName}...`);
    const result = await testHuggingFaceModel(modelName);

    if (result.success) {
      console.log(`✅ Success`);
      console.log(`   Response: "${result.text.slice(0, 150)}"`);
      console.log(`   Status: Model is available and responding`);
      console.log('');
      workingModel = result;
      break;
    } else {
      const statusCode = result.statusCode || 'unknown';
      const errorMsg = result.error || 'Unknown error';

      if (result.retryable) {
        console.log(`⏳ Loading`);
        console.log(`   Message: ${errorMsg}`);
        console.log(`   Status: Model needs to warm up (503)`);
        loadingModels.push(modelName);
      } else if (statusCode === 401 || statusCode === 403) {
        console.log(`🔒 Access Restricted`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
        console.log(`   Status: May require HF API token`);
      } else if (statusCode === 404) {
        console.log(`❌ Not Found`);
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
    console.log(`✅ Hugging Face API is working!`);
    console.log(`   Best model: ${workingModel.model}`);
    console.log(`   This model is free and can handle research tasks.`);
  } else if (loadingModels.length > 0) {
    console.log(`⏳ Models are loading (503 errors):`);
    loadingModels.forEach((m) => console.log(`   - ${m}`));
    console.log(`\n   Solution: Wait 20-30 seconds and run the test again.`);
    console.log(`   First request wakes up the model (cold start).`);
  } else {
    console.log(`❌ No models are currently available.`);
    console.log(`   Try running again in a few seconds (cold start issue).`);
  }
  console.log('='.repeat(60) + '\n');

  process.exit(workingModel ? 0 : 1);
})();
