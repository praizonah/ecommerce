import jwt from "jsonwebtoken";
import { User } from "../schemas/userSchemas.js";
import signToken, { deleteUserTokensIfNotExists, clearUserTokens } from "../utils/jwtauthentication.js";
import util from "util";
import { sendPasswordResetEmail, sendConfirmationEmail, sendEmailVerificationToken } from "../utils/emailService.js";
import { generateResetToken, hashResetToken } from "../utils/tokenUtils.js";
import crypto from "crypto";


// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const findUser = await User.find({});
    return res.status(200).json(findUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const findUser = await User.findById(id);

    if (!findUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(findUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user from database
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify user no longer exists and tokens are cleared
    const tokenClearResult = await deleteUserTokensIfNotExists(id);
    
    return res.status(200).json({ 
      message: "User deleted successfully and all related tokens have been cleared",
      tokensClearedResult: tokenClearResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const userExist = await User.exists({ email: req.body.email });

    if (userExist)
      return res.status(409).json({ message: "User already exists" });

    // Generate email confirmation token BEFORE creating user
    const confirmationToken = generateResetToken();
    const hashedConfirmationToken = hashResetToken(confirmationToken);

    // Add confirmation token to the user data
    const userData = {
      ...req.body,
      emailConfirmationToken: hashedConfirmationToken,
      emailConfirmationExpires: Date.now() + 24 * 60 * 60 * 1000,
      isEmailConfirmed: false
    };

    const newUser = await User.create(userData);

    // Send email verification token via Nodemailer (primary method)
    const emailResult = await sendEmailVerificationToken(
      newUser.email,
      confirmationToken,
      newUser.name
    );

    if (!emailResult.success) {
      console.warn(`⚠️ Nodemailer failed: ${emailResult.message}`);
      
      // Fallback to existing confirmation email method
      const fallbackResult = await sendConfirmationEmail(
        newUser.email,
        confirmationToken,
        newUser.name
      );
      
      if (!fallbackResult.success) {
        // Delete user if all email methods fail
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ 
          message: "Verification email could not be sent. Please try again.",
          error: "Email service unavailable"
        });
      }
    }

    const token = signToken(newUser._id);

    return res.status(201).json({
      message: "✅ User registered successfully! Please check your email to confirm your account.",
      token,
      user: newUser,
      emailSentVia: emailResult.provider || "fallback"
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// LOGIN USER (with Passport.js Local Strategy)
export const loginUser = async (req, res, next) => {
  try {
    // Passport.js local strategy has already validated the user
    // req.user is set by passport middleware if authentication succeeds
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Generate JWT token
    const token = signToken(user._id);

    return res.status(200).json({ 
      message: "✅ Login successful",
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// PROTECTED ROUTE MIDDLEWARE

export const protectedRoute = async (req, res, next) => {
  try {
    //  Get token from Authorization header
    const authHeader = req.headers.authorization;
    // console.log(authHeader)

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token (throws if invalid)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from decoded token
    const user = await User.findById(decoded.id);
    console.log(decoded);

    if (!user) {
      // User does not exist in database - delete their tokens
      const tokenDeletionResult = await deleteUserTokensIfNotExists(decoded.id);
      console.log(`Token deletion check for non-existent user: ${JSON.stringify(tokenDeletionResult)}`);
      
      return res.status(401).json({
        message: "Unauthorized: User no longer exists. All related tokens have been cleared.",
        tokensClearedResult: tokenDeletionResult
      });
    }

    // Check if password was changed after token was issued
    if (user.isPasswordChanged && user.isPasswordChanged(decoded.iat)) {
      return res.status(401).json({
        message: "Unauthorized: Password changed recently, please login again",
      });
    }

    // Grant access
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: `unauthorized: invalid token ${err.message}`,
    });
  }
};//User authorization middleware
export const restrictUser = (role)=>{
  return (req,res,next)=>{
    try{
      if(req.user.role !== role){
        return res.status(401).json({message: "Unauthorized: No role attached"})
      }
      next();
    }catch(err){
      return res.status(500).json({message: "Server error"});
    }
  }
}

// Reset password middleware

//User authorization middleware for multiple roles
// export const restrictUser = (...role)=>{
//   return (req,res,next)=>{
//     try{
//       if(!req.user.role && !role.includes(req.user.role)){
//         return res.status(401).json({message: "Unauthorized: No role attached"})
//       }
//     }catch(err){
//       return res.status(500).json({message: "Server error"});
//     }
//   }
// }

// FORGOT PASSWORD - Send reset token via email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found with that email" });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    // Save hashed token and expiration to database (10 minutes)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Send email with reset token
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      user.name
    );

    if (!emailResult.success) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Email could not be sent" });
    }

    return res.status(200).json({
      message: "Password reset email sent successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// RESET PASSWORD - Update password using token from email
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate input
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Please provide password and confirm password" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Hash the token to compare with database
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// VERIFY RESET TOKEN - Check if token is valid (middleware)
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    // Hash the token to compare with database
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Attach user to request for use in next middleware/route
    req.user = user;
    req.resetToken = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// CONFIRM EMAIL - Verify email with token from email link
export const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('\n🔍 Email Confirmation Debug:');
    console.log('Raw token from URL:', token);

    if (!token) {
      return res.status(400).json({ message: "Confirmation token is required" });
    }

    // Hash the token to compare with database
    const hashedToken = hashResetToken(token);
    console.log('Hashed token:', hashedToken);

    // Find user with valid confirmation token
    const user = await User.findOne({
      emailConfirmationToken: hashedToken,
      emailConfirmationExpires: { $gt: Date.now() },
    });

    console.log('User found:', !!user);
    
    if (user) {
      console.log('User email:', user.email);
      console.log('Token expires:', new Date(user.emailConfirmationExpires));
      console.log('Current time:', new Date(Date.now()));
    } else {
      // Debug: Check if token exists but is expired
      const userWithAnyToken = await User.findOne({
        emailConfirmationToken: hashedToken,
      });
      
      if (userWithAnyToken) {
        console.log('⚠️ Token found but EXPIRED');
        console.log('Expiration time:', new Date(userWithAnyToken.emailConfirmationExpires));
      } else {
        console.log('❌ Token not found in database');
        // Let's check all users with any confirmation token
        const allUsersWithTokens = await User.find({ 
          emailConfirmationToken: { $exists: true, $ne: null } 
        }).select('email emailConfirmationToken emailConfirmationExpires');
        
        console.log('All users with confirmation tokens:', allUsersWithTokens.length);
        allUsersWithTokens.forEach(u => {
          console.log(`  - Email: ${u.email}, Token: ${u.emailConfirmationToken?.substring(0, 10)}..., Expires: ${new Date(u.emailConfirmationExpires)}`);
        });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired confirmation token" });
    }

    // Mark email as confirmed
    user.isEmailConfirmed = true;
    user.emailConfirmationToken = undefined;
    user.emailConfirmationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    console.log('✅ Email confirmed successfully for:', user.email);

    return res.status(200).json({
      message: "Email confirmed successfully. You can now login.",
    });
  } catch (err) {
    console.error('❌ Error in confirmEmail:', err);
    return res.status(500).json({ error: err.message });
  }
};

// VERIFY CONFIRMATION TOKEN - Middleware to verify token validity
export const verifyConfirmationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Confirmation token is required" });
    }

    // Hash the token to compare with database
    const hashedToken = hashResetToken(token);

    // Find user with valid confirmation token
    const user = await User.findOne({
      emailConfirmationToken: hashedToken,
      emailConfirmationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired confirmation token" });
    }

    // Attach user to request for use in next middleware/route
    req.user = user;
    req.confirmationToken = token;
    
    // Call next only if next is a function (proper middleware usage)
    if (typeof next === 'function') {
      next();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// RESEND CONFIRMATION EMAIL
export const resendConfirmationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found with that email" });
    }

    if (user.isEmailConfirmed) {
      return res.status(400).json({ message: "Email is already confirmed" });
    }

    // Generate new confirmation token
    const confirmationToken = generateResetToken();
    const hashedConfirmationToken = hashResetToken(confirmationToken);

    // Save hashed token and expiration (24 hours)
    user.emailConfirmationToken = hashedConfirmationToken;
    user.emailConfirmationExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(
      email,
      confirmationToken,
      user.name
    );

    if (!emailResult.success) {
      // Clear tokens if email fails
      user.emailConfirmationToken = undefined;
      user.emailConfirmationExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Confirmation email could not be sent" });
    }

    return res.status(200).json({
      message: "Confirmation email sent successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// CLEAR ALL TOKENS FOR A USER
export const clearAllUserTokens = async (req, res) => {
  try {
    const { id } = req.params;
    const { tokenTypes } = req.body;

    // Validate that user exists before clearing tokens
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear tokens based on type
    const result = await clearUserTokens(id, tokenTypes || ['all']);

    if (!result.success) {
      return res.status(500).json({ message: result.error || result.message });
    }

    return res.status(200).json({
      message: "User tokens cleared successfully",
      data: result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET PENDING EMAIL CONFIRMATION TOKEN FOR A USER
export const getPendingConfirmationToken = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        message: "User not found with that email",
        hasPendingToken: false
      });
    }

    // Check if user has a pending confirmation token
    if (!user.emailConfirmationToken || user.isEmailConfirmed) {
      return res.status(200).json({
        message: user.isEmailConfirmed 
          ? "Email is already confirmed. You can login."
          : "No pending confirmation token found. Please register or request a new one.",
        email: user.email,
        isEmailConfirmed: user.isEmailConfirmed,
        hasPendingToken: false
      });
    }

    // Check if token is expired
    if (user.emailConfirmationExpires < Date.now()) {
      return res.status(200).json({
        message: "Confirmation token has expired. Please request a new one.",
        email: user.email,
        isEmailConfirmed: user.isEmailConfirmed,
        hasPendingToken: false,
        tokenExpired: true
      });
    }

    // Token exists and is valid - show user information
    // We don't return the plaintext token here for security - users should use their email link
    const hoursRemaining = Math.round((user.emailConfirmationExpires - Date.now()) / (1000 * 60 * 60));

    return res.status(200).json({
      message: "✅ Pending confirmation token found",
      email: user.email,
      isEmailConfirmed: false,
      hasPendingToken: true,
      tokenExpiresAt: new Date(user.emailConfirmationExpires),
      hoursRemaining: hoursRemaining,
      instruction: "Check your email for the confirmation link, or use the manual token input form below"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ENDPOINT TO CHECK EMAIL VERIFICATION STATUS
export const checkEmailVerificationStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        message: "User not found with that email",
        isVerified: false,
        userExists: false
      });
    }

    // Return verification status
    return res.status(200).json({
      userExists: true,
      email: user.email,
      name: user.name,
      isEmailConfirmed: user.isEmailConfirmed,
      hasEmailConfirmationToken: !!user.emailConfirmationToken,
      tokenExpiresAt: user.emailConfirmationExpires ? new Date(user.emailConfirmationExpires) : null,
      message: user.isEmailConfirmed 
        ? "✅ Email is verified. You can login."
        : "⏳ Email is not verified. Please check your inbox for confirmation link.",
      nextAction: user.isEmailConfirmed ? "Login" : "Confirm Email"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// VERIFY EMAIL TOKEN BEFORE CONFIRMATION (Check if token is valid without confirming)
export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Confirmation token is required" });
    }

    // Hash the token to compare with database
    const hashedToken = hashResetToken(token);

    // Find user with valid confirmation token
    const user = await User.findOne({
      emailConfirmationToken: hashedToken,
      emailConfirmationExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if token exists but is expired
      const userWithExpiredToken = await User.findOne({
        emailConfirmationToken: hashedToken,
      });

      if (userWithExpiredToken) {
        return res.status(400).json({ 
          message: "❌ Confirmation token has expired",
          isValid: false,
          isExpired: true,
          email: userWithExpiredToken.email,
          expiredAt: userWithExpiredToken.emailConfirmationExpires,
          suggestion: "Please request a new verification email"
        });
      }

      return res.status(400).json({ 
        message: "❌ Invalid confirmation token",
        isValid: false,
        isExpired: false,
        suggestion: "Please check your email for the correct verification link"
      });
    }

    // Token is valid
    return res.status(200).json({
      message: "✅ Token is valid",
      isValid: true,
      email: user.email,
      name: user.name,
      expiresAt: new Date(user.emailConfirmationExpires),
      hoursRemaining: Math.round((user.emailConfirmationExpires - Date.now()) / (1000 * 60 * 60)),
      nextAction: "Confirm email with this token"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ENDPOINT TO VERIFY USER EXISTS AND CHECK TOKENS
export const verifyUserAndTokens = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    
    if (!user) {
      // User doesn't exist - log that tokens would be cleared
      return res.status(404).json({ 
        message: "User does not exist",
        userExists: false,
        note: "If user existed, their tokens would be cleared: passwordResetToken, passwordResetExpires, emailConfirmationToken, emailConfirmationExpires"
      });
    }

    // Return token information for existing user
    return res.status(200).json({
      userExists: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      tokens: {
        hasPasswordResetToken: !!user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        hasEmailConfirmationToken: !!user.emailConfirmationToken,
        emailConfirmationExpires: user.emailConfirmationExpires,
        isEmailConfirmed: user.isEmailConfirmed
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};