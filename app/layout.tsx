import type { Metadata } from "next";
import "./globals.css";

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
      <body className="h-full antialiased overflow-hidden flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
