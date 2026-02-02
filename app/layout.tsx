import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Atlas Cockpit",
  description: "Real-time visual monitoring for Atlas AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#18181B]">
      <body className="h-full antialiased">
        <Header />
        <div className="has-header">
          {children}
        </div>
      </body>
    </html>
  );
}
