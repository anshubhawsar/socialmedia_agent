export async function postTweet(accessToken: string, text: string): Promise<string> {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = JSON.stringify(errorJson, null, 2);
      } catch {
        // Use text as-is if not JSON
      }
      throw new Error(`Twitter API Error (${response.status}): ${errorDetail}`);
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to post tweet: ${JSON.stringify(error)}`);
  }
}
