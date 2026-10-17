import type { Metadata } from 'next';
import { GlobalStyleProvider } from '@/components/GlobalStyleProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ELGEN · Volt — Generator Ofert',
  description: 'Generator ofert dla instalacji elektrycznych',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <GlobalStyleProvider>{children}</GlobalStyleProvider>
      </body>
    </html>
  );
}
