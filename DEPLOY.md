# Payload CMS on a KVM2 VPS (aaPanel + Docker)

**Setup:** Payload 3.x runs in Docker, with Postgres in a second container. aaPanel's Nginx serves it at `https://cms.yourdomain.com` with SSL. Your Next.js projects pull content from it through the REST API, and each one can run anywhere (Vercel, the same VPS, or another server).

```
Next.js site(s) ──HTTPS──> aaPanel Nginx (cms.yourdomain.com, SSL)
                                │ proxy_pass 127.0.0.1:3001
                                ▼
                     [payload-cms container] ──> [payload-postgres container]
                          /app/media volume          postgres_data volume
```

---

## 1. Create the Payload project (on your laptop)

```bash
npx create-payload-app@latest my-cms
#  Template: blank      Database: PostgreSQL
#  Connection string:  postgres://payload:payload@localhost:5432/payload
cd my-cms
```

Copy these files from this kit into the project root:

| File | Where it goes |
|---|---|
| `Dockerfile`, `.dockerignore` | project root |
| `docker-compose.yml`, `docker-compose.dev.yml` | project root |
| `.env.example` | project root |
| `next.config.mjs` | replace the generated one, or just add `output: 'standalone'` |
| `src/payload.config.ts` | merge in the lines marked `// <-- add` |
| `src/collections/Posts.ts`, `src/hooks/revalidateFrontends.ts` | optional example collection + webhook |

## 2. Develop locally

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres only
npm run dev                                      # http://localhost:3000/admin
```

In dev, Payload syncs the DB schema on its own ("push" mode). **Before every deploy**, create a migration so production gets the same schema:

```bash
npm run payload migrate:create        # writes src/migrations/...
git add . && git commit -m "schema" && git push
```

> The first time, run `migrate:create` once *before* you import `migrations` in payload.config.ts, so `src/migrations/index.ts` exists.

Production applies the migrations by itself on start (`prodMigrations` in the config).

## 3. Prepare the VPS

SSH in as root (or a sudo user):

```bash
docker --version && docker compose version     # confirm both work
mkdir -p /www/docker && cd /www/docker
git clone https://github.com/AtivaITSolutions/payload-cms.git && cd payload-cms
cp .env.example .env
openssl rand -hex 32    # paste as PAYLOAD_SECRET
openssl rand -hex 24    # paste as POSTGRES_PASSWORD
nano .env               # set domain, FRONTEND_URLS, secrets
```

**RAM note:** `next build` needs roughly 2 GB. If your KVM2 plan is tight or the build gets killed, add swap once:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 4. Start it

```bash
docker compose up -d --build
docker compose logs -f payload       # wait for "Ready" / migrations done
curl -I http://127.0.0.1:3001/admin  # should return 200 or 307
```

## 5. Point a domain at it in aaPanel

1. DNS: add an **A record** `cms` → your VPS IP.
2. aaPanel → **Website** → **Add site** → domain `cms.yourdomain.com`, PHP: **Static / Pure static**, no database.
3. Site → **SSL** → Let's Encrypt → issue, then enable **Force HTTPS**.
4. Site → **Conf** (config file): paste the blocks from `nginx/aapanel-reverse-proxy.conf` inside the `server {}` block, then save.
   *(You can use aaPanel's **Reverse proxy** tab with target `http://127.0.0.1:3001` instead, but you still need to add `client_max_body_size 50m;` in Conf for uploads.)*
5. Open `https://cms.yourdomain.com/admin` and create the first admin user.

**Firewall:** don't open 3001 or 5432 in aaPanel's Security tab. Both are bound to localhost on purpose.

## 6. Connect your Next.js projects

In each frontend:

1. Copy `frontend-example/lib/payload.ts` → `lib/payload.ts`
2. Copy `frontend-example/app/api/revalidate/route.ts` → `app/api/revalidate/route.ts`
3. Add the CMS hostname to `images.remotePatterns` (see `frontend-example/next.config.ts`)
4. `.env.local`:
   ```
   PAYLOAD_URL=https://cms.yourdomain.com
   REVALIDATE_SECRET=<same as CMS .env>
   ```
5. Use it:
   ```tsx
   // app/blog/page.tsx
   import { getPosts, mediaUrl } from '@/lib/payload'

   export default async function Blog() {
     const { docs } = await getPosts()
     return docs.map((p) => <h2 key={p.id}>{p.title}</h2>)
   }
   ```
6. Add the frontend's URL to `FRONTEND_URLS` in the CMS `.env`, then `docker compose up -d` to reload.

For typing, copy `src/payload-types.ts` from the CMS into the frontend (regenerate with `npm run generate:types`).

Other APIs are available too: GraphQL at `/api/graphql`, and `?locale=`, `?draft=true` (with auth) on REST.

## 7. Day-to-day commands

```bash
# Deploy new code / schema
git pull && docker compose up -d --build

# Logs / restart
docker compose logs -f payload
docker compose restart payload

# Database backup (run nightly via aaPanel → Cron → Shell script)
docker exec payload-postgres pg_dump -U payload payload | gzip > /www/backup/payload_$(date +%F).sql.gz

# Media backup
docker run --rm -v payload-cms_payload_media:/m -v /www/backup:/b alpine tar czf /b/media_$(date +%F).tgz -C /m .

# Restore DB
gunzip -c backup.sql.gz | docker exec -i payload-postgres psql -U payload payload
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build killed / exit 137 | Not enough RAM → add swap (step 3) |
| `next build` tries to reach the DB and fails | A page calls `getPayload` at build time. Add `export const dynamic = 'force-dynamic'` to that page, or delete the blank template's `(frontend)` demo page if you're headless |
| 502 Bad Gateway in browser | Container down or wrong port. Check `docker compose ps` and that Conf uses the same port as `PAYLOAD_PORT` |
| 413 when uploading images | `client_max_body_size` missing in Nginx Conf |
| CORS error from frontend | Frontend URL not in `FRONTEND_URLS` (exact scheme + domain, no trailing slash) |
| Uploaded images disappear after rebuild | Media must live in the `payload_media` volume (default `/app/media`). Don't change `staticDir` without updating the volume path |
| Admin login loops | `NEXT_PUBLIC_SERVER_URL` must exactly match the https domain |

**Later:** if you want media on S3, Cloudflare R2 or DigitalOcean Spaces instead of the VPS disk, add `@payloadcms/storage-s3` and the volume isn't needed.