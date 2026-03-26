import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/chat', '/settings', '/admin', '/onboarding'],
    },
    sitemap: 'https://mochi-match.com/sitemap.xml',
  };
}
