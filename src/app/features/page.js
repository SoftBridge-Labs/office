import Link from 'next/link';
import { allFeatures, products } from '../products/productData';
import styles from './features.module.css';

export const metadata = {
  title: 'Features | SoftBridge Workspace',
  description: 'Discover all SoftBridge features: real-time messaging, video conferencing, calendar scheduling, document collaboration, task management, customer support, link bookmarking, and visual whiteboarding.',
  openGraph: {
    title: 'Complete Feature Suite | SoftBridge',
    description: 'Everything you need for modern team collaboration. Explore the full range of capabilities across SoftBridge Workspace.',
    type: 'website',
    url: 'https://softbridgelabs.in/features',
  },
  keywords: 'collaboration features, team productivity, communication platform, project management tools, enterprise software'
};

export default function FeaturesPage() {
  const categories = [
    {
      title: 'Communication',
      description: 'Keep your team connected in real-time',
      features: allFeatures.communication,
      icon: '💬'
    },
    {
      title: 'Scheduling & Meetings',
      description: 'Manage time and meetings effortlessly',
      features: allFeatures.scheduling,
      icon: '📅'
    },
    {
      title: 'Video & Audio',
      description: 'Crystal-clear conferencing and streaming',
      features: allFeatures.video,
      icon: '📹'
    },
    {
      title: 'Productivity',
      description: 'Create, collaborate, and organize work',
      features: allFeatures.productivity,
      icon: '⚡'
    },
    {
      title: 'Support & Tickets',
      description: 'AI-powered customer support at scale',
      features: allFeatures.support,
      icon: '🎯'
    },
    {
      title: 'Organization',
      description: 'Centralize and share knowledge',
      features: allFeatures.organization,
      icon: '📚'
    },
    {
      title: 'Visual Collaboration',
      description: 'Brainstorm and design together',
      features: allFeatures.collaboration,
      icon: '🎨'
    }
  ];

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
            <Link href="/products">Products</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login" className={styles.signIn}>Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1>Complete Feature Suite</h1>
          <p>Everything you need for modern team collaboration. Explore the full range of capabilities across SoftBridge Workspace.</p>
        </div>
      </section>

      {/* Feature Categories */}
      <section className={styles.categoriesSection}>
        <div className={styles.container}>
          <div className={styles.categoriesGrid}>
            {categories.map((category, idx) => (
              <div key={idx} className={styles.categoryCard}>
                <div className={styles.categoryIcon}>{category.icon}</div>
                <h2>{category.title}</h2>
                <p className={styles.categoryDesc}>{category.description}</p>
                <ul className={styles.featureList}>
                  {category.features.map((feature, i) => (
                    <li key={i}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Using Features */}
      <section className={styles.productsFeatures}>
        <div className={styles.container}>
          <h2>Where These Features Live</h2>
          <p>Each product is built with these capabilities to power your team</p>
          <div className={styles.productsGrid}>
            {products.map(product => (
              <Link key={product.id} href={product.href} className={styles.productFeatureCard} style={{ '--color': product.color }}>
                <img src={product.icon} alt={product.name} className={styles.productIcon} />
                <h3>{product.name}</h3>
                <p>{product.tagline}</p>
                <div className={styles.productFeaturesList}>
                  {product.features.slice(0, 3).map((feat, i) => (
                    <span key={i} className={styles.badge}>{feat}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className={styles.integration}>
        <div className={styles.container}>
          <h2>Unified Platform Benefits</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>01</div>
              <h3>Seamless Integration</h3>
              <p>All features work together seamlessly. Data flows between products automatically, keeping teams synchronized.</p>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>02</div>
              <h3>Single Identity</h3>
              <p>One login gives access to all tools. Permissions are consistent across the platform for easy management.</p>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>03</div>
              <h3>Real-time Sync</h3>
              <p>Updates propagate instantly across all applications, ensuring everyone has current information.</p>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>04</div>
              <h3>Unified Analytics</h3>
              <p>View activity and metrics across all tools in one dashboard for comprehensive workspace insights.</p>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>05</div>
              <h3>Enterprise Security</h3>
              <p>Bank-level encryption, role-based access control, and audit logs across all features and products.</p>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitNumber}>06</div>
              <h3>Unified Support</h3>
              <p>One support team knows your entire workspace. Faster resolution with complete context.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.comparisonSection}>
        <div className={styles.container}>
          <h2>Feature Availability by Product</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Feature</th>
                  {products.slice(0, 5).map(p => (
                    <th key={p.id}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'Real-time Collaboration',
                  'User Permissions',
                  'File Sharing',
                  'API Access',
                  'Advanced Analytics',
                  'Custom Integrations',
                  'Priority Support',
                  'Enterprise SLA'
                ].map((feature, idx) => (
                  <tr key={idx}>
                    <td className={styles.featureName}>{feature}</td>
                    {products.slice(0, 5).map(p => (
                      <td key={p.id} className={styles.available}>✓</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2>Ready to explore all features?</h2>
          <p>Start your free trial and experience the complete SoftBridge Workspace platform.</p>
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.primaryBtn}>Start Free Trial</Link>
            <Link href="/products" className={styles.secondaryBtn}>View All Products</Link>
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
                {products.slice(0, 4).map(p => (
                  <li key={p.id}><Link href={p.href}>{p.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/products">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link href="/login">Sign In</Link></li>
                <li><a href="mailto:support@softbridgelabs.in">Support</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="https://softbridgelabs.in/legal/privacy/workspace.html">Privacy</a></li>
                <li><a href="https://softbridgelabs.in/legal/terms/workspace.html">Terms</a></li>
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
