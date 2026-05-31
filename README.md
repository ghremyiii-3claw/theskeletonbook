# The Skeleton and the Chocolate Chip Cookie — Preorder Site

Static preorder site for *The Skeleton and the Chocolate Chip Cookie* by Andrew Scott, illustrated by V. Khromatidi. Deploys to Cloudflare Pages; payments handled by Stripe Checkout.

## Layout

```
public/
  index.html          landing page
  thank-you.html      post-checkout confirmation
  style.css           watercolor + rope aesthetic
  script.js           lightbox + checkout button
  _headers            cache + security headers
  robots.txt, sitemap.xml
  images/             27 page exports from the PDF
functions/api/
  checkout.js         POST /api/checkout → creates Stripe Checkout Session
```

## One-time setup

### 1. Domain
Buy **theskeletonbook.com** at Cloudflare Registrar (~$10/yr) or Namecheap. If outside Cloudflare, add a CNAME pointing to the Pages project after step 3.

### 2. Stripe account
1. Sign up at https://stripe.com — needs EIN or SSN + a bank account (~10 min).
2. **Stay in test mode** for the first deploy. Grab the **test secret key** (`sk_test_…`) from Developers → API keys.
3. In Settings → Branding, upload a small icon (cover image works) and set the brand color to `#C8531A`.
4. In Settings → Customer emails, **turn on "Email customers about successful payments"** — Stripe will auto-send a receipt with shipping address to every buyer.
5. In Settings → Team → Notifications, **add `sales@theskeletonbook.com`** to the notification list so Andrew/Scott gets a Stripe email on every order.

### 3. Cloudflare Pages
1. Push this repo to GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: **public**
4. Settings → Environment variables → add:
   - `STRIPE_SECRET_KEY` = your `sk_test_…` (for both Production and Preview environments)
   - `SITE_URL` = `https://theskeletonbook.com` (Production) and your `*.pages.dev` URL (Preview)
5. Custom domain → add `theskeletonbook.com` and `www.theskeletonbook.com`.

### 4. Email (sales@theskeletonbook.com)
**Cheapest path** — Cloudflare Email Routing (free):
1. Email → Email Routing → Get started.
2. Create a custom address `sales@theskeletonbook.com` → forward to a real Gmail.
3. Verify the destination, then publish the suggested MX + TXT records (Cloudflare adds them automatically if the zone is on Cloudflare).

**Better path** — Google Workspace ($6/mo):
- Lets you actually send *from* `sales@theskeletonbook.com` and run an inbox-agent loop on it.

### 5. Go live
1. Place a test order with Stripe test card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any ZIP.
2. Confirm: redirect to thank-you page, Stripe sends receipt to buyer, Stripe sends notification to `sales@`.
3. In Stripe Dashboard, flip from test to **Live mode**. Grab `sk_live_…`.
4. In CF Pages env vars, replace `STRIPE_SECRET_KEY` (Production) with the live key. Trigger a redeploy.

## Local preview (no Stripe)

```sh
cd public
python3 -m http.server 8080
```

Visit http://localhost:8080. The preorder button will show a "Checkout not configured yet" message — that's expected without the CF Pages Function running.

## Editing copy / price

- **Price** — change `PRICE_CENTS = 2999` in `functions/api/checkout.js` *and* the `$29.99` strings in `public/index.html` + `public/thank-you.html`.
- **Cover/preview images** — overwrite files in `public/images/`. Source PDF is at `/home/atlas/scott-files/childrens-book/Final Kids Book 5.7.26.pdf`. Re-render with `pdftoppm -jpeg -r 80 …`.

## Future

- **Stripe webhook → custom email** to `sales@` with the buyer's full order including a Print Run column (use `metadata[printing]`). Currently we rely on Stripe's built-in notification.
- **Inbox agent** on `sales@theskeletonbook.com` to auto-answer questions about the book (age range, ship date, shipping policy) — same pattern as the AIS Ellie and Remy Law Clara agents.
- **International shipping** — add countries to `shipping_address_collection` and a paid international shipping rate.
- **Audiobook / ebook tier** — add a second `line_items` entry.
