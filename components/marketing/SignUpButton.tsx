'use client';

import { useRouter } from 'next/navigation';

interface SignUpButtonProps {
  plan?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function SignUpButton({ plan, className, style, children }: SignUpButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (plan) {
      router.push(`/auth/signup?plan=${plan}`);
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <button onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  );
}
