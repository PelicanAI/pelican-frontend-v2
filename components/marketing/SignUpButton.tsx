interface SignUpButtonProps {
  plan?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function SignUpButton({ plan, className, style, children }: SignUpButtonProps) {
  const href = plan ? `/auth/signup?plan=${plan}` : '/auth/signup';

  return (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  );
}
