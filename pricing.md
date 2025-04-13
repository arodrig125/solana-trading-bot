# SolarBot Subscription Tiers

## FREE
- 3 token pairs
- Simulation mode only
- 2-minute scan interval
- Basic exchange arbitrage
- 1 wallet

## PRO - $29.99/month
- 10 token pairs
- Live trading enabled
- 1-minute scan interval
- Exchange and triangular arbitrage
- 1 wallet

## ELITE - $99.99/month
- Unlimited token pairs
- Live trading enabled
- 30-second scan interval
- Advanced strategies
- Up to 3 wallets

## INSTITUTIONAL - $499.99/month
- Unlimited token pairs
- Live trading enabled
- 10-second scan interval
- All strategies including custom
- Unlimited wallets
- Priority support

To upgrade, use the /upgrade command followed by the tier name:
/upgrade PRO
/upgrade ELITE
/upgrade INSTITUTIONAL
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const tierManager = require('./tier-manager');

// Create a checkout session for subscription
async function createCheckoutSession(userId, tier) {
  // Map tiers to price IDs
  const priceIds = {
    PRO: 'price_pro_monthly',
    ELITE: 'price_elite_monthly',
    INSTITUTIONAL: 'price_institutional_monthly'
  };
  
  const priceId = priceIds[tier];
  if (!priceId) {
    throw new Error(`Invalid tier: ${tier}`);
  }
  
  // Get or create customer
  let customerId;
  const customers = await stripe.customers.list({ email: `${userId}@solarbot.io` });
  
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: `${userId}@solarbot.io`,
      metadata: { userId }
    });
    customerId = customer.id;
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `https://t.me/your_bot_username?start=success`,
    cancel_url: `https://t.me/your_bot_username?start=cancel`
  });
  
  return session;
}

// Generate payment link
async function getPaymentLink(userId, tier) {
  const session = await createCheckoutSession(userId, tier);
  return session.url;
}

module.exports = {
  getPaymentLink
};
