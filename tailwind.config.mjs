/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,md,mdx,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: { indigoDeep: '#0A2342', gold: '#B9975B' },
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
