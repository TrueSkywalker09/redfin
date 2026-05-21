/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F5F4F2',
        surface: '#FFFFFF',
        border: '#E2E0DC',
        'text-primary': '#1C1C1A',
        'text-muted': '#6B6A67',
        accent: '#5C6B4E',
        'accent-light': '#EEF1EA',
        danger: '#C0392B',
        warning: '#A86500',
        success: '#2E7D5E',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      maxWidth: {
        app: '1200px',
      },
      spacing: {
        sidebar: '220px',
        'sidebar-collapsed': '64px',
      },
    },
  },
  plugins: [],
}
