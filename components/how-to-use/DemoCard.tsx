'use client';

import SkillBadge from './SkillBadge';
import DemoVideoPlaceholder from './DemoVideoPlaceholder';

interface DemoCardProps {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  examplePrompt: string;
  features: string[];
  demoSrc?: string;
  reverse?: boolean;
}

export default function DemoCard({
  skillLevel,
  title,
  description,
  examplePrompt,
  features,
  demoSrc,
  reverse = false,
}: DemoCardProps) {
  return (
    <div
      className="demo-card animate-on-scroll"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center',
      }}
    >
      {/* Video placeholder - order changes based on reverse prop */}
      <div
        className="demo-card-video bracket-box"
        style={{ order: reverse ? 2 : 1 }}
      >
        <DemoVideoPlaceholder demoSrc={demoSrc} />
      </div>

      {/* Content */}
      <div
        className="demo-card-content"
        style={{ order: reverse ? 1 : 2 }}
      >
        {/* Skill badge */}
        <div style={{ marginBottom: '1rem' }}>
          <SkillBadge level={skillLevel} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem',
            letterSpacing: '0.02em',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}
        >
          {description}
        </p>

        {/* Example prompt box */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            Example Prompt
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
            }}
          >
            &quot;{examplePrompt}&quot;
          </div>
        </div>

        {/* Feature tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {features.map((feature, index) => (
            <span
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.4rem 0.75rem',
                background: 'var(--accent-purple-dim)',
                border: '1px solid var(--border-accent)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                color: 'var(--accent-purple)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
