/**
 * One-time WordPress -> Payload content import.
 *
 * Imports TEXT/HTML content only — NO media/images (those come later via R2,
 * uploaded selectively). WP <img> tags are kept as-is in the body and will
 * still point at the WordPress domain until you replace them.
 *
 * Run from the my-cms folder:
 *   pnpm payload run src/scripts/import-wordpress.ts
 *
 * Options (space-separated after the script path):
 *   --fresh            delete all existing posts/pages first, then import
 *   --only=posts       import only posts  (or --only=pages)
 *   WP_URL=...         override source site (defaults to the live site)
 *
 * Re-runnable: matches by slug, so it updates existing docs instead of
 * duplicating. To start clean later, re-run with --fresh.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { JSDOM } from 'jsdom'

const WP_URL = (process.env.WP_URL || 'https://ativaitsolutions.com').replace(/\/$/, '')
const args = process.argv.slice(2)
const FRESH = args.includes('--fresh')
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1] // 'posts' | 'pages' | undefined

// Single JSDOM instance reused for HTML-entity decoding (titles/excerpts).
const decoderDoc = new JSDOM('').window.document
const decode = (s = ''): string => {
  const el = decoderDoc.createElement('textarea')
  el.innerHTML = s
  return el.value
}
const stripTags = (s = ''): string => decode(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()

type WPItem = {
  id: number
  slug: string
  date: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt?: { rendered: string }
}

/** Fetch every page of a WP REST collection, following X-WP-TotalPages. */
async function fetchAll(type: 'posts' | 'pages'): Promise<WPItem[]> {
  const out: WPItem[] = []
  let page = 1
  let totalPages = 1
  do {
    const url = `${WP_URL}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_fields=id,slug,title,content,excerpt,date`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`WP ${type} page ${page} -> HTTP ${res.status} (${res.statusText}). Is the REST API open?`)
    }
    totalPages = Number(res.headers.get('x-wp-totalpages') || '1')
    const batch = (await res.json()) as WPItem[]
    out.push(...batch)
    console.log(`  fetched ${type} page ${page}/${totalPages} (${batch.length} items)`)
    page += 1
  } while (page <= totalPages)
  return out
}

// NOTE: run with `pnpm payload run` — it uses top-level await to stay alive,
// so this file deliberately awaits at module scope rather than in a floating main().
const payload = await getPayload({ config })

const run = async (type: 'posts' | 'pages') => {
    console.log(`\n=== ${type.toUpperCase()} ===`)

    if (FRESH) {
      const del = await payload.delete({ collection: type, where: { id: { exists: true } } })
      console.log(`  --fresh: deleted ${del.docs?.length ?? 0} existing ${type}`)
    }

    const items = await fetchAll(type)
    console.log(`  importing ${items.length} ${type}...`)

    let created = 0
    let updated = 0
    for (const it of items) {
      try {
        const base =
          type === 'posts'
            ? {
                title: decode(it.title.rendered),
                slug: it.slug,
                excerpt: stripTags(it.excerpt?.rendered || ''),
                // Raw WordPress HTML, rendered as-is on the frontend (lossless).
                bodyHtml: it.content.rendered || '',
                publishedAt: it.date,
                _status: 'published' as const,
              }
            : {
                title: decode(it.title.rendered),
                slug: it.slug,
                // Page HTML goes into one Raw HTML block; redesign with real blocks later.
                // Builder-made pages can return empty REST content — import them as an
                // empty shell (title/slug/SEO) so the URL is preserved for the redesign.
                layout: (it.content.rendered || '').trim()
                  ? [{ blockType: 'html' as const, html: it.content.rendered }]
                  : [],
                _status: 'published' as const,
              }

        const existing = await payload.find({
          collection: type,
          where: { slug: { equals: it.slug } },
          limit: 1,
          depth: 0,
        })

        if (existing.docs[0]) {
          await payload.update({ collection: type, id: existing.docs[0].id, data: base })
          updated += 1
        } else {
          await payload.create({ collection: type, data: base })
          created += 1
        }
      } catch (err) {
        console.error(`  ! failed "${it.slug}": ${(err as Error).message}`)
      }
    }
    console.log(`  done ${type}: ${created} created, ${updated} updated`)
  }

console.log(`Source: ${WP_URL}`)
if (!ONLY || ONLY === 'posts') await run('posts')
if (!ONLY || ONLY === 'pages') await run('pages')

console.log('\nImport finished.')
