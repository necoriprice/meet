import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RIPRICE Meet',
    short_name: 'RIPRICE Meet',
    description: 'リプライス株式会社 社内向けビデオ会議システム',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0b',
    theme_color: '#003e86',
    icons: [
      {
        src: '/images/riprice/riprice-meet-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/riprice/riprice-meet-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
