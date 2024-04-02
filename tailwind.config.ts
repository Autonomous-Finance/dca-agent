import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        dmSans: ["var(--font-dmSans)"],
      },
      colors: {
        "main-dark-color": "#222326",
        gray: "#9EA2AA",
        "secondary-gray": "#FBFCFF",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundColor: {
        background: "rgb(var(--background-color))",
      },
      screens: {
        lg: "1280px",
        desktop: "916px",
        tablet: "624px",
        mobile: "482px",
      },
    },
  },
  plugins: [require("daisyui")],
};
export default config;
