---
name: build-feature
description: Build a new feature, page, or component following the project's Linear-inspired design system, file conventions, and architecture patterns. Use when implementing new UI features, pages, forms, lists, or detail views.
argument-hint: [feature-description]
---

# Build Feature

You are building a new feature for this ecommerce admin app. Follow every convention below exactly.

## Architecture

- **Router**: TanStack Router, file-based routes under `src/routes/_authenticated/`
- **Server state**: React Query — queries in `src/api/{entity}/query.ts`, services in `service.ts`, Zod schemas in `schema.ts`
- **Styling**: Tailwind v4 with CSS custom properties defined in `src/index.css`
- **Components**: shadcn/ui primitives (`src/components/ui/`) + custom DS components (`src/components/ds/`)

## File Structure

| What | Where |
|------|-------|
| List page | `src/routes/_authenticated/{entity}/index.tsx` |
| Detail page | `src/routes/_authenticated/{entity}/$entityId/index.tsx` |
| Page-specific components | `src/routes/_authenticated/{entity}/-components/` |
| Shared components | `src/components/` or `src/components/common/` |
| Design system atoms | `src/components/ds/` |
| API layer | `src/api/{entity}/schema.ts`, `service.ts`, `query.ts` |

## Design System — Visual Language

This is a **Linear-inspired** design with **Apple system colors**. Dense, professional, minimal chrome.

### Color Palette (CSS custom properties)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#FFFFFF` | `#161618` | Page bg |
| `--bg-secondary` | `#F5F5F6` | `#1C1C1F` | Panels, cards |
| `--bg-hover` | `#F0EFF4` | `#232328` | Row/item hover |
| `--bg-active` | `#E8E7EC` | `#2C2C32` | Active/selected |
| `--foreground` | `#1A1A1E` | `#ECECEE` | Primary text |
| `--text-secondary` | `#65656D` | `#9B9BA3` | Secondary text |
| `--text-tertiary` | `#A8A8B0` | `#6B6B73` | Labels, meta |
| `--primary` | `#007AFF` | `#0A84FF` | Accent / links |
| `--border` | `#E6E5EB` | `#2C2C32` | Default border |
| `--border-light` | `#F0EFF4` | `#232328` | Subtle dividers |
| `--destructive` | `#FF3B30` | `#FF453A` | Delete/error |

**Status colors**: Done `#34C759`, In Progress `#007AFF`, Warning `#FF9500`, Error `#FF3B30`, Purple `#AF52DE`, Default `#8E8E93`

**Priority colors**: Low `#34C759`, Medium `#FFCC00`, High `#FF9500`, Urgent `#FF3B30`

### Typography Scale

| Element | Classes |
|---------|---------|
| Page title | `text-[16px] font-semibold tracking-[-0.02em]` |
| Detail page title | `text-[24px] font-semibold tracking-[-0.02em]` (desktop), `text-xl` (mobile) |
| Section header | `text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary` |
| Property label | `text-[12px] font-medium text-text-tertiary` |
| Body text | `text-[13px]` |
| IDs / counts | `text-[12px] tabular-nums text-text-tertiary` |
| Badges / tags | `text-[11px] font-medium rounded-[4px] bg-bg-secondary px-1.5 py-0.5` |

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons, controls, inputs | `rounded-[5px]` to `rounded-[6px]` |
| Dropdowns, popovers | `rounded-[8px]` |
| Cards, modals, dialogs | `rounded-[10px]` to `rounded-xl` |
| Inline chips, small elements | `rounded-[3px]` to `rounded-[4px]` |

### Transitions

- Color/opacity changes: `transition-colors duration-[80ms]`
- Row hover: `transition-colors duration-100`
- Opacity: `transition-opacity`

### Shadows

- Dropdown: `var(--dropdown-shadow)` = `0 6px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)`
- Surface: `var(--surface-shadow)` = `0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)`

---

## Component Reference

### Page Layout

```tsx
// Full-height container
<div className="-m-4 flex h-[calc(100%+2rem)] flex-col overflow-hidden">
  {/* Header bar */}
  <div className="flex items-center gap-2 border-b border-border px-8 py-2 max-md:px-5">
    <SidebarTrigger className="-ml-1 md:hidden" />
    <PageHeaderIcon icon={IconComponent} color={pageColors.entity} />
    <h1 className="text-[16px] font-semibold tracking-[-0.02em]">Title</h1>
    <div className="flex-1" />
    {/* Search + actions */}
  </div>

  {/* Content */}
  <div className="flex-1 overflow-y-auto">
    {/* List rows or detail content */}
  </div>

  {/* Footer (pagination) */}
  <div className="shrink-0 border-t border-border px-8 py-2">
    <Pagination />
  </div>
</div>
```

### Page Header Icon Colors

Use `PageHeaderIcon` from `src/components/ds/page-header.tsx`. Available color keys:
- `dashboard` (emerald-500), `orderDesk` (orange-500), `shipping` (cyan-500)
- `customers` (blue-500), `orders` (amber-500), `proposals` (rose-500)
- `todos` (violet-500), `projects` (slate-500), `settings` (zinc-500)
- `users` (indigo-500), `profile` (zinc-500), `testing` (gray-500)

### List Row

```tsx
<div className="group/row flex items-center gap-6 border-b border-border-light px-8 py-1.5 transition-colors duration-100 hover:bg-bg-hover max-md:px-5 max-md:gap-4 max-sm:flex-col max-sm:items-start max-sm:px-3.5 max-sm:py-2">
  <InitialsAvatar initials="AB" size={20} />
  <span className="text-[13px] font-medium">{name}</span>
  <span className="text-[12px] tabular-nums text-text-tertiary">{id}</span>
  <div className="flex-1" />
  {/* Hover actions */}
  <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
    <DropdownMenu>{/* actions */}</DropdownMenu>
  </div>
</div>
```

### Detail Page Layout

```tsx
<div className="-m-4 flex h-[calc(100%+2rem)] flex-col overflow-hidden">
  {/* Header with back button */}
  <div className="flex items-center gap-2 border-b border-border px-8 py-2">
    <Button variant="outline" size="sm" onClick={() => navigate({ to: '/entity' })}>
      <ChevronLeft className="size-4" /> Back
    </Button>
    <PageHeaderIcon icon={Icon} color={pageColors.entity} />
    <h1 className="text-[16px] font-semibold">{title}</h1>
    <div className="flex-1" />
    {/* Edit / Delete buttons */}
  </div>

  {/* Desktop: main + side panel */}
  <div className="flex flex-1 overflow-hidden">
    <div className="flex-1 overflow-y-auto p-8">{/* Main content */}</div>
    <div className="hidden w-[380px] shrink-0 border-l border-border bg-bg-secondary/50 overflow-y-auto p-6 md:block">
      {/* Properties panel */}
    </div>
  </div>
</div>
```

### Properties Panel

```tsx
<div className="space-y-4">
  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Section</h3>
  <div className="flex items-center justify-between">
    <span className="text-[12px] font-medium text-text-tertiary">Label</span>
    <span className="text-[13px]">{value}</span>
  </div>
  <div className="border-t border-border-light pt-3 mt-4" /> {/* Section divider */}
</div>
```

### Data Table

Use `DataTable` from `src/components/common/data-table/`. Define columns with TanStack Table's `columnHelper`. Use `ColumnHeader` for sortable headers.

### Inline Search (Header)

```tsx
<div className="hidden md:flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5" style={{ height: 28 }}>
  <Search className="size-3.5 shrink-0 text-text-tertiary" />
  <input className="w-[200px] bg-transparent text-[13px] outline-none placeholder:text-text-tertiary" placeholder="Search..." />
</div>
```

### Filter Popover

Use `FilterPopover` and `FilterChip` from `src/components/ds/filter-controls.tsx`:

```tsx
<FilterPopover label="Status" active={filters.size > 0} width="w-[180px]">
  {statuses.map(s => (
    <label key={s} className="flex items-center gap-2 rounded-[6px] px-2 py-[3px] text-[13px] font-medium hover:bg-bg-hover">
      <Checkbox checked={filters.has(s)} onCheckedChange={() => toggle(s)} />
      {s}
    </label>
  ))}
</FilterPopover>

{/* Active filter chips */}
{[...filters].map(f => (
  <FilterChip key={f} onRemove={() => remove(f)}>{f}</FilterChip>
))}
```

### "New" Action Button

```tsx
<Button size="sm" className="h-7 gap-1.5 rounded-[6px] bg-primary px-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
  <Plus className="size-3.5" /> New Item
</Button>
```

### Form Dialog

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Item</DialogTitle>
      <DialogDescription>Fill in the details.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <FieldSet>
        <Field orientation="vertical">
          <FieldLabel>Name</FieldLabel>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field orientation="vertical">
          <FieldLabel>Type</FieldLabel>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldSet>
    </DialogBody>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button isPending={mutation.isPending} onClick={handleSubmit}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog

```tsx
<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete item?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Empty State

Use `PageEmpty` from `src/components/common/page-empty.tsx`:

```tsx
<PageEmpty icon={Package} title="No items yet" description="Create your first item to get started." action={<Button>Create Item</Button>} />
```

### Status Indicator

Use `StatusIcon` from `src/components/ds/status-icon.tsx` with status colors:

```tsx
<StatusIcon color="#34C759" size={14} /> {/* Done */}
<StatusIcon color="#007AFF" size={14} /> {/* In Progress */}
```

### View Toggle

Use `ViewToggle` from `src/components/ds/view-toggle.tsx` for List/Board/Grid switches.

### KPI Card (Dashboard)

```tsx
<div className="rounded-[10px] border border-border bg-background p-4">
  <div className="size-7 rounded-[6px] bg-primary/10 flex items-center justify-center">
    <Icon className="size-4 text-primary" />
  </div>
  <div className="mt-3 text-[22px] font-semibold tabular-nums tracking-tight">{value}</div>
  <div className="text-[12px] font-medium text-text-tertiary">{label}</div>
</div>
```

---

## Key DS Components (import paths)

| Component | Import |
|-----------|--------|
| `InitialsAvatar` | `@/components/ds/initials-avatar` |
| `StatusIcon` | `@/components/ds/status-icon` |
| `SearchInput` | `@/components/ds/search-input` |
| `Tag` | `@/components/ds/tag` |
| `PageHeaderIcon`, `pageColors` | `@/components/ds/page-header` |
| `ViewToggle` | `@/components/ds/view-toggle` |
| `FieldTrigger` | `@/components/ds/field-trigger` |
| `FilterPopover`, `FilterChip` | `@/components/ds/filter-controls` |
| Nav icons | `@/components/ds/nav-icons` |

## Key UI Components (import paths)

| Component | Import |
|-----------|--------|
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Select`, `SelectTrigger`, etc. | `@/components/ui/select` |
| `Combobox`, etc. | `@/components/ui/combobox` |
| `Dialog`, etc. | `@/components/ui/dialog` |
| `AlertDialog`, etc. | `@/components/ui/alert-dialog` |
| `DropdownMenu`, etc. | `@/components/ui/dropdown-menu` |
| `Popover`, etc. | `@/components/ui/popover` |
| `Tabs`, etc. | `@/components/ui/tabs` |
| `Badge` | `@/components/ui/badge` |
| `Switch` | `@/components/ui/switch` |
| `Checkbox` | `@/components/ui/checkbox` |
| `Sheet`, etc. | `@/components/ui/sheet` |
| `Tooltip`, etc. | `@/components/ui/tooltip` |
| `NumberInput` | `@/components/ui/number-input` |
| `InputGroup`, etc. | `@/components/ui/input-group` |
| `Field`, `FieldSet`, etc. | `@/components/ui/field` |
| `Spinner` | `@/components/ui/spinner` |
| `Empty`, etc. | `@/components/ui/empty` |

## Key Shared Components

| Component | Import |
|-----------|--------|
| `DataTable` | `@/components/common/data-table` |
| `ColumnHeader` | `@/components/common/data-table/column-header` |
| `PageEmpty` | `@/components/common/page-empty` |
| `RoleBadge` | `@/components/common/role-badge` |
| `SearchFilter` | `@/components/common/filters/search` |
| `Pagination` | `@/components/common/pagination` |

## Key Hooks & Utilities

| Hook/Util | Usage |
|-----------|-------|
| `cn()` | Classname merger (clsx + tailwind-merge) |
| `useBreakpoint()` | Returns `'mobile' \| 'tablet' \| 'desktop'` |
| `useProjectId()` | Current project context |
| `useSearchParam()` | URL search state |
| `useOffsetParam()` / `useLimitParam()` | Pagination URL state |
| `useAuth()` | User context + role |
| `isAdmin(role)` | Permission check |

---

## Implementation Checklist

When building a new feature:

1. **API layer first** — Create `src/api/{entity}/schema.ts` (Zod), `service.ts` (fetch calls), `query.ts` (React Query hooks)
2. **Route file** — Add to `src/routes/_authenticated/{entity}/index.tsx`
3. **Page layout** — Use the full-height container pattern with header/content/footer
4. **List view** — DataTable or custom rows with hover actions, search, filters, pagination
5. **Detail view** — Back button, main + side panel, tabs if needed
6. **Forms** — Dialog-based with Field/FieldSet, proper validation
7. **Empty states** — PageEmpty component
8. **Loading states** — Skeleton rows or `isPending` on buttons
9. **Responsive** — Test mobile (stacked), tablet (reduced gaps), desktop (full layout)
10. **Nav entry** — Add to sidebar if it's a top-level entity
