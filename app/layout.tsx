import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const syne = Syne({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = { title: "NPTELBoard — Course insights, together", description: "See how students experienced NPTEL courses. Explore the numbers and add your result." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${inter.variable} ${syne.variable}`}>{children}</body></html>; }
