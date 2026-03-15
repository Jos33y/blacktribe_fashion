import { useEffect } from 'react';
import ProductHero from '../components/home/ProductHero';
import Marquee from '../components/home/Marquee';
import FeaturedGrid from '../components/home/FeaturedGrid';
import BrandVideo from '../components/home/BrandVideo';
import CollectionPreview from '../components/home/CollectionPreview';
import NewsletterForm from '../components/home/NewsletterForm';
import '../styles/pages/Home.css';

export default function Home() {
  useEffect(() => {
    document.title = 'BlackTribe Fashion. Redefining Luxury.';
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('.home-reveal');
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('home-reveal--visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.08 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

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
      <ProductHero />
      <Marquee />
      <div className="home-reveal">
        <FeaturedGrid />
      </div>
      <div className="home-reveal">
        <BrandVideo />
      </div>
      <div className="home-reveal">
        <CollectionPreview />
      </div>
      <div className="home-reveal">
        <NewsletterForm />
      </div>
    </div>
  );
}
