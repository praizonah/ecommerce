import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import session from "express-session"
import passport from "passport"
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import productRouters from "../routers/productRouters.js";
import userRouters from "../routers/userRouters.js";
import paymentRouters from "../routers/paymentRouters.js";
import cashOutRouters from "../routers/cashOutRouters.js";
import emailSetupRouter from "../routers/emailSetupRouter.js";
import cors from "cors";
import passportConfig, { initializeJWTStrategy } from '../utils/passportConfig.js';
import { ensureMongoConnected } from '../utils/mongoHealthCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track cold starts and reuse across invocations
let isWarmUp = true;

// Load config.env only if it exists (local development)
// On Railway, environment variables come from the dashboard
try {
  const configPath = path.join(__dirname, '../config.env');
  if (fs.existsSync(configPath)) {
    const result = dotenv.config({path: configPath});
    if (!result.error) {
      console.log('✅ dotenv loaded config.env');
    } else {
      console.warn('⚠️  dotenv error:', result.error.message);
    }
  } else {
    console.log('ℹ️  config.env not found (expected on Railway - use dashboard variables)');
  }
} catch (err) {
  console.warn('⚠️  Error checking for config.env:', err.message);
}

// Initialize JWT strategy after env vars are loaded
initializeJWTStrategy();

// Robustly load config.env keys into process.env if any are missing
import loadConfigEnvIfMissing from '../utils/configLoader.js';
try {
  const loaded = loadConfigEnvIfMissing(__dirname);
  if (loaded) {
    console.log('✅ Custom loader filled in missing environment variables');
  }
} catch (e) {
  console.warn('⚠️  Config loader error:', e.message);
}

// Debug output
const MONGO_URL_CHECK = process.env.MONGO_URL;
if (MONGO_URL_CHECK) {
  console.log('✅ MONGO_URL is set:', MONGO_URL_CHECK.substring(0, 60) + '...');
} else {
  console.warn('⚠️  MONGO_URL is not set');
}

const app = express()

// Stripe webhook - must be before body parsing
app.post('/api/v1/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const { handleStripeWebhook } = await import('../controllers/paymentController.js');
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

console.log('ℹ️  Session configuration ready (store will be MongoDB if MONGO_URL is set)');

// Apply session middleware BEFORE Passport
app.use(session(sessionConfig));

// Initialize Passport.js AFTER session middleware
app.use(passport.initialize())
app.use(passport.session())

// CORS - Updated for Railway deployment
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  process.env.FRONTEND_URL,
  process.env.RAILWAY_URL ? `https://${process.env.RAILWAY_URL}` : null
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true
}))

// MongoDB health check middleware - ensure database is accessible before processing API requests
app.use('/api', ensureMongoConnected);

//Connecting to the database (only if MONGO_URL is set)
const MONGO_URL = process.env.MONGO_URL
let mongoConnected = false;
let mongoConnectionPromise = null;

// Lazy connect function - only connect when needed
const connectToDatabase = async () => {
  if (mongoConnected) {
    return;
  }
  
  if (mongoConnectionPromise) {
    return mongoConnectionPromise;
  }

  if (!MONGO_URL) {
    console.log('MONGO_URL not set - skipping database connection');
    return;
  }

  mongoConnectionPromise = (async () => {
    try {
      await mongoose.connect(MONGO_URL, {
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
      });
      mongoConnected = true;
      console.log(`database connected: ${mongoose.connection.host}`);
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      mongoConnectionPromise = null;
      throw err;
    }
  })();

  return mongoConnectionPromise;
};

// mount API routers
app.use('/api/v1/products', productRouters)
app.use('/api/v1/users', userRouters)
app.use('/api/v1/payments', paymentRouters)
app.use('/api/v1/cashout', cashOutRouters)
app.use('/api/v1/email', emailSetupRouter)

// serve static files from the public directory
// Optimize for serverless: cache static assets aggressively
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1h',
  etag: false
}))

// Health check endpoint - lightweight for keeping warm
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok', 
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Catch-all route - serve index.html for client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Fallback for all other routes - serve index.html for SPA
app.get(/^\/(?!api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware to connect to database before API requests
app.use('/api', async (req, res, next) => {
  if (MONGO_URL && !mongoConnected) {
    try {
      await connectToDatabase();
    } catch (err) {
      console.error('Failed to connect to database on request:', err.message);
      // Continue anyway - some endpoints might not need DB
    }
  }
  next();
});

// Centralized error handler to return JSON errors to clients (useful for axios)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const payload = {
    success: false,
    message: err && (err.message || err.error) ? (err.message || err.error) : 'Internal Server Error'
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err && err.stack ? err.stack : null;
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

export default app;
