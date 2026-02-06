import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Pelican Trading',
  description: 'Simple, credit-based pricing for Pelican Trading. Pay for what you use with no hidden fees — plans starting at $29/month.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
