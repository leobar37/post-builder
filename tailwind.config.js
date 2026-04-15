/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // UI surfaces
        'ui-bg-primary': '#0f1117',
        'ui-bg-secondary': '#1a1d27',
        'ui-bg-card': '#252836',
        'ui-bg-input': '#1f2937',
        'ui-bg-hover': '#2a2d3a',
        'ui-border': '#2a2d3a',
        'ui-border-subtle': '#1f2937',
        // Text
        'ui-text-primary': '#f9fafb',
        'ui-text-secondary': '#9ca3af',
        'ui-text-muted': '#6b7280',
        // Brand orange preserved
        'gs-orange': '#F57E24',
        'gs-orange-light': '#FF9144',
        'gs-orange-dark': '#E56614',
        'gs-dark': '#2D3C53',
        'gs-dark-light': '#3D4C63',
        'gs-dark-darker': '#1D2C43',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
