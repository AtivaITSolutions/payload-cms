// Pings every frontend's /api/revalidate route when a global (Header/Footer)
// changes. Globals have no slug, so we ask the frontend to revalidate sitewide.
import type { GlobalAfterChangeHook } from 'payload'

export const revalidateGlobal: GlobalAfterChangeHook = async ({ global, req }) => {
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
        body: JSON.stringify({ global: global.slug }),
      }),
    ),
  ).then((results) =>
    results.forEach((r, i) => {
      if (r.status === 'rejected') req.payload.logger.warn(`Revalidate failed for ${urls[i]}`)
    }),
  )
}
