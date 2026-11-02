import Link from 'next/link';
import { products } from './productData';
import styles from './products.module.css';

export const metadata = {
  title: 'Products | SoftBridge Workspace',
  description: 'Explore all 9 SoftBridge products: Ping (chat), Calendar (scheduling), Meet (video), Booking (appointments), Tasks (management), Docs (collaboration), Tickets (support), Bookmarks (links), and Whiteboard (brainstorming).',
  openGraph: {
    title: 'Complete Workspace Platform | SoftBridge',
    description: 'Everything you need for modern team collaboration. From communication to support, we\'ve built tools that fit the way you work.',
    type: 'website',
    url: 'https://softbridgelabs.in/products',
  },
  keywords: 'team collaboration, workspace platform, project management, communication tools, video conferencing, document collaboration, customer support, scheduling'
};

export default function ProductsPage() {
  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.brand}>
            <span>S</span>
            <span>SoftBridge</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login" className={styles.signIn}>Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1>Complete Workspace Platform</h1>
          <p>Everything you need for modern team collaboration. From communication to support, we've built tools that fit the way you work.</p>
          <Link href="/login" className={styles.cta}>Get Started Now</Link>
        </div>
      </section>

      {/* Products Grid */}
      <section className={styles.productsSection}>
        <div className={styles.container}>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <Link key={product.id} href={product.href} className={styles.productTile} style={{ '--product-color': product.color }}>
                <div className={styles.tileIcon}>
                  <img src={product.icon} alt={product.name} />
                </div>
                <div className={styles.tileContent}>
                  <h2>{product.name}</h2>
                  <p className={styles.tileSummary}>{product.tagline}</p>
                  <p className={styles.tileDescription}>{product.shortDescription}</p>
                  <div className={styles.tileFeatures}>
                    <span className={styles.featureLabel}>Key Features:</span>
                    <ul>
                      {product.features.slice(0, 4).map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                  <span className={styles.tileAction}>Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className={styles.integration}>
        <div className={styles.container}>
          <h2>Everything Works Together</h2>
          <p>All tools are built on a unified platform. Your data flows seamlessly between apps, keeping your team synchronized and productive.</p>
          <div className={styles.integrationGrid}>
            <div className={styles.integrationCard}>
              <h3>Real-time Sync</h3>
              <p>Changes instantly across all applications</p>
            </div>
            <div className={styles.integrationCard}>
              <h3>Unified Identity</h3>
              <p>One login for all workspace tools</p>
            </div>
            <div className={styles.integrationCard}>
              <h3>Shared Permissions</h3>
              <p>Consistent access control everywhere</p>
            </div>
            <div className={styles.integrationCard}>
              <h3>Single Dashboard</h3>
              <p>See all activity in one place</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2>Ready to transform how your team works?</h2>
          <p>Join hundreds of teams using SoftBridge to collaborate more effectively.</p>
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.primaryBtn}>Start Free Trial</Link>
            <Link href="/pricing" className={styles.secondaryBtn}>View Plans</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <h4>Products</h4>
              <ul>
                {products.map(p => (
                  <li key={p.id}><Link href={p.href}>{p.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/login">Sign In</Link></li>
                <li><a href="mailto:support@softbridgelabs.in">Support</a></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="https://softbridgelabs.in/legal/privacy/workspace.html">Privacy</a></li>
                <li><a href="https://softbridgelabs.in/legal/terms/workspace.html">Terms</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} SoftBridge Labs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
