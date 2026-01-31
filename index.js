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
import './utils/passportConfig.js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config.env only if it exists (local development)
try {
  dotenv.config({path: path.join(__dirname, 'config.env')});
} catch (err) {
  // config.env not found - continue without it
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
app.use(session({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Allow cross-site cookies for development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport.js
app.use(passport.initialize())
app.use(passport.session())

// logging
app.use(morgan('dev'))

// CORS - Updated for Render deployment
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'
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
mongoose.connect(MONGO_URL).then((conn)=>{
    console.log(`database connected successfully : ${conn.connection.host}`);
}).catch((err)=>{
    console.log(`could not connect to database: ${err}`);
})    

//Creating a server
const PORT= process.env.PORT || 4000
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
    err? console.log(err): console.log(`server is running on port: ${PORT}`)
    
    // Test email configuration on startup
    console.log("\n");
    await testEmailConfiguration();
})

