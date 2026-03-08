import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, auto_mode, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const body = await request.json();
  const { auto_mode } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        auto_mode: typeof auto_mode === 'boolean' ? auto_mode : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
