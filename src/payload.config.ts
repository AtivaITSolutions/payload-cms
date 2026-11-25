import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { Services } from './collections/Services'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
// Production applies these migrations automatically on container start.
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Next.js frontends allowed to call this CMS (comma-separated in FRONTEND_URLS)
const frontendURLs = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL, // <-- public CMS URL
  cors: frontendURLs, // <-- allow those frontends
  csrf: frontendURLs, // <-- and protect against CSRF
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts, Pages, Services],
  globals: [Header, Footer],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    // Store Media uploads in Cloudflare R2 (S3-compatible) when S3_BUCKET is set.
    // With no R2 env vars (e.g. local dev), uploads fall back to the local disk.
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT, // https://<account_id>.r2.cloudflarestorage.com
              region: 'auto', // R2 always uses 'auto'
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              forcePathStyle: true, // required for R2
            },
          }),
        ]
      : []),
  ],
})
