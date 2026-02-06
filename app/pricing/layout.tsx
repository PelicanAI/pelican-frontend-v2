import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Pelican Trading',
  description: 'Simple, credit-based pricing for Pelican Trading. Pay for what you use with no hidden fees — plans starting at $29/month.',
  openGraph: {
    title: 'Pricing | Pelican Trading',
    description: 'Simple, credit-based pricing. Plans starting at $29/month.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Pelican Trading Pricing' }],
    type: 'website',
    siteName: 'Pelican Trading',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Pelican Trading',
    description: 'Simple, credit-based pricing. Plans starting at $29/month.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
