import Parser from 'rss-parser';
import { RSSItem } from '@/types';

const parser = new Parser();

const AI_RSS_FEEDS = [
  'https://arxiv.org/rss/cs.AI',
  'https://news.mit.edu/feed',
  'https://www.deeplearning.ai/feed/',
  'https://www.thealgorithmicbridge.com/feed',
  'https://feeds.arstechnica.com/arstechnica/index',
];

export async function fetchLatestHeadlines(limit: number = 5): Promise<string[]> {
  const allItems: RSSItem[] = [];

  const results = await Promise.allSettled(
    AI_RSS_FEEDS.map(feed =>
      parser.parseURL(feed)
        .then(result => result.items || [])
        .catch(() => [])
    )
  );

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  const headlines = allItems
    .filter(item => item.title)
    .slice(0, limit * 2)
    .map(item => item.title!)
    .filter((headline, index, self) => self.indexOf(headline) === index)
    .slice(0, limit);

  return headlines;
}

export async function fetchFeedSummaries(): Promise<string[]> {
  const allItems: RSSItem[] = [];

  const results = await Promise.allSettled(
    AI_RSS_FEEDS.map(feed =>
      parser.parseURL(feed)
        .then(result => (result.items || []).slice(0, 3))
        .catch(() => [])
    )
  );

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  const summaries = allItems
    .filter(item => item.title)
    .slice(0, 10)
    .map(item => {
      const text = item.summary || item.content || '';
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      return `${item.title}: ${cleanText.slice(0, 200)}`;
    });

  return summaries;
}
