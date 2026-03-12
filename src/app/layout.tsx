import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'WhatsApp Lottery',
  description: 'Lottery ticket booking via WhatsApp',
};

// dynamically load the client-side Providers component to avoid passing class instances
const Providers = dynamic(() => import('../components/Providers'));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
