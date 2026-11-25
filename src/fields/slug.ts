import type { Field } from 'payload'

/** Lowercase, hyphenated, URL-safe slug from any string. */
export const slugify = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // drop punctuation
    .replace(/[\s_]+/g, '-') // spaces/underscores -> hyphen
    .replace(/-+/g, '-') // collapse repeats
    .replace(/^-+|-+$/g, '') // trim hyphens

/**
 * A `slug` text field that auto-fills from `sourceField` (default: "title")
 * when left empty. Editable, unique, indexed — safe for public URLs.
 */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL path. Leave blank to auto-generate from the title.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        const source = data?.[sourceField]
        if (typeof source === 'string' && source.length > 0) return slugify(source)
        return value
      },
    ],
  },
})
