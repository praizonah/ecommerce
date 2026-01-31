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

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config.env only if it exists (local development)
try {
  dotenv.config({path: path.join(__dirname, 'config.env')});
} catch (err) {
  // config.env not found - continue without it
}

// Initialize JWT strategy after env vars are loaded
initializeJWTStrategy();

// Robustly load config.env keys into process.env if any are missing
import loadConfigEnvIfMissing from './utils/configLoader.js';
try {
  const loaded = loadConfigEnvIfMissing(__dirname);
  if (loaded) console.log('ℹ️  Loaded missing env vars from config.env');
} catch (e) {
  /* ignore */
}

const app = express()

// Stripe webhook - must be before body parsing
app.post('/api/v1/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const { handleStripeWebhook } = await import('./controllers/paymentController.js');
  handleStripeWebhook(req, res);
});

app.use(express.urlencoded({extended:true}))
app.use(express.json())

// Session configuration for Passport.js
// Sessions are optional for this app (JWT-based auth is primary).
// In production we avoid using MemoryStore. Enable sessions explicitly
// by setting ENABLE_SESSIONS=true and installing `connect-mongo` if
// you want persistent sessions backed by MongoDB.
const enableSessions = process.env.ENABLE_SESSIONS === 'true' || process.env.NODE_ENV !== 'production';

if (enableSessions) {
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

  if (process.env.NODE_ENV === 'production' && process.env.MONGO_URL) {
    // Try to dynamically add a Mongo-backed session store if available
    (async () => {
      try {
        const { default: MongoStore } = await import('connect-mongo');
        // connect-mongo v4 exposes create method via MongoStore.create
        if (MongoStore && typeof MongoStore.create === 'function') {
          sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URL });
          console.log('ℹ️  Using MongoDB-backed session store (connect-mongo)');
        } else if (MongoStore) {
          // fallback for other exports
          sessionConfig.store = MongoStore({ mongoUrl: process.env.MONGO_URL });
          console.log('ℹ️  Using MongoDB-backed session store (connect-mongo fallback)');
        }
      } catch (err) {
        console.warn('⚠️  connect-mongo not installed or failed to load. Sessions will use MemoryStore. Install connect-mongo for production: `npm install connect-mongo`');
      } finally {
        app.use(session(sessionConfig));
      }
    })();
  } else {
    // Development or sessions explicitly enabled without Mongo
    app.use(session(sessionConfig));
  }

} else {
  console.log('ℹ️  Sessions disabled (ENABLE_SESSIONS not set). Using JWT-only authentication is recommended in production.');
}

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
  mongoose.connect(MONGO_URL, {
    maxPoolSize: 5,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 5000,
  }).then((conn)=>{
      console.log(`database connected successfully : ${conn.connection.host}`);
  }).catch((err)=>{
      console.error(`could not connect to database: ${err}`);
  });
} else {
  console.warn('MONGO_URL environment variable not set - database functionality disabled');
}    

// Creating a server
// Determine port with safety for Railway: prefer FORCE_PORT in production if set,
// otherwise use Railway's provided `PORT` or fallback to 4000 for local dev.
let PORT;
if (process.env.NODE_ENV === 'production') {
  // If you need to force the app to listen on 4000 in production,
  // set the environment variable `FORCE_PORT=4000` in Railway variables.
  PORT = process.env.FORCE_PORT ? Number(process.env.FORCE_PORT) : (process.env.PORT || 4000);
} else {
  PORT = process.env.PORT || 4000;
}
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

app.listen(PORT, async (err)=>{
    if (err) {
      console.error('Server startup error:', err);
      process.exit(1);
    }
    console.log(`\n✅ Server is running on port: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production' && process.env.PORT && process.env.FORCE_PORT) {
      console.warn('⚠️  Note: Railway provided PORT is', process.env.PORT, 'but FORCE_PORT is set to', process.env.FORCE_PORT);
      console.warn('If you experience connectivity issues, consider removing FORCE_PORT so the process listens on Railway\'s assigned port.');
    }
})

