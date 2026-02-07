'use client';

import dynamic from 'next/dynamic';

const HeroChatDemo = dynamic(() => import('@/components/marketing/HeroChatDemo'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', maxWidth: 560, height: 468, margin: '0 auto', borderRadius: 16, background: '#12141a' }} />
  ),
});

export default function HeroChatDemoLoader() {
  return <HeroChatDemo />;
}
