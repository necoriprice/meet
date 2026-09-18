import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Outfit, Zen_Kaku_Gothic_New } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

// Outfit: ロゴ・見出し用。Zen Kaku Gothic New: 日本語本文・ボタン等のUI用
const displayFont = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const bodyFont = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RIPRICE Meet',
    template: '%s',
  },
  description: 'リプライス株式会社 社内向けビデオ会議システム',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: {
      rel: 'icon',
      url: '/images/riprice/riprice-meet-logo-256.png',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/riprice/riprice-meet-icon-192.png',
        sizes: '192x192',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#003E86',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body data-lk-theme="default">
        <Toaster />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
