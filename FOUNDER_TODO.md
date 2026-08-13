# What only you can do

The code is already renamed and waiting in **reisierx/open-matter**.
You do the accounts, DNS, and Vercel. In this order.

## 1. Repo — you did this

https://github.com/reisierx/open-matter

## 2. Put the new site on Vercel

Easiest: a **new** Vercel project, so the old one keeps pdf-frontmatter.org up until the new domain works.

1. Open [vercel.com](https://vercel.com) → Add New → Project
2. Import **reisierx/open-matter**
3. Framework: leave whatever it detects. Root directory: `.`
4. Environment variables — copy from the old project:
   - `XAI_API_KEY` = the same key
5. Deploy

You should get a `*.vercel.app` URL. Open it. You should see **open-matter**, not pdf-frontmatter.

## 3. Point open-matter.org at Vercel

Wait until the registrar shows the domain as active (same wait as last time).

1. In the new Vercel project → Settings → Domains → add `open-matter.org` and `www.open-matter.org`
2. Vercel will show the DNS it wants. For an apex on GoDaddy it is usually:
   - Type **A**, Name **@**, Value **76.76.21.21**
   - Type **CNAME**, Name **www**, Value **cname.vercel-dns.com**
3. Save at GoDaddy. Wait 10–60 minutes. Vercel will show the domain as valid.

## 4. Redirect the old name

When open-matter.org is green in Vercel:

1. Old Vercel project (pdf-frontmatter) → Settings → Domains
2. For `pdf-frontmatter.org`, set a **redirect** to `https://open-matter.org`
3. Or, in the new project, add `pdf-frontmatter.org` as a domain and redirect it there — one project, two names, one site.

Leave the old GitHub repo public. Its README now points here. You can archive it later (Settings → Archive). Do not delete it; links exist.

## 5. Still later (not tonight)

- npm / PyPI accounts, then tell the person helping you to publish `open-matter`
- Record the race on `/app` for launch
- Show HN drafts are in `launch/` — titles now say open-matter

## Money

Same rules. Domain you just bought. Do not turn on a paid Vercel plan. If anything asks for more than €20, stop.
