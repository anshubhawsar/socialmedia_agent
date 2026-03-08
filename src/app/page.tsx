'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Brain, Rocket, Shield, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          router.push('/dashboard');
        }
      } catch {
        // User not authenticated
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async () => {
    window.location.href = '/api/auth/login';
  };

  const error = searchParams.get('error');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const floatingVariants = {
    float: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
      },
    },
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      desc: 'Create professional posts with cutting-edge Groq AI analysis',
    },
    {
      icon: Rocket,
      title: 'Instant Publishing',
      desc: 'One-click X/Twitter integration with secure OAuth 2.0',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      desc: 'Generate options in seconds, not hours',
    },
    {
      icon: TrendingUp,
      title: 'Autonomous Mode',
      desc: 'Automatic content discovery from RSS feeds',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      desc: 'Bank-level encryption and data protection',
    },
    {
      icon: Sparkles,
      title: 'Pro Features',
      desc: 'Unlimited tokens and premium customization',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Headline */}
          <motion.div variants={itemVariants} className="mb-6">
            <motion.h1
              className="text-7xl md:text-8xl lg:text-9xl font-black text-white leading-tight mb-4 bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Social Media Manager
            </motion.h1>
          </motion.div>

          {/* Subheading */}
          <motion.div variants={itemVariants} className="max-w-3xl mb-8">
            <p className="text-2xl md:text-4xl text-slate-300 font-medium leading-relaxed">
              Generate stunning posts with <span className="text-sky-400 font-bold">AI intelligence</span> and publish with{' '}
              <span className="text-purple-400 font-bold">one click</span>
            </p>
          </motion.div>

          {/* Powered By */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-lg text-slate-400 mb-4">Powered by Groq AI, X API v2 & Vercel Edge</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.span
                className="px-4 py-2 bg-sky-500/20 border border-sky-500/40 rounded-full text-sky-300 text-sm font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                500+ tokens/sec
              </motion.span>
              <motion.span
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-sm font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                99.99% Uptime
              </motion.span>
              <motion.span
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/40 rounded-full text-pink-300 text-sm font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                Zero Setup
              </motion.span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={handleLogin}
              className="relative px-12 py-5 text-2xl font-bold text-white rounded-2xl overflow-hidden group mb-8"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500"
                animate={{ x: ['-100%', '100%'], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative flex items-center gap-3 justify-center">
                Sign in with X <Rocket className="h-6 w-6" />
              </span>
            </motion.button>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 max-w-md"
            >
              <p className="font-bold mb-1">Authentication Error</p>
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="py-20 px-4 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-200px' }}
        >
          <motion.h2
            className="text-6xl md:text-7xl font-black text-center mb-4 bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Powerful Features
          </motion.h2>
          <motion.p
            className="text-center text-xl text-slate-400 max-w-2xl mx-auto mb-16"
            variants={itemVariants}
          >
            Everything you need to dominate social media
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 hover:border-sky-500/50 transition-colors overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                />
                <motion.div
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                >
                  <feature.icon className="h-12 w-12 text-sky-400 mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3 relative">{feature.title}</h3>
                <p className="text-slate-400 text-lg relative">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Modes Section */}
        <motion.div
          className="py-20 px-4 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-6xl md:text-7xl font-black text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Two Powerful Modes
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="group bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-500/30 rounded-3xl p-12 hover:border-blue-400/60 transition-all"
              whileHover={{ scale: 1.02 }}
              variants={itemVariants}
            >
              <motion.div
                className="text-5xl font-black text-blue-400 mb-4"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <h3 className="text-4xl font-bold text-white mb-4">Manual Mode</h3>
              <p className="text-xl text-slate-300 leading-relaxed">
                Type your topic, get 4 AI-generated variations, and publish with one click. Full control in your hands.
              </p>
            </motion.div>

            <motion.div
              className="group bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/30 rounded-3xl p-12 hover:border-purple-400/60 transition-all"
              whileHover={{ scale: 1.02 }}
              variants={itemVariants}
            >
              <motion.div
                className="text-5xl font-black text-purple-400 mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                🤖
              </motion.div>
              <h3 className="text-4xl font-bold text-white mb-4">Autonomous Mode</h3>
              <p className="text-xl text-slate-300 leading-relaxed">
                AI monitors RSS feeds, discovers trending topics, and auto-publishes the best content daily.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer with Himgrow Link */}
        <motion.div
          className="py-12 px-4 border-t border-slate-800/50 mt-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-slate-400 text-lg mb-6">Designed & Built with Animation Excellence</p>
            <motion.a
              href="https://himgrow.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-sky-500/50 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Powered by Himgrow Digitals <ExternalLink className="h-5 w-5" />
            </motion.a>
            <p className="text-slate-500 text-sm mt-6">Animation Company • Digital Excellence</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
