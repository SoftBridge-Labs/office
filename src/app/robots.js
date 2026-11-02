const baseUrl = 'https://softbridgelabs.in';

export default function robots() {
  return {
    rules: { 
      userAgent: '*', 
      allow: ['/services', '/services/', '/products', '/products/', '/features', '/pricing'] 
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
