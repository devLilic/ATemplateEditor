/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ui: {
          app: 'rgb(var(--color-ui-app) / <alpha-value>)',
          panel: 'rgb(var(--color-ui-panel) / <alpha-value>)',
          card: 'rgb(var(--color-ui-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-ui-elevated) / <alpha-value>)',
          primary: 'rgb(var(--color-ui-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-ui-text-secondary) / <alpha-value>)',
          disabled: 'rgb(var(--color-ui-text-disabled) / <alpha-value>)',
          accent: 'rgb(var(--color-ui-accent) / <alpha-value>)',
          selected: 'rgb(var(--color-ui-selected) / <alpha-value>)',
          success: 'rgb(var(--color-ui-success) / <alpha-value>)',
          warning: 'rgb(var(--color-ui-warning) / <alpha-value>)',
          danger: 'rgb(var(--color-ui-danger) / <alpha-value>)',
          border: 'rgb(var(--color-ui-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--color-ui-border-strong) / <alpha-value>)',
          focus: 'rgb(var(--color-ui-focus) / <alpha-value>)',
        },
      },
      boxShadow: {
        panel: '0 1px 0 rgb(255 255 255 / 0.03), 0 18px 48px rgb(0 0 0 / 0.24)',
        focus: '0 0 0 3px rgb(var(--color-ui-focus) / 0.35)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
