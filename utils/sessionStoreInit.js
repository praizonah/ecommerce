import session from 'express-session';

/**
 * Initialize MongoDB session store asynchronously
 * Returns a configured sessionConfig object ready for express-session
 */
export async function initializeSessionStore() {
  const sessionConfig = {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  };

  // Try to use MongoDB-backed session store if available
  if (process.env.MONGO_URL) {
    try {
      const { default: MongoStore } = await import('connect-mongo');
      if (MongoStore && typeof MongoStore.create === 'function') {
        sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URL });
        console.log('✅ MongoDB session store initialized (connect-mongo)');
        return sessionConfig;
      } else if (MongoStore) {
        sessionConfig.store = MongoStore({ mongoUrl: process.env.MONGO_URL });
        console.log('✅ MongoDB session store initialized (connect-mongo fallback)');
        return sessionConfig;
      }
    } catch (err) {
      console.warn('⚠️  connect-mongo not available:', err.message);
    }
  }

  // Fallback: use MemoryStore (acceptable for development, not for production at scale)
  console.warn('⚠️  Using MemoryStore for sessions');
  if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URL) {
    console.warn('   ⚠️  WARNING: MemoryStore is not suitable for production!');
    console.warn('   Please set MONGO_URL and install connect-mongo');
  }

  return sessionConfig;
}

/**
 * Create session middleware with appropriate store
 */
export async function createSessionMiddleware() {
  const config = await initializeSessionStore();
  return session(config);
}
