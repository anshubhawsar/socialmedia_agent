if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

const ENABLE_NON_AI_FALLBACK = process.env.ENABLE_NON_AI_FALLBACK === 'true';

function buildDeterministicTweet(input: string): string {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const maxBodyLength = 225;
  const body = cleaned.length > maxBodyLength
    ? `${cleaned.slice(0, maxBodyLength - 1).trim()}…`
    : cleaned;

  return `${body} #AI #MachineLearning`;
}

function buildDeterministicTweetOptions(topic: string): string[] {
  const base = buildDeterministicTweet(topic).replace(/\s+#AI\s+#MachineLearning$/, '');
  return [
    `What if ${base}? This could transform AI development. #AI #MachineLearning`,
    `Breaking: ${base}. Major implications for the industry. #GenAI #AIResearch`,
    `${base} — the future of intelligent systems is evolving fast. #DeepLearning #AI`,
    `Key insight: ${base}. How will this impact your AI workflow? #TechInnovation #MachineLearning`,
  ].map(option => option.slice(0, 280));
}

function normalizeTweetOption(option: string): string {
  return option.replace(/^[-*\d.)\s]+/, '').replace(/^"|"$/g, '').trim();
}

function getModelCandidates(): string[] {
  const configured = process.env.GROQ_MODEL?.trim();
  if (!configured) return DEFAULT_GROQ_MODELS;

  // Try user-configured model first, then fall back to known compatible models.
  return [configured, ...DEFAULT_GROQ_MODELS.filter(m => m !== configured)];
}

async function generateWithGroq(prompt: string): Promise<{ text: string; model: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const parseRetryDelayMs = (message: string): number => {
    const secMatch = message.match(/retry.*?in\s+([\d.]+)\s*s/i);
    if (!secMatch) return 0;
    const seconds = Number(secMatch[1]);
    return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds * 1000)) : 0;
  };

  const isRetryableError = (statusCode: number): boolean => {
    return statusCode === 429 || statusCode === 503;
  };

  const models = getModelCandidates();
  const errors: string[] = [];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text) {
            return { text: text.trim(), model: modelName };
          }
          throw new Error('No content in response');
        }

        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        const message = errorData.error?.message || response.statusText;
        
        if (isRetryableError(response.status) && attempt < 2) {
          const retryDelayMs = parseRetryDelayMs(message);
          await sleep(retryDelayMs || 1200);
          continue;
        }

        errors.push(`${modelName} (${response.status}): ${message}`);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${modelName}: ${message}`);
        break;
      }
    }
  }

  throw new Error(
    `Groq generation failed for all candidate models. ${
      errors.length ? `Details: ${errors.join(' | ')}` : ''
    }`
  );
}

export async function generateTweet(context: string): Promise<string> {
  const prompt = `You are an expert AI researcher and technology thought leader. Create a compelling, research-focused tweet (max 280 characters) based on this context.

Context: ${context}

Requirements:
- Lead with the key insight or breakthrough
- Use clear, accessible language for tech professionals
- Include 2-3 relevant hashtags (e.g., #AI, #MachineLearning, #GenAI, #DeepLearning, #AIResearch, #TechInnovation)
- Professional tone, no emojis
- Focus on impact and implications

Return only the tweet text.`;

  try {
    const { text } = await generateWithGroq(prompt);
    return text.trim();
  } catch (error) {
    if (!ENABLE_NON_AI_FALLBACK) {
      throw error;
    }
    // Graceful degradation for quota/model outages.
    return buildDeterministicTweet(context);
  }
}

export async function generateTweetOptions(topic: string, count = 4): Promise<string[]> {
  const prompt = `You are an AI research expert creating social media content. Generate ${count} distinct, engaging tweet variations about this topic.

Topic: ${topic}

Create ${count} different approaches:
1. A thought-provoking question that sparks discussion
2. A bold statement highlighting the key innovation
3. A practical insight showing real-world impact
4. A future-focused perspective on implications

Requirements for EACH tweet:
- Maximum 280 characters
- Include 2-3 relevant hashtags (choose from: #AI, #MachineLearning, #GenAI, #DeepLearning, #AIResearch, #TechInnovation, #DataScience, #NeuralNetworks)
- Professional, insightful tone
- No emojis, no numbering
- Each tweet must stand alone and be compelling

Return only the ${count} tweet texts, one per line, no extra formatting.`;

  try {
    const { text } = await generateWithGroq(prompt);
    const lines = text
      .split('\n')
      .map(normalizeTweetOption)
      .filter(Boolean)
      .filter(line => line.length <= 280);

    const unique = Array.from(new Set(lines));
    if (unique.length > 0) {
      return unique.slice(0, count);
    }
  } catch (error) {
    if (!ENABLE_NON_AI_FALLBACK) {
      throw error;
    }
    // Fall through to deterministic options when AI is unavailable.
  }

  return buildDeterministicTweetOptions(topic).slice(0, count);
}

export async function selectBestHeadline(headlines: string[]): Promise<{ index: number; synthesis: string }> {
  const headlinesList = headlines
    .map((h, i) => `${i + 1}. ${h}`)
    .join('\n');

  const prompt = `You are an AI research expert curating breakthrough news. Analyze these headlines and select the most significant innovation. Create a compelling tweet about it.

Headlines:
${headlinesList}

Respond in this exact format:
SELECTED: <number>
TWEET: <the tweet text>

Tweet Requirements:
- Maximum 280 characters
- Lead with the key breakthrough or insight
- Include 2-3 relevant hashtags (#AI, #MachineLearning, #GenAI, #AIResearch, etc.)
- Professional tone, no emojis
- Focus on why this matters to the AI community`;

  let text: string;
  try {
    ({ text } = await generateWithGroq(prompt));
  } catch (error) {
    if (!ENABLE_NON_AI_FALLBACK) {
      throw error;
    }
    const fallbackIndex = 0;
    return {
      index: fallbackIndex,
      synthesis: buildDeterministicTweet(headlines[fallbackIndex]),
    };
  }

  const lines = text.split('\n');
  const selectedLine = lines.find(line => line.startsWith('SELECTED:'));
  const tweetLine = lines.find(line => line.startsWith('TWEET:'));

  if (!selectedLine || !tweetLine) {
    throw new Error('Failed to parse AI response');
  }

  const selectedMatch = selectedLine.match(/SELECTED:\s*(\d+)/);
  const tweetMatch = tweetLine.match(/TWEET:\s*(.*)/);

  if (!selectedMatch || !tweetMatch) {
    throw new Error('Invalid AI response format');
  }

  const selectedIndex = parseInt(selectedMatch[1]) - 1;
  const synthesis = tweetMatch[1].trim();

  if (selectedIndex < 0 || selectedIndex >= headlines.length) {
    throw new Error('Invalid headline selection index');
  }

  return { index: selectedIndex, synthesis };
}
