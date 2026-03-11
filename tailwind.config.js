/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        backgroundAuthLight: 'var(--color-background-auth-light)',
        backgroundAuthDark: 'var(--color-background-auth-dark)',
        inputBorderLight: 'var(--color-input-border-light)',
        inputBorderDark: 'var(--color-input-border-dark)',
        textLight: 'var(--color-text-light)',
        textDark: 'var(--color-text-dark)',
      },
    },
  },
  plugins: [],
};