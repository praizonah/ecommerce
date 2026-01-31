import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import morgan from "morgan"
import session from "express-session"
import passport from "passport"
import productRouters from "./routers/productRouters.js";
import userRouters from "./routers/userRouters.js";
import paymentRouters from "./routers/paymentRouters.js";
import cashOutRouters from "./routers/cashOutRouters.js";
import emailSetupRouter from "./routers/emailSetupRouter.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { testEmailConfiguration } from "./utils/emailService.js";
import passportConfig, { initializeJWTStrategy } from './utils/passportConfig.js';
import { ensureMongoConnected, isMongoConnected } from './utils/mongoHealthCheck.js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try multiple methods for robustness
// First, try dotenv with explicit config.env path
try {
  const configPath = path.join(__dirname, 'config.env');
  const result = dotenv.config({path: configPath});
  if (result.error) {
    console.warn('⚠️  dotenv error:', result.error.message);
  } else {
    console.log('✅ dotenv loaded config.env successfully');
  }
} catch (err) {
  console.warn('⚠️  Error with dotenv:', err.message);
}

// Then ensure all vars are loaded using custom parser (handles spaces around =)
import loadConfigEnvIfMissing from './utils/configLoader.js';
let configLoaded = false;
try {
  configLoaded = loadConfigEnvIfMissing(__dirname);
  if (configLoaded) {
    console.log('✅ Custom loader filled in missing environment variables');
  }
} catch (e) {
  console.error('❌ Error in custom config loader:', e.message);
}

// Debug output
console.log('\n📋 Environment Variable Status:');
const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (MONGO_URL) {
  console.log('✅ MONGO_URL is set:', MONGO_URL.substring(0, 60) + '...');
} else {
  console.error('❌ MONGO_URL is NOT set!');
  console.error('   Check: config.env exists in project root?');
  console.error('   Check: MONGO_URL line in config.env?');
}

if (JWT_SECRET) {
  console.log('✅ JWT_SECRET is set');
} else {
  console.warn('⚠️  JWT_SECRET not set, using fallback');
}

if (STRIPE_KEY) {
  console.log('✅ STRIPE_SECRET_KEY is set');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set');
}
console.log('');

// Initialize JWT strategy after env vars are loaded
initializeJWTStrategy();

const app = express()

// Stripe webhook - must be before body parsing
app.post('/api/v1/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const { handleStripeWebhook } = await import('./controllers/paymentController.js');
  handleStripeWebhook(req, res);
});

app.use(express.urlencoded({extended:true}))
app.use(express.json())

// Session configuration for Passport.js
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

// Note: Session store will be initialized after MongoDB connection attempt
// For now, use MemoryStore (will be replaced if MongoDB connects)
console.log('ℹ️  Session configuration ready (store will be MongoDB if MONGO_URL is set)');

// Apply session middleware BEFORE Passport
app.use(session(sessionConfig));

// Initialize Passport.js AFTER session middleware
app.use(passport.initialize())
app.use(passport.session())

// Initialize Passport.js
app.use(passport.initialize())
app.use(passport.session())

// logging
app.use(morgan('dev'))

// CORS - Updated for Railway deployment
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  process.env.FRONTEND_URL,
  process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_URL || 'http://localhost:4000'
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true
}))

// MongoDB health check middleware - ensure database is accessible before processing API requests
app.use('/api', ensureMongoConnected);

// mount API routers
app.use('/api/v1/products', productRouters)
app.use('/api/v1/users', userRouters)
app.use('/api/v1/payments', paymentRouters)
app.use('/api/v1/cashout', cashOutRouters)
app.use('/api/v1/email', emailSetupRouter)

// serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route - serve index.html for client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback - serve index.html for any non-API routes (client-side routing)
app.get(/.*/, (req, res) => {
  // If this is an API request, pass through (should have been handled earlier)
  if (req.path.startsWith('/api/')) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Connecting to the database
const MONGO_URL = process.env.MONGO_URL
if (MONGO_URL) {
  console.log('🔄 Initiating MongoDB connection with 120s buffer timeout...');
  mongoose.connect(MONGO_URL, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    bufferCommands: true,
    bufferTimeoutMS: 120000,  // ⚠️ CRITICAL: 120 seconds for buffering operations
    maxIdleTimeMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
  }).then((conn)=>{
      console.log(`✅ Database connected successfully : ${conn.connection.host}`);
      console.log(`📊 Connection pool: max=${conn.connections[0]?.options?.maxPoolSize || 'N/A'}, min=${conn.connections[0]?.options?.minPoolSize || 'N/A'}`);
  }).catch((err)=>{
      console.error(`❌ Could not connect to database: ${err.message}`);
      console.error('Error details:', err);
  });
  
  // Monitor connection events for debugging
  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
    
    // Try to initialize MongoDB session store now that DB is connected
    if (!sessionConfig.store) {
      (async () => {
        try {
          const { default: MongoStore } = await import('connect-mongo');
          if (MongoStore && typeof MongoStore.create === 'function') {
            sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URL });
            console.log('✅ MongoDB session store initialized and updated');
          } else if (MongoStore) {
            sessionConfig.store = MongoStore({ mongoUrl: process.env.MONGO_URL });
            console.log('✅ MongoDB session store initialized (fallback method)');
          }
        } catch (err) {
          console.warn('⚠️  Could not initialize MongoStore after connection:', err.message);
        }
      })();
    }
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('♻️  Mongoose reconnected to MongoDB');
  });
} else {
  console.warn('MONGO_URL environment variable not set - database functionality disabled');
}    

// Creating a server
// Determine port: use 8080 in production, 4000 in development
let PORT;
if (process.env.NODE_ENV === 'production') {
  // Use 8080 as default port in production
  // Can be overridden by FORCE_PORT env var if needed
  PORT = process.env.FORCE_PORT ? Number(process.env.FORCE_PORT) : (process.env.PORT || 8080);
} else {
  PORT = process.env.PORT || 4000;
}
// Centralized error handler to return JSON errors to clients (useful for axios)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  
  // Check if this is a mongoose buffering timeout error
  const isBufferingTimeout = err && err.message && err.message.includes('buffering timed out');
  
  let status = err && err.status ? err.status : 500;
  let message = err && (err.message || err.error) ? (err.message || err.error) : 'Internal Server Error';
  
  // Provide helpful message for buffering timeout
  if (isBufferingTimeout) {
    console.error('⚠️  Database buffering timeout - MongoDB connection may be slow or unavailable');
    status = 503;
    message = 'Database temporarily unavailable - operation timed out. Please retry in a moment.';
  }
  
  const payload = {
    success: false,
    message: message
  };
  
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err && err.stack ? err.stack : null;
    payload.errorName = err?.name;
  }
  
  try {
    if (!res.headersSent) {
      res.status(status).json(payload);
    } else {
      res.end();
    }
  } catch (e) {
    console.error('Error sending error response:', e);
  }
});

app.listen(PORT, async (err)=>{
    if (err) {
      console.error('Server startup error:', err);
      process.exit(1);
    }
    console.log(`\n✅ Server is running on port: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test MongoDB connection immediately on startup
    if (MONGO_URL) {
      try {
        const adminDb = mongoose.connection.db.admin();
        const pingResult = await adminDb.ping();
        console.log('🔗 MongoDB connection verified with ping');
      } catch (pingErr) {
        console.warn('⚠️  MongoDB connection not fully established yet. Requests will trigger lazy connection.');
      }
    }
    
    if (process.env.NODE_ENV === 'production' && process.env.PORT && process.env.FORCE_PORT) {
      console.warn('⚠️  Note: Railway provided PORT is', process.env.PORT, 'but FORCE_PORT is set to', process.env.FORCE_PORT);
      console.warn('If you experience connectivity issues, consider removing FORCE_PORT so the process listens on Railway\'s assigned port.');
    }
})

