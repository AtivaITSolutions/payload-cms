import type { CollectionConfig } from 'payload'
import { revalidateFrontends } from '../hooks/revalidateFrontends'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order', '_status'],
    defaultSort: 'order',
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateFrontends],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Icon name (e.g. a Lucide icon) the frontend renders.' },
    },
    { name: 'summary', type: 'textarea', admin: { description: 'Short line for cards/grids.' } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', admin: { description: 'Full service detail page body.' } },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
    seoField,
  ],
}
