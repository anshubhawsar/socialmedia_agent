#!/usr/bin/env node

/**
 * OpenAI API Connectivity & Quota Test Script
 * Tests your OpenAI API key and reports available models
 */

const https = require('https');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.argv[2];

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not provided');
  console.error('Usage: node test-openai.js <API_KEY>');
  process.exit(1);
}

const MODELS_TO_TEST = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

async function testOpenAI(model) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
      max_tokens: 10,
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length,
      },
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
            resolve({ success: true, text, model });
          } else {
            const errorMsg = parsed.error?.message || responseData;
            resolve({ success: false, error: errorMsg, statusCode: res.statusCode, model });
          }
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response', statusCode: res.statusCode, model });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message, model });
    });

    req.write(data);
    req.end();
  });
}

async function listOpenAIModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          
          if (res.statusCode === 200 && parsed.data) {
            const gptModels = parsed.data
              .filter(m => m.id.includes('gpt'))
              .map(m => m.id)
              .sort();
            resolve({ success: true, models: gptModels });
          } else {
            resolve({ success: false, error: parsed.error?.message || 'Failed to list models' });
          }
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

(async () => {
  console.log('🧪 Testing OpenAI API...\n');
  console.log(`API Key: ${OPENAI_API_KEY.slice(0, 15)}...${OPENAI_API_KEY.slice(-10)}`);
  console.log('');

  let workingModel = null;

  for (const modelName of MODELS_TO_TEST) {
    console.log(`Testing model: ${modelName}...`);
    const result = await testOpenAI(modelName);

    if (result.success) {
      console.log(`✅ Success`);
      console.log(`   Response: "${result.text}"`);
      console.log(`   Status: Model is available and responding`);
      console.log('');
      workingModel = result;
      break;
    } else {
      const statusCode = result.statusCode || 'unknown';
      const errorMsg = result.error || 'Unknown error';
      
      if (statusCode === 401) {
        console.log(`❌ Authentication Error`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
        console.log(`   Solution: Check OPENAI_API_KEY is correct`);
        console.log('');
        break;
      } else if (statusCode === 429) {
        console.log(`⚠️  Rate Limit / Quota Error`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
        console.log(`   Solution: Check billing or rate limits`);
      } else if (statusCode === 404) {
        console.log(`⚠️  Model Not Found`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
      } else {
        console.log(`❌ Error (${statusCode})`);
        console.log(`   Message: ${errorMsg.slice(0, 200)}`);
      }
      console.log('');
    }
  }

  console.log('\n📋 Checking available models...\n');
  const modelsList = await listOpenAIModels();

  if (modelsList.success) {
    console.log(`✅ Found ${modelsList.models.length} GPT models:`);
    modelsList.models.slice(0, 15).forEach((m) => {
      console.log(`   - ${m}`);
    });
    if (modelsList.models.length > 15) {
      console.log(`   ... and ${modelsList.models.length - 15} more`);
    }
  } else {
    console.log('⚠️  Could not fetch model list:', modelsList.error);
  }

  console.log('\n' + '='.repeat(50));
  if (workingModel) {
    console.log('✅ OpenAI API is working! Model: ' + workingModel.model);
    console.log('You can use this for tweet generation.');
  } else {
    console.log('❌ OpenAI API is not working. Check your key and billing.');
  }
  console.log('='.repeat(50) + '\n');

  process.exit(workingModel ? 0 : 1);
})();
