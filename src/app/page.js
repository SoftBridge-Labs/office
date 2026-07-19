'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function LandingPage() {
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { 
          const parsed = JSON.parse(localUser);
          setUserProfile(parsed);
          // If user logged in then redirect to /home directly
          router.replace('/home'); 
        } catch (e) { }
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo('.hero-text', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.hero-image', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out' });
      
      gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.fromTo(card, 
          { y: 40, opacity: 0 }, 
          { 
            y: 0, opacity: 1, duration: 0.6, 
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none'
            },
            delay: (i % 3) * 0.1 
          }
        );
      });
      
      gsap.fromTo('.comparison-table', 
        { y: 40, opacity: 0 }, 
        { 
          y: 0, opacity: 1, duration: 0.8, 
          scrollTrigger: {
            trigger: '.comparison-section',
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", "Helvetica Neue", sans-serif', backgroundColor: '#e7eaf4', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 3rem', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', letterSpacing: '-0.04em' }}>SoftBridge.</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/pricing" style={{ textDecoration: 'none', color: '#111', fontWeight: 600, fontSize: '0.95rem' }}>Pricing</Link>
          <Link href="/login" style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            GET STARTED
          </Link>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          /* Glassmorphic Navigation */
          nav {
            padding: 1rem 1.2rem !important;
            position: sticky !important;
            top: 0;
            background: rgba(231, 234, 244, 0.85) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.4);
            z-index: 100 !important;
          }
          .nav-links a:first-child { display: none !important; } /* Hide Pricing */
          .nav-links { display: flex !important; gap: 1rem !important; }
          .nav-links a:last-child {
            padding: 0.6rem 1rem !important;
            font-size: 0.75rem !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
          }
          
          /* Hero Section Refinement */
          .hero-container {
            flex-direction: column !important;
            padding: 2.5rem 1.2rem 2rem 1.2rem !important;
            min-height: auto !important;
            text-align: center;
          }
          .hero-text {
            max-width: 100% !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 0 !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-text h1 {
            font-size: 2.5rem !important;
            margin-bottom: 1rem !important;
            line-height: 1.1 !important;
            background: linear-gradient(135deg, #111 0%, #444 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em !important;
          }
          .hero-text p {
            font-size: 1rem !important;
            text-align: center !important;
            max-width: 100% !important;
            color: #555 !important;
            line-height: 1.5 !important;
          }
          
          /* Hide the small line in hero */
          .hero-text > div > div:first-child { display: none !important; }
          .hero-text > div { justify-content: center !important; }
          
          /* Hide decorative elements that clutter mobile */
          .decorative-star { display: none !important; }
          .badge-1, .badge-2 { display: none !important; }
          
          /* Hero Image */
          .hero-image {
            position: relative !important;
            right: 0 !important;
            max-width: 100% !important;
            height: auto !important;
            margin-top: 1rem !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            padding: 0 !important;
          }
          .hero-image img { 
            max-height: 300px !important; 
            filter: drop-shadow(0 15px 25px rgba(0,0,0,0.1)); 
          }
          
          /* Sections Refinement */
          .features-section {
            padding: 3rem 1.2rem !important;
            border-top-left-radius: 24px !important;
            border-top-right-radius: 24px !important;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.03);
          }
          .comparison-section {
            padding: 3rem 1.2rem !important;
          }
          .features-section h2, .comparison-section h2 {
            font-size: 1.8rem !important;
            line-height: 1.2 !important;
            letter-spacing: -0.02em !important;
          }
          .features-section p, .comparison-section p {
            font-size: 0.95rem !important;
            margin-bottom: 2rem !important;
          }
          
          /* Feature Cards - Mobile Premium Look */
          .features-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .feature-card {
            padding: 1.25rem !important;
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 8px 25px rgba(0,0,0,0.03) !important;
            border-radius: 16px !important;
          }
          .feature-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
          }
          
          /* Comparison Table - Smooth Scroll on Mobile */
          .comparison-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 1rem;
            margin: 0 -1.2rem;
            padding-left: 1.2rem;
            padding-right: 1.2rem;
            scroll-snap-type: x mandatory;
          }
          .comparison-table::-webkit-scrollbar { display: none; }
          .comp-table {
            border-radius: 12px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important;
            border: 1px solid #f1f3f4;
          }
          .comp-table th, .comp-table td {
            padding: 0.75rem 1rem !important;
            font-size: 0.85rem;
          }
          
          /* Footer Refinement */
          footer {
            flex-direction: column;
            gap: 1.2rem;
            text-align: center;
            padding: 2rem 1.2rem !important;
            background: #ffffff !important;
          }
          footer .footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem !important;
          }
        }

        /* Features Section */
        .feature-card {
          background: #fff;
          border-radius: 16px;
          padding: 2rem;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.06);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Table Styles */
        .comp-table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .comp-table th, .comp-table td {
          padding: 1.5rem;
          text-align: left;
          border-bottom: 1px solid #f1f3f4;
        }
        .comp-table th { background: #f8fafc; font-weight: 700; color: '#111'; }
        .comp-table td { color: #444; }
        .comp-table .check { color: #10b981; font-weight: bold; }
        .comp-table .cross { color: #ef4444; opacity: 0.5; }
      `}} />

      {/* Hero Section */}
      <main className="hero-container" style={{ display: 'flex', alignItems: 'center', padding: '0 4rem', maxWidth: '1400px', margin: '0 auto', position: 'relative', width: '100%', minHeight: 'calc(100vh - 100px)' }}>
        
        {/* Decorative Star */}
        <div className="decorative-star" style={{ position: 'absolute', top: '10%', right: '15%', opacity: 0.6 }}>
           <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
             <path d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" fill="#2d3a6c" />
           </svg>
        </div>
        {/* Background shadow blob */}
        <div style={{ position: 'absolute', right: '10%', top: '20%', width: '400px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(160,175,220,0.3) 0%, rgba(231,234,244,0) 70%)', zIndex: 0 }}></div>

        {/* Left Text */}
        <div className="hero-text" style={{ flex: '1', maxWidth: '600px', zIndex: 2, paddingBottom: '4rem' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 400, color: '#111', margin: '0 0 3rem 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Accelerate <br/>
            productivity <strong style={{fontWeight: 800}}>with <br/>
            world-class</strong> <br/>
            workspace tools
          </h1>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '2px', background: '#111', marginTop: '12px' }}></div>
            <p style={{ fontSize: '1.25rem', color: '#333', margin: 0, lineHeight: 1.5, maxWidth: '350px' }}>
              Access powerful workspace tools in a secure, unified and mutually trusted environment.
            </p>
          </div>
        </div>

        {/* Right Image & Badges */}
        <div className="hero-image" style={{ flex: '1', position: 'relative', zIndex: 1, height: '700px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <img src="/hero_image.png" alt="Professional using phone" style={{ maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'darken' }} />
          
          {/* Badge 1 */}
          <div className="badge-1" style={{ position: 'absolute', right: '-40px', top: '50%', background: '#fff', padding: '12px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', zIndex: 3, maxWidth: '280px' }}>
             <img src="https://i.pravatar.cc/100?img=32" alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
             <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111', lineHeight: 1.3 }}>Quickly organized a fully managed remote setup</span>
          </div>

          {/* Badge 2 */}
          <div className="badge-2" style={{ position: 'absolute', left: '-20px', bottom: '20%', background: '#fff', padding: '12px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', zIndex: 3, maxWidth: '280px' }}>
             <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
             <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111', lineHeight: 1.3 }}><strong style={{fontWeight: 700}}>With SoftBridge</strong> we got a ton of flexibility for a good price</span>
          </div>
        </div>
      </main>

      {/* Extended Details Section: What We Offer */}
      <section className="features-section" style={{ padding: '6rem 4rem', background: '#ffffff', borderTopLeftRadius: '40px', borderTopRightRadius: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111', margin: '0 0 1rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>Everything you need to succeed</h2>
          <p style={{ fontSize: '1.1rem', color: '#555', textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
            SoftBridge brings together video conferencing, task management, document editing, and whiteboarding into a single, unified platform.
          </p>
          
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#fce8e6', color: '#d93025' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Meet</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5 }}>End-to-end encrypted video calls with AI moderation, polls, and screen sharing.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Calendar</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5 }}>Seamlessly schedule meetings and integrate with external providers.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#e6f4ea', color: '#1e8e3e' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Tasks</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5 }}>Organize your projects with powerful Kanban boards and checklists.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Docs</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5 }}>Real-time collaborative document editing, directly within your workspace.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#f3e8fd', color: '#8e24aa' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>Whiteboard</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5 }}>Infinite canvas for brainstorming, diagramming, and freeform creativity.</p>
            </div>

            <div className="feature-card" style={{ background: '#111', color: '#fff' }}>
              <div className="feature-icon" style={{ background: '#333', color: '#fff' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Unified AI</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#aaa', lineHeight: 1.5 }}>Get intelligent assistance across all tools with our integrated AI co-pilot.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Extended Details Section: Comparison */}
      <section className="comparison-section" style={{ padding: '6rem 4rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111', margin: '0 0 1rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>How we are different</h2>
          <p style={{ fontSize: '1.1rem', color: '#555', textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
            See why forward-thinking enterprises are choosing SoftBridge over traditional disjointed tools.
          </p>

          <div className="comparison-table">
            <table className="comp-table">
              <thead>
                <tr>
                  <th>Features</th>
                  <th>SoftBridge</th>
                  <th>Microsoft Teams</th>
                  <th>Google Workspace</th>
                  <th>Slack</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>True Unified Interface</strong></td>
                  <td className="check">✔ Yes</td>
                  <td className="cross">✖ Fragmented</td>
                  <td className="cross">✖ Fragmented</td>
                  <td className="cross">✖ Fragmented</td>
                </tr>
                <tr>
                  <td><strong>Built-in AI Assistant</strong></td>
                  <td className="check">✔ Included</td>
                  <td>Paid Add-on</td>
                  <td>Paid Add-on</td>
                  <td>Paid Add-on</td>
                </tr>
                <tr>
                  <td><strong>End-to-End Encryption</strong></td>
                  <td className="check">✔ Default</td>
                  <td>Optional</td>
                  <td>Optional</td>
                  <td className="cross">✖ No</td>
                </tr>
                <tr>
                  <td><strong>Pricing Structure</strong></td>
                  <td className="check">Transparent</td>
                  <td>Complex Tiers</td>
                  <td>Complex Tiers</td>
                  <td>Complex Tiers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e7eaf4', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: 500 }}>
          © {new Date().getFullYear()} SoftBridge Labs
        </div>
        <div className="footer-links" style={{ display: 'flex', gap: '2rem' }}>
          <a href="https://softbridgelabs.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Website</a>
          <a href="https://softbridgelabs.in/legal/privacy.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Privacy</a>
          <a href="https://softbridgelabs.in/legal/terms.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Terms</a>
          <a href="https://www.linkedin.com/company/softbridge-labs" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>LinkedIn</a>
          <a href="https://www.instagram.com/softbridge.labs/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>Instagram</a>
        </div>
      </footer>
    </div>
  );
}
