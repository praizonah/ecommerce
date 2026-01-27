import express from 'express';
import {
  createPaymentIntent,
  createPaymentIntentCustom,
  createAchCheckoutSession,
  createAchPaymentIntent,
  verifyPayment,
  getPaymentStatus,
  getSessionDetails,
  handleStripeWebhook,
  getStripePublicKey,
  transferPaymentToBank
} from '../controllers/paymentController.js';

const router = express.Router();

// Get Stripe public key
router.route('/config')
  .get(getStripePublicKey);

// Create checkout session (Card payment)
router.route('/create-checkout-session')
  .post(createPaymentIntent);

// Create checkout session (ACH/Bank Transfer)
router.route('/create-ach-checkout-session')
  .post(createAchCheckoutSession);

// Create custom payment intent (Card)
router.route('/create-payment-intent')
  .post(createPaymentIntentCustom);

// Create ACH payment intent (Bank Transfer)
router.route('/create-ach-payment-intent')
  .post(createAchPaymentIntent);

// Transfer payment to bank account
router.route('/transfer-to-bank')
  .post(transferPaymentToBank);

// Verify payment after completion
router.route('/verify-payment')
  .post(verifyPayment);

// Get payment status
router.route('/payment-status/:intentId')
  .get(getPaymentStatus);

// Get session details
router.route('/session/:sessionId')
  .get(getSessionDetails);

// Webhook for Stripe events
router.route('/webhook')
  .post(handleStripeWebhook);

export default router;
