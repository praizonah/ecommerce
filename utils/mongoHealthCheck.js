import mongoose from 'mongoose';

/**
 * Checks if MongoDB connection is healthy
 * Returns true if connected and responding, false otherwise
 */
export const isMongoConnected = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    // Perform a lightweight operation to verify connection is responsive
    const adminDb = mongoose.connection.db?.admin();
    if (!adminDb) {
      return false;
    }
    await adminDb.ping({ waitConnection: 5000 });
    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB health check failed:', err.message);
    return false;
  }
};

/**
 * Middleware to ensure MongoDB is connected before processing requests
 * If not connected, wait for connection with timeout
 */
export const ensureMongoConnected = async (req, res, next) => {
  try {
    const isConnected = await isMongoConnected();
    
    if (isConnected) {
      console.log('✅ MongoDB connection healthy');
      return next();
    }

    console.log('⏳ MongoDB not healthy, waiting for reconnection...');
    
    // Wait for connection state to become connected (max 30 seconds)
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      if (mongoose.connection.readyState === 1) {
        const healthy = await isMongoConnected();
        if (healthy) {
          console.log('✅ MongoDB reconnected successfully');
          return next();
        }
      }
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    
    // If we get here, connection is not available
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable. Please try again in a moment.',
      error: 'MongoDB connection timeout'
    });
  } catch (err) {
    console.error('❌ Error in MongoDB health check middleware:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during connection check',
      error: err.message
    });
  }
};

/**
 * Retry wrapper for database operations
 * Retries the operation up to 3 times with exponential backoff
 */
export const withRetry = async (operation, operationName = 'Database operation') => {
  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (err) {
      lastError = err;
      
      // If it's a buffer timeout error, retry
      if (err.message && err.message.includes('buffering timed out')) {
        console.warn(`⏳ ${operationName} buffering timeout on attempt ${attempt}, retrying...`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      } else {
        // For non-timeout errors, don't retry
        throw err;
      }
    }
  }
  
  throw lastError;
};
