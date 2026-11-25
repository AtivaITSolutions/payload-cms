import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../hooks/revalidateGlobal'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'tagline', type: 'textarea' },
    {
      name: 'columns',
      type: 'array',
      label: 'Link columns',
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
    {
      name: 'social',
      type: 'array',
      label: 'Social links',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github'],
          required: true,
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'copyright', type: 'text', admin: { description: 'e.g. © 2026 Ativa IT Solutions' } },
  ],
}
