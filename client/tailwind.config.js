/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Terracotta / Burnt Orange Primary
        primary: {
          50:  '#FDF6F3',
          100: '#FBEAE3',
          200: '#F6D4C6',
          300: '#EEB39E',
          400: '#DE8568',
          500: '#C45A3C', // Main Terracotta Brand
          600: '#B84E32', // Hover / Action
          700: '#9C3E25', // Deep Accent
          800: '#823521',
          900: '#6C2E1E',
          950: '#3D160C',
        },
        terracotta: {
          50:  '#FDF6F3',
          100: '#FBEAE3',
          200: '#F6D4C6',
          300: '#EEB39E',
          400: '#DE8568',
          500: '#C45A3C',
          600: '#B84E32',
          700: '#9C3E25',
          800: '#823521',
          900: '#6C2E1E',
        },
        // Warm ivory / sand neutrals
        warm: {
          50:  '#FAF8F3', // Main background warm ivory
          100: '#F4EFE6', // Soft secondary bg
          200: '#E8E2D6', // Border warm light
          300: '#DDD5C7', // Border warm dark / subtle divider
          400: '#B5ABA0', // Placeholder
          500: '#8A847D', // Muted text
          600: '#66615C', // Secondary text
          700: '#4A4642', // Strong body text
          800: '#33302D', // Heading text
          900: '#1F1E1D', // Primary dark
        },
        sage: {
          50:  '#F2F7F4',
          100: '#E1EFE7',
          500: '#3D7856',
          600: '#336548',
          700: '#285139',
        },
        amber: {
          50:  '#FEF9F0',
          100: '#FDF2DC',
          500: '#C48427',
          600: '#B46B18',
          700: '#94540F',
        },
        brick: {
          50:  '#FDF3F3',
          100: '#FCE5E5',
          500: '#BC4747',
          600: '#A83838',
          700: '#8E2C2C',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgba(40, 30, 20, 0.04)',
        'warm': '0 2px 8px -2px rgba(40, 30, 20, 0.08), 0 1px 4px -1px rgba(40, 30, 20, 0.04)',
        'warm-md': '0 6px 16px -4px rgba(40, 30, 20, 0.1), 0 2px 6px -2px rgba(40, 30, 20, 0.05)',
        'warm-lg': '0 12px 24px -6px rgba(40, 30, 20, 0.12), 0 4px 10px -3px rgba(40, 30, 20, 0.06)',
      },
    },
  },
  plugins: [],
};
