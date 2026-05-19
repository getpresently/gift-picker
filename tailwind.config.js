/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        selected: "#FF5D81",
        unselected: "#F9FBFF",
        deepGrey: "#444253",
        midGrey: "#AEAFB7",
        deepBlack: "#272833",
      },
      maxWidth: {
        xxs: "16rem",
      },
    },
  },
  plugins: [],
};
