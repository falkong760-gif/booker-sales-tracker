import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Booker Sales & Payment Tracking System',
    short_name: 'Booker Sales',
    description: 'A tracking and reconciliation system for bookers, sales, and payments.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F9FA',
    theme_color: '#0F3D5C',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
