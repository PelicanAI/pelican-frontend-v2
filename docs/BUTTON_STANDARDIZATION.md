# Button Standardization

## Overview

All buttons across the application have been standardized to follow proper sizing, spacing, and interaction patterns based on Material Design and modern UI principles.

## Button Size Standards

### Small Buttons (36px height)
**Usage:** Icon buttons, compact controls
```
Height: 36px (h-9)
Padding: 16px vertical
Font size: 14px (text-sm)
Icon size: 16px (h-4 w-4)
```

### Medium Buttons (40px height) - DEFAULT
**Usage:** Primary actions, form buttons, most UI buttons
```
Height: 40px (h-10)
Padding: 20px vertical
Font size: 16px (text-sm with medium weight)
Icon size: 16px (h-4 w-4)
Gap: 8px between icon and text (gap-2)
```

### Large Buttons (56px height)
**Usage:** Hero CTAs, major actions
```
Height: 56px (h-14)
Padding: 24px vertical
Font size: 18px (text-base)
Icon size: 20px (h-5 w-5)
```

## FAB (Floating Action Button)

### Standard FAB (56px diameter)
```
Width: 56px (w-14)
Height: 56px (h-14)
Icon: 24px (h-6 w-6)
Border radius: rounded-full
```

### Mini FAB (40px diameter)
```
Width: 40px (w-10)
Height: 40px (h-10)
Icon: 20px (h-5 w-5)
Border radius: rounded-full
```

## Implementation Changes

### 1. Sidebar Buttons

**New Chat Button:**
- Height: 40px (h-10)
- Padding: 16px horizontal (px-4)
- Font: 14px medium (text-sm font-medium)
- Icon: 16px with 8px gap
- Full width with gradient background

**Search Input:**
- Height: 40px (h-10)
- Left padding: 40px (pl-10) for icon
- Border radius: 8px (rounded-lg)
- Icon left: 12px from edge

**Profile Button:**
- Height: 40px (h-10)
- Avatar: 32px (w-8 h-8)
- Gap: 12px (gap-3)
- Settings icon: 40x40px button

**Action Buttons (Edit/Delete):**
- Size: 28px (h-7 w-7)
- Icon: 14px (h-3.5 w-3.5)
- Gap: 2px (gap-0.5)
- Rounded: rounded-md

### 2. Chat Input

**Main Input Container:**
- Border radius: 12px (rounded-xl)
- Card styling with proper shadows

**Attach File Button:**
- Size: 36px (w-9 h-9)
- Icon: 16px (h-4 w-4)
- Position: Bottom left
- Border radius: 8px (rounded-lg)

**Send Button:**
- Size: 36px (w-9 h-9)
- Icon: 16px (h-4 w-4)
- Position: Bottom right
- Border radius: 8px (rounded-lg)
- Color: Purple gradient (changed from teal)
- Stop state: Red background

**Textarea:**
- Min height: 32px
- Left padding: 56px (pl-14) - space for attach button
- Right padding: 128px (pr-32) - space for send button
- Font: 15px with 1.5 line height

**Removed Elements:**
- Search button (not needed)
- Globe button (unused feature)
- Calendar button (unused feature)
- Map pin button (unused feature)
- Mic button (feature not ready)
- Suggestion pills below input (cleaner interface)

### 3. Welcome Screen

**Quick Action Cards:**
- Min height: 72px (min-h-[72px])
- Padding: 16px (p-4)
- Border radius: 12px (rounded-xl)
- Icon: 24px (text-2xl)
- Gap: 12px (gap-3)
- Text spacing: 6px (space-y-1.5)

## Spacing Standards

### Button Internal Spacing
```
Small:  px-3 py-2  (12px horizontal, 8px vertical)
Medium: px-4 py-2.5 (16px horizontal, 10px vertical)
Large:  px-6 py-3  (24px horizontal, 12px vertical)
```

### Button Groups
```
Tight:  gap-1 (4px)
Normal: gap-2 (8px)
Loose:  gap-3 (12px)
```

### Icon + Text
```
Standard gap: gap-2 (8px)
Tight gap:    gap-1.5 (6px)
```

## Color Standards

### Primary Action
```
Background: purple-600 → purple-700 on hover
Shadow: shadow-lg with purple-500/25
Text: white
```

### Secondary Action
```
Background: transparent → accent/50 on hover
Border: border with sidebar-border/50
Text: foreground
```

### Destructive Action
```
Background: transparent → red-500/20 on hover
Text: red-400 → red-300 on hover
Icon: red-400
```

### Ghost/Icon Buttons
```
Background: transparent → sidebar-accent/50 on hover
Text: muted-foreground
Icon: 16px default, can vary
```

## Interaction States

### Hover
```
Scale: 1.01-1.05 (subtle)
Background: Lighten/darken by ~10%
Shadow: Increase elevation
Transition: 200ms ease
```

### Active/Pressed
```
Scale: 0.95-0.98 (press down)
Transform: translateY(1px) optional
Transition: 100ms ease
```

### Focus
```
Ring: 2px solid purple-500/50
Ring offset: 2px
Outline: none (custom ring instead)
```

### Disabled
```
Opacity: 0.5
Cursor: not-allowed
Background: gray-300 dark:gray-600
Pointer events: none for true disabled state
```

## Accessibility

### Touch Targets
- Minimum: 40x40px (following WCAG guidelines)
- Ideal: 44x44px or larger
- Icon buttons: Always at least 36x36px

### Keyboard Navigation
- All buttons focusable (tabindex="0")
- Enter and Space trigger action
- Visible focus rings
- Logical tab order

### Screen Readers
- Meaningful aria-labels for icon-only buttons
- Title attributes for tooltips
- Role="button" for custom buttons
- Disabled state announced

## Animation Standards

### Scale Animations
```typescript
whileHover: { scale: 1.05 }
whileTap: { scale: 0.95 }
transition: { duration: 0.15 }
```

### Fade Animations
```typescript
initial: { opacity: 0 }
animate: { opacity: 1 }
exit: { opacity: 0 }
transition: { duration: 0.2 }
```

### Stagger Animations
```typescript
delay: index * 0.05
duration: 0.3
```

## Before vs After

### Before
- Inconsistent button heights (28px, 32px, 36px, 40px mixed)
- Different icon sizes within same context
- Too many unused buttons cluttering UI
- Inconsistent padding and spacing
- Mixed color schemes (teal and purple)
- Small touch targets (<40px)

### After
- Standardized 36px and 40px heights
- Consistent 16px icons for medium buttons
- Removed 5+ unused buttons from chat input
- Consistent 8px-based spacing
- Unified purple color scheme
- All touch targets ≥36px
- Better visual hierarchy

## Testing Checklist

- [x] All buttons minimum 36x36px
- [x] Primary actions use 40px height
- [x] Icon buttons properly sized
- [x] Consistent spacing between buttons
- [x] Hover states work correctly
- [x] Focus rings visible
- [x] Disabled states styled correctly
- [x] Mobile touch targets adequate
- [x] Keyboard navigation works
- [x] Screen reader labels present

## Future Enhancements

1. **Button variants component**
   - Create reusable Button primitive
   - Size variants: xs, sm, md, lg
   - Style variants: primary, secondary, ghost, destructive

2. **Loading states**
   - Spinner integration
   - Disabled during loading
   - Success/error feedback

3. **Tooltip system**
   - Consistent tooltip styling
   - Keyboard accessible
   - Touch-friendly delays

4. **Icon library**
   - Standardize all icon sizes
   - Create icon size constants
   - Consistent stroke widths

5. **Theme tokens**
   - Button color tokens
   - Shadow tokens
   - Animation duration tokens