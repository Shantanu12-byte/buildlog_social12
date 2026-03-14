/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        'stone-gray': '#2A2A2A',
        surface: '#2A2A2A',
        'diamond-cyan': '#00F0FF',
        'emerald-green': '#00FF85',
        'gold-yellow': '#FFD700',
        'stark-black': '#000000',
        primary: '#00F0FF',
        'primary-dark': '#00C4CC',
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
        },
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        neubrutalism: '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};
