const baseUrl = 'https://softbridgelabs.in';
const serviceSlugs = ['calendar', 'docs', 'tasks', 'meet', 'ping', 'tickets', 'whiteboard', 'booking'];

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...serviceSlugs.map(slug => ({
      url: `${baseUrl}/services/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    }))
  ];
}
