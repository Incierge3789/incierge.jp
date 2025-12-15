/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,md,mdx,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        'page': '880px',
      },
      colors: {
        indigoDeep: '#0A2342', // Keeping existing
        gold: '#B9975B',       // Keeping existing
        ink: {
          DEFAULT: '#111111',
          soft: '#4b5563',
          mute: '#9ca3af',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f9fafb',
        },
        borderline: '#d1d5db',
        accent: {
          aegis: '#3b82f6',
        },
      },
      borderWidth: {
        'hairline': '0.5px',
      },
      fontFamily: {
        heading: ['Inter','system-ui','sans-serif'],
        body: ['"Noto Sans JP"','system-ui','sans-serif'],
      },
    },
  },
  plugins: [
    typography(),
  ],
};
