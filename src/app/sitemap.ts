import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hphrms.com'
  const now = new Date()

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/#features`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/#services`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/#pricing`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: 'https://hpserve.site', lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
  ]
}
