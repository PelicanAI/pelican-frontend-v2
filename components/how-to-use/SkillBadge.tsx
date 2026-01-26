'use client';

interface SkillBadgeProps {
  level: 'beginner' | 'intermediate' | 'advanced';
}

const levelStyles = {
  beginner: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  intermediate: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  advanced: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
};

const levelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function SkillBadge({ level }: SkillBadgeProps) {
  const styles = levelStyles[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.35rem 0.75rem',
        background: styles.background,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.7rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {levelLabels[level]}
    </span>
  );
}
