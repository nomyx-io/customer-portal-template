import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        nomyx: {
          main1: {
            light: "#1568DB",
            dark: "#1568DB",
          },
          main2: {
            light: "#3F206B",
            dark: "#3F206B",
          },
          gradient: {
            light: "linear-gradient(0deg, #3F206B 50%, #3E81C8 50%)",
            dark: "linear-gradient(0deg, #3F206B 50%, #3E81C8 50%)",
          },
          secondary: {
            light: "#D27685",
            dark: "#D27685",
          },
          text: {
            light: "#1F1F1F",
            dark: "#DCDCDC",
          },
          dark1: {
            light: "#F1F5F9",
            dark: "#000000",
          },
          dark2: {
            light: "#FEFEFE",
            dark: "#141414",
          },
          gray1: {
            light: "#484848",
            dark: "#BBBBBB",
          },
          gray2: {
            light: "#626262",
            dark: "#878787",
          },
          gray3: {
            light: "#878787",
            dark: "#626262",
          },
          gray4: {
            light: "#BBBBBB",
            dark: "#484848",
          },
          success: {
            light: "#409C43",
            dark: "#409C43",
          },
          warning: {
            light: "#DC9B1B",
            dark: "#DC9B1B",
          },
          danger: {
            light: "#EB5757",
            dark: "#EB5757",
          },
          blue: {
            light: "#3396ff",
            dark: "#3396ff",
          },
          violet: {
            light: "#3F206B",
            dark: "#3F206B",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
