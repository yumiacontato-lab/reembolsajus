import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    // Warn but don't fail, as users might be setting this up
    console.warn("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key", {
    apiVersion: "2025-12-15.clover",
    typescript: true,
});
