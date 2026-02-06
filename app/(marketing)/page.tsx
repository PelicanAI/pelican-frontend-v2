import type { Metadata } from 'next';
import HomePageContent from '@/components/marketing/HomePageContent';
import './styles/marketing.css';

export const metadata: Metadata = {
  title: 'Pelican Trading | AI Market Intelligence for Traders',
  description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence — finally accessible to everyone.',
};

export default function HomePage() {
  return <HomePageContent />;
}
