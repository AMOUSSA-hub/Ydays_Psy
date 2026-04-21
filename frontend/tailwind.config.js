/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design palette — purples & lavenders
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#E0E0FF',
          300: '#D0D0FF',
          400: '#B0B0E0',
          500: '#9A8EC1',
          600: '#7E6BAD',
          700: '#6B5B95',
        },
        orchid: {
          light: '#B8A9D4',
          DEFAULT: '#9B86C2',
          dark: '#7E6BAD',
        },
        periwinkle: {
          light: '#C5CCEF',
          DEFAULT: '#A0B0E8',
          dark: '#8090D0',
        },
      },
    },
  },
  plugins: [],
};

