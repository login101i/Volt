import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELGEN Generator Ofert",
  description: "Generator ofert dla instalacji elektrycznych",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

