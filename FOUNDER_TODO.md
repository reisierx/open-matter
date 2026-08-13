# What only you can do

Numbered. One action each. Nothing here needs a terminal.

## 1. Make the code public — done

Public repository: [https://github.com/reisierx/pdf-frontmatter](https://github.com/reisierx/pdf-frontmatter)

On the **reisierx** organisation (the connection can write there). The empty personal repo at `goncalo-reisierx/pdf-frontmatter` can be deleted. In the repository settings, tick **Issues** if it is not already on, and leave the repo public.

## 2. Buy the names — done

Bought **`pdf-frontmatter.org`** on 13 August 2026. One name. Prefácio lives at `https://pdf-frontmatter.org/app`. Do not buy `prefacio.app` unless the app later needs its own door.

Registration was still “in progress” at purchase. Wait until the registrar shows the domain as active before changing DNS.

## 3. Put the site on the internet

This project is already set up to publish on Vercel, which has a free tier.

1. Create a Vercel account with the same GitHub account: [https://vercel.com/signup](https://vercel.com/signup)
2. Click **Add new project**, pick the `reisierx/pdf-frontmatter` repository, deploy.
3. In Vercel → Project → Settings → Domains, add `pdf-frontmatter.org` and `www.pdf-frontmatter.org`.
4. At the registrar, paste the records Vercel shows (usually two: one for the apex, one for `www`). Do not invent records. Do not point the domain at anything else.
5. Leave the old GoDaddy/registrar parking page alone until those records are in.

Spending: Vercel’s free tier is enough. Do not turn on a paid plan until the site is slow.


## 4. Give the writing desk a key

Prefácio asks a language model to draft the card.

1. Open [https://console.x.ai](https://console.x.ai)
2. Create an API key.
3. In Vercel → Project → Settings → Environment Variables, add:
   - Name: `XAI_API_KEY`
   - Value: the key
   - Environment: Production (and Preview if you want drafts to work)
4. Redeploy once.

Keep the key off screenshots and off email. If it leaks, delete it in the xAI console and make a new one.

Optional later, only if you change provider:

- `LLM_PROVIDER` (`xai` or `openai`)
- `LLM_MODEL` (default `grok-4.5`)
- `LLM_BASE_URL`

## 5. Approve money above €20

You should not need to. The only likely bill is:

- Domain names (about €10–15 each per year)
- xAI usage, which stays small if the rate limit stays at 6 cards per 10 minutes

If a host or a registrar asks for more than €20, stop and decide.

## 6. Publish the packages (optional)

The libraries are ready. Publishing them is a one-time account step.

**npm**

1. Create an account at [https://www.npmjs.com/signup](https://www.npmjs.com/signup)
2. Tell the person helping you. They will run `npm publish` from `packages/pdf-frontmatter` after building.
3. The name `pdf-frontmatter` was free on 13 August 2026.

**PyPI**

1. Create an account at [https://pypi.org/account/register](https://pypi.org/account/register)
2. Same: tell the person helping you. They will publish `packages/pdf-frontmatter-py`.

If you would rather not, leave them as folders in the GitHub repo. People can still copy them.

## 7. Send the three letters

Drafts are in the `launch` folder:

1. `launch/show-hn.md` — post on Hacker News when the site is live. Paste, do not decorate.
2. `launch/pdf-association.md` — email to the PDF Association. Find a contact on [pdfa.org](https://pdfa.org).
3. `launch/paper-json.md` — email to the paper.json author, listed on [the arXiv page](https://arxiv.org/abs/2605.16194).

Change nothing that makes them louder.

## 8. After launch, once

Reply to the first ten people who write. If someone asks for a batch desk, you already have the waitlist.
