/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ateneo: {
          blue: '#003366',
          gold: '#C5A900',
        },
      },
    },
  },
  plugins: [],
};
