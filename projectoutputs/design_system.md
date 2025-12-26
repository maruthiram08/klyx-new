# Klyx Portfolio Intelligence - Design System

## 1. Typography
**Primary Font**: `Inter` (Body Text)
**Heading Font**: `Space Grotesk` (Headings, Branding)
**Monospace**: `JetBrains Mono` (Data labels, API status)

## 2. Color Palette
### Base
- **Background**: `#fffdf7` (Off-white Cream)
- **Text**: `#18181b` (Zinc-900 / Near Black)
- **Borders**: `#000000` (Pure Black)

### Accents (Neo-Brutalist)
- **Primary Action (Yellow)**: `#fde047`
- **Secondary Action (Purple)**: `#a78bfa`
- **Success/Build (Green)**: `#86efac`
- **System Active (Emerald)**: `#10b981` (emerald-500)
- **Decoration (Blue)**: `#bfdbfe`
- **Decoration (Pink)**: `#ff9ebb`

## 3. Shadows & Effects
**Style**: Hard, non-blurred shadows (Neo-Brutalism).
- `brutal-shadow`: `box-shadow: 4px 4px 0px 0px #000`
- `brutal-shadow-sm`: `box-shadow: 2px 2px 0px 0px #000`
- `brutal-shadow-lg`: `box-shadow: 6px 6px 0px 0px #000`

**Interactions**:
- Hover: Translate (2px, 2px) to simulate "pressing" the shadow.
- Hover Lift: Translate (-2px, -2px) to increase shadow depth.

## 4. Layout Patterns
- **Cards**: Rounded (`rounded-2xl`), Thick Borders (`border-2 border-black`), Hard Shadows.
- **Grid**: Bento-style grid (`grid-cols-12`).
- **Background**: Subtle grid pattern (`bg-grid-pattern`) with opacity 0.05.

## 5. UI Components
### Buttons
- **Primary**: Black bg, White text, Rounded-lg, Border-2 Black, Brutal Shadow.
- **Secondary**: Yellow/Accent bg, Black text, Hover lift effect.

### Inputs
- **Search**: White bg, Rounded-xl, Thick Border, Brutal Shadow-lg.
- Icon on left, clear focus states.

### Badges / Tags
- **Style**: Pill-shaped (`rounded-full`), Border-2 Black, Monospace font.
- Example: "System Active" with pulsing dot.
