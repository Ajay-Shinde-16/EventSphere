/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F19',
        surface: '#171E2E',
        surface2: '#1E2840',
        surface3: '#243050',
        cyan: '#00F2FE',
        cyan2: '#00D4E0',
        purple: '#9B51E0',
        mint: '#05FF9B',
        silver: '#E2E8F0',
        muted: '#8892A4',
        pink: '#FF4081',
        amber: '#FFB300',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'border-anim': 'borderAnim 4s linear infinite',
        'pulse-dot': 'pulseDot 2s infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.3s ease',
      },
    },
  },
  plugins: [],
}