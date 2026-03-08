import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
];

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured) return DEFAULT_GEMINI_MODELS;

  // Try user-configured model first, then fall back to known compatible models.
  return [configured, ...DEFAULT_GEMINI_MODELS.filter(m => m !== configured)];
}

async function generateWithFallback(prompt: string): Promise<{ text: string; model: string }> {
  const models = getModelCandidates();
  const errors: string[] = [];

  for (const modelName of models) {
    try {
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return { text: result.response.text().trim(), model: modelName };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${modelName}: ${message}`);
    }
  }

  throw new Error(`All Gemini models failed. Tried: ${errors.join(' | ')}`);
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

  const { text } = await generateWithFallback(prompt);
  return text.trim();
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

  const { text } = await generateWithFallback(prompt);

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
