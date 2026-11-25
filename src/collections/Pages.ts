import type { CollectionConfig } from 'payload'
import { revalidateFrontends } from '../hooks/revalidateFrontends'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'
import { layoutBlocks } from '../blocks/layout'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
  },
  access: {
    // Public can read published pages; logged-in users also see drafts.
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
      name: 'layout',
      type: 'blocks',
      blocks: layoutBlocks,
      admin: { description: 'Stack blocks to build the page.' },
    },
    seoField,
  ],
}
