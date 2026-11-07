/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './client/src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-slate-400',
    'bg-blue-500', 'bg-indigo-500', 'bg-green-500', 'bg-emerald-500',
    'bg-amber-400', 'bg-purple-500', 'bg-pink-500',
    'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-slate-400',
    'text-amber-400', 'text-purple-400', 'text-pink-400', 'text-emerald-400',
    'text-rose-400', 'text-blue-400', 'text-indigo-400',
    'w-5', 'h-5', 'w-6', 'h-6', 'w-7', 'h-7', 'w-8', 'h-8',
  ],
};
