import PricingPageContent from '@/components/pricing/PricingPageContent'

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Pelican Trading',
  description: 'AI-powered trading intelligence platform with credit-based pricing.',
  brand: {
    '@type': 'Organization',
    name: 'Pelican Trading',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Base',
      price: '29',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '29',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
      description: '1,000 credits/month — ~100 price checks or ~40 analyses',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '99',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '99',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
      description: '3,500 credits/month — ~350 price checks or ~140 analyses',
    },
    {
      '@type': 'Offer',
      name: 'Power',
      price: '249',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '249',
        priceCurrency: 'USD',
        billingDuration: 'P1M',
      },
      description: '10,000 credits/month — ~1,000 price checks or ~400 analyses',
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <PricingPageContent />
    </>
  )
}
