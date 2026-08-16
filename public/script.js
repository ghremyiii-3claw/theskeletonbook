// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Lightbox for preview spreads
const dialog = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
document.querySelectorAll(".preview-card").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const img = a.querySelector("img");
    lbImg.src = a.getAttribute("href");
    lbImg.alt = img ? img.alt : "";
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
});
dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

// Stripe Checkout — calls our /api/checkout, then redirects to Stripe-hosted page
const btn = document.getElementById("checkout-button");
const errEl = document.getElementById("checkout-error");

btn.addEventListener("click", async () => {
  errEl.hidden = true;
  btn.classList.add("loading");
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 1 }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Checkout unavailable. Please try again in a moment.");
    }
    if (window.fbq) fbq('track', 'InitiateCheckout');
    window.location.href = data.url;
  } catch (e) {
    errEl.textContent = e.message;
    errEl.hidden = false;
    btn.classList.remove("loading");
  }
});
