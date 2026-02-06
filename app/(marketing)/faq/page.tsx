import type { Metadata } from 'next';
import FAQPageContent from '@/components/marketing/FAQPageContent';
import '../styles/marketing.css';
import '../styles/faq.css';

export const metadata: Metadata = {
  title: 'FAQ | Pelican Trading',
  description: 'Frequently asked questions about Pelican Trading — how it works, pricing, supported markets, data sources, and more.',
};

export default function FAQ() {
  return <FAQPageContent />;
}
