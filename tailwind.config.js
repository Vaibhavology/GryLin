/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // The "GryLin" Identity
        primary: '#2563EB',    // Trust Blue (Buttons, Active Tabs, Logo)
        secondary: '#0F172A',  // Obsidian (Headings, Main Text)
        background: '#F8FAFC', // Ceramic (App Background - NOT White)
        surface: '#FFFFFF',    // Pure White (Cards, Modals, Bottom Sheets)
        
        // Semantic Colors
        ai: '#7C3AED',         // Neural Violet (Magic/AI Features)
        success: '#16A34A',    // Growth Green (Paid, Safe)
        danger: '#DC2626',     // Alert Red (Scams, Overdue)
        subtext: '#64748B',    // Slate 500 (Secondary Text)
        border: '#E2E8F0',     // Slate 200 (Subtle Borders)
        
        // Extended palette
        'primary-light': '#DBEAFE',
        'ai-light': '#EDE9FE',
        'success-light': '#DCFCE7',
        'danger-light': '#FEE2E2',
      },
      fontFamily: {
        sans: ['Inter', 'System', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'button': '0 4px 14px rgba(37, 99, 235, 0.25)',
      },
    },
  },
  plugins: [],
};
