/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        gray: {
          ultradark: 'hsl(var(--gray-ultradark))',
          darkest: 'hsl(var(--gray-darkest))',
          darker: 'hsl(var(--gray-darker))',
          dark: 'hsl(var(--gray-dark))',
          DEFAULT: 'hsl(var(--gray))',
          light: 'hsl(var(--gray-light))',
          lighter: 'hsl(var(--gray-lighter))',
          lightest: 'hsl(var(--gray-lightest))',
        },
        yellow: {
          dark: 'hsl(var(--yellow-dark))',
          DEFAULT: 'hsl(var(--yellow))',
        },
        red: 'hsl(var(--red))',
        orange: 'hsl(var(--orange))',
        green: 'hsl(var(--green))',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Monocraft', 'Courier New', 'monospace'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'spin-y': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
      },
      animation: {
        'spin-y': 'spin-y 1.5s linear infinite',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: false,
    base: false,
    styled: true,
    utils: true,
  },
}

