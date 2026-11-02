import Link from 'next/link';
import { products } from '../productData';
import styles from './product.module.css';

export async function generateStaticParams() {
  return products.map(product => ({
    slug: product.id
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || '').toLowerCase();
  const product = products.find(p => p.id === slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | SoftBridge',
      description: 'The product you are looking for does not exist.',
    };
  }

  return {
    title: `${product.name} | SoftBridge Workspace`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} - ${product.tagline} | SoftBridge`,
      description: product.shortDescription,
      type: 'website',
      url: `https://softbridgelabs.in/products/${product.id}`,
    },
    keywords: `${product.name}, ${product.tagline}, team collaboration, workspace tools`
  };
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || '').toLowerCase();
  
  const product = products.find(p => p.id === slug);

  if (!product) {
    return (
      <main className={styles.notFound}>
        <div className={styles.container}>
          <h1>Product Not Found</h1>
          <p>Sorry, we couldn't find the product you're looking for.</p>
          <Link href="/products" className={styles.backLink}>View All Products</Link>
        </div>
      </main>
    );
  }

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 3);

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
            <Link href="/products">All Products</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login" className={styles.signIn}>Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero} style={{ '--product-color': product.color }}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <img src={product.icon} alt={product.name} className={styles.icon} />
            <h1>{product.name}</h1>
            <p className={styles.tagline}>{product.tagline}</p>
            <div className={styles.ctaButtons}>
              <Link href="/login" className={styles.primaryBtn}>Get Started</Link>
              <Link href="/pricing" className={styles.secondaryBtn}>View Plans</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Description Section */}
      <section className={styles.descriptionSection}>
        <div className={styles.container}>
          <div className={styles.descriptionContent}>
            <div className={styles.descriptionText}>
              <h2>Everything You Need to Know</h2>
              <p>{product.longDescription}</p>
              <div className={styles.descriptionHighlights}>
                {product.benefits.slice(0, 3).map((benefit, idx) => (
                  <div key={idx} className={styles.highlightItem}>
                    <div className={styles.highlightIcon}>✓</div>
                    <div>
                      <h3>{benefit.split(' ')[0]}</h3>
                      <p>{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.descriptionImage}>
              <img src={product.icon} alt={product.name} style={{ width: '280px', height: '280px', opacity: 0.9 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2>Key Features</h2>
          <div className={styles.featureGrid}>
            {product.features.map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ backgroundColor: product.color }}>✓</div>
                <p>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.container}>
          <h2>Why Choose {product.name}?</h2>
          <div className={styles.benefitsList}>
            {product.benefits.map((benefit, idx) => (
              <div key={idx} className={styles.benefitItem}>
                <span className={styles.benefitIcon}>→</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className={styles.useCases}>
        <div className={styles.container}>
          <h2>Perfect For</h2>
          <div className={styles.useCasesGrid}>
            {product.useCases.map((useCase, idx) => (
              <div key={idx} className={styles.useCaseCard} style={{ borderLeftColor: product.color }}>
                <p>{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.related}>
          <div className={styles.container}>
            <h2>Explore Other Products</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map(p => (
                <Link key={p.id} href={p.href} className={styles.relatedCard}>
                  <img src={p.icon} alt={p.name} />
                  <h3>{p.name}</h3>
                  <p>{p.shortDescription}</p>
                  <span className={styles.arrow}>Learn more →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Ready to get started?</h2>
          <p>Join teams using SoftBridge to work more clearly and move together.</p>
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.primaryBtn}>Open Workspace</Link>
            <Link href="/pricing" className={styles.secondaryBtn}>Compare Plans</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div>
              <h4>Products</h4>
              <ul>
                {products.slice(0, 4).map(p => (
                  <li key={p.id}><Link href={p.href}>{p.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/login">Sign In</Link></li>
                <li><a href="mailto:support@softbridge.com">Support</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; 2026 SoftBridge Labs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
