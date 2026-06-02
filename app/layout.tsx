import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Listing Doctor",
  description: "An AI-style listing quality assistant for vehicle marketplace sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
