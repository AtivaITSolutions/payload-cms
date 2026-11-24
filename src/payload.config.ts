import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
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
  collections: [Users, Media, Posts],
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
  plugins: [],
})
