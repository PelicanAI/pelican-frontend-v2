'use client';

import { useState } from 'react';

interface CollapsibleBioProps {
  text: string;
  /** Max words to show before collapsing (mobile only) */
  maxWords?: number;
}

export default function CollapsibleBio({ text, maxWords = 50 }: CollapsibleBioProps) {
  const [expanded, setExpanded] = useState(false);
  const words = text.split(/\s+/);
  const needsTruncation = words.length > maxWords;

  if (!needsTruncation) {
    return <p className="team-bio">{text}</p>;
  }

  const truncated = words.slice(0, maxWords).join(' ') + '...';

  return (
    <p className="team-bio">
      <span className="collapsible-bio-full">{text}</span>
      <span className="collapsible-bio-truncated">
        {expanded ? text : truncated}
        {' '}
        <button
          type="button"
          className="collapsible-bio-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      </span>
    </p>
  );
}
