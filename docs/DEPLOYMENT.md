# Deployment (Netlify)

The app deploys to Netlify with the managed Next.js adapter (OpenNext). `netlify.toml` sets `npm run build`; the
adapter is applied automatically. SSR, API/route handlers, middleware and Server Actions run on Netlify Functions.

## One-time setup

1. Push the repo to GitHub (confirm `.env.local` is not tracked).
2. Netlify → **Add new site → Import from Git** → select the repo and the production branch (`main`).
3. Build command `npm run build`; leave publish directory to the adapter default.
4. **Environment variables** (Site configuration → Environment variables), scoped per context:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` – production domain for Production; the branch/preview URL for other contexts
   - Server-only secrets (if ever added) must be marked **secret**; never use `NEXT_PUBLIC_` for them.
   Use a separate Supabase project for staging if possible.
5. **Domain & HTTPS:** Domain management → add the custom domain, set DNS as instructed, then enable the managed
   Let's Encrypt certificate and "Force HTTPS". HSTS is sent by the app in production.
6. **Contexts:** Production = `main`; Staging = branch deploy of a `staging` branch; Previews = deploy previews on pull requests.
7. **Supabase Auth:** set Site URL to the production domain and add redirect URLs
   `https://<domain>/auth/callback` (plus staging and `https://*--<site>.netlify.app/auth/callback` for previews).
8. **Notifications:** Project configuration → Build & deploy → Deploy notifications → add email/Slack for
   "Deploy failed" and "Deploy succeeded". Monitor with Netlify Logs → Functions and Supabase Logs.

## Security headers

Defined in `next.config.mjs` (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
If you add third-party scripts, images or APIs called from the browser, extend the CSP there.

## Rollback

Netlify → Deploys → select a previous good deploy → **Publish deploy**. This is instant and also stops auto-publishing;
click **Start auto publishing** after the fix. Database changes are not rolled back by this: write a corrective
migration (migrations are forward-only).

## Maintenance

- Dependencies: monthly `npm audit` and `npm outdated`; test in a preview deploy before merging.
- Apply migrations to staging first, then production, before deploying code that depends on them.
- Rotate keys and the admin password after any exposure; review the admin Activity log regularly.
- Review Supabase advisors (Security) after schema changes.

## Verify after deploy

Run the checklist in [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md) on the Netlify URL.
