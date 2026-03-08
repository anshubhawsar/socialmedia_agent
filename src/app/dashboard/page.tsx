'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  username: string;
  auto_mode: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState('');
  const [posting, setPosting] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data);
      setAutoMode(data.auto_mode);
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePostTweet = async () => {
    if (!context.trim()) {
      setMessage('Please enter a context');
      return;
    }

    setPosting(true);

    try {
      const response = await fetch('/api/agent/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post tweet');
      }

      setMessage(`Tweet posted! ${data.tweet}`);
      setContext('');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleAutoMode = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auto_mode: !autoMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setAutoMode(!autoMode);
      setMessage(
        `Auto-mode ${!autoMode ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleLogout = () => {
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            AI Twitter Agent
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">
              @{user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">
                Manual Post
              </h2>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter context for AI to generate tweet..."
                className="w-full h-32 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handlePostTweet}
                disabled={posting}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                {posting ? 'Posting...' : 'Generate & Post Tweet'}
              </button>
            </div>

            {message && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-100">
                {message}
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg h-fit">
            <h2 className="text-lg font-bold text-white mb-4">
              Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Autonomous Mode
                </span>
                <button
                  onClick={handleToggleAutoMode}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    autoMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {autoMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-sm text-slate-400">
                {autoMode
                  ? 'AI is actively monitoring feeds and posting'
                  : 'AI monitor disabled - manual posts only'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
