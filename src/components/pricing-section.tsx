'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

interface PricingSectionProps {
  onUpgrade: () => void;
  upgrading: boolean;
  isSubscribed: boolean;
}

export function PricingSection({ onUpgrade, upgrading, isSubscribed }: PricingSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto p-2">
      <motion.div
        whileHover={{ y: -5 }}
        className="relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg"
      >
        <h3 className="text-xl font-bold text-white">Starter</h3>
        <div className="my-4 text-4xl font-black text-white">Free</div>
        <p className="text-slate-400 mb-6">Perfect for trying us out.</p>
        <ul className="space-y-3 mb-8 text-slate-200">
          <li className="flex items-center gap-2"><Check size={18} className="text-green-400" /> 10 Free Tokens</li>
          <li className="flex items-center gap-2"><Check size={18} className="text-green-400" /> Basic Analytics</li>
        </ul>
        <button
          type="button"
          className="w-full px-4 py-2 rounded-lg border border-slate-500 text-slate-200"
          disabled
        >
          {isSubscribed ? 'Previously Used' : 'Current Plan'}
        </button>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95 }}
        whileHover={{ scale: 1 }}
        className="relative p-8 rounded-3xl border-2 border-sky-400 bg-gradient-to-b from-sky-400/10 to-transparent backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(56,189,248,0.45)]"
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white">
          Most Popular
        </div>
        <h3 className="text-xl font-bold text-white">Pro Account</h3>
        <div className="my-4 text-4xl font-black text-white">$19<span className="text-lg font-normal text-slate-300">/mo</span></div>
        <ul className="space-y-3 mb-8 text-slate-100">
          <li className="flex items-center gap-2"><Zap size={18} className="text-yellow-400 fill-yellow-400" /> Unlimited Tokens</li>
          <li className="flex items-center gap-2"><Check size={18} className="text-green-400" /> Priority Support</li>
          <li className="flex items-center gap-2"><Check size={18} className="text-green-400" /> Custom Twitter Branding</li>
        </ul>
        <button
          type="button"
          onClick={onUpgrade}
          disabled={upgrading || isSubscribed}
          className="w-full px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-sky-500/30"
        >
          {isSubscribed ? 'Pro Active' : upgrading ? 'Upgrading...' : 'Upgrade Now'}
        </button>
      </motion.div>
    </div>
  );
}
