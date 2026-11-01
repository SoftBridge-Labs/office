const baseUrl = 'https://softbridgelabs.in';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: ['/services', '/services/'] },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
