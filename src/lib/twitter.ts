export async function postTweet(accessToken: string, text: string): Promise<string> {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to post tweet: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.id;
}
