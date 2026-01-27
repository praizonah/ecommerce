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
import { testEmailConfiguration } from "./utils/emailService.js";
import './utils/passportConfig.js';

dotenv.config({path: './config.env'})

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
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport.js
app.use(passport.initialize())
app.use(passport.session())

// logging
app.use(morgan('dev'))

// CORS - allow requests from the dev server hosting static files (Live Server)
// or allow all origins during local development. Adjust in production.
app.use(cors({ origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] }))

// mount API routers
app.use('/api/v1/products', productRouters)
app.use('/api/v1/users', userRouters)
app.use('/api/v1/payments', paymentRouters)
app.use('/api/v1/cashout', cashOutRouters)
app.use('/api/v1/email', emailSetupRouter)

// serve static files from the public directory
app.use(express.static('./public'))

//Connecting to the database
const MONGO_URL = process.env.MONGO_URL
mongoose.connect(MONGO_URL).then((conn)=>{
    console.log(`database connected successfully : ${conn.connection.host}`);
}).catch((err)=>{
    console.log(`could not connect to database: ${err}`);
})    

//Creating a server
const PORT= process.env.PORT
app.listen(PORT, async (err)=>{
    err? console.log(err): console.log(`server is running on port: ${PORT}`)
    
    // Test email configuration on startup
    console.log("\n");
    await testEmailConfiguration();
})