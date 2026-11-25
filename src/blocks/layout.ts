import type { Block } from 'payload'

/**
 * Reusable page-builder blocks. Editors stack these in the Pages `layout`
 * field to compose any page without a developer.
 */

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'buttons',
      type: 'array',
      maxRows: 2,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
      ],
    },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [{ name: 'content', type: 'richText', required: true }],
}

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to Action', plural: 'Calls to Action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonUrl', type: 'text', required: true },
  ],
}

export const HtmlBlock: Block = {
  slug: 'html',
  labels: { singular: 'Raw HTML', plural: 'Raw HTML' },
  fields: [
    {
      name: 'html',
      type: 'textarea',
      required: true,
      maxLength: 2_000_000, // large pages exceed Payload's 40k default
      admin: { description: 'Raw HTML (e.g. imported from WordPress), rendered as-is.' },
    },
  ],
}

export const ServicesGridBlock: Block = {
  slug: 'servicesGrid',
  labels: { singular: 'Services Grid', plural: 'Services Grids' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea' },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Leave empty to show all services automatically on the frontend.' },
    },
  ],
}

export const layoutBlocks = [HeroBlock, RichTextBlock, HtmlBlock, ServicesGridBlock, CTABlock]
