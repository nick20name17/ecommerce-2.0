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

import { RODRIX_LOGO_DATA_URL } from './preset-assets'
import type {
  CreateDocumentTemplatePayload,
  DocumentLayout,
  EntityType,
  Orientation,
  PageSize,
  TableColumn
} from './schema'

export type DocumentTemplatePresetKey =
  | 'blank'
  | 'invoice'
  | 'credit_invoice'
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
  { fieldKey: 'amount', label: 'Amount', widthPct: 17, align: 'right', format: 'currency' }
]

const PACKING_LIST_COLUMNS: TableColumn[] = [
  { fieldKey: 'quan', label: 'Ordered', widthPct: 12, align: 'right', format: 'number' },
  { fieldKey: 'ship', label: 'Shipped', widthPct: 12, align: 'right', format: 'number' },
  { fieldKey: 'inven', label: 'Item', widthPct: 21, align: 'left', format: 'string' },
  { fieldKey: 'descr', label: 'Description', widthPct: 55, align: 'left', format: 'string' }
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
          x: 0.5,
          y: 0.5,
          w: 1.8,
          h: 0.9,
          props: { src: '' }
        },
        // Center: company name
        {
          id: 'preset2',
          type: 'text',
          x: 2.5,
          y: 0.55,
          w: 3.5,
          h: 0.35,
          props: {
            text: 'Your Company Name',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        // Center: company address (multi-line text — users can edit)
        {
          id: 'preset3',
          type: 'text',
          x: 2.5,
          y: 0.95,
          w: 3.5,
          h: 0.6,
          props: {
            text: '123 Street\nCity, ST 12345\nPhone: (555) 123-4567',
            fontSize: 9,
            textAlign: 'center',
            color: COLOR_MUTED
          }
        },
        // Top-right: INVOICE title
        {
          id: 'preset4',
          type: 'text',
          x: 6.1,
          y: 0.5,
          w: 1.9,
          h: 0.4,
          props: {
            text: 'INVOICE',
            fontSize: 22,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },
        // Top-right: invoice # + date row labels
        {
          id: 'preset5',
          type: 'text',
          x: 6.1,
          y: 1.05,
          w: 1,
          h: 0.2,
          props: { text: 'Invoice #', fontSize: 9, textAlign: 'left', color: COLOR_MUTED }
        },
        {
          id: 'preset6',
          type: 'field',
          x: 7.1,
          y: 1.05,
          w: 0.9,
          h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset7',
          type: 'text',
          x: 6.1,
          y: 1.27,
          w: 1,
          h: 0.2,
          props: { text: 'Date', fontSize: 9, textAlign: 'left', color: COLOR_MUTED }
        },
        {
          id: 'preset8',
          type: 'field',
          x: 7.1,
          y: 1.27,
          w: 0.9,
          h: 0.2,
          props: { fieldKey: 'inv_date', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },

        // Divider
        {
          id: 'preset9',
          type: 'line',
          x: 0.5,
          y: 1.75,
          w: 7.5,
          h: 0,
          props: { thickness: 1, color: COLOR_BORDER }
        },

        // Bill To header
        {
          id: 'preset10',
          type: 'text',
          x: 0.5,
          y: 1.9,
          w: 2,
          h: 0.22,
          props: { text: 'Bill To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED }
        },
        // Bill To name + address fields
        {
          id: 'preset11',
          type: 'field',
          x: 0.5,
          y: 2.15,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset12',
          type: 'field',
          x: 0.5,
          y: 2.4,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'address1', fontSize: 9, color: COLOR_TEXT }
        },
        {
          id: 'preset13',
          type: 'field',
          x: 0.5,
          y: 2.62,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'city', fontSize: 9, color: COLOR_TEXT }
        },

        // Ship To header
        {
          id: 'preset14',
          type: 'text',
          x: 4.5,
          y: 1.9,
          w: 2,
          h: 0.22,
          props: { text: 'Ship To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED }
        },
        {
          id: 'preset15',
          type: 'field',
          x: 4.5,
          y: 2.15,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset16',
          type: 'field',
          x: 4.5,
          y: 2.4,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_address1', fontSize: 9, color: COLOR_TEXT }
        },
        {
          id: 'preset17',
          type: 'field',
          x: 4.5,
          y: 2.62,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_city', fontSize: 9, color: COLOR_TEXT }
        },

        // Items table
        {
          id: 'preset18',
          type: 'table',
          x: 0.5,
          y: 3.4,
          w: 7.5,
          h: 5,
          props: {
            columns: INVOICE_COLUMNS,
            itemsSource: 'items',
            showHeader: true,
            headerBackground: COLOR_HEADER_BG,
            fontSize: 9,
            striped: true,
            stripeBackground: '#fafafa',
            borderColor: COLOR_BORDER
          }
        },

        // Totals (bottom-right)
        {
          id: 'preset19',
          type: 'text',
          x: 5.5,
          y: 8.8,
          w: 1,
          h: 0.25,
          props: { text: 'Subtotal', fontSize: 10, textAlign: 'right', color: COLOR_MUTED }
        },
        {
          id: 'preset20',
          type: 'field',
          x: 6.5,
          y: 8.8,
          w: 1.5,
          h: 0.25,
          props: { fieldKey: 'subtotal', fontSize: 10, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset21',
          type: 'text',
          x: 5.5,
          y: 9.05,
          w: 1,
          h: 0.25,
          props: { text: 'Tax', fontSize: 10, textAlign: 'right', color: COLOR_MUTED }
        },
        {
          id: 'preset22',
          type: 'field',
          x: 6.5,
          y: 9.05,
          w: 1.5,
          h: 0.25,
          props: { fieldKey: 'tax', fontSize: 10, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset23',
          type: 'line',
          x: 5.5,
          y: 9.32,
          w: 2.5,
          h: 0,
          props: { thickness: 1, color: COLOR_TEXT }
        },
        {
          id: 'preset24',
          type: 'text',
          x: 5.5,
          y: 9.4,
          w: 1,
          h: 0.3,
          props: {
            text: 'Total',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset25',
          type: 'field',
          x: 6.5,
          y: 9.4,
          w: 1.5,
          h: 0.3,
          props: {
            fieldKey: 'total',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },

        // Footer
        {
          id: 'preset26',
          type: 'text',
          x: 0.5,
          y: 10.4,
          w: 7.5,
          h: 0.3,
          props: {
            text: 'Thank you for your business!',
            fontSize: 9,
            fontStyle: 'italic',
            textAlign: 'center',
            color: COLOR_MUTED
          }
        }
      ]
    }
  ]
}

// ── Credit Invoice (Rodrix-style, with embedded logo) ───────

const CREDIT_INVOICE_COLUMNS: TableColumn[] = [
  { fieldKey: 'quan', label: 'Ordered', widthPct: 10, align: 'right', format: 'number' },
  { fieldKey: 'ship', label: 'Shipped', widthPct: 10, align: 'right', format: 'number' },
  { fieldKey: 'unit_meas', label: 'Unit', widthPct: 7, align: 'left', format: 'string' },
  { fieldKey: 'inven', label: 'Product ID', widthPct: 15, align: 'left', format: 'string' },
  { fieldKey: 'descr', label: 'Description', widthPct: 33, align: 'left', format: 'string' },
  { fieldKey: 'unit_price', label: 'Unit Price', widthPct: 12, align: 'right', format: 'currency' },
  { fieldKey: 'amount', label: 'Extended', widthPct: 13, align: 'right', format: 'currency' }
]

// Coordinates roughly mirror the Rodrix Fasteners Credit Invoice screenshot
// the user shared. Letter portrait, 0.4" margins. ~35 elements.
const CREDIT_INVOICE_LAYOUT: DocumentLayout = {
  pages: [
    {
      elements: [
        // ── Header: logo + company info + title + invoice meta ──
        {
          id: 'preset-logo',
          type: 'image',
          x: 0.4,
          y: 0.4,
          w: 2.4,
          h: 1.05,
          props: { src: RODRIX_LOGO_DATA_URL }
        },
        {
          id: 'preset-company-name',
          type: 'text',
          x: 3.0,
          y: 0.4,
          w: 2.6,
          h: 0.3,
          props: {
            text: 'Rodrix  Fasteners Ltd',
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-company-info',
          type: 'text',
          x: 3.0,
          y: 0.7,
          w: 2.6,
          h: 1.0,
          props: {
            text:
              '1868 King St N\n' +
              'St Jacobs, ON N0B 2N0\n' +
              'Phone: (519) 664-2452\n' +
              'Fax: (519) 664-1398\n' +
              'sales@rodrixfasteners.com\n' +
              'Phone: (877)964-2452\n' +
              'HST/GST # 833792450',
            fontSize: 8,
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-title',
          type: 'text',
          x: 5.8,
          y: 0.4,
          w: 2.3,
          h: 0.5,
          props: {
            text: 'CREDIT INVOICE',
            fontSize: 22,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },
        // Invoice meta — header band + data row, 3 columns
        {
          id: 'preset-meta-rect',
          type: 'rect',
          x: 5.8,
          y: 1.0,
          w: 2.3,
          h: 0.22,
          props: { fill: COLOR_HEADER_BG, borderWidth: 0.5, borderColor: COLOR_BORDER }
        },
        {
          id: 'preset-meta-h1',
          type: 'text',
          x: 5.8,
          y: 1.02,
          w: 0.95,
          h: 0.2,
          props: {
            text: 'Invoice Number',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-meta-h2',
          type: 'text',
          x: 6.75,
          y: 1.02,
          w: 0.65,
          h: 0.2,
          props: {
            text: 'Date',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-meta-h3',
          type: 'text',
          x: 7.4,
          y: 1.02,
          w: 0.7,
          h: 0.2,
          props: {
            text: 'Page',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-meta-v1',
          type: 'field',
          x: 5.8,
          y: 1.25,
          w: 0.95,
          h: 0.22,
          props: { fieldKey: 'invoice', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-meta-v2',
          type: 'field',
          x: 6.75,
          y: 1.25,
          w: 0.65,
          h: 0.22,
          props: { fieldKey: 'inv_date', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-meta-v3',
          type: 'text',
          x: 7.4,
          y: 1.25,
          w: 0.7,
          h: 0.22,
          props: { text: '1 of 1', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-meta-underline',
          type: 'line',
          x: 5.8,
          y: 1.5,
          w: 2.3,
          h: 0,
          props: { thickness: 0.5, color: COLOR_TEXT }
        },

        // ── Bill To / Ship To ──
        {
          id: 'preset-bill-label',
          type: 'text',
          x: 0.4,
          y: 1.9,
          w: 1.5,
          h: 0.22,
          props: { text: 'Bill To', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset-bill-name',
          type: 'field',
          x: 0.4,
          y: 2.15,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'name', fontSize: 10, color: COLOR_TEXT }
        },
        {
          id: 'preset-bill-addr1',
          type: 'field',
          x: 0.4,
          y: 2.37,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'address1', fontSize: 9, color: COLOR_TEXT }
        },
        {
          id: 'preset-bill-city',
          type: 'field',
          x: 0.4,
          y: 2.59,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'city', fontSize: 9, color: COLOR_TEXT }
        },
        // (Phone removed — Order entity doesn't carry a direct customer
        // phone field; users who want it can add a Field element bound to a
        // custom contact column.)

        {
          id: 'preset-ship-label',
          type: 'text',
          x: 4.5,
          y: 1.9,
          w: 1.5,
          h: 0.22,
          props: { text: 'Ship To', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset-ship-name',
          type: 'field',
          x: 4.5,
          y: 2.15,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'c_name', fontSize: 10, color: COLOR_TEXT }
        },
        {
          id: 'preset-ship-addr1',
          type: 'field',
          x: 4.5,
          y: 2.37,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'c_address1', fontSize: 9, color: COLOR_TEXT }
        },
        {
          id: 'preset-ship-city',
          type: 'field',
          x: 4.5,
          y: 2.59,
          w: 3.5,
          h: 0.22,
          props: { fieldKey: 'c_city', fontSize: 9, color: COLOR_TEXT }
        },

        // ── Order info bar (Customer ID / Sales Person / etc) ──
        {
          id: 'preset-bar-rect',
          type: 'rect',
          x: 0.4,
          y: 3.55,
          w: 7.7,
          h: 0.22,
          props: { fill: COLOR_HEADER_BG, borderWidth: 0.5, borderColor: COLOR_BORDER }
        },
        // 6 columns: Customer ID | Sales Person | P.O. Number | Ship Date | Ship Via | Terms
        {
          id: 'preset-bar-h1',
          type: 'text',
          x: 0.4,
          y: 3.57,
          w: 1.28,
          h: 0.2,
          props: {
            text: 'Customer ID',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-bar-h2',
          type: 'text',
          x: 1.68,
          y: 3.57,
          w: 1.28,
          h: 0.2,
          props: {
            text: 'Sales Person',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-bar-h3',
          type: 'text',
          x: 2.97,
          y: 3.57,
          w: 1.28,
          h: 0.2,
          props: {
            text: 'P.O. Number',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-bar-h4',
          type: 'text',
          x: 4.25,
          y: 3.57,
          w: 1.0,
          h: 0.2,
          props: {
            text: 'Ship Date',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-bar-h5',
          type: 'text',
          x: 5.25,
          y: 3.57,
          w: 1.0,
          h: 0.2,
          props: {
            text: 'Ship Via',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-bar-h6',
          type: 'text',
          x: 6.25,
          y: 3.57,
          w: 1.85,
          h: 0.2,
          props: {
            text: 'Terms',
            fontSize: 8,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        // Data row
        {
          id: 'preset-bar-v1',
          type: 'field',
          x: 0.4,
          y: 3.83,
          w: 1.28,
          h: 0.22,
          // `id` is the customer code on ARINV (e.g. "BEMOR"). The mistakenly
          // used `c_id` doesn't exist on the serialized Order.
          props: { fieldKey: 'id', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-bar-v2',
          type: 'field',
          x: 1.68,
          y: 3.83,
          w: 1.28,
          h: 0.22,
          props: { fieldKey: 'salesman', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-bar-v3',
          type: 'field',
          x: 2.97,
          y: 3.83,
          w: 1.28,
          h: 0.22,
          props: { fieldKey: 'po_no', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-bar-v4',
          type: 'field',
          x: 4.25,
          y: 3.83,
          w: 1.0,
          h: 0.22,
          props: { fieldKey: 'ship_date', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-bar-v5',
          type: 'field',
          x: 5.25,
          y: 3.83,
          w: 1.0,
          h: 0.22,
          props: { fieldKey: 'ship_via', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },
        {
          id: 'preset-bar-v6',
          type: 'field',
          x: 6.25,
          y: 3.83,
          w: 1.85,
          h: 0.22,
          props: { fieldKey: 'charge', fontSize: 9, textAlign: 'center', color: COLOR_TEXT }
        },

        // ── Items table ──
        {
          id: 'preset-items',
          type: 'table',
          x: 0.4,
          y: 4.15,
          w: 7.7,
          h: 5.0,
          props: {
            columns: CREDIT_INVOICE_COLUMNS,
            itemsSource: 'items',
            showHeader: true,
            headerBackground: COLOR_HEADER_BG,
            fontSize: 9,
            striped: false,
            borderColor: COLOR_BORDER
          }
        },

        // ── Payment / footer notice ──
        {
          id: 'preset-payment-importance',
          type: 'text',
          x: 0.4,
          y: 9.4,
          w: 7.7,
          h: 0.22,
          props: {
            text: '*IMPORTANT* PLEASE INCLUDE INVOICE NUMBERS ON YOUR PAYMENT',
            fontSize: 9,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-payment-etransfer',
          type: 'text',
          x: 0.4,
          y: 9.62,
          w: 7.7,
          h: 0.22,
          props: {
            text: 'We accept E-transfer, please send to:  ar@rodrixfasteners.com',
            fontSize: 9,
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-payments-header',
          type: 'text',
          x: 0.4,
          y: 9.92,
          w: 7.7,
          h: 0.22,
          props: {
            text: 'Current Payments Applied to Invoice',
            fontSize: 9,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-payments-line',
          type: 'line',
          x: 0.4,
          y: 10.14,
          w: 7.7,
          h: 0,
          props: { thickness: 0.5, color: COLOR_TEXT }
        },

        // ── Footer notices (left) ──
        {
          id: 'preset-footer-1',
          type: 'text',
          x: 0.4,
          y: 10.25,
          w: 4.5,
          h: 0.2,
          props: {
            text: 'ORDERS UNDER $10.00 ARE SUBJECT TO A $4.50 HANDLING FEE',
            fontSize: 8,
            fontWeight: 'bold',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-footer-2',
          type: 'text',
          x: 0.4,
          y: 10.42,
          w: 4.5,
          h: 0.18,
          props: {
            text: 'ALL RETURNS ARE SUBJECT TO A 15% RESTOCKING FEE',
            fontSize: 7,
            fontWeight: 'bold',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-footer-3',
          type: 'text',
          x: 0.4,
          y: 10.58,
          w: 4.5,
          h: 0.18,
          props: {
            text: 'NO RETURNS AFTER 30 DAYS - NO RETURNS ON SPECIAL ORDER ITEMS',
            fontSize: 7,
            fontWeight: 'bold',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-footer-4',
          type: 'text',
          x: 0.4,
          y: 10.74,
          w: 4.5,
          h: 0.18,
          props: {
            text: 'All claims limited to cost of goods.  Prices subject to change without notice.',
            fontSize: 7,
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-footer-5',
          type: 'text',
          x: 0.4,
          y: 10.9,
          w: 4.5,
          h: 0.18,
          props: {
            text: 'Statements issued on request or overdue accounts only.',
            fontSize: 7,
            color: COLOR_TEXT
          }
        },

        // ── Totals box (right) ──
        {
          id: 'preset-tot-subtotal-lbl',
          type: 'text',
          x: 5.6,
          y: 10.25,
          w: 1.2,
          h: 0.2,
          props: { text: 'Subtotal', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset-tot-subtotal-val',
          type: 'field',
          x: 6.85,
          y: 10.25,
          w: 1.25,
          h: 0.2,
          props: {
            fieldKey: 'subtotal',
            fontSize: 9,
            textAlign: 'right',
            color: COLOR_TEXT,
            format: 'currency'
          }
        },
        {
          id: 'preset-tot-ship-lbl',
          type: 'text',
          x: 5.4,
          y: 10.46,
          w: 1.4,
          h: 0.2,
          props: { text: 'Shipping/Handling', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset-tot-ship-val',
          type: 'text',
          x: 6.85,
          y: 10.46,
          w: 1.25,
          h: 0.2,
          props: { text: '0.00', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset-tot-gst-lbl',
          type: 'text',
          x: 5.6,
          y: 10.66,
          w: 1.2,
          h: 0.2,
          props: { text: 'GST/HST', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset-tot-gst-val',
          type: 'field',
          x: 6.85,
          y: 10.66,
          w: 1.25,
          h: 0.2,
          props: {
            fieldKey: 'tax',
            fontSize: 9,
            textAlign: 'right',
            color: COLOR_TEXT,
            format: 'currency'
          }
        },
        {
          id: 'preset-tot-line',
          type: 'line',
          x: 5.4,
          y: 10.92,
          w: 2.7,
          h: 0,
          props: { thickness: 0.5, color: COLOR_TEXT }
        },
        {
          id: 'preset-tot-total-lbl',
          type: 'text',
          x: 5.4,
          y: 10.96,
          w: 1.4,
          h: 0.25,
          props: {
            text: 'TOTAL',
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset-tot-total-val',
          type: 'field',
          x: 6.85,
          y: 10.96,
          w: 1.25,
          h: 0.25,
          props: {
            fieldKey: 'total',
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT,
            format: 'currency'
          }
        }
      ]
    }
  ]
}

// ── Packing List ────────────────────────────────────────────

const PACKING_LIST_LAYOUT: DocumentLayout = {
  pages: [
    {
      elements: [
        {
          id: 'preset1',
          type: 'image',
          x: 0.5,
          y: 0.5,
          w: 1.8,
          h: 0.9,
          props: { src: '' }
        },
        {
          id: 'preset2',
          type: 'text',
          x: 2.5,
          y: 0.55,
          w: 3.5,
          h: 0.35,
          props: {
            text: 'Your Company Name',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset3',
          type: 'text',
          x: 6.1,
          y: 0.5,
          w: 1.9,
          h: 0.4,
          props: {
            text: 'PACKING LIST',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'right',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset4',
          type: 'text',
          x: 6.1,
          y: 1.05,
          w: 1,
          h: 0.2,
          props: { text: 'Order #', fontSize: 9, textAlign: 'left', color: COLOR_MUTED }
        },
        {
          id: 'preset5',
          type: 'field',
          x: 7.1,
          y: 1.05,
          w: 0.9,
          h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset6',
          type: 'text',
          x: 6.1,
          y: 1.27,
          w: 1,
          h: 0.2,
          props: { text: 'Ship Date', fontSize: 9, textAlign: 'left', color: COLOR_MUTED }
        },
        {
          id: 'preset7',
          type: 'field',
          x: 7.1,
          y: 1.27,
          w: 0.9,
          h: 0.2,
          props: { fieldKey: 'ship_date', fontSize: 9, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset8',
          type: 'line',
          x: 0.5,
          y: 1.75,
          w: 7.5,
          h: 0,
          props: { thickness: 1, color: COLOR_BORDER }
        },
        // Ship To block
        {
          id: 'preset9',
          type: 'text',
          x: 0.5,
          y: 1.9,
          w: 2,
          h: 0.22,
          props: { text: 'Ship To', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED }
        },
        {
          id: 'preset10',
          type: 'field',
          x: 0.5,
          y: 2.15,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_name', fontSize: 10, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset11',
          type: 'field',
          x: 0.5,
          y: 2.4,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_address1', fontSize: 9, color: COLOR_TEXT }
        },
        {
          id: 'preset12',
          type: 'field',
          x: 0.5,
          y: 2.62,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'c_city', fontSize: 9, color: COLOR_TEXT }
        },
        // Ship Via
        {
          id: 'preset13',
          type: 'text',
          x: 4.5,
          y: 1.9,
          w: 2,
          h: 0.22,
          props: { text: 'Ship Via', fontSize: 10, fontWeight: 'bold', color: COLOR_MUTED }
        },
        {
          id: 'preset14',
          type: 'field',
          x: 4.5,
          y: 2.15,
          w: 3.5,
          h: 0.25,
          props: { fieldKey: 'ship_via', fontSize: 10, color: COLOR_TEXT }
        },
        // Items table
        {
          id: 'preset15',
          type: 'table',
          x: 0.5,
          y: 3.4,
          w: 7.5,
          h: 6.5,
          props: {
            columns: PACKING_LIST_COLUMNS,
            itemsSource: 'items',
            showHeader: true,
            headerBackground: COLOR_HEADER_BG,
            fontSize: 9,
            striped: false,
            borderColor: COLOR_BORDER
          }
        },
        // Footer
        {
          id: 'preset16',
          type: 'text',
          x: 0.5,
          y: 10.4,
          w: 7.5,
          h: 0.3,
          props: {
            text: 'This is only a Packing List',
            fontSize: 9,
            fontStyle: 'italic',
            textAlign: 'center',
            color: COLOR_MUTED
          }
        }
      ]
    }
  ]
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
          x: 0.15,
          y: 0.15,
          w: 1,
          h: 0.18,
          props: { text: 'FROM', fontSize: 7, fontWeight: 'bold', color: COLOR_MUTED }
        },
        {
          id: 'preset2',
          type: 'text',
          x: 0.15,
          y: 0.32,
          w: 3.7,
          h: 0.7,
          props: {
            text: 'Your Company\n123 Street\nCity, ST 12345',
            fontSize: 9,
            color: COLOR_TEXT
          }
        },
        // Separator
        {
          id: 'preset3',
          type: 'line',
          x: 0.15,
          y: 1.1,
          w: 3.7,
          h: 0,
          props: { thickness: 1.5, color: COLOR_TEXT }
        },
        // SHIP TO
        {
          id: 'preset4',
          type: 'text',
          x: 0.15,
          y: 1.25,
          w: 1.5,
          h: 0.2,
          props: { text: 'SHIP TO', fontSize: 9, fontWeight: 'bold', color: COLOR_TEXT }
        },
        {
          id: 'preset5',
          type: 'field',
          x: 0.15,
          y: 1.5,
          w: 3.7,
          h: 0.3,
          props: {
            fieldKey: 'c_name',
            fontSize: 14,
            fontWeight: 'bold',
            color: COLOR_TEXT
          }
        },
        {
          id: 'preset6',
          type: 'field',
          x: 0.15,
          y: 1.85,
          w: 3.7,
          h: 0.28,
          props: { fieldKey: 'c_address1', fontSize: 12, color: COLOR_TEXT }
        },
        {
          id: 'preset7',
          type: 'field',
          x: 0.15,
          y: 2.18,
          w: 3.7,
          h: 0.28,
          props: { fieldKey: 'c_address2', fontSize: 12, color: COLOR_TEXT }
        },
        {
          id: 'preset8',
          type: 'field',
          x: 0.15,
          y: 2.5,
          w: 3.7,
          h: 0.28,
          props: { fieldKey: 'c_city', fontSize: 12, color: COLOR_TEXT }
        },
        // Bottom: order # + ship via
        {
          id: 'preset9',
          type: 'line',
          x: 0.15,
          y: 4.8,
          w: 3.7,
          h: 0,
          props: { thickness: 0.5, color: COLOR_BORDER }
        },
        {
          id: 'preset10',
          type: 'text',
          x: 0.15,
          y: 4.9,
          w: 1,
          h: 0.2,
          props: { text: 'Order #', fontSize: 8, color: COLOR_MUTED }
        },
        {
          id: 'preset11',
          type: 'field',
          x: 1.15,
          y: 4.9,
          w: 2.7,
          h: 0.2,
          props: { fieldKey: 'invoice', fontSize: 8, textAlign: 'right', color: COLOR_TEXT }
        },
        {
          id: 'preset12',
          type: 'text',
          x: 0.15,
          y: 5.1,
          w: 1,
          h: 0.2,
          props: { text: 'Via', fontSize: 8, color: COLOR_MUTED }
        },
        {
          id: 'preset13',
          type: 'field',
          x: 1.15,
          y: 5.1,
          w: 2.7,
          h: 0.2,
          props: { fieldKey: 'ship_via', fontSize: 8, textAlign: 'right', color: COLOR_TEXT }
        }
      ]
    }
  ]
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
    defaultAccessibleFrom: ['order_detail']
  },
  {
    key: 'invoice',
    label: 'Plain Paper Invoice',
    description: 'Letter portrait. Logo, bill-to/ship-to, line items table, totals box.',
    entity_type: 'order',
    page_size: 'letter',
    orientation: 'portrait',
    layout: INVOICE_LAYOUT,
    defaultName: 'Plain Paper Invoice',
    defaultAccessibleFrom: ['order_detail'],
    page_margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
  },
  {
    key: 'credit_invoice',
    label: 'Credit Invoice (Rodrix-style)',
    description:
      'Letter portrait. Branded layout with embedded Rodrix Fasteners logo, ' +
      'order info bar, 7-column items table, return-policy notices, totals.',
    entity_type: 'order',
    page_size: 'letter',
    orientation: 'portrait',
    layout: CREDIT_INVOICE_LAYOUT,
    defaultName: 'Credit Invoice',
    defaultAccessibleFrom: ['order_detail'],
    page_margins: { top: 0.4, right: 0.4, bottom: 0.4, left: 0.4 }
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
    page_margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
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
    page_margins: { top: 0, right: 0, bottom: 0, left: 0 }
  }
]

export function getPresetByKey(key: DocumentTemplatePresetKey): DocumentTemplatePreset | undefined {
  return DOCUMENT_TEMPLATE_PRESETS.find(p => p.key === key)
}

/**
 * Re-issue fresh UUIDs for every element when materializing a preset, so
 * multiple templates created from the same preset don't share element IDs.
 */
export function materializePresetLayout(preset: DocumentTemplatePreset): DocumentLayout {
  const pages = preset.layout.pages ?? []
  return {
    pages: pages.map(page => ({
      elements: page.elements.map(el => ({
        ...el,
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
        props: el.props ? { ...el.props } : undefined
      }))
    }))
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
    ...(overrides.layout ? { layout: overrides.layout } : {})
  }
}
