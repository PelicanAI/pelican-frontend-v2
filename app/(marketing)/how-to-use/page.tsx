import type { Metadata } from 'next';
import HowToUsePageContent from '@/components/marketing/HowToUsePageContent';
import '../styles/marketing.css';
import './how-to-use.css';

export const metadata: Metadata = {
  title: 'How to Use | Pelican Trading',
  description: 'Learn how to use Pelican Trading — get started with AI-powered market analysis, natural language stock scanning, backtesting, and more.',
  alternates: {
    canonical: '/how-to-use',
  },
};

export default function HowToUsePage() {
  return <HowToUsePageContent />;
}
