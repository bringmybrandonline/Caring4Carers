/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E90FF",
          secondary: "#FF441F",
          accent: "#FFDA1F",
          "primary-dark": "#1A75CC",
          "secondary-dark": "#CC3619",
          "accent-dark": "#CCB019",
        },
      },
    },
  },
  plugins: [],
};
