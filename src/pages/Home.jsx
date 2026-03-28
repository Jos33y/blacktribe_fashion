import { useState, useEffect } from 'react';
import { setPageMeta, clearPageMeta } from '../utils/pageMeta';
import JsonLd, { buildOrganizationSchema } from '../components/seo/JsonLd';
import useScrollReveal from '../hooks/useScrollReveal';
import ProductHero from '../components/home/ProductHero';
import Marquee from '../components/home/Marquee';
import FeaturedGrid from '../components/home/FeaturedGrid';
import BrandVideo from '../components/home/BrandVideo';
import CollectionPreview from '../components/home/CollectionPreview';
import NewsletterForm from '../components/home/NewsletterForm';
import '../styles/pages/Home.css';

export default function Home() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'BlackTribe Fashion. Redefining Luxury.',
      description: 'Premium streetwear and luxury fashion. Shop limited collections, pre-order new drops, worldwide shipping. Born from culture, refined by craft.',
      path: '/',
    });
    return () => clearPageMeta();
  }, []);

  /* Single batch fetch for all homepage data */
  useEffect(() => {
    async function fetchHomepage() {
      try {
        const res = await fetch('/api/homepage');
        const json = await res.json();
        if (json.success && json.data) {
          setHomeData(json.data);
        }
      } catch (err) {
        console.error('[Home] batch fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomepage();
  }, []);

  // Scroll reveal — immediately shows above-fold elements, observes the rest
  useScrollReveal('.home-reveal', 'home-reveal--visible', [loading]);

  // Navbar transparency: add class while hero is in viewport
  useEffect(() => {
    const hero = document.getElementById('home-hero');
    if (!hero) return;

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          navbar.classList.add('navbar--transparent');
        } else {
          navbar.classList.remove('navbar--transparent');
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(hero);
    // Start transparent
    navbar.classList.add('navbar--transparent');

    return () => {
      obs.disconnect();
      navbar.classList.remove('navbar--transparent');
    };
  }, []);

  return (
    <div className="home">
      <JsonLd data={buildOrganizationSchema()} />
      <ProductHero />
      <Marquee />
      <div className="home-reveal">
        <FeaturedGrid products={homeData?.featured} loading={loading} />
      </div>
      <div className="home-reveal">
        <BrandVideo />
      </div>
      <div className="home-reveal">
        <CollectionPreview collection={homeData?.collection} loading={loading} />
      </div>
      <div className="home-reveal">
        <NewsletterForm />
      </div>
    </div>
  );
}
