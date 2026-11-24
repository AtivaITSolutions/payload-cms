// Pings every frontend's /api/revalidate route when content changes,
// so Next.js pages update instantly instead of waiting for the cache to expire.
import type { CollectionAfterChangeHook } from 'payload'

export const revalidateFrontends: CollectionAfterChangeHook = async ({ doc, collection, req }) => {
  const urls = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u && !u.includes('localhost'))

  await Promise.allSettled(
    urls.map((base) =>
      fetch(`${base}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
        },
        body: JSON.stringify({ collection: collection.slug, slug: doc?.slug }),
      }),
    ),
  ).then((results) =>
    results.forEach((r, i) => {
      if (r.status === 'rejected') req.payload.logger.warn(`Revalidate failed for ${urls[i]}`)
    }),
  )

  return doc
}
