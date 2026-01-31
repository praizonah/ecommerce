import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import session from "express-session"
import passport from "passport"
import path from "path";
import { fileURLToPath } from "url";
import productRouters from "../routers/productRouters.js";
import userRouters from "../routers/userRouters.js";
import paymentRouters from "../routers/paymentRouters.js";
import cashOutRouters from "../routers/cashOutRouters.js";
import emailSetupRouter from "../routers/emailSetupRouter.js";
import cors from "cors";
import '../utils/passportConfig.js';
import serverless from 'serverless-http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track cold starts and reuse across invocations
let isWarmUp = true;

// Load config.env only if it exists (local development)
// On Vercel, environment variables come from the dashboard
try {
  const configPath = path.join(__dirname, '../config.env');
  dotenv.config({path: configPath});
} catch (err) {
  // config.env not found - expected on Vercel
  // Environment variables will come from Vercel dashboard
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
app.use(session({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Only true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Allow cross-site cookies for development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport.js
app.use(passport.initialize())
app.use(passport.session())

// CORS - Updated for Vercel deployment
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
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

//Connecting to the database (only if MONGO_URL is set)
const MONGO_URL = process.env.MONGO_URL
let mongoConnected = false;

// Only connect once, reuse connection for subsequent invocations
if (MONGO_URL && !mongoConnected) {
  mongoose.connect(MONGO_URL, {
    // Serverless connection pooling
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then((conn)=>{
      mongoConnected = true;
      console.log(`database connected successfully : ${conn.connection.host}`);
  }).catch((err)=>{
      console.log(`could not connect to database: ${err}`);
  })    
} else if (MONGO_URL) {
  console.log('MONGO_URL is set - using existing connection');
} else {
  console.log('MONGO_URL not set - skipping database connection');
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

export default serverless(app);
