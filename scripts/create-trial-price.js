/**
 * Script to create a price with a trial period
 */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createTrialPrice() {
  try {
    // First, check if the STARTER product exists
    let starterProduct;
    const products = await stripe.products.list({
      limit: 10,
    });
    
    const existingProduct = products.data.find(p => p.name === 'STARTER');
    
    if (existingProduct) {
      console.log(`Found existing STARTER product: ${existingProduct.id}`);
      starterProduct = existingProduct;
    } else {
      // Create the STARTER product if it doesn't exist
      starterProduct = await stripe.products.create({
        name: 'STARTER',
        description: 'Entry-level arbitrage bot with simulation mode'
      });
      console.log(`Created new STARTER product: ${starterProduct.id}`);
    }
    
    // Create monthly price with 7-day trial
    const monthlyPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7
      },
      nickname: 'STARTER Monthly with 7-day trial'
    });
    
    console.log(`Created monthly price with 7-day trial: ${monthlyPrice.id}`);
    
    // Create yearly price with 7-day trial
    const yearlyPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 27900, // $279.00
      currency: 'usd',
      recurring: {
        interval: 'year',
        trial_period_days: 7
      },
      nickname: 'STARTER Yearly with 7-day trial'
    });
    
    console.log(`Created yearly price with 7-day trial: ${yearlyPrice.id}`);
    
    console.log('\nSummary:');
    console.log(`STARTER Product ID: ${starterProduct.id}`);
    console.log(`Monthly Price ID (with 7-day trial): ${monthlyPrice.id}`);
    console.log(`Yearly Price ID (with 7-day trial): ${yearlyPrice.id}`);
    
  } catch (error) {
    console.error('Error creating trial price:', error);
  }
}

// Run the function
createTrialPrice();
