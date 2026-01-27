import express from 'express'
import passport from 'passport'
import { getUsers, getUserById, updateUser, deleteUser, registerUser, loginUser, restrictUser, protectedRoute, forgotPassword, resetPassword, verifyResetToken, confirmEmail, resendConfirmationEmail, clearAllUserTokens, verifyUserAndTokens, checkEmailVerificationStatus, verifyEmailToken, getPendingConfirmationToken } from '../controllers/userController.js'
import { authenticateJWT, authorize, requireEmailConfirmed } from '../utils/passportMiddleware.js'

const router = express.Router()

router.route('/')
.get(authenticateJWT, authorize('admin'), getUsers)

router.route('/register')
.post(registerUser)

router.route('/login')
.post(passport.authenticate('local', { session: false }), loginUser)

// Email verification routes (BACKEND-ONLY)
router.route('/verify-email/status')
.post(checkEmailVerificationStatus)

router.route('/verify-email/pending')
.post(getPendingConfirmationToken)

router.route('/verify-email/token/:token')
.get(verifyEmailToken)

// Email confirmation routes
router.route('/confirm-email/:token')
.post(confirmEmail)

router.route('/resend-confirmation-email')
.post(resendConfirmationEmail)

// Password reset routes
router.route('/forgot-password')
.post(forgotPassword)

router.route('/reset-password/:token')
.post(resetPassword)

router.route('/verify-token/:token')
.get(verifyResetToken)

// Token management routes
router.route('/tokens/verify/:id')
.get(authenticateJWT, verifyUserAndTokens)

router.route('/tokens/clear/:id')
.post(authenticateJWT, authorize('admin'), clearAllUserTokens)

router.route('/:id')
.get(authenticateJWT, requireEmailConfirmed, getUserById)
.patch(authenticateJWT, authorize('admin'), updateUser)
.delete(authenticateJWT, authorize('admin'), deleteUser)

export default router;