/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#f2cc0d",
        "background-light": "#f8f6f6",
        "background-dark": "#121212",
        "card-dark": "#1e1e1e",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      }
    },
  },
  plugins: [],
}
