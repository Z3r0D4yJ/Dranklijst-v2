/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Semantic token aliases → CSS vars */
        bg:         'var(--color-bg)',
        surface:    'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border:     'var(--color-border)',
        'border-mid': 'var(--color-border-mid)',

        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',

        header:    'var(--color-header)',
        'header-fg': 'var(--color-header-fg)',

        primary: {
          DEFAULT: 'var(--color-primary)',
          pale:    'var(--color-primary-pale)',
          border:  'var(--color-primary-border)',
          on:      'var(--color-primary-on)',
          /* legacy aliases */
          dark:    '#1E3A8A',
          light:   '#3B82F6',
        },

        accent: {
          DEFAULT: 'var(--color-accent)',
          bg:      'var(--color-accent-bg)',
          on:      'var(--color-accent-on)',
          border:  'var(--color-accent-border)',
        },

        success: {
          DEFAULT: 'var(--color-success)',
          bg:      'var(--color-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg:      'var(--color-warning-bg)',
          border:  'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          bg:      'var(--color-danger-bg)',
        },

        gold:   'var(--color-gold)',
        silver: 'var(--color-silver)',
        bronze: 'var(--color-bronze)',

        'cat-beer':   { bg: 'var(--color-cat-beer-bg)',   fg: 'var(--color-cat-beer-fg)' },
        'cat-wine':   { bg: 'var(--color-cat-wine-bg)',   fg: 'var(--color-cat-wine-fg)' },
        'cat-soda':   { bg: 'var(--color-cat-soda-bg)',   fg: 'var(--color-cat-soda-fg)' },
        'cat-water':  { bg: 'var(--color-cat-water-bg)',  fg: 'var(--color-cat-water-fg)' },
        'cat-coffee': { bg: 'var(--color-cat-coffee-bg)', fg: 'var(--color-cat-coffee-fg)' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        fab: 'var(--shadow-fab)',
      },
      borderRadius: {
        card:   '16px',
        chip:   '12px',
        button: '12px',
      },
    },
  },
  plugins: [],
}
