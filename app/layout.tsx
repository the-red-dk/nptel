import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NPTELBoard — Course insights, together", description: "See how students experienced NPTEL courses. Explore the numbers and add your result." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
