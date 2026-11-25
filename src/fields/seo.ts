import type { Field } from 'payload'

/**
 * Per-page SEO metadata. Migrating off WordPress means keeping search
 * rankings — fill these from your Yoast/RankMath titles & descriptions.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description: 'Overrides the default <title> and meta description for this page.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Meta title (~60 chars). Falls back to the page title.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Meta description (~155 chars).' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Open Graph / social share image (1200x630).' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      label: 'Hide from search engines',
      defaultValue: false,
    },
  ],
}
