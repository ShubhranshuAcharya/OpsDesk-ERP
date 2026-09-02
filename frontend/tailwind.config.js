/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ops-bg-base': 'var(--color-bg-base)',
        'ops-bg-surface': 'var(--color-bg-surface)',
        'ops-border-default': 'var(--color-border-default)',
        'ops-border-strong': 'var(--color-border-strong)',
        'ops-text-primary': 'var(--color-text-primary)',
        'ops-text-secondary': 'var(--color-text-secondary)',
        'ops-text-muted': 'var(--color-text-muted)',
        'ops-primary': 'var(--color-primary)',
        'ops-primary-hover': 'var(--color-primary-hover)',
        'ops-success': 'var(--color-success)',
        'ops-success-bg': 'var(--color-success-bg)',
        'ops-warning': 'var(--color-warning)',
        'ops-warning-bg': 'var(--color-warning-bg)',
        'ops-danger': 'var(--color-danger)',
        'ops-danger-bg': 'var(--color-danger-bg)',
        'ops-info': 'var(--color-info)',
        'ops-info-bg': 'var(--color-info-bg)'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ops-xs': ['12px', '16px'],
        'ops-sm': ['13px', '18px'],
        'ops-base': ['14px', '20px'],
        'ops-lg': ['16px', '24px'],
        'ops-xl': ['24px', '32px'],
      },
      borderRadius: {
        'ops-sm': '6px',
        'ops-md': '8px',
        'ops-full': '9999px',
      },
      boxShadow: {
        'ops-sm': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
      }
    },
  },
  plugins: [],
}
