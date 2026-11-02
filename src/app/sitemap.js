const baseUrl = 'https://softbridgelabs.in';
const serviceSlugs = ['calendar', 'docs', 'tasks', 'meet', 'ping', 'tickets', 'whiteboard', 'booking'];
const productSlugs = ['ping', 'calendar', 'meet', 'booking', 'tasks', 'docs', 'tickets', 'bookmarks', 'whiteboard'];

export default function sitemap() {
  const now = new Date();
  return [
    // Main pages
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/features`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    
    // Individual product pages
    ...productSlugs.map(slug => ({
      url: `${baseUrl}/products/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85
    })),
    
    // Services (legacy - kept for backward compatibility)
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...serviceSlugs.map(slug => ({
      url: `${baseUrl}/services/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    }))
  ];
}
