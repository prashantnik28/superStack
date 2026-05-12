/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        accent: '#FF6B9D',
        success: '#4CAF82',
        warning: '#FFB347',
        danger: '#FF6B6B',
      },
    },
  },
  plugins: [],
};
