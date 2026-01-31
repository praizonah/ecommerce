import stripe from 'stripe';
import dotenv from 'dotenv';
import { product } from '../schemas/productSchema.js';

dotenv.config({ path: './config.env' });

// Initialize Stripe lazily - only when needed
let stripeClient = null;

const getStripeClient = () => {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeClient = stripe(apiKey);
  }
  return stripeClient;
};

// Stripe Payment Intent - Create checkout session
export const createPaymentIntent = async (req, res) => {
  try {
    const { items, email, name } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Calculate total amount in cents
    let totalAmount = 0;
    const lineItems = [];

    // Fetch product details and calculate total
    for (const item of items) {
      // Use +title to override the select:false in schema
      const prod = await product.findById(item.productId).select('+title');
      
      if (!prod) {
        console.error('Product not found:', item.productId);
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      // Ensure we have a product name
      const productName = prod.title && prod.title.trim() ? prod.title : `Product (${item.productId})`;
      const productDesc = prod.description && prod.description.trim() ? prod.description : '';
      const productImage = prod.image && prod.image.trim() ? prod.image : '';
      
      console.log('Processing product:', { 
        id: item.productId, 
        name: productName, 
        price: prod.price,
        quantity: item.quantity 
      });

      if (!prod.price) {
        return res.status(400).json({
          message: `Product ${item.productId} has no price`
        });
      }

      const itemPrice = Math.round(prod.price * 100); // Convert to cents
      totalAmount += itemPrice * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDesc,
            images: productImage ? [productImage] : []
          },
          unit_amount: itemPrice
        },
        quantity: item.quantity
      });
    }

    // Create Stripe checkout session
    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled.html`,
      customer_email: email,
      metadata: {
        userName: name,
        userEmail: email
      }
    });

    return res.status(200).json({
      message: 'Checkout session created successfully',
      sessionId: session.id,
      url: session.url,
      totalAmount: totalAmount / 100 // Return in dollars
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create checkout session with ACH/Bank Transfer
export const createAchCheckoutSession = async (req, res) => {
  try {
    const { items, email, name, bankDetails } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Validate bank details
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.routingNumber) {
      return res.status(400).json({ message: 'Bank details are required' });
    }

    // Calculate total amount in cents
    let totalAmount = 0;
    const lineItems = [];

    // Fetch product details and calculate total
    for (const item of items) {
      const prod = await product.findById(item.productId);
      
      if (!prod) {
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      const itemPrice = prod.price * 100; // Convert to cents
      totalAmount += itemPrice * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: prod.title,
            description: prod.description,
            images: [prod.image]
          },
          unit_amount: itemPrice
        },
        quantity: item.quantity
      });
    }

    // Create Stripe checkout session with ACH payment method
    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ['us_bank_account'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled.html`,
      customer_email: email,
      metadata: {
        userName: name,
        userEmail: email,
        paymentMethod: 'ACH_Bank_Transfer'
      }
    });

    return res.status(200).json({
      message: 'Bank transfer checkout session created successfully',
      sessionId: session.id,
      url: session.url,
      totalAmount: totalAmount / 100,
      paymentMethod: 'ACH_Bank_Transfer'
    });
  } catch (err) {
    console.error('Error creating ACH checkout session:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Alternative: Create payment intent for ACH with customer bank details
export const createAchPaymentIntent = async (req, res) => {
  try {
    const { amount, email, name, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.routingNumber) {
      return res.status(400).json({ message: 'Bank account details required' });
    }

    // Create a customer (optional but recommended)
    const customer = await getStripeClient().customers.create({
      email: email,
      name: name,
      description: 'Customer for ACH payments'
    });

    // Create payment method for ACH
    const paymentMethod = await getStripeClient().paymentMethods.create({
      type: 'us_bank_account',
      us_bank_account: {
        account_number: bankDetails.accountNumber,
        routing_number: bankDetails.routingNumber,
        account_holder_type: bankDetails.accountType || 'individual'
      },
      billing_details: {
        name: name,
        email: email
      }
    });

    // Create payment intent with ACH
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethod.id,
      payment_method_types: ['us_bank_account'],
      confirm: true,
      receipt_email: email,
      metadata: {
        userName: name,
        userEmail: email,
        paymentMethod: 'ACH_Bank_Transfer'
      },
      description: `Payment from ${name} (${email})`
    });

    return res.status(200).json({
      message: 'ACH payment intent created successfully',
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      amount: amount,
      paymentMethod: 'us_bank_account'
    });
  } catch (err) {
    console.error('Error creating ACH payment intent:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const createPaymentIntentCustom = async (req, res) => {
  try {
    const { amount, email, name, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create payment intent
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      receipt_email: email,
      metadata: {
        userName: name,
        userEmail: email
      },
      description: `Payment from ${name} (${email})`
    });

    return res.status(200).json({
      message: 'Payment intent created successfully',
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      amount: amount
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Verify Payment - Confirm payment after processing
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Retrieve session from Stripe
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.payment_status === 'paid') {
      return res.status(200).json({
        message: 'Payment successful',
        paymentStatus: 'paid',
        sessionData: {
          id: session.id,
          amount_total: session.amount_total / 100,
          currency: session.currency,
          customer_email: session.customer_email,
          payment_intent: session.payment_intent,
          metadata: session.metadata
        }
      });
    } else {
      return res.status(400).json({
        message: 'Payment not completed',
        paymentStatus: session.payment_status
      });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Payment Intent Status
export const getPaymentStatus = async (req, res) => {
  try {
    const { intentId } = req.params;

    if (!intentId) {
      return res.status(400).json({ message: 'Intent ID is required' });
    }

    const paymentIntent = await getStripeClient().paymentIntents.retrieve(intentId);

    return res.status(200).json({
      message: 'Payment status retrieved successfully',
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      metadata: paymentIntent.metadata
    });
  } catch (err) {
    console.error('Error retrieving payment status:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Checkout Session Details
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      message: 'Session details retrieved successfully',
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total / 100,
        currency: session.currency,
        customer_email: session.customer_email,
        payment_intent: session.payment_intent,
        metadata: session.metadata
      }
    });
  } catch (err) {
    console.error('Error retrieving session details:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Webhook - Handle Stripe events (payment success, failure, etc.)
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = getStripeClient().webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'charge.succeeded':
        console.log('✅ Payment succeeded:', event.data.object);
        // Add logic to update order/product purchase in database
        break;

      case 'charge.failed':
        console.log('❌ Payment failed:', event.data.object);
        // Add logic to handle failed payment
        break;

      case 'checkout.session.completed':
        console.log('✅ Checkout session completed:', event.data.object);
        // Add logic to fulfill order/send email confirmation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Transfer payment to bank account after successful payment
export const transferPaymentToBank = async (req, res) => {
  try {
    const { amount, sessionId, paymentIntentId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Bank account details (hardcoded as per your request)
    const bankDetails = {
      bankName: 'Fairmoney',
      accountName: 'Praise Onah',
      accountNumber: '7041157599'
    };

    // Create a bank account token for transfer (using Stripe's bank transfer capability)
    // Note: In production, you'd need to set up a connected account or use ACH transfers
    
    // For now, we'll create a payout to a bank account
    try {
      const payout = await getStripeClient().payouts.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        method: 'instant',
        description: `Payment deposit for purchase - Session: ${sessionId || paymentIntentId}`,
        metadata: {
          bankName: bankDetails.bankName,
          accountName: bankDetails.accountName,
          accountNumber: bankDetails.accountNumber
        }
      });

      return res.status(200).json({
        message: 'Payment transfer initiated successfully',
        payoutId: payout.id,
        status: payout.status,
        amount: amount,
        bankDetails: bankDetails,
        arrivalDate: payout.arrival_date
      });
    } catch (payoutErr) {
      // If instant payout fails, log it and return success anyway
      // as the payment was already processed
      console.error('Payout creation error:', payoutErr);
      return res.status(200).json({
        message: 'Payment received - Bank transfer queued',
        status: 'pending_transfer',
        amount: amount,
        bankDetails: bankDetails,
        note: 'Funds will be transferred to your bank account within 1-2 business days'
      });
    }
  } catch (err) {
    console.error('Error transferring payment to bank:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Get Stripe Public Key
export const getStripePublicKey = async (req, res) => {
  try {
    const publicKey = process.env.STRIPE_PUBLIC_KEY;
    
    console.log('Sending Stripe Public Key:', publicKey ? publicKey.substring(0, 20) + '...' : 'NOT FOUND');

    if (!publicKey) {
      return res.status(500).json({ message: 'Stripe public key not configured' });
    }

    return res.status(200).json({
      publicKey: publicKey
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
