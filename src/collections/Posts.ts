// Example collection your Next.js sites can read.
import type { CollectionConfig } from 'payload'
import { revalidateFrontends } from '../hooks/revalidateFrontends'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  access: {
    // Public can read published posts; only logged-in users can see drafts
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateFrontends],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', admin: { description: 'Rich text body for posts written here.' } },
    {
      name: 'bodyHtml',
      type: 'textarea',
      maxLength: 2_000_000, // large posts exceed Payload's 40k default
      admin: {
        description:
          'Raw HTML imported from WordPress, rendered as-is. Leave empty for new posts and use Content above.',
      },
    },
    { name: 'publishedAt', type: 'date' },
  ],
}
