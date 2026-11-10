/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kid-friendly core palette
        sunny: {
          50: '#FFFDEB',
          100: '#FFF9C4',
          200: '#FFF185',
          300: '#FFE647',
          DEFAULT: '#FFD12E',
          500: '#F5B800',
          600: '#D49B00',
          dark: '#B08000',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          DEFAULT: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          dark: '#0369A1',
        },
        coral: {
          50: '#FFF2F2',
          100: '#FFE2E2',
          200: '#FFC7C7',
          300: '#FFA0A0',
          DEFAULT: '#FF6B6B',
          500: '#F03E3E',
          600: '#D92626',
          dark: '#B81414',
        },
        mint: {
          50: '#EDFCF5',
          100: '#D3F8E5',
          200: '#AAF0CE',
          300: '#73E3B1',
          DEFAULT: '#3FD094',
          500: '#20B276',
          600: '#14925F',
          dark: '#0D7349',
        },
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          DEFAULT: '#B388FF',
          500: '#9055FF',
          600: '#792EE8',
          dark: '#621BCA',
        },
        starBg: '#F7FAFC',
        cardBg: '#FFFFFF',
        kidDark: '#1E293B',
      },
      fontFamily: {
        heading: ['"Fredoka"', 'sans-serif'],
        body: ['"Nunito"', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'bouncy': '0 6px 0 0 rgba(0, 0, 0, 0.12)',
        'bouncy-hover': '0 8px 0 0 rgba(0, 0, 0, 0.15)',
        'bouncy-active': '0 2px 0 0 rgba(0, 0, 0, 0.15)',
        'bubble-card': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'glow-sunny': '0 0 20px 4px rgba(255, 209, 46, 0.4)',
        'glow-sky': '0 0 20px 4px rgba(56, 189, 248, 0.4)',
        'glow-mint': '0 0 20px 4px rgba(63, 208, 148, 0.4)',
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      },
    },
  },
  plugins: [],
};
