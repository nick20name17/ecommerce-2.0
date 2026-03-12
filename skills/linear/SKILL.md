---
name: linear-ui-skills
description: Linear-inspired UI design system used in this project. Reference when building or modifying any UI component.
license: MIT
metadata:
  author: design-skills
  version: "2.0.0"
---

# Linear-Inspired UI Design System

Opinionated patterns extracted from the actual codebase (tasks page is the reference implementation).

## When to Apply

Reference these guidelines when building or modifying ANY UI in this project.

## Design Tokens (Tailwind CSS custom properties)

Use these Tailwind classes — never hardcode hex values except for semantic status/priority colors.

| Token class | Usage |
|-------------|-------|
| `bg-background` | Page/panel background |
| `bg-bg-hover` | Hover state for rows, cards |
| `bg-bg-active` | Active/pressed state |
| `bg-bg-secondary` | Subtle badge/tag backgrounds |
| `text-foreground` | Primary text |
| `text-text-secondary` | Secondary text (labels, metadata) |
| `text-text-tertiary` | Tertiary text (placeholders, disabled) |
| `border-border` | Default borders |
| `border-border-light` | Subtle row dividers |
| `primary` | Brand accent (buttons, focus rings) |

### Status Colors (hardcoded)
- Done: `#34C759` / dark `#30D158`
- In Progress: `#007AFF` / dark `#0A84FF`
- Todo: `#8E8E93`
- Backlog: `#C7C7CC` / dark `#48484A`

### Priority Colors (from `TASK_PRIORITY_COLORS`)
- Low: `#34C759` (green)
- Medium: `#FFCC00` (yellow)
- High: `#FF9500` (orange)
- Urgent: `#FF3B30` (red)

## Typography

- Font: `Inter Variable` via `@fontsource-variable/inter`
- MUST use `tabular-nums` for all numeric data (counts, IDs, dates)

| Usage | Size | Weight | Class example |
|-------|------|--------|---------------|
| Page title | 14px | 600 | `text-[14px] font-semibold` |
| Row/card text | 13px | 500 | `text-[13px] font-medium` |
| Badges, labels | 12px | 500 | `text-[12px] font-medium` |
| Metadata, IDs | 11px | 500 | `text-[11px] font-medium tabular-nums` |
| Detail title | 24px | 600 | `text-[24px] font-semibold` |

## Spacing

- MUST use 4px grid
- Common gaps: `gap-1` (4), `gap-1.5` (6), `gap-2` (8), `gap-2.5` (10), `gap-3` (12), `gap-4` (16)
- Row padding: `px-8 py-1.5` desktop, `px-5 py-1.5` tablet
- Toolbar padding: `px-6 py-2` desktop, `px-4 py-2` mobile
- Modal body: `px-6 py-4`

## Borders & Radius

- Default radius: `rounded-[6px]` for buttons, inputs, dropdown items, cards
- Larger elements: `rounded-lg` (8px) for cards, modals, popovers
- MUST use 1px borders only
- Row dividers: `border-b border-border-light`
- Section dividers: `border-b border-border`

## Shadows

- Dropdowns/popovers: `style={{ boxShadow: 'var(--dropdown-shadow)' }}`
- Card hover: `shadow-md`
- Drag overlay: `shadow-lg`

## Transitions

- MUST use `transition-colors duration-[80ms]` for interactive elements
- MUST use `transition-opacity` for show/hide (e.g. row actions on hover)

## Component Patterns

### List Rows

```
group/row flex cursor-pointer items-center border-b border-border-light
hover:bg-bg-hover transition-colors duration-100
gap-6 px-8 py-1.5  (desktop)
gap-4 px-5 py-1.5  (tablet)
```

- Primary content: `flex min-w-0 flex-1` with `truncate` on text
- Right metadata: `flex shrink-0 items-center gap-4` with fixed-width columns
- Row actions: `opacity-0 group-hover/row:opacity-100 transition-opacity`

### Icon Buttons (inline, ghost)

```
inline-flex size-6 items-center justify-center rounded-[6px]
text-text-tertiary transition-colors duration-[80ms]
hover:bg-bg-active hover:text-foreground
```

- Icon size: `size-3.5` or `size-4`
- MUST include `aria-label`

### Counter Buttons (notes, attachments)

Two states: empty (ghost) and with count (bordered badge).

```tsx
// Empty: ghost style
'border-transparent text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
// With count: subtle bordered badge
'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active'
// Shared base
'inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[12px] font-medium transition-colors duration-[80ms]'
```

- Icon: `size-3.5`
- Counter: `tabular-nums`
- Always show the count (0 when empty)

### Dropdowns & Popovers

```
PopoverContent: w-64 overflow-hidden rounded-lg border-border p-0
  style={{ boxShadow: 'var(--dropdown-shadow)' }}
```

- Search header: `flex items-center gap-1.5 border-b border-border px-2.5 py-[6px]`
- Search input: `flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-text-tertiary`
- Item list: `max-h-64 overflow-y-auto overscroll-contain p-1`
- Items: `rounded-[6px] px-2.5 py-[7px] text-[13px] font-medium hover:bg-bg-hover`
- Loading: 5 `Skeleton` rows `h-8 w-full rounded-[6px]`
- Empty: centered icon + text `text-xs text-text-tertiary py-6`

### Combobox Pattern

- Trigger: outline button or custom trigger with `ChevronsUpDown` icon
- Popover opens on click, auto-focuses search input via `queueMicrotask`
- Debounced search (300ms) with `useDebouncedCallback`
- `enabled: open` on query (only fetch when open)
- `staleTime: 30_000` + `placeholderData: keepPreviousData` for performance
- Clear button: destructive hover `hover:bg-destructive/10 hover:text-destructive`

### Kanban Cards

```
rounded-lg border border-border p-3
hover:border-foreground/15 hover:shadow-md hover:bg-bg-hover/50
```

- Title: `text-[13px] font-medium leading-snug line-clamp-2`
- Meta: `text-[11px] tabular-nums text-text-tertiary`
- Dragging: `rotate-[2deg] shadow-lg ring-1 ring-primary/20`

### Modals (Dialog)

- Max width: `sm:max-w-2xl`
- Sticky header: `bg-background border-b px-6 py-4 z-10`
- Scrollable body: `px-6 py-4`
- Sticky footer: `bg-background border-t z-10`
- Form grid: `grid-cols-1 gap-2.5 sm:grid-cols-2`

### Status Indicators

- Color dot: `size-1.5 rounded-full` with inline `backgroundColor`
- Status icon: `StatusIcon` component from `@/components/ds`
- Priority: 4-bar chart SVG from `TASK_PRIORITY_COLORS`

### Badges

```
inline-flex items-center rounded-[4px] bg-bg-secondary px-1.5 py-0.5
text-[11px] font-medium text-text-secondary
```

### Delete Confirmation

- MUST use `AlertDialog` for destructive actions
- Show entity title in description
- Cancel + destructive Delete buttons

## Data Patterns

### Query Structure
- Query keys: `ENTITY_QUERY_KEYS.list(params)`, `.detail(id)`
- Optimistic updates for status changes
- `staleTime` on frequently-opened dropdowns
- `enabled` flag to defer fetching until needed

### Form Pattern
- React Hook Form + Zod validation
- `Controller` for each field
- Inline validation errors
- Loading state on submit button via `isPending`

## Rules

- NEVER hardcode colors — use design tokens
- MUST use `rounded-[6px]` as default radius (not `rounded-md`)
- MUST use `duration-[80ms]` for hover transitions (not default 150ms)
- MUST use `text-[13px]` as primary UI text size
- MUST add `aria-label` to icon-only buttons
- MUST use `truncate` on text that could overflow
- MUST use `tabular-nums` on numeric data
- SHOULD use `Skeleton` components for loading states
- SHOULD use `AlertDialog` for destructive actions
- NEVER use `useEffect` for render-derivable logic
