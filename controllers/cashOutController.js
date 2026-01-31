import stripe from 'stripe';
import dotenv from 'dotenv';
import { User } from '../schemas/userSchemas.js';

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

// Create or update Stripe Connect account
export const createStripeConnectAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, accountHolderName, country = 'US', businessType = 'individual' } = req.body;

    // Validate user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a Stripe Connect account
    if (user.stripeConnectId) {
      return res.status(400).json({ 
        message: 'User already has a Stripe Connect account',
        stripeConnectId: user.stripeConnectId
      });
    }

    // Create Stripe Connect account
    const account = await getStripeClient().accounts.create({
      type: 'express',
      email: email || user.email,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      settings: {
        payouts: {
          debit_negative_balances: true,
          schedule: {
            interval: 'daily'
          }
        }
      },
      individual: {
        first_name: accountHolderName || user.name.split(' ')[0],
        last_name: user.name.split(' ')[1] || '',
        email: email || user.email
      },
      country: country
    });

    // Save Stripe Connect ID to user
    user.stripeConnectId = account.id;
    await user.save();

    return res.status(200).json({
      message: 'Stripe Connect account created successfully',
      stripeConnectId: account.id,
      accountStatus: account.requirements
    });
  } catch (err) {
    console.error('Error creating Stripe Connect account:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Stripe Connect account link (for onboarding)
export const getConnectAccountLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { refreshUrl, returnUrl } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeConnectId) {
      return res.status(400).json({ message: 'User does not have a Stripe Connect account' });
    }

    // Create account link for onboarding
    const accountLink = await getStripeClient().accountLinks.create({
      account: user.stripeConnectId,
      type: 'account_onboarding',
      refresh_url: refreshUrl || `${process.env.FRONTEND_URL}/cashout-onboarding`,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/cashout-success`
    });

    return res.status(200).json({
      message: 'Account link created successfully',
      url: accountLink.url
    });
  } catch (err) {
    console.error('Error creating account link:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Stripe Connect account details
export const getConnectAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeConnectId) {
      return res.status(400).json({ message: 'User does not have a Stripe Connect account' });
    }

    // Get account details
    const account = await getStripeClient().accounts.retrieve(user.stripeConnectId);

    return res.status(200).json({
      message: 'Account details retrieved successfully',
      account: {
        id: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        business_profile: account.business_profile
      }
    });
  } catch (err) {
    console.error('Error retrieving account details:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Add funds to user wallet (simulated, in real app this comes from sales)
export const addFundsToWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description = 'Payment received' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update wallet balance
    user.wallet.balance += amount;
    user.wallet.totalEarned += amount;
    await user.save();

    return res.status(200).json({
      message: 'Funds added to wallet successfully',
      wallet: user.wallet
    });
  } catch (err) {
    console.error('Error adding funds to wallet:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get user wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Wallet balance retrieved successfully',
      wallet: user.wallet,
      stripeConnectId: user.stripeConnectId
    });
  } catch (err) {
    console.error('Error retrieving wallet balance:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Request cash out (transfer from wallet to bank account)
export const requestCashOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has Stripe Connect account
    if (!user.stripeConnectId) {
      return res.status(400).json({ message: 'User does not have a Stripe Connect account' });
    }

    // Check wallet balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        availableBalance: user.wallet.balance,
        requestedAmount: amount
      });
    }

    // Check if account is ready for payouts
    const account = await getStripeClient().accounts.retrieve(user.stripeConnectId);
    if (!account.payouts_enabled) {
      return res.status(400).json({ 
        message: 'Account is not ready for payouts. Please complete onboarding.',
        requirements: account.requirements
      });
    }

    try {
      // Create transfer to connected account
      const transfer = await getStripeClient().transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: user.stripeConnectId,
        description: `Cash out from wallet - ${user.email}`
      });

      // Update wallet balance
      user.wallet.balance -= amount;

      // Add cash out request record
      user.cashOutRequests.push({
        amount: amount,
        status: 'completed',
        transferId: transfer.id,
        completedAt: new Date()
      });

      await user.save();

      return res.status(200).json({
        message: 'Cash out request processed successfully',
        transfer: {
          id: transfer.id,
          amount: transfer.amount / 100,
          status: transfer.status,
          created: transfer.created
        },
        newWalletBalance: user.wallet.balance
      });
    } catch (transferErr) {
      // If transfer fails, create a pending request for manual review
      user.cashOutRequests.push({
        amount: amount,
        status: 'pending',
        failureMessage: transferErr.message
      });
      await user.save();

      return res.status(400).json({
        message: 'Cash out transfer failed, request marked as pending',
        error: transferErr.message,
        requestCreated: true
      });
    }
  } catch (err) {
    console.error('Error processing cash out:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get cash out history
export const getCashOutHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Cash out history retrieved successfully',
      cashOutRequests: user.cashOutRequests,
      totalCashedOut: user.cashOutRequests
        .filter(req => req.status === 'completed')
        .reduce((sum, req) => sum + req.amount, 0)
    });
  } catch (err) {
    console.error('Error retrieving cash out history:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all cash out requests (Admin)
export const getAllCashOutRequests = async (req, res) => {
  try {
    const { status = null } = req.query;

    let query = {};
    if (status) {
      query = { 'cashOutRequests.status': status };
    }

    const users = await User.find(
      status ? query : {},
      'name email wallet cashOutRequests'
    );

    // Flatten and enrich cash out requests
    const allRequests = [];
    users.forEach(user => {
      user.cashOutRequests.forEach(req => {
        if (!status || req.status === status) {
          allRequests.push({
            ...req.toObject(),
            userId: user._id,
            userName: user.name,
            userEmail: user.email
          });
        }
      });
    });

    return res.status(200).json({
      message: 'All cash out requests retrieved successfully',
      requests: allRequests,
      total: allRequests.length
    });
  } catch (err) {
    console.error('Error retrieving cash out requests:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update cash out request status (Admin)
export const updateCashOutRequestStatus = async (req, res) => {
  try {
    const { userId, requestId } = req.params;
    const { status, failureMessage = null } = req.body;

    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the cash out request
    const cashOutRequest = user.cashOutRequests.id(requestId);
    if (!cashOutRequest) {
      return res.status(404).json({ message: 'Cash out request not found' });
    }

    // Update status
    cashOutRequest.status = status;
    if (status === 'completed') {
      cashOutRequest.completedAt = new Date();
    }
    if (status === 'failed' && failureMessage) {
      cashOutRequest.failureMessage = failureMessage;
    }

    await user.save();

    return res.status(200).json({
      message: 'Cash out request status updated successfully',
      cashOutRequest
    });
  } catch (err) {
    console.error('Error updating cash out request:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Payout balance to connected account
export const payoutBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description = 'Payout from wallet' } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeConnectId) {
      return res.status(400).json({ message: 'User does not have a Stripe Connect account' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payout amount' });
    }

    // Create payout for connected account
    const payout = await getStripeClient().payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: 'usd',
        description: description
      },
      {
        stripeAccount: user.stripeConnectId
      }
    );

    return res.status(200).json({
      message: 'Payout initiated successfully',
      payout: {
        id: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: payout.arrival_date,
        created: payout.created
      }
    });
  } catch (err) {
    console.error('Error creating payout:', err);
    return res.status(500).json({ error: err.message });
  }
};
