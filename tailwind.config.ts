import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#E11D2E',
        'brand-red-hover': '#C81423',
        'surface-canvas': '#0D0E11',
        'surface-card': 'rgba(22, 24, 29, 0.7)',
        'surface-elevated': 'rgba(28, 31, 38, 0.8)',
        'surface-overlay': 'rgba(13, 14, 17, 0.85)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        'surface-border-subtle': 'rgba(255, 255, 255, 0.04)',
        'surface-border-accent': 'rgba(225, 29, 46, 0.35)',
        'text-primary': '#F2F3F5',
        'text-secondary': '#949BA4',
        'text-tertiary': '#6D737F',
        'accent-success': '#23A55A',
        'accent-warning': '#F0B232',
        'accent-danger': '#F23F43',
        'accent-info': '#5865F2',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        'primary-dim': 'var(--color-primary-dim)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
