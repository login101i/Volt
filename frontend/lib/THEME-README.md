# Theme System Documentation

This project uses a centralized theme system for consistent colors and typography across the application.

## Color Palette

The theme uses **3 main colors** for better UX:

### 1. Primary (Blue) - `primary-*`
- **Usage**: Main actions, primary buttons, links, active states
- **Examples**: Export buttons, sort indicators, filter buttons, selected items
- **Classes**: `bg-primary-600`, `text-primary-700`, `hover:bg-primary-700`

### 2. Secondary (Purple) - `secondary-*`
- **Usage**: Secondary actions, alternative buttons
- **Examples**: Import buttons, alternative actions
- **Classes**: `bg-secondary-600`, `text-secondary-700`, `hover:bg-secondary-700`

### 3. Success (Green) - `success-*`
- **Usage**: Positive actions, confirmations, additions
- **Examples**: Add buttons, Save buttons, Generate buttons
- **Classes**: `bg-success-600`, `text-success-700`, `hover:bg-success-700`

## Usage

### Buttons

Use the `getButtonClass()` helper function for consistent button styling:

```tsx
import { getButtonClass } from '@/lib/theme';

// Primary button
<button className={getButtonClass('primary')}>
  Export
</button>

// Success button
<button className={getButtonClass('success')}>
  Add
</button>

// Secondary button
<button className={getButtonClass('secondary')}>
  Import
</button>

// With additional classes
<button className={getButtonClass('success', 'w-full px-6 py-4')}>
  Generate Offer
</button>
```

### Direct Color Classes

You can also use Tailwind classes directly:

```tsx
// Backgrounds
<div className="bg-primary-50">Light primary background</div>
<div className="bg-success-100">Light success background</div>

// Text colors
<span className="text-primary-700">Primary text</span>
<span className="text-success-600">Success text</span>

// Borders
<div className="border-primary-200">Primary border</div>
```

## Button Variants

- `primary` - Main actions (blue)
- `secondary` - Secondary actions (purple)
- `success` - Positive actions like Add/Save (green)
- `danger` - Destructive actions like Delete (red)
- `neutral` - Neutral actions like Reset (gray)
- `outline` - Outlined buttons with border

## Color Scale

Each color has a scale from 50 (lightest) to 900 (darkest):
- `*-50` - Very light backgrounds
- `*-100` - Light backgrounds/highlights
- `*-200` - Light borders
- `*-600` - Main color for buttons
- `*-700` - Hover states
- `*-900` - Dark text

## Examples

### Button Examples
```tsx
// Primary action button
<button className={getButtonClass('primary')}>
  Export to CSV
</button>

// Success action button
<button className={getButtonClass('success')}>
  + Dodaj
</button>

// Secondary action button
<button className={getButtonClass('secondary')}>
  Import from CSV
</button>
```

### Highlight Examples
```tsx
// Selected state
<div className={selected ? 'bg-primary-100 text-primary-700' : 'bg-white'}>
  Item
</div>

// Success highlight
<div className="bg-success-100 text-success-700">
  Total Power
</div>
```

## Best Practices

1. **Use theme colors** instead of hardcoded colors like `bg-blue-600`
2. **Use `getButtonClass()`** for all buttons to ensure consistency
3. **Limit color usage** - Use only 2-3 colors per page for better UX
4. **Primary for main actions** - Use primary color for the most important actions
5. **Success for positive actions** - Use success color for Add, Save, Generate
6. **Secondary for alternatives** - Use secondary color for less important actions

## Updating Colors

To change the color palette, update `tailwind.config.ts` and `lib/theme.ts`:

1. Update colors in `tailwind.config.ts` under `theme.extend.colors`
2. Update color references in `lib/theme.ts` if needed
3. Colors will automatically be available as Tailwind classes










