import { NextRequest, NextResponse } from 'next/server';
import { generateTweetOptions } from '@/lib/agent';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const body = await request.json();
  const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';

  if (!topic) {
    return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
  }

  try {
    const options = await generateTweetOptions(topic, 4);
    return NextResponse.json({ success: true, topic, options });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
