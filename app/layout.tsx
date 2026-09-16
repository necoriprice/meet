import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

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
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
