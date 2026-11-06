/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    // Priority dots
    'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-slate-400',
    // Priority text
    'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-slate-400',
    // Column colors
    'bg-slate-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500',
    'bg-purple-500', 'bg-pink-500', 'bg-emerald-500',
    // Column header text
    'text-blue-400', 'text-amber-400', 'text-orange-400',
    'text-purple-400', 'text-pink-400', 'text-emerald-400',
    // Stat card colors
    'text-indigo-400', 'bg-indigo-500/20', 'border-indigo-500/30',
    'text-purple-400', 'bg-purple-500/10', 'border-purple-500/20',
    'text-rose-400', 'bg-rose-500/10', 'border-rose-500/20',
    // Role badge colors
    'bg-red-600/20', 'text-red-300', 'border-red-600/40',
    'bg-purple-600/20', 'text-purple-300', 'border-purple-600/40',
    'bg-blue-600/20', 'text-blue-300', 'border-blue-600/40',
    'bg-emerald-600/20', 'text-emerald-300', 'border-emerald-600/40',
    'bg-amber-600/20', 'text-amber-300', 'border-amber-600/40',
    // Status badge colors
    'bg-slate-600/40', 'bg-blue-600/20', 'bg-amber-600/20', 'bg-orange-600/20',
    'bg-pink-600/20', 'bg-emerald-600/20', 'bg-red-600/20',
    'text-slate-300', 'text-blue-300', 'text-amber-300', 'text-orange-300',
    'text-pink-300', 'text-emerald-300', 'text-red-300',
    'border-slate-600', 'border-blue-600/40', 'border-amber-600/40',
    'border-orange-600/40', 'border-pink-600/40', 'border-emerald-600/40', 'border-red-600/40',
    // Progress bar backgrounds
    'bg-amber-400', 'bg-orange-400', 'bg-purple-400',
    'bg-pink-400', 'bg-emerald-400', 'bg-rose-400',
    // Avatar sizes
    'w-5', 'h-5', 'w-6', 'h-6', 'w-7', 'h-7', 'w-8', 'h-8',
  ],
  theme: { extend: {} },
  plugins: [],
};
