'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'type'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  type = 'button',
  disabled,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30 focus:ring-sky-500 disabled:bg-slate-600 disabled:shadow-none',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-md focus:ring-slate-500 disabled:bg-slate-800',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 focus:ring-slate-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17
      }}
      {...props}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </motion.div>
      )}
      {!loading && icon && icon}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </motion.button>
  );
}
