/**
 * Document template starter presets.
 *
 * Lean skeletons that fill in a sensible layout + column config so users can
 * start from "something close to what they want" instead of an empty canvas.
 * Each preset is just data — the layout JSON shape matches what the backend
 * renderer + frontend designer already consume.
 *
 * IDs use simple `presetN` strings; the create flow re-issues `crypto.randomUUID`
 * for every element when materializing a real template (so two templates from
 * the same preset don't collide).
 */

import type {
  CreateDocumentTemplatePayload,
  DocumentLayout,
  EntityType,
  Orientation,
  PageSize,
  TableColumn,
} from './schema'

export type DocumentTemplatePresetKey =
  | 'blank'
  | 'invoice'
  | 'packing_list'
  | 'shipping_label'

export interface DocumentTemplatePreset {
  key: DocumentTemplatePresetKey
  label: string
  description: string
  entity_type: EntityType
  page_size: PageSize
  orientation: Orientation
  layout: DocumentLayout
  /** Default fill for name / description on the create form. */
  defaultName: string
  /** Default print-from routes. */
  defaultAccessibleFrom: string[]
  /** Default margins (inches). */
  page_margins?: { top?: number; right?: number; bottom?: number; left?: number }
}

// ── Helpers (data-only, no React) ───────────────────────────

const COLOR_TEXT = '#111'
const COLOR_MUTED = '#6b7280'
const COLOR_BORDER = '#d4d4d8'
const COLOR_HEADER_BG = '#f4f4f5'

const INVOICE_COLUMNS: TableColumn[] = [
  { fieldKey: 'quan', label: 'Qty', widthPct: 10, align: 'right', format: 'number' },
  { fieldKey: 'inven', label: 'Item', widthPct: 18, align: 'left', format: 'string' },
  { fieldKey: 'descr', label: 'Description', widthPct: 38, align: 'left', format: 'string' },
  { fieldKey: 'unit_price', label: 'Unit Price', widthPct: 17, align: 'right', format: 'currency' },
  { fieldKey: 'amount', label: 'Amount', widthPct: 17, align: 'right', format: 'currency' },
]

const PACKING_LIST_COLUMNS: TableColumn[] = [
  { fieldKey: 'quan', label: 'Ordered', widthPct: 12, align: 'right', format: 'number' },
  { fieldKey: 'ship', label: 'Shipped', widthPct: 12, align: 'right', format: 'number' },
  { fieldKey: 'inven', label: 'Item', widthPct: 21, align: 'left', format: 'string' },
  { fieldKey: 'descr', label: 'Description', widthPct: 55, align: 'left', format: 'string' },
]

// ── Plain Paper Invoice ─────────────────────────────────────

const INVOICE_LAYOUT: DocumentLayout = {
  pages: [
    {
      elements: [
        // Top-left: logo placeholder
        {
          id: 'preset1',
          type: 'image',
          x: 0.5, y: 0.5, w: 1.8, h: 0.9,
          props: { src: '' },
        },
        // Center: company name
        {
          id: 'preset2',
          type: 'text',
          x: 2.5, y: 0.55, w: 3.5, h: 0.35,
          props: {
            text: 'Your Company Name',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT,
          },
        },
        // Center: company address (multi-line text — users can edit)
        {
          id: 'preset3',
          type: 'text',
          x: 2.5, y: 0.95, w: 3.5, h: 0.6,
          props: {
            text: '123 Street\nCity, ST 12345\nPhone: (555) 123-4567',
            fontSize: 9,
            textAlign: 'center',
            color: COLOR_MUTED,
          },
        },
        // Top-right: INVOICE title
        {
          id: 'preset4',
          type: 'text',
          x: 6.1, y: 0.5, w: 1.9, h: 0.4,
          props: {
            text: 'INVOICE',
            fontSize: 22,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT,
          },
        },
        // Top-right: invoice # + date row labels
        {
          id: 'preset5',
          type: 'text',
          x: 6.1, y: 1.05, w: 1, h: 0.2,
          props: { text: 'Invoice #', fontSize: 9, textAlign: 'left', color: COLOR_MUTED },
        },
        {
          id: 'preset6',
          type: 'field',
          x: 7.1, y: 1.05, w: 0.9, h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 9, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset7',
          type: 'text',
          x: 6.1, y: 1.27, w: 1, h: 0.2,
          props: { text: 'Date', fontSize: 9, textAlign: 'left', color: COLOR_MUTED },
        },
        {
          id: 'preset8',
          type: 'field',
          x: 7.1, y: 1.27, w: 0.9, h: 0.2,
          props: { fieldKey: 'inv_date', fontSize: 9, textAlign: 'right', color: COLOR_TEXT },
        },

        // Divider
        {
          id: 'preset9',
          type: 'line',
          x: 0.5, y: 1.75, w: 7.5, h: 0,
          props: { thickness: 1, color: COLOR_BORDER },
        },

        // Bill To header
        {
          id: 'preset10',
          type: 'text',
          x: 0.5, y: 1.9, w: 2, h: 0.22,
          props: { text: 'Bill To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED },
        },
        // Bill To name + address fields
        {
          id: 'preset11',
          type: 'field',
          x: 0.5, y: 2.15, w: 3.5, h: 0.25,
          props: { fieldKey: 'name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT },
        },
        {
          id: 'preset12',
          type: 'field',
          x: 0.5, y: 2.4, w: 3.5, h: 0.25,
          props: { fieldKey: 'address1', fontSize: 9, color: COLOR_TEXT },
        },
        {
          id: 'preset13',
          type: 'field',
          x: 0.5, y: 2.62, w: 3.5, h: 0.25,
          props: { fieldKey: 'city', fontSize: 9, color: COLOR_TEXT },
        },

        // Ship To header
        {
          id: 'preset14',
          type: 'text',
          x: 4.5, y: 1.9, w: 2, h: 0.22,
          props: { text: 'Ship To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED },
        },
        {
          id: 'preset15',
          type: 'field',
          x: 4.5, y: 2.15, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT },
        },
        {
          id: 'preset16',
          type: 'field',
          x: 4.5, y: 2.4, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_address1', fontSize: 9, color: COLOR_TEXT },
        },
        {
          id: 'preset17',
          type: 'field',
          x: 4.5, y: 2.62, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_city', fontSize: 9, color: COLOR_TEXT },
        },

        // Items table
        {
          id: 'preset18',
          type: 'table',
          x: 0.5, y: 3.4, w: 7.5, h: 5,
          props: {
            columns: INVOICE_COLUMNS,
            itemsSource: 'items',
            showHeader: true,
            headerBackground: COLOR_HEADER_BG,
            fontSize: 9,
            striped: true,
            stripeBackground: '#fafafa',
            borderColor: COLOR_BORDER,
          },
        },

        // Totals (bottom-right)
        {
          id: 'preset19',
          type: 'text',
          x: 5.5, y: 8.8, w: 1, h: 0.25,
          props: { text: 'Subtotal', fontSize: 10, textAlign: 'right', color: COLOR_MUTED },
        },
        {
          id: 'preset20',
          type: 'field',
          x: 6.5, y: 8.8, w: 1.5, h: 0.25,
          props: { fieldKey: 'subtotal', fontSize: 10, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset21',
          type: 'text',
          x: 5.5, y: 9.05, w: 1, h: 0.25,
          props: { text: 'Tax', fontSize: 10, textAlign: 'right', color: COLOR_MUTED },
        },
        {
          id: 'preset22',
          type: 'field',
          x: 6.5, y: 9.05, w: 1.5, h: 0.25,
          props: { fieldKey: 'tax', fontSize: 10, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset23',
          type: 'line',
          x: 5.5, y: 9.32, w: 2.5, h: 0,
          props: { thickness: 1, color: COLOR_TEXT },
        },
        {
          id: 'preset24',
          type: 'text',
          x: 5.5, y: 9.4, w: 1, h: 0.3,
          props: { text: 'Total', fontSize: 12, fontWeight: 'bold', textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset25',
          type: 'field',
          x: 6.5, y: 9.4, w: 1.5, h: 0.3,
          props: { fieldKey: 'total', fontSize: 12, fontWeight: 'bold', textAlign: 'right', color: COLOR_TEXT },
        },

        // Footer
        {
          id: 'preset26',
          type: 'text',
          x: 0.5, y: 10.4, w: 7.5, h: 0.3,
          props: {
            text: 'Thank you for your business!',
            fontSize: 9,
            fontStyle: 'italic',
            textAlign: 'center',
            color: COLOR_MUTED,
          },
        },
      ],
    },
  ],
}

// ── Packing List ────────────────────────────────────────────

const PACKING_LIST_LAYOUT: DocumentLayout = {
  pages: [
    {
      elements: [
        {
          id: 'preset1',
          type: 'image',
          x: 0.5, y: 0.5, w: 1.8, h: 0.9,
          props: { src: '' },
        },
        {
          id: 'preset2',
          type: 'text',
          x: 2.5, y: 0.55, w: 3.5, h: 0.35,
          props: {
            text: 'Your Company Name',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT,
          },
        },
        {
          id: 'preset3',
          type: 'text',
          x: 6.1, y: 0.5, w: 1.9, h: 0.4,
          props: {
            text: 'PACKING LIST',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT,
          },
        },
        {
          id: 'preset4',
          type: 'text',
          x: 6.1, y: 1.05, w: 1, h: 0.2,
          props: { text: 'Order #', fontSize: 9, textAlign: 'left', color: COLOR_MUTED },
        },
        {
          id: 'preset5',
          type: 'field',
          x: 7.1, y: 1.05, w: 0.9, h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 9, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset6',
          type: 'text',
          x: 6.1, y: 1.27, w: 1, h: 0.2,
          props: { text: 'Ship Date', fontSize: 9, textAlign: 'left', color: COLOR_MUTED },
        },
        {
          id: 'preset7',
          type: 'field',
          x: 7.1, y: 1.27, w: 0.9, h: 0.2,
          props: { fieldKey: 'ship_date', fontSize: 9, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset8',
          type: 'line',
          x: 0.5, y: 1.75, w: 7.5, h: 0,
          props: { thickness: 1, color: COLOR_BORDER },
        },
        // Ship To block
        {
          id: 'preset9',
          type: 'text',
          x: 0.5, y: 1.9, w: 2, h: 0.22,
          props: { text: 'Ship To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED },
        },
        {
          id: 'preset10',
          type: 'field',
          x: 0.5, y: 2.15, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT },
        },
        {
          id: 'preset11',
          type: 'field',
          x: 0.5, y: 2.4, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_address1', fontSize: 9, color: COLOR_TEXT },
        },
        {
          id: 'preset12',
          type: 'field',
          x: 0.5, y: 2.62, w: 3.5, h: 0.25,
          props: { fieldKey: 'c_city', fontSize: 9, color: COLOR_TEXT },
        },
        // Ship Via
        {
          id: 'preset13',
          type: 'text',
          x: 4.5, y: 1.9, w: 2, h: 0.22,
          props: { text: 'Ship Via', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED },
        },
        {
          id: 'preset14',
          type: 'field',
          x: 4.5, y: 2.15, w: 3.5, h: 0.25,
          props: { fieldKey: 'ship_via', fontSize: 10, color: COLOR_TEXT },
        },
        // Items table
        {
          id: 'preset15',
          type: 'table',
          x: 0.5, y: 3.4, w: 7.5, h: 6.5,
          props: {
            columns: PACKING_LIST_COLUMNS,
            itemsSource: 'items',
            showHeader: true,
            headerBackground: COLOR_HEADER_BG,
            fontSize: 9,
            striped: false,
            borderColor: COLOR_BORDER,
          },
        },
        // Footer
        {
          id: 'preset16',
          type: 'text',
          x: 0.5, y: 10.4, w: 7.5, h: 0.3,
          props: {
            text: 'This is only a Packing List',
            fontSize: 9,
            fontStyle: 'italic',
            textAlign: 'center',
            color: COLOR_MUTED,
          },
        },
      ],
    },
  ],
}

// ── Shipping Label (4×6) ────────────────────────────────────

const SHIPPING_LABEL_LAYOUT: DocumentLayout = {
  pages: [
    {
      elements: [
        // From (return) — top
        {
          id: 'preset1',
          type: 'text',
          x: 0.15, y: 0.15, w: 1, h: 0.18,
          props: { text: 'FROM', fontSize: 7, fontWeight: 'bold', color: COLOR_MUTED },
        },
        {
          id: 'preset2',
          type: 'text',
          x: 0.15, y: 0.32, w: 3.7, h: 0.7,
          props: {
            text: 'Your Company\n123 Street\nCity, ST 12345',
            fontSize: 9,
            color: COLOR_TEXT,
          },
        },
        // Separator
        {
          id: 'preset3',
          type: 'line',
          x: 0.15, y: 1.1, w: 3.7, h: 0,
          props: { thickness: 1.5, color: COLOR_TEXT },
        },
        // SHIP TO
        {
          id: 'preset4',
          type: 'text',
          x: 0.15, y: 1.25, w: 1.5, h: 0.2,
          props: { text: 'SHIP TO', fontSize: 9, fontWeight: 'bold', color: COLOR_TEXT },
        },
        {
          id: 'preset5',
          type: 'field',
          x: 0.15, y: 1.5, w: 3.7, h: 0.3,
          props: {
            fieldKey: 'c_name',
            fontSize: 14,
            fontWeight: 'bold',
            color: COLOR_TEXT,
          },
        },
        {
          id: 'preset6',
          type: 'field',
          x: 0.15, y: 1.85, w: 3.7, h: 0.28,
          props: { fieldKey: 'c_address1', fontSize: 12, color: COLOR_TEXT },
        },
        {
          id: 'preset7',
          type: 'field',
          x: 0.15, y: 2.18, w: 3.7, h: 0.28,
          props: { fieldKey: 'c_address2', fontSize: 12, color: COLOR_TEXT },
        },
        {
          id: 'preset8',
          type: 'field',
          x: 0.15, y: 2.5, w: 3.7, h: 0.28,
          props: { fieldKey: 'c_city', fontSize: 12, color: COLOR_TEXT },
        },
        // Bottom: order # + ship via
        {
          id: 'preset9',
          type: 'line',
          x: 0.15, y: 4.8, w: 3.7, h: 0,
          props: { thickness: 0.5, color: COLOR_BORDER },
        },
        {
          id: 'preset10',
          type: 'text',
          x: 0.15, y: 4.9, w: 1, h: 0.2,
          props: { text: 'Order #', fontSize: 8, color: COLOR_MUTED },
        },
        {
          id: 'preset11',
          type: 'field',
          x: 1.15, y: 4.9, w: 2.7, h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 8, textAlign: 'right', color: COLOR_TEXT },
        },
        {
          id: 'preset12',
          type: 'text',
          x: 0.15, y: 5.1, w: 1, h: 0.2,
          props: { text: 'Via', fontSize: 8, color: COLOR_MUTED },
        },
        {
          id: 'preset13',
          type: 'field',
          x: 1.15, y: 5.1, w: 2.7, h: 0.2,
          props: { fieldKey: 'ship_via', fontSize: 8, textAlign: 'right', color: COLOR_TEXT },
        },
      ],
    },
  ],
}

// ── Registry ─────────────────────────────────────────────────

export const DOCUMENT_TEMPLATE_PRESETS: DocumentTemplatePreset[] = [
  {
    key: 'blank',
    label: 'Blank',
    description: 'Empty canvas — build from scratch.',
    entity_type: 'order',
    page_size: 'letter',
    orientation: 'portrait',
    layout: { pages: [{ elements: [] }] },
    defaultName: '',
    defaultAccessibleFrom: ['order_detail'],
  },
  {
    key: 'invoice',
    label: 'Plain Paper Invoice',
    description:
      'Letter portrait. Logo, bill-to/ship-to, line items table, totals box.',
    entity_type: 'order',
    page_size: 'letter',
    orientation: 'portrait',
    layout: INVOICE_LAYOUT,
    defaultName: 'Plain Paper Invoice',
    defaultAccessibleFrom: ['order_detail'],
    page_margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  },
  {
    key: 'packing_list',
    label: 'Packing List',
    description:
      'Letter portrait. Ship-to block, ship via, line items with ordered/shipped columns.',
    entity_type: 'order',
    page_size: 'letter',
    orientation: 'portrait',
    layout: PACKING_LIST_LAYOUT,
    defaultName: 'Packing List',
    defaultAccessibleFrom: ['order_detail'],
    page_margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  },
  {
    key: 'shipping_label',
    label: 'Shipping Label (4×6)',
    description: '4×6 label. From/to address blocks, large recipient name, order #.',
    entity_type: 'order',
    page_size: 'label_4x6',
    orientation: 'portrait',
    layout: SHIPPING_LABEL_LAYOUT,
    defaultName: 'Shipping Label',
    defaultAccessibleFrom: ['order_detail'],
    page_margins: { top: 0, right: 0, bottom: 0, left: 0 },
  },
]

export function getPresetByKey(
  key: DocumentTemplatePresetKey
): DocumentTemplatePreset | undefined {
  return DOCUMENT_TEMPLATE_PRESETS.find((p) => p.key === key)
}

/**
 * Re-issue fresh UUIDs for every element when materializing a preset, so
 * multiple templates created from the same preset don't share element IDs.
 */
export function materializePresetLayout(
  preset: DocumentTemplatePreset
): DocumentLayout {
  const pages = preset.layout.pages ?? []
  return {
    pages: pages.map((page) => ({
      elements: page.elements.map((el) => ({
        ...el,
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `el_${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 9)}`,
        props: el.props ? { ...el.props } : undefined,
      })),
    })),
  }
}

/** Convert a preset into a CreateDocumentTemplatePayload, optionally overriding name. */
export function presetToCreatePayload(
  preset: DocumentTemplatePreset,
  overrides: Partial<CreateDocumentTemplatePayload> = {}
): CreateDocumentTemplatePayload {
  return {
    name: overrides.name ?? preset.defaultName,
    description: overrides.description ?? preset.description,
    entity_type: preset.entity_type,
    accessible_from: (overrides.accessible_from ??
      preset.defaultAccessibleFrom) as CreateDocumentTemplatePayload['accessible_from'],
    page_size: preset.page_size,
    orientation: preset.orientation,
    page_margins: preset.page_margins,
    layout: materializePresetLayout(preset),
    is_active: true,
    ...overrides,
    // Always re-materialize the layout (override above might be undefined).
    ...(overrides.layout ? { layout: overrides.layout } : {}),
  }
}
