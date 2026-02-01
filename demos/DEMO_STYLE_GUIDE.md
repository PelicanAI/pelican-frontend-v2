# Pelican AI Demo Style Guide

This document contains exact visual specifications extracted from the Pelican chat application codebase for creating accurate HTML demo videos.

---

## Color Palette

### Dark Mode (Primary Theme for Demos)

```css
/* Background Colors */
--bg-primary: #0a0a0f;                    /* Main app background */
--bg-sidebar: oklch(0.08 0.01 280);       /* Sidebar: ~#121218 */
--bg-surface-1: oklch(0.08 0.01 280);     /* Cards layer 1 */
--bg-surface-2: oklch(0.18 0.015 280);    /* Cards layer 2: ~#2a2a36 */
--bg-surface-3: oklch(0.22 0.02 280);     /* Popovers: ~#35354a */
--bg-card: oklch(0.18 0.015 280);         /* Card backgrounds */

/* Text Colors */
--text-primary: oklch(0.95 0.002 280);    /* Main text: ~#f0f0f4 */
--text-secondary: oklch(0.75 0 0);        /* Secondary text: ~#bfbfbf */
--text-muted: oklch(0.708 0 0);           /* Muted text: ~#b3b3b3 */

/* Brand Colors - Purple Theme */
--purple-primary: oklch(0.60 0.25 280);   /* Primary purple: ~#a855f7 */
--purple-secondary: oklch(0.55 0.22 285); /* Accent purple: ~#8b5cf6 */
--purple-glow: rgba(168, 85, 247, 0.25);  /* Glow effect */
--purple-accent: rgb(192, 132, 252);      /* Highlight purple: #c084fc */

/* Border Colors */
--border-color: oklch(0.35 0.08 280);     /* Default borders: ~#4a3a5a */
--border-sidebar: oklch(0.25 0.08 280);   /* Sidebar borders */
--border-focus: rgba(168, 85, 247, 0.4);  /* Focus state */

/* Status Colors */
--green: rgb(34, 197, 94);                /* Positive: #22c55e */
--red: rgb(239, 68, 68);                  /* Negative: #ef4444 */
--orange: rgb(251, 146, 60);              /* Warning: #fb923c */
```

### Hex Equivalents for HTML Demos

```css
/* Backgrounds */
--bg-primary: #0a0a0f;
--bg-sidebar: #121218;
--bg-surface-1: #121218;
--bg-surface-2: #2a2a36;
--bg-card: #2a2a36;

/* Text */
--text-primary: #f0f0f4;
--text-secondary: #bfbfbf;
--text-muted: #7a7a7a;

/* Purple Theme */
--purple-primary: #a855f7;
--purple-secondary: #8b5cf6;
--purple-accent: #c084fc;
--purple-glow: rgba(168, 85, 247, 0.25);

/* Borders */
--border-color: rgba(168, 85, 247, 0.15);
--border-focus: rgba(168, 85, 247, 0.4);

/* Status */
--green: #22c55e;
--red: #ef4444;
```

---

## Typography

### Fonts
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Monospace**: Geist Mono, ui-monospace, monospace

### Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Body text | 15-16px | 400 |
| Message text | 16px | 400 |
| Section headers | 11px uppercase | 600 |
| Sidebar titles | 14px | 500 |
| Brand name | 18px | 700 |
| Welcome title | 32px | 600 |

### Line Heights
- Headlines: 1.25
- Body text: 1.5-1.625
- Message content: 1.625

---

## Spacing System

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

---

## Border Radius

```css
--radius-xs: 4px;    /* Small elements */
--radius-sm: 6px;    /* Buttons */
--radius-md: 8px;    /* Cards */
--radius-lg: 12px;   /* Modals */
--radius-xl: 16px;   /* Large containers */
--radius-2xl: 20px;  /* Chat input */
--radius-full: 9999px; /* Circles */
```

---

## Shadows

```css
/* Elevation system */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Purple glow for buttons */
--shadow-purple: 0 4px 12px rgba(168, 85, 247, 0.3);
--shadow-focus: 0 0 0 4px rgba(168, 85, 247, 0.12);
```

---

## Layout Dimensions

### Desktop (xl breakpoint: 1280px+)
| Component | Width |
|-----------|-------|
| Sidebar | 280px |
| Main Chat Area | flex-1 (remaining) |
| Trading Panel | 320px (w-80) |
| Chat max-width | 800px (max-w-5xl) |
| Message max-width | 70% (user), 100% (assistant) |

### Full Layout
```
Total: 100vw
Sidebar: 280px | Chat: flex-1 | Trading Panel: 320px
```

### Mobile Sheet
- Width: 85vw, max 320px

---

## Component Specifications

### Chat Messages

#### User Messages
- **Alignment**: Right-aligned (justify-end)
- **Max width**: 70% of container, max 600px
- **Background**: Transparent (no bubble)
- **Text color**: var(--text-primary)
- **Font size**: 15-16px
- **Avatar**: Hidden (per requirements)

#### Assistant Messages
- **Alignment**: Left-aligned
- **Max width**: 100%, flex-1, max 700px
- **Background**: Transparent (no bubble)
- **Text color**: var(--text-primary)
- **Font size**: 16px
- **Avatar**: Pelican logo, 32px (w-8 h-8)

#### Message Container Structure
```html
<div class="py-4">
  <div class="max-w-3xl mx-auto px-4 sm:px-8">
    <div class="flex gap-3 sm:gap-6 items-start">
      <!-- Avatar for assistant only -->
      <img src="pelican-logo-transparent.png" class="w-7 h-7 sm:w-8 sm:h-8" />
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="text-[16px] leading-relaxed">
          <!-- Message text -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### Chat Input

- **Height**: 56px minimum
- **Border radius**: 20px (rounded-2xl)
- **Background**: var(--bg-card)
- **Border**: 1px solid var(--border-color)
- **Focus state**:
  - Border: var(--purple-primary)
  - Shadow: 0 0 0 4px rgba(168, 85, 247, 0.12)
- **Send button**: 44px circle, purple gradient background
- **Paperclip button**: 44px circle, transparent

### Sidebar

- **Width**: 280px (w-[280px])
- **Background**: var(--bg-sidebar)
- **Border**: 1px solid var(--border-sidebar)
- **Logo section**: 28px logo + "PelicanAI" text
- **New Chat button**:
  - Full width, 40px height
  - Purple gradient: from-purple-600 via-violet-600 to-purple-600
  - White text
- **Search input**: 40px height, rounded-lg
- **Conversation item**:
  - 48px min-height
  - Active: bg-primary/10 with border-primary/20
  - Hover: bg-sidebar-accent/50

### Trading Context Panel

- **Width**: 320px (w-80)
- **Background**: var(--surface-1)/40, backdrop-blur
- **Border**: 1px solid rgba(255,255,255,0.05)
- **Header**: Activity icon (teal), "Market Overview" title
- **Section titles**: 11px uppercase, letter-spacing 1px
- **Items**: Flex justify-between, 8px padding

---

## Animations

### Typing Indicator
```css
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-8px); opacity: 1; }
}
/* 3 dots, 0.6s infinite, delays: 0ms, 150ms, 300ms */
```

### Message Slide In
```css
@keyframes messageSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 300ms, ease-out */
```

### Logo Pulse (Welcome Screen)
```css
@keyframes welcomeFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
/* Duration: 3s, ease-in-out, infinite */
```

### Focus Ring
```css
box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.6), 0 0 0 4px rgba(168, 85, 247, 0.2);
```

---

## Logo Assets

| File | Location | Usage |
|------|----------|-------|
| pelican-logo-transparent.png | /public/ | AI avatar, sidebar, welcome screen |
| pelican-logo.png | /public/ | Marketing pages |

### Logo Styling
- **AI Avatar**: 32px (w-8 h-8), object-contain
- **Sidebar**: 28px (w-7 h-7)
- **Welcome screen**: 100px with glow effect
- **Glow**: drop-shadow(0 0 40px rgba(168, 85, 247, 0.3))

---

## Background Effects (Dark Mode)

```css
/* Radial gradients for futuristic look */
.bg-gradient {
  background: radial-gradient(600px 400px at 50% 10%, rgba(168, 85, 247, 0.08), transparent);
}
.bg-radial-1 {
  background: radial-gradient(ellipse at 20% 20%, rgba(124, 58, 237, 0.08), transparent 50%);
}
.bg-radial-2 {
  background: radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.05), transparent 50%);
}

/* Chat area specific */
.chat-background-gradient {
  background: radial-gradient(ellipse at top, rgba(88, 28, 135, 0.3) 0%, transparent 70%);
}
```

---

## Text Formatting in Messages

### Bold Text (Section Headers)
- If ends with ":", apply purple accent color (#c084fc)
- Otherwise, just font-weight: 600

```css
strong { font-weight: 600; }
strong.section-header { color: #a855f7; } /* If ends with colon */
```

### Links
```css
a {
  color: #14b8a6; /* teal-600 */
  font-weight: 500;
  text-decoration: none;
}
```

---

## Z-Index Layers

```css
--z-base: 1000;
--z-dropdown: 1010;
--z-sticky: 1020;
--z-modal-backdrop: 1030;
--z-modal: 1040;
--z-popover: 1050;
--z-toast: 1060;
--z-tooltip: 1070;
```

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Full-width chat, hamburger menu |
| Tablet | 640-1024px | Sidebar as overlay sheet |
| Desktop | 1024-1280px | Sidebar visible, no trading panel |
| Large Desktop | 1280px+ | Full 3-panel layout |

---

## Quick Reference CSS Variables for Demos

```css
:root {
  /* Core */
  --bg-primary: #0a0a0f;
  --bg-sidebar: #121218;
  --bg-card: #2a2a36;
  --text-primary: #f0f0f4;
  --text-secondary: #bfbfbf;
  --text-muted: #7a7a7a;

  /* Brand */
  --purple-primary: #a855f7;
  --purple-secondary: #8b5cf6;
  --purple-glow: rgba(168, 85, 247, 0.25);

  /* Borders */
  --border-color: rgba(168, 85, 247, 0.15);

  /* Status */
  --green: #22c55e;
  --red: #ef4444;

  /* Radius */
  --radius-lg: 12px;
  --radius-2xl: 20px;
}
```
