/**
 * Script to set up Stripe products and prices for SolarBot
 * 
 * This script creates the following:
 * 1. STARTER product with monthly and yearly prices (7-day trial)
 * 2. PRO product with monthly and yearly prices (no trial)
 * 3. ELITE product with monthly and yearly prices (no trial)
 * 4. INSTITUTIONAL product with monthly and yearly prices (no trial)
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProduct(name, description) {
  try {
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        tier: name
      }
    });
    console.log(`Created product: ${name} (${product.id})`);
    return product;
  } catch (error) {
    console.error(`Error creating product ${name}:`, error);
    throw error;
  }
}

async function createPrice(productId, unitAmount, interval, trialDays = null, nickname) {
  const priceData = {
    product: productId,
    unit_amount: unitAmount * 100, // Convert to cents
    currency: 'usd',
    recurring: {
      interval
    },
    nickname
  };

  // Add trial period if specified
  if (trialDays) {
    priceData.recurring.trial_period_days = trialDays;
  }

  try {
    const price = await stripe.prices.create(priceData);
    console.log(`Created ${interval}ly price for ${nickname}: $${unitAmount} (${price.id})`);
    return price;
  } catch (error) {
    console.error(`Error creating price for ${nickname}:`, error);
    throw error;
  }
}

async function setupProducts() {
  try {
    // 1. STARTER Product
    const starterProduct = await createProduct(
      'STARTER',
      'Entry-level arbitrage bot with simulation mode'
    );
    
    // STARTER Prices (with 7-day trial)
    await createPrice(starterProduct.id, 29, 'month', 7, 'starter_monthly');
    await createPrice(starterProduct.id, 279, 'year', 7, 'starter_yearly');

    // 2. PRO Product
    const proProduct = await createProduct(
      'PRO',
      'Professional arbitrage bot with live trading'
    );
    
    // PRO Prices (no trial)
    await createPrice(proProduct.id, 79, 'month', null, 'pro_monthly');
    await createPrice(proProduct.id, 759, 'year', null, 'pro_yearly');

    // 3. ELITE Product
    const eliteProduct = await createProduct(
      'ELITE',
      'Advanced arbitrage bot with multi-wallet support'
    );
    
    // ELITE Prices (no trial)
    await createPrice(eliteProduct.id, 199, 'month', null, 'elite_monthly');
    await createPrice(eliteProduct.id, 1899, 'year', null, 'elite_yearly');

    // 4. INSTITUTIONAL Product
    const institutionalProduct = await createProduct(
      'INSTITUTIONAL',
      'Enterprise-grade arbitrage solution for trading firms'
    );
    
    // INSTITUTIONAL Prices (no trial)
    await createPrice(institutionalProduct.id, 999, 'month', null, 'institutional_monthly');
    await createPrice(institutionalProduct.id, 9590, 'year', null, 'institutional_yearly');

    console.log('All products and prices created successfully!');
  } catch (error) {
    console.error('Error setting up products:', error);
  }
}

// Run the setup
setupProducts();
