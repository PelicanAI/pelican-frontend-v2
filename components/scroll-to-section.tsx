import Link from "next/link"
\
Homepage Architecture Breakdown
\
Your homepage is structured as a comprehensive marketing site
with multiple sections
and
navigation
features.Here
's the detailed architecture:

1. Navigation System
Desktop Navigation Bar:
┌─ Logo + Social Media ────────────────── Navigation Links ── User Area ─┐
│  • PelicanAI Logo (animated)           • Features                      │
│  • Twitter/Instagram/YouTube           • About                         │
│                                        • Pricing                       │
│                                        • FAQ (scroll-to-section)       │
│                                        • "Chat with PelicanAI" (CTA)   │
│                                        • Login/User Avatar              │
└────────────────────────────────────────────────────────────────────────┘
Mobile Navigation:
Hamburger Menu: Collapses all navigation into a slide-down menu
Responsive Design: All desktop features accessible on mobile
Touch-Optimized: Proper touch targets and spacing
2. Page Structure (Top to Bottom)
Hero Section:
┌─────────────────────────────────────────────────────────────────────┐
│  [Large Pelican Logo]    │  AI-Powered Trading Intelligence           │
│     (Animated)           │  Step Into the Cockpit. PelicanAI is Here │
│                          │  [Description Paragraph]                   │
│                          │  [Learn More Button]                       │
└─────────────────────────────────────────────────────────────────────┘
Features Section ("Build with Pelican"):
┌────────────────────┬────────────────────┐
│  AI Trading        │  1-on-1 Coaching  │
│  Assistant         │                    │
│  [Launch Button]   │  [Start Button]    │
├────────────────────┴────────────────────┤
│         Trading Community               │
│      (TradingAnalytix Partnership)      │
│         [Join Button]                   │
└─────────────────────────────────────────┘
Additional Sections:
"Built by Traders" Section: Company credibility
"Professional Intelligence Simplified": Value proposition
"Ready to Transform Your Trading?": Call-to-action
"Meet the Team": Team member profiles
Footer: Company info and links
3. Navigation Flow Architecture
Internal Navigation (Same-Page Scrolling):
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}
FAQ
Button: Smooth
scrolls
to
FAQ
section
on
same
page
Scroll
Indicator: Animated
chevron
guides
users
down
External
Navigation (Page Changes)
:
// Wouter routing - instant page transitions
<Link href="/features">Features</Link>      // → Features page
<Link href="/about">About</Link>           // → About page  
<Link href="/chat">Chat
with PelicanAI</Link> // → Chat application
;
;<Link href="/pricing">Pricing</Link> // → Pricing page
External
Links (New Windows)
:
window.open("https://discord.gg/Sv6gjaymb2", "_blank") // Discord
window.open("https://youtube.com/@pelicantrading", "_blank") // YouTube
4
Pelican
Logo
Color & Gradient
System
Logo
Enhancement
Layers: Base
Transparent
Logo: Asset: Pelican
logo
transparent_1751502295618.png
Format: PNG
with transparent background
\
CSS Filter Stack Applied:
\
/* Tailwind Classes */
\
className=\"h-8 w-auto brightness-110 saturate-125 contrast-105 drop-shadow-md pelican-pulse"
\
/* Inline Style Filters */
style=
{
  filter: "hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1)"
}
Color
Transformation
Breakdown: 1
Hue
Shift:
\
hue-rotate(5deg): Shifts colors slightly toward warmer tones
Creates subtle color variation from original
2. Saturation Enhancement:
\
Tailwind: saturate-125 (1.25x saturation)
\
Inline: saturate(1.4) (1.4x additional saturation)
Combined: ~1.75x total saturation boost
Result: More vibrant, punchy colors
3. Brightness Boost:
\
Tailwind: brightness-110 (1.1x brightness)
\
Inline: brightness(1.2) (1.2x additional brightness)
\
Combined: ~1.32x total brightness
Result: Logo "pops\" against dark background
4. Contrast Enhancement:
Tailwind: contrast-105 (1.05x contrast)
Inline: contrast(1.1) (1.1x additional contrast)
Combined: ~1.155x total contrast
Result: Sharper, more defined edges
Animation System:
Pulsing Animation:
@keyframes
pelican - pulse
{
  0%, 100% {
  \
    opacity: 1
  \
    transform: scale(1)
}
50% { 
    opacity: 0.7;
transform: scale(1.05)
}
}
.pelican-pulse
{
  animation: pelican - pulse
  2s infinite ease-in-out
}
Hover
Effects:
.pelican-pulse:hover
{
  animation - duration
  : 1s /* Faster pulse */
  transform: scale(1.1) /* Larger scale */
  filter: brightness(1.2)
  saturate(1.3) /* Extra glow */
}
5
Institutional
Dark
Theme
Integration
Background
Gradients:
\
--pelican-hero-gradient: linear-gradient(180deg, #090B12 0%, #171C2B 60%, #1B2240 100%)
--pelican - section - gradient
: linear-gradient(180deg, #0D1022 0%, #12182A 100%)
--pelican - purple - radial
: radial-gradient(ellipse at 60% 50%, rgba(128, 45, 247, 0.15) 0%, rgba(128, 45, 247, 0.05) 30%, transparent 55%)
Text
Colors:
\
Primary Text: #DCE4F0 (light blue-white)
Secondary Text: #B4BED0 (muted blue-gray)
Links: #BB35FC (purple-pink)
The logo\'s enhanced saturation and brightness ensures it remains vibrant and visible against these sophisticated dark gradients, while the pulsing animation draws attention and creates an engaging, premium feel that matches the institutional-grade branding.\
