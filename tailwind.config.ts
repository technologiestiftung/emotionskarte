import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern:
        /(bg|text|border)-emo-(stress|happy|loneliness|anxiety|energy|envbeauty|envinteresting|envsafety|envcrowded|environmentgreeness)/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#e6f7f7",
          100: "#9de1e0",
          200: "#52c7c4",
          300: "#19b3ab",
          400: "#009a92",
        },
        night: {
          900: "#050b12",
          950: "#02070d",
        },
        emo: {
          black: "#09090B",
          blacktext: "#2F2E38",
          greytext: "#928FA3",

          stress: "#CD3F32",
          happy: "#F8D130",
          loneliness: "#0F29DB",
          anxiety: "#65509E",
          energy: "#04BEAC",

          envbeauty: "#CD3F32",
          envinteresting: "#F8D130",
          envsafety: "#0F29DB",
          envcrowded: "#65509E",
          environmentgreeness: "#04BEAC",
        },
      },
      boxShadow: {
        sidebar: "0 25px 80px -40px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(82,199,196,0.35), 0 10px 30px -12px rgba(0,0,0,0.75)",
      },
      backgroundImage: {
        "panel-gradient":
          "linear-gradient(135deg, rgba(12,37,45,0.92) 0%, rgba(6,22,29,0.96) 55%, rgba(4,15,22,0.98) 100%)",
        "metric-card":
          "linear-gradient(160deg, rgba(19,179,171,0.18) 0%, rgba(0,154,146,0.08) 55%, rgba(0,154,146,0.04) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
