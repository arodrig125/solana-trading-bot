/**
 * SolarBot Checkout Integration with Stripe
 */

// Initialize Stripe with your publishable key
const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY || 'pk_live_51RDOtSKFKKBTUMsUq79ndPaY7yQGPR272Sy6P9IndnOKTYOi1g5FMnSSfSGoKWUq98VDpLJns1SYfK0GuqaBG9bd00Zq3VvFG8');

// Price IDs for each tier and billing interval
const PRICE_IDS = {
  starter: {
    monthly: 'price_1RDTOdKFKKBTUMsUsuNlbaFU', // with 7-day trial
    yearly: 'price_1RDTOdKFKKBTUMsUdfnNcm1r' // with 7-day trial
  },
  pro: {
    monthly: 'price_1RDTHxKFKKBTUMsU8caUc8cN',
    yearly: 'price_1RDTHyKFKKBTUMsUUkUtK1om'
  },
  elite: {
    monthly: 'price_1RDTHyKFKKBTUMsUm6h5KeOP',
    yearly: 'price_1RDTHyKFKKBTUMsUCN6WACnA'
  },
  institutional: {
    monthly: 'price_1RDTHzKFKKBTUMsUvFuCEfFP',
    yearly: 'price_1RDTHzKFKKBTUMsUtlflsE63'
  }
};

// Function to create a checkout session
async function createCheckoutSession(tier, interval, userId) {
  try {
    const priceId = PRICE_IDS[tier][interval];

    if (!priceId) {
      throw new Error(`Invalid tier (${tier}) or interval (${interval})`);
    }

    // Create checkout session on the server
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        successUrl: window.location.origin + '/success.html',
        cancelUrl: window.location.origin + '/pricing.html',
      }),
    });

    const session = await response.json();

    // Redirect to Stripe Checkout
    return stripe.redirectToCheckout({
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    alert('There was an error processing your payment. Please try again.');
  }
}

// Function to handle subscription button clicks
function handleSubscriptionClick(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const tier = button.getAttribute('data-tier');
  const interval = document.querySelector('input[name="billing-cycle"]:checked').value;

  // Get user ID from local storage or generate a temporary one
  const currentUser = JSON.parse(localStorage.getItem('solarbot_current_user')) || {};
  const userId = currentUser.id || 'guest_' + Math.random().toString(36).substr(2, 9);

  // Create checkout session and redirect to Stripe
  createCheckoutSession(tier, interval, userId);
}

// Initialize checkout buttons
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners to subscription buttons
  const subscriptionButtons = document.querySelectorAll('[data-tier]');
  subscriptionButtons.forEach(button => {
    button.addEventListener('click', handleSubscriptionClick);
  });

  // Handle billing cycle toggle
  const billingToggle = document.getElementById('billing-toggle');
  if (billingToggle) {
    billingToggle.addEventListener('change', function() {
      const monthlyPrices = document.querySelectorAll('.monthly-price');
      const yearlyPrices = document.querySelectorAll('.yearly-price');

      if (this.checked) {
        // Yearly billing
        monthlyPrices.forEach(el => el.style.display = 'none');
        yearlyPrices.forEach(el => el.style.display = 'block');
      } else {
        // Monthly billing
        monthlyPrices.forEach(el => el.style.display = 'block');
        yearlyPrices.forEach(el => el.style.display = 'none');
      }
    });
  }
});
