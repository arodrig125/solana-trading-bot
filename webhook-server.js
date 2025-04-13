const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// For raw body parsing (needed for Stripe signature verification)
app.use(express.raw({ type: 'application/json' }));

// Webhook endpoint
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the event came from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  // Log the event to a file for debugging
  const logsDir = path.join(__dirname, 'data', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'stripe-webhooks.log');
  fs.appendFileSync(
    logFile,
    `${new Date().toISOString()} - Event: ${event.type}\n${JSON.stringify(event, null, 2)}\n\n`
  );

  // Handle different event types
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('New subscription created!');
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'invoice.paid':
      console.log('Payment succeeded!');
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed!');
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send('Received');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Webhook server is running');
});

// Handler functions
async function handleSubscriptionCreated(subscription) {
  try {
    const tierManager = require('./utils/tier-manager');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Get customer to find user ID
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Map price ID to tier
    const priceId = subscription.items.data[0].price.id;
    const tierMap = {
      // STARTER tier price IDs (with 7-day trial)
      'price_1RDTOdKFKKBTUMsUsuNlbaFU': 'STARTER', // monthly with 7-day trial
      'price_1RDTOdKFKKBTUMsUdfnNcm1r': 'STARTER', // yearly with 7-day trial

      // PRO tier price IDs
      'price_1RDTHxKFKKBTUMsU8caUc8cN': 'PRO', // monthly
      'price_1RDTHyKFKKBTUMsUUkUtK1om': 'PRO', // yearly

      // ELITE tier price IDs
      'price_1RDTHyKFKKBTUMsUm6h5KeOP': 'ELITE', // monthly
      'price_1RDTHyKFKKBTUMsUCN6WACnA': 'ELITE', // yearly

      // INSTITUTIONAL tier price IDs
      'price_1RDTHzKFKKBTUMsUvFuCEfFP': 'INSTITUTIONAL', // monthly
      'price_1RDTHzKFKKBTUMsUtlflsE63': 'INSTITUTIONAL' // yearly
    };

    const tier = tierMap[priceId] || 'STARTER';

    // Update user tier
    tierManager.setUserTier(userId, tier);
    console.log(`Updated user ${userId} to tier ${tier}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    // Implement payment success logic here
    console.log(`Payment succeeded for invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    // Implement payment failure logic here
    console.log(`Payment failed for invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Start the server
const PORT = process.env.WEBHOOK_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
