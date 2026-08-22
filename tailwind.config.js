/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      animation: {
        "bounce-slow": "bounceSlow 2.4s ease-in-out infinite",
      },
      keyframes: {
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        panel: "0 12px 40px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: [
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          '"Noto Sans KR"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
