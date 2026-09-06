// Vercel Serverless Function
// URL once deployed: https://<your-site>/api/create-checkout-session
//
// Creates a Stripe Checkout session and returns its URL so the browser
// can redirect the customer to Stripe's hosted payment page.
//
// Requires this environment variable to be set in Vercel:
//   STRIPE_SECRET_KEY   (starts with sk_test_... for now)

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // The front end sends the total price (in cents) and a short description
    // of what's being rented, e.g. { amount: 2000, description: "Oversized Tee — 4 days" }
    const { amount, description } = req.body || {};

    if (!amount || typeof amount !== 'number' || amount < 50) {
      res.status(400).json({ error: 'Invalid amount (must be at least 50 cents).' });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Kloudy rental',
            },
            unit_amount: Math.round(amount), // amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
};
