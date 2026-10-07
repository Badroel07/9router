export default function manifest() {
  return {
    name: '67Router - AI Gateway & Proxy',
    short_name: '67Router',
    description: 'Unified AI gateway, model routing, and key infrastructure.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080808',
    theme_color: '#080808',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
