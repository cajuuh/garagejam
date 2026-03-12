/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Add this line to allow manual/hybrid theme switching
  darkMode: "class",

  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
