# The Daily List

A personal, text-only NPR news reader with a clear stopping point.

## Behavior

- Fetches NPR's public general-news RSS feed, with at most 20 stories.
- Saves a fixed edition on the first visit after 6 a.m. America/Chicago each day (including daylight saving time).
- Uses headlines and feed summaries; full stories open on https://text.npr.org/.
- Shows an explicit end of edition. No images, infinite scroll, analytics, or AI summaries.
- Remembers opened links on each device using localStorage.
- Stores editions in Cloudflare R2, so the list stays consistent across visits and devices.
- If NPR cannot be reached, shows a clearly dated saved edition with a notice.

The list is generated on demand, not by a background scheduler. Stories can have publication dates earlier than the edition date, depending on NPR's feed.

## Development

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

The project uses React, Vinext, Vite, and Cloudflare Workers. Local development uses the R2 binding `BUCKET` configured in `vite.config.ts`. Hosted R2 storage is separate from local preview storage.

```sh
npx tsc --noEmit
npm run build
```

## Hosting

This is a server-backed app, so GitHub Pages alone cannot run it. It needs a Cloudflare Worker and an R2 bucket bound as `BUCKET` (or compatible hosting adapted to another persistent store).

The ChatGPT Sites deployment uses `.openai/hosting.json` and the included Sites build integration. For an independent Cloudflare deployment, configure the output Worker and static assets from the generated `dist/server/wrangler.json` and provision the R2 binding in your Cloudflare account. Do not reuse someone else's Sites project ID.

## Key files

- `app/page.tsx`: reader, opened-link tracking, end of edition.
- `app/globals.css`: responsive text-only layout.
- `app/api/edition/route.ts`: feed parsing, daily cutoff, R2 persistence, fallback.
- `lib/initial-edition.json`: dated initial fallback snapshot.

## Attribution

Independent personal reader; not affiliated with NPR. Headlines, summaries, and reporting belong to NPR. The feed identifies its content as for personal use. No full articles are copied into the reader. No license is granted here over NPR content.
