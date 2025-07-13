import { loadStripe } from '@stripe/stripe-js';

// Make sure to set your Stripe publishable key in environment variables
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('REACT_APP_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
} else if (!stripePublishableKey.startsWith('pk_')) {
  console.error('REACT_APP_STRIPE_PUBLISHABLE_KEY appears to be invalid (should start with pk_)');
} else {
  console.log('Stripe configuration loaded successfully');
}

let stripePromise;

const getStripe = () => {
  if (!stripePromise && stripePublishableKey && stripePublishableKey.startsWith('pk_')) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export default getStripe;
