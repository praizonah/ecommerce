import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import morgan from "morgan"
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
import { testEmailConfiguration } from "../utils/emailService.js";
import '../utils/passportConfig.js';
import serverless from 'serverless-http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport.js
app.use(passport.initialize())
app.use(passport.session())

// logging
app.use(morgan('dev'))

// CORS - Updated for Vercel deployment
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }))

// mount API routers
app.use('/api/v1/products', productRouters)
app.use('/api/v1/users', userRouters)
app.use('/api/v1/payments', paymentRouters)
app.use('/api/v1/cashout', cashOutRouters)
app.use('/api/v1/email', emailSetupRouter)

// serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route - serve index.html for client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
// Fallback for all other routes - serve index.html for SPA
app.use((req, res, next) => {
  // Only handle GET requests that are not API calls
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

//Connecting to the database (only if MONGO_URL is set)
const MONGO_URL = process.env.MONGO_URL
if (MONGO_URL) {
  mongoose.connect(MONGO_URL).then((conn)=>{
      console.log(`database connected successfully : ${conn.connection.host}`);
  }).catch((err)=>{
      console.log(`could not connect to database: ${err}`);
  })    
} else {
  console.log('MONGO_URL not set - skipping database connection');
}

export default serverless(app);
