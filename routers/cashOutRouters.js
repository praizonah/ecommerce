import express from 'express';
import {
  createStripeConnectAccount,
  getConnectAccountLink,
  getConnectAccountDetails,
  addFundsToWallet,
  getWalletBalance,
  requestCashOut,
  getCashOutHistory,
  getAllCashOutRequests,
  updateCashOutRequestStatus,
  payoutBalance
} from '../controllers/cashOutController.js';

const router = express.Router();

// Stripe Connect Account Setup
router.route('/connect-account/:id')
  .post(createStripeConnectAccount);

// Get Connect Account Link (for onboarding)
router.route('/connect-account-link/:id')
  .post(getConnectAccountLink);

// Get Connect Account Details
router.route('/connect-account-details/:id')
  .get(getConnectAccountDetails);

// Wallet Management
router.route('/wallet/:id')
  .get(getWalletBalance);

router.route('/wallet/add-funds/:id')
  .post(addFundsToWallet);

// Cash Out Operations
router.route('/cash-out/:id')
  .post(requestCashOut);

router.route('/cash-out-history/:id')
  .get(getCashOutHistory);

// Payout to Connected Account
router.route('/payout/:id')
  .post(payoutBalance);

// Admin Routes
router.route('/admin/cash-out-requests')
  .get(getAllCashOutRequests);

router.route('/admin/cash-out-request/:userId/:requestId')
  .patch(updateCashOutRequestStatus);

export default router;
