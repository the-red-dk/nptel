import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { display: ["var(--font-display)", "sans-serif"], sans: ["var(--font-sans)", "sans-serif"] }, colors: { ink: "#171717", paper: "#fbfaf7" }, boxShadow: { card: "5px 5px 0 #171717" } } }, plugins: [] } satisfies Config;
