// Worker entry: routes /api/* to handlers, everything else falls through to the static assets binding.

import { onRequestPost as checkoutPost } from "../functions/api/checkout.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/checkout") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return checkoutPost({ request, env, ctx });
    }

    // Anything else → static assets (index.html, /images/*, /style.css, etc.)
    return env.ASSETS.fetch(request);
  },
};
