/**
 * Payment Constants
 * Configuration for payment gateways and subscription plans
 */

export const PAYMENT_ENVIRONMENT = {
  TEST: 'TEST',
  PRODUCTION: 'PRODUCTION',
};

// Google Pay configuration
export const GOOGLE_PAY_CONFIG = {
  environment: PAYMENT_ENVIRONMENT.TEST, // Change to "PRODUCTION" for live payments
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: "CARD",
      parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["MASTERCARD", "VISA"],
      },
      tokenizationSpecification: {
        type: "PAYMENT_GATEWAY",
        parameters: {
          gateway: "stripe",
          "stripe:version": "2020-08-27",
          "stripe:publishableKey": import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
        },
      },
    },
  ],
  merchantInfo: {
    merchantName: "School Bus Service",
    merchantId: "BCR2DN6TR6QFZXJB",
  },
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    price: 29.99,
    currency: 'USD',
    features: [
      'Real-time bus tracking',
      'Basic notifications',
      'Trip history',
    ],
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    price: 49.99,
    currency: 'USD',
    features: [
      'Everything in Basic',
      'Priority support',
      'Advanced analytics',
      'Multiple students',
    ],
  },
};
