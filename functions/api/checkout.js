// Cloudflare Pages Function — creates a Stripe Checkout Session for the preorder.
// Required env vars (set in CF Pages → Settings → Environment variables):
//   STRIPE_SECRET_KEY  — sk_test_... in preview, sk_live_... in production
//   SITE_URL           — e.g. https://theskeletonbook.com  (used for success/cancel URLs)

const PRICE_CENTS = 2999; // $29.99
const PRODUCT_NAME = "The Skeleton and the Chocolate Chip Cookie — Signed Hardcover";
const PRODUCT_DESC = "Signed first-printing hardcover. Free US shipping. Ships when the first print run arrives.";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Checkout not configured yet. Please email sales@theskeletonbook.com to reserve a copy." }, 503);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const qty = clampInt(body.quantity, 1, 10, 1);

  const origin = env.SITE_URL || new URL(request.url).origin;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/#preorder`);
  params.append("submit_type", "book");
  params.append("billing_address_collection", "auto");
  params.append("phone_number_collection[enabled]", "true");

  // Free US shipping — collect address only inside the US
  params.append("shipping_address_collection[allowed_countries][]", "US");

  // Line item — $29.99 signed hardcover
  params.append("line_items[0][quantity]", String(qty));
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(PRICE_CENTS));
  params.append("line_items[0][price_data][product_data][name]", PRODUCT_NAME);
  params.append("line_items[0][price_data][product_data][description]", PRODUCT_DESC);
  params.append("line_items[0][price_data][product_data][images][]", `${origin}/images/page-01.jpg`);

  // Free shipping rate — explicit so Stripe shows "Free" line item
  params.append("shipping_options[0][shipping_rate_data][display_name]", "Free US shipping");
  params.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
  params.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  params.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "3");
  params.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  params.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "8");

  // Metadata so Scott can spot preorders in his Stripe dashboard
  params.append("metadata[product]", "skeleton-cookie-book");
  params.append("metadata[printing]", "first");
  params.append("metadata[signed]", "true");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return json({ error: data.error?.message || "Stripe error" }, 502);
  }
  return json({ url: data.url, id: data.id });
}

function clampInt(v, lo, hi, dflt) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
