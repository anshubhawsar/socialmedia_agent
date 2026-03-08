import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-pro',
];

const ENABLE_NON_AI_FALLBACK = process.env.ENABLE_NON_AI_FALLBACK === 'true';

function buildDeterministicTweet(input: string): string {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const maxBodyLength = 235;
  const body = cleaned.length > maxBodyLength
    ? `${cleaned.slice(0, maxBodyLength - 1).trim()}…`
    : cleaned;

  return `${body} #AI`;
}

function buildDeterministicTweetOptions(topic: string): string[] {
  const base = buildDeterministicTweet(topic).replace(/\s+#AI$/, '');
  return [
    `${base} #AI`,
    `Key update: ${base} #MachineLearning`,
    `${base} What are your thoughts on the impact? #AI`,
    `${base} This could reshape how teams ship AI products. #GenAI`,
  ].map(option => option.slice(0, 280));
}

function normalizeTweetOption(option: string): string {
  return option.replace(/^[-*\d.)\s]+/, '').replace(/^"|"$/g, '').trim();
}

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured) return DEFAULT_GEMINI_MODELS;

  // Try user-configured model first, then fall back to known compatible models.
  return [configured, ...DEFAULT_GEMINI_MODELS.filter(m => m !== configured)];
}

async function generateWithFallback(prompt: string): Promise<{ text: string; model: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const parseRetryDelayMs = (message: string): number => {
    const secMatch = message.match(/Please retry in\s+([\d.]+)s/i);
    if (!secMatch) return 0;
    const seconds = Number(secMatch[1]);
    return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds * 1000)) : 0;
  };

  const isRetryableQuotaError = (message: string): boolean => {
    const normalized = message.toLowerCase();
    return normalized.includes('429')
      || normalized.includes('quota exceeded')
      || normalized.includes('resource_exhausted')
      || normalized.includes('too many requests');
  };

  const models = getModelCandidates();
  const errors: string[] = [];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const model = gemini.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return { text: result.response.text().trim(), model: modelName };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const retryDelayMs = parseRetryDelayMs(message);
        const retryable = isRetryableQuotaError(message) && attempt < 2;

        if (retryable) {
          await sleep(retryDelayMs || 1200);
          continue;
        }

        errors.push(`${modelName}: ${message}`);
        break;
      }
    }
  }

  throw new Error(
    `Gemini generation failed for all candidate models. ${
      errors.length ? `Details: ${errors.join(' | ')}` : ''
    }`
  );
}

export async function generateTweet(context: string): Promise<string> {
  const prompt = `You are a top-tier AI researcher and expert communicator. Based on the given context, synthesize a concise, factual, and engaging tweet (280 characters max). 

The tweet should:
- Be professional and insightful
- Highlight the key innovation or breakthrough
- Use minimal hashtags (max 1-2) and no emojis
- Be suitable for an AI/tech-focused audience

Context: ${context}

Generate only the tweet text, with no additional explanation.`;

  try {
    const { text } = await generateWithFallback(prompt);
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
  const prompt = `Generate ${count} different tweet options about this topic.

Topic: ${topic}

Rules:
- Each tweet must be under 280 characters
- Professional, insightful tone
- Max 1-2 hashtags per tweet
- No emojis
- Return plain text only, one tweet per line, no numbering`;

  try {
    const { text } = await generateWithFallback(prompt);
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

  const prompt = `You are a top-tier AI researcher evaluating recent AI breakthroughs. Analyze the following headlines and select the single most impactful breakthrough. Then synthesize it into a compelling, factual tweet (280 characters max).

Headlines:
${headlinesList}

Respond in this exact format:
SELECTED: <number>
TWEET: <the tweet text>

Requirements:
- Be professional and insightful
- Highlight the key innovation
- Use minimal hashtags (max 1-2) and no emojis
- Be suitable for an AI/tech audience`;

  let text: string;
  try {
    ({ text } = await generateWithFallback(prompt));
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
    throw new Error('Failed to parse Gemini response');
  }

  const selectedMatch = selectedLine.match(/SELECTED:\s*(\d+)/);
  const tweetMatch = tweetLine.match(/TWEET:\s*(.*)/);

  if (!selectedMatch || !tweetMatch) {
    throw new Error('Invalid Gemini response format');
  }

  const selectedIndex = parseInt(selectedMatch[1]) - 1;
  const synthesis = tweetMatch[1].trim();

  if (selectedIndex < 0 || selectedIndex >= headlines.length) {
    throw new Error('Invalid headline selection index');
  }

  return { index: selectedIndex, synthesis };
}
