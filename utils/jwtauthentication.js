import jwt from 'jsonwebtoken';
import { User } from '../schemas/userSchemas.js';

// Generate token helper
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Delete all tokens related to a user if they don't exist in the database
export const deleteUserTokensIfNotExists = async (userId) => {
  try {
    const userExists = await User.findById(userId);
    
    if (!userExists) {
      // User doesn't exist, delete all tokens related to this userId
      // Since tokens are embedded in the user document, we can't delete them if user is already deleted
      // This function is primarily for verification logic in protected routes
      console.log(`User with ID ${userId} does not exist in database. Tokens cannot be cleared as user record is deleted.`);
      return {
        success: true,
        message: 'User not found. Token should be invalidated.',
        userDeleted: true
      };
    }
    
    return {
      success: true,
      userDeleted: false
    };
  } catch (error) {
    console.error('Error checking user existence:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Clear specific token types for a user
export const clearUserTokens = async (userId, tokenTypes = ['all']) => {
  try {
    const updateData = {};
    
    if (tokenTypes.includes('all') || tokenTypes.includes('password')) {
      updateData.passwordResetToken = undefined;
      updateData.passwordResetExpires = undefined;
    }
    
    if (tokenTypes.includes('all') || tokenTypes.includes('email')) {
      updateData.emailConfirmationToken = undefined;
      updateData.emailConfirmationExpires = undefined;
    }
    
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!updatedUser) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      message: `Tokens cleared for user ${userId}`,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error clearing user tokens:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export default signToken;