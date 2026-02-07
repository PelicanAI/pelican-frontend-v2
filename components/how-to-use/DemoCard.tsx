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
  audience?: 'trader' | 'investor';
}

export default function DemoCard({
  skillLevel,
  title,
  description,
  examplePrompt,
  features,
  demoSrc,
  reverse = false,
  audience,
}: DemoCardProps) {
  return (
    <div className="demo-card animate-on-scroll">
      {/* Video placeholder - order changes based on reverse prop */}
      <div
        className="demo-card-video bracket-box"
        style={{ order: reverse ? 2 : 1 }}
      >
        <DemoVideoPlaceholder demoSrc={demoSrc} />
      </div>

      {/* Content */}
      <div className="demo-card-content" style={{ order: reverse ? 1 : 2 }}>
        {/* Skill badge */}
        <div className="demo-card-skill">
          <SkillBadge level={skillLevel} audience={audience} />
        </div>

        {/* Title */}
        <h3 className="demo-card-title">
          {title}
        </h3>

        {/* Description */}
        <p className="demo-card-description">
          {description}
        </p>

        {/* Example prompt box */}
        <div className="demo-card-prompt">
          <div className="demo-card-prompt-label">
            Example Prompt
          </div>
          <div className="demo-card-prompt-text">
            &quot;{examplePrompt}&quot;
          </div>
        </div>

        {/* Feature tags */}
        <div className="demo-card-features">
          {features.map((feature, index) => (
            <span
              key={index}
              className="demo-card-feature"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
