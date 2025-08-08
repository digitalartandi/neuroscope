/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'elevated': '0 10px 30px -12px rgba(16,24,40,.18), 0 8px 16px -8px rgba(16,24,40,.12)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-x': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'gradient-x': 'gradient-x 18s linear infinite alternate',
        'fade-in': 'fadeIn .35s ease both',
      },
      backgroundImage: {
        'radial-faint': 'radial-gradient(60% 60% at 50% 0%, rgba(59,130,246,.25), rgba(255,255,255,0) 70%)',
      },
    },
  },
  plugins: [],
};
