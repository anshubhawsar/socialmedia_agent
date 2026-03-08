'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, LogOut, Zap, Lock, CheckCircle2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PricingSection } from '@/components/pricing-section';
import { AnimatedButton } from '@/components/animated-button';
import { TweetSkeleton, LoadingMessage } from '@/components/skeleton-loader';

interface UserProfile {
  id: string;
  username: string;
  auto_mode: boolean;
  tokens_used: number;
  token_limit: number;
  is_subscribed: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const tokenLimit = user?.is_subscribed ? Infinity : (user?.token_limit ?? 10);
  const tokensUsed = user?.tokens_used ?? 0;
  const tokensRemaining = user?.is_subscribed ? Infinity : Math.max(0, tokenLimit - tokensUsed);
  const usagePercent = user?.is_subscribed || tokenLimit === Infinity
    ? 0
    : Math.min(100, Math.round((tokensUsed / tokenLimit) * 100));
  const isLocked = !user?.is_subscribed && tokenLimit !== Infinity && tokensUsed >= tokenLimit;

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
    if (isLocked) {
      toast.error('Usage limit reached. Upgrade to Pro to continue.', {
        duration: 4000,
      });
      return;
    }

    const topic = context.trim();
    const chosenTweet = selectedOption.trim();

    if (!topic && !chosenTweet) {
      toast.error('Please enter a topic and generate options first', {
        duration: 3000,
      });
      return;
    }

    const toastId = toast.loading('Publishing post...');
    setPosting(true);

    try {
      const response = await fetch('/api/agent/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: topic, tweet: chosenTweet || undefined }),
      });

      const data = await response.json();

      toast.dismiss(toastId);

      if (!response.ok) {
        if (response.status === 402 && data.code === 'TOKEN_LIMIT_REACHED') {
          setUser(prev => prev ? {
            ...prev,
            tokens_used: data.tokensUsed ?? prev.tokens_used,
            token_limit: data.tokenLimit ?? prev.token_limit,
            is_subscribed: data.isSubscribed ?? prev.is_subscribed,
          } : prev);
          toast.error('Free plan limit reached. Upgrade to Pro for unlimited posting.', {
            duration: 5000,
          });
          return;
        }
        throw new Error(data.error || 'Failed to post tweet');
      }

      setUser(prev => prev ? {
        ...prev,
        tokens_used: data.tokensUsed ?? prev.tokens_used,
        token_limit: data.tokenLimit ?? prev.token_limit,
        is_subscribed: data.isSubscribed ?? prev.is_subscribed,
      } : prev);

      if (data.manualRequired) {
        if (data.intentUrl) {
          window.open(data.intentUrl, '_blank', 'noopener,noreferrer');
        }
        toast.success('Draft opened in X Composer for review.', {
          duration: 4000,
        });
      } else {
        toast.success('Post published successfully.', {
          duration: 4000,
        });
      }
      
      // Clear form
      setContext('');
      setOptions([]);
      setSelectedOption('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post tweet', {
        duration: 4000,
      });
    } finally {
      toast.dismiss(toastId);
      setPosting(false);
    }
  };

  const handleGenerateOptions = async () => {
    if (isLocked) {
      toast.error('Usage limit reached. Upgrade to Pro to continue.', {
        duration: 4000,
      });
      return;
    }

    const topic = context.trim();
    if (!topic) {
      toast.error('Please enter a topic first', {
        duration: 3000,
      });
      return;
    }

    const toastId = toast.loading('Generating post options...');
    setGenerating(true);

    try {
      const response = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      
      toast.dismiss(toastId);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tweet options');
      }

      const nextOptions: string[] = Array.isArray(data.options) ? data.options : [];
      setOptions(nextOptions);
      setSelectedOption(nextOptions[0] || '');
      
      toast.success(`Generated ${nextOptions.length} post options.`, {
        duration: 3000,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate options', {
        duration: 4000,
      });
    } finally {
      toast.dismiss(toastId);
      setGenerating(false);
    }
  };

  const handleToggleAutoMode = async () => {
    const toastId = toast.loading('Updating autonomous mode setting...');
    
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
      toast.success(`Autonomous mode ${!autoMode ? 'enabled' : 'disabled'}.`, {
        duration: 3000,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle auto-mode', {
        duration: 4000,
      });
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    const toastId = toast.loading('Activating Pro plan...');
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_subscribed: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Upgrade failed');
      }

      setUser(prev => prev ? {
        ...prev,
        is_subscribed: true,
        token_limit: -1,
      } : prev);
      
      toast.success('Pro plan activated. Unlimited tokens enabled.', {
        duration: 5000,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upgrade failed', {
        duration: 4000,
      });
    } finally {
      toast.dismiss(toastId);
      setUpgrading(false);
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
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Social Media Manager
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
            <div className="relative bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg overflow-hidden">
              <h2 className="text-xl font-bold text-white mb-4">
                Topic To Tweet Options
              </h2>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter a topic (e.g. AI agents for customer support)"
                className="w-full h-32 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateOptions}
                  disabled={generating || posting}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  {generating ? 'Generating...' : 'Generate Post Options'}
                </button>
                <button
                  onClick={handlePostTweet}
                  disabled={posting || generating || !selectedOption}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  {posting ? 'Publishing...' : 'Publish Selected Option'}
                </button>
              </div>

              {options.length > 0 && (
                <div className="mt-6 space-y-3">
                  {options.map((option, idx) => (
                    <label
                      key={`${idx}-${option.slice(0, 20)}`}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOption === option
                          ? 'border-blue-500 bg-slate-700'
                          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="tweet-option"
                          checked={selectedOption === option}
                          onChange={() => setSelectedOption(option)}
                          className="mt-1"
                        />
                        <span className="text-slate-200 text-sm">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {isLocked && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
                  <p className="text-white text-lg font-semibold">Free Plan Limit Reached</p>
                  <p className="text-slate-300 mt-2 max-w-md">
                    You used all 10 free tokens. Upgrade to Pro to unlock unlimited tweet generation and posting.
                  </p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={upgrading || !!user?.is_subscribed}
                    className="mt-4 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white font-semibold"
                  >
                    {upgrading ? 'Upgrading...' : user?.is_subscribed ? 'Pro Active' : 'Upgrade to Pro'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg h-fit">
            <h2 className="text-lg font-bold text-white mb-4">
              Settings
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-300">Token Usage</span>
                  <span className="text-white font-semibold">
                    {user.is_subscribed ? 'Unlimited' : `${tokensUsed}/10`}
                  </span>
                </div>
                {!user.is_subscribed && (
                  <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 shadow-[0_0_14px_rgba(59,130,246,0.7)]"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {user.is_subscribed
                    ? 'Pro plan active. Unlimited posting enabled.'
                    : `${tokensRemaining} free token${tokensRemaining === 1 ? '' : 's'} remaining.`}
                </p>
              </div>

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

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Choose Your Plan</h2>
          <p className="text-slate-400 text-center mb-6">Starter includes 10 tokens. Pro unlocks unlimited generation and posting.</p>
          <PricingSection
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
            isSubscribed={!!user?.is_subscribed}
          />
        </section>
      </main>
      </div>
    </>
  );
}
