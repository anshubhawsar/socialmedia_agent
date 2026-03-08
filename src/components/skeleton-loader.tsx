'use client';

import { motion } from 'framer-motion';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded-lg animate-shimmer" />
    </div>
  );
}

export function TweetSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50"
    >
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-32 rounded" />
          <SkeletonLoader className="h-3 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLoader className="h-4 w-full rounded" />
        <SkeletonLoader className="h-4 w-5/6 rounded" />
        <SkeletonLoader className="h-4 w-4/6 rounded" />
      </div>
      <div className="flex gap-2">
        <SkeletonLoader className="h-6 w-16 rounded-full" />
        <SkeletonLoader className="h-6 w-16 rounded-full" />
      </div>
    </motion.div>
  );
}

export function LoadingMessage({ messages }: { messages: string[] }) {
  const [currentMessage, setCurrentMessage] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      key={currentMessage}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="text-sky-400 text-sm font-medium"
    >
      {messages[currentMessage]}
    </motion.div>
  );
}

import React from 'react';
