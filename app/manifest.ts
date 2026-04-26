// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KES Carburant',
    short_name: 'KES Carburant',
    description: 'Application de suivi de consommation carburant',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3B82F6',
    orientation: 'portrait',
    scope: '/',
    lang: 'fr',
    categories: ['business', 'lifestyle', 'utilities'],
    icons: [
      // Android
      {
        src: '/icons/launchericon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/launchericon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/launchericon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/launchericon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/launchericon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/launchericon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // iOS (les plus grandes tailles pour l'affichage)
      {
        src: '/icons/152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/180.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Nouvelle recharge',
        url: '/user/refuels',
        icons: [{ src: '/icons/launchericon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Mes véhicules',
        url: '/user/dashboard',
        icons: [{ src: '/icons/launchericon-96x96.png', sizes: '96x96' }],
      },
    ],
  };
}