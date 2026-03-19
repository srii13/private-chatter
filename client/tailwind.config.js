/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        instagram: {
          blue: '#0095f6',
          dark: '#000000',
          darkGray: '#121212',
          lightGray: '#262626',
          border: '#363636',
          textHover: '#8e8e8e'
        }
      }
    },
  },
  plugins: [],
}
