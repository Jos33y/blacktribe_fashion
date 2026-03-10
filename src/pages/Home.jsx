import { useEffect } from 'react';
import Hero from '../../components/home/Hero';
import InfoStrip from '../../components/home/InfoStrip';
import FeaturedGrid from '../../components/home/FeaturedGrid';
import EditorialSplit from '../../components/home/EditorialSplit';
import NewsletterForm from '../../components/home/NewsletterForm';
import '../../styles/pages/Home.css';

export default function Home() {
  useEffect(() => {
    document.title = 'BlackTribe Fashion. Redefining Luxury.';
  }, []);

  return (
    <div className="home page-enter">
      <Hero />
      <InfoStrip />
      <FeaturedGrid />
      <EditorialSplit />
      <NewsletterForm />
    </div>
  );
}
