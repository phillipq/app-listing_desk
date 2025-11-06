# Color System Documentation

## Overview

The Realtor App uses a sophisticated, centralized color system to ensure consistency across all components and pages. This system is defined in `/lib/colors.ts` and automatically applied through our color update scripts.

## Color Palette

### Primary Colors (Sophisticated Palette)

#### Cerulean (Primary Blue)
- **Usage**: Primary actions, navigation, main CTAs
- **Classes**: `text-cerulean-*`, `bg-cerulean-*`, `bg-gradient-cerulean`
- **Hex Values**: 
  - 50: `#f0f9ff` (lightest)
  - 500: `#166686` (main)
  - 900: `#0e456d` (darkest)

#### Verdigris (Teal/Green)
- **Usage**: Success actions, secondary CTAs, positive indicators
- **Classes**: `text-verdigris-*`, `bg-verdigris-*`, `bg-gradient-verdigris`
- **Hex Values**:
  - 50: `#f0fdfa` (lightest)
  - 500: `#50BAC3` (main)
  - 900: `#134e4a` (darkest)

#### Eggplant (Purple/Pink)
- **Usage**: Warning actions, special features, accent elements
- **Classes**: `text-eggplant-*`, `bg-eggplant-*`, `bg-gradient-eggplant`
- **Hex Values**:
  - 50: `#fdf2f8` (lightest)
  - 500: `#4D353E` (main)
  - 900: `#500724` (darkest)

#### Licorice (Deep Purple)
- **Usage**: Danger actions, delete buttons, error states
- **Classes**: `text-licorice-*`, `bg-licorice-*`, `bg-gradient-licorice`
- **Hex Values**:
  - 50: `#faf5ff` (lightest)
  - 500: `#160717` (main)
  - 900: `#581c87` (darkest)

#### Indigo (Blue/Purple)
- **Usage**: Info actions, informational elements, secondary navigation
- **Classes**: `text-indigo-*`, `bg-indigo-*`, `bg-gradient-indigo`
- **Hex Values**:
  - 50: `#eef2ff` (lightest)
  - 500: `#1F3D59` (main)
  - 900: `#312e81` (darkest)

### Neutral Colors

#### Slate (Primary Neutral)
- **Usage**: Text, backgrounds, borders
- **Classes**: `text-slate-*`, `bg-slate-*`
- **Hex Values**:
  - 50: `#f8fafc` (lightest)
  - 500: `#67748e` (main)
  - 900: `#0f172a` (darkest)

#### Gray (Secondary Neutral)
- **Usage**: Secondary text, subtle backgrounds
- **Classes**: `text-gray-*`, `bg-gray-*`
- **Hex Values**:
  - 50: `#f8f9fa` (lightest)
  - 500: `#adb5bd` (main)
  - 900: `#141727` (darkest)

## Semantic Color Usage

### Text Colors
```css
/* Primary text */
.text-slate-700    /* Main content text */
.text-slate-500    /* Secondary text */
.text-slate-400    /* Muted text */
.text-white        /* Inverse text */
```

### Background Colors
```css
/* Page backgrounds */
.bg-slate-50       /* Main page background */
.bg-white          /* Card backgrounds */
.bg-gradient-cerulean  /* Primary action backgrounds */
```

### Button Colors
```css
/* Primary button */
.bg-gradient-cerulean.text-white

/* Secondary button */
.bg-white.text-slate-600.border.border-gray-200

/* Success button */
.bg-gradient-verdigris.text-white

/* Warning button */
.bg-gradient-eggplant.text-white

/* Danger button */
.bg-gradient-licorice.text-white

/* Info button */
.bg-gradient-indigo.text-white
```

### Loading Spinners
```css
/* Primary spinner */
.animate-spin.rounded-full.h-12.w-12.border-b-2.border-cerulean-500

/* Secondary spinner */
.animate-spin.rounded-full.h-12.w-12.border-b-2.border-slate-300
```

## Usage Guidelines

### When to Use Each Color

#### Cerulean (Primary)
- ✅ Main call-to-action buttons
- ✅ Primary navigation elements
- ✅ Loading spinners
- ✅ Active states
- ✅ Brand elements

#### Verdigris (Success)
- ✅ Success messages
- ✅ Save/Submit actions
- ✅ Positive indicators
- ✅ Secondary CTAs

#### Eggplant (Warning)
- ✅ Warning messages
- ✅ Caution states
- ✅ Special features
- ✅ Accent elements

#### Licorice (Danger)
- ✅ Delete actions
- ✅ Error messages
- ✅ Destructive operations
- ✅ Critical alerts

#### Indigo (Info)
- ✅ Information messages
- ✅ Help text
- ✅ Secondary navigation
- ✅ Informational CTAs

### Color Combinations

#### High Contrast (Accessible)
- `text-slate-700` on `bg-white`
- `text-white` on `bg-gradient-cerulean`
- `text-slate-500` on `bg-slate-50`

#### Medium Contrast
- `text-slate-600` on `bg-slate-100`
- `text-cerulean-700` on `bg-cerulean-50`

#### Low Contrast (Subtle)
- `text-slate-400` on `bg-slate-50`
- `text-cerulean-500` on `bg-cerulean-100`

## Implementation

### Using the Color System

1. **Import the color system**:
```typescript
import { semanticColors, getColorClasses } from '@/lib/colors'
```

2. **Use semantic classes**:
```typescript
// Instead of hardcoded colors
className="bg-blue-600 text-white"

// Use semantic colors
className={getColorClasses('button', 'primary')}
```

3. **Apply consistent patterns**:
```typescript
// Loading states
className="animate-spin rounded-full h-12 w-12 border-b-2 border-cerulean-500"

// Button states
className="bg-gradient-cerulean text-white hover:shadow-soft-md focus:ring-2 focus:ring-cerulean-500"
```

### Maintenance

#### Adding New Colors
1. Add to `/lib/colors.ts`
2. Update Tailwind config if needed
3. Run the color update script
4. Update this documentation

#### Updating Existing Colors
1. Modify `/lib/colors.ts`
2. Run the color update script: `node scripts/update-colors.js`
3. Test all affected components
4. Update documentation

#### Color Update Script
```bash
# Run the automated color update
node scripts/update-colors.js
```

## Accessibility

### Color Contrast
- All color combinations meet WCAG AA standards
- High contrast ratios for text readability
- Color is not the only indicator of meaning

### Color Blindness
- Colors are distinguishable for common color vision deficiencies
- Icons and text accompany color indicators
- Patterns and shapes supplement color coding

## Best Practices

### Do's ✅
- Use semantic color classes consistently
- Follow the established color hierarchy
- Test color combinations for accessibility
- Use the color update script for bulk changes

### Don'ts ❌
- Don't hardcode hex values in components
- Don't mix different color systems
- Don't use colors that aren't in the palette
- Don't ignore accessibility requirements

## Examples

### Good Examples
```typescript
// ✅ Using semantic colors
<button className="bg-gradient-cerulean text-white hover:shadow-soft-md">
  Primary Action
</button>

// ✅ Consistent loading state
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cerulean-500"></div>

// ✅ Proper text hierarchy
<h1 className="text-slate-700">Main Heading</h1>
<p className="text-slate-500">Secondary text</p>
```

### Bad Examples
```typescript
// ❌ Hardcoded colors
<button className="bg-blue-600 text-white">Action</button>

// ❌ Inconsistent spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>

// ❌ Random color usage
<h1 className="text-purple-700">Heading</h1>
```

## Troubleshooting

### Common Issues

1. **Colors not updating**: Run the color update script
2. **Inconsistent appearance**: Check for hardcoded colors
3. **Accessibility issues**: Verify contrast ratios
4. **Build errors**: Ensure Tailwind config is updated

### Debugging
```bash
# Check for hardcoded colors
grep -r "bg-blue-\|text-blue-\|border-blue-" app/ components/

# Verify color classes exist
grep -r "cerulean\|verdigris\|eggplant\|licorice\|indigo" tailwind.config.js
```

## Resources

- [Tailwind CSS Color System](https://tailwindcss.com/docs/customizing-colors)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
