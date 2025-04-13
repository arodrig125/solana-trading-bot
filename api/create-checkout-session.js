/**
 * API endpoint to create a Stripe checkout session
 */
require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;
    
    if (!priceId || !userId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create a new customer or use existing one
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: req.user?.email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: req.user?.email || 'guest@example.com',
        metadata: {
          userId: userId
        }
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer.id,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    });
    
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
