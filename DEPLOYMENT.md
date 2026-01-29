# PRASUFAVIC - Premium Accessories Store

An e-commerce platform built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT and Passport.js
- Product management
- Stripe payment integration
- Email verification and password reset
- Wallet/Cash-out functionality
- Responsive UI with modern styling

## Prerequisites

- Node.js (v16 or higher)
- npm
- MongoDB Atlas account
- Stripe account
- Email service credentials (Gmail/SendGrid)

## Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ecommerce
npm install
```

### 2. Environment Variables

Create a `config.env` file in the root directory with the following variables:

```env
PORT = 4000
MONGO_URL = your_mongodb_connection_string
PASSWS = your_password
JWT_SECRET = your_jwt_secret
JWT_EXPIRES_IN = 7d
EMAIL_USER = your_email@gmail.com
EMAIL_PASSWORD = your_app_password
FRONTEND_URL = http://localhost:5500
STRIPE_PUBLIC_KEY = your_stripe_public_key
STRIPE_SECRET_KEY = your_stripe_secret_key
STRIPE_WEBHOOK_SECRET = your_webhook_secret
RESEND_API_KEY = your_resend_api_key
EMAILJS_SERVICE_ID = your_emailjs_service_id
EMAILJS_TEMPLATE_ID = your_emailjs_template_id
EMAILJS_PUBLIC_KEY = your_emailjs_public_key
EMAILJS_PRIVATE_KEY = your_emailjs_private_key
```

### 3. Run Locally

```bash
npm run dev
```

The application will start on `http://localhost:4000` and serve `index.html` as the home page.

---

## Vercel Deployment

This project is configured for easy deployment to Vercel.

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Accept the default settings

3. **Add Environment Variables**
   - In Vercel Dashboard, go to Settings → Environment Variables
   - Add all variables from `config.env`:
     - MONGO_URL
     - PASSWS
     - JWT_SECRET
     - JWT_EXPIRES_IN
     - EMAIL_USER
     - EMAIL_PASSWORD
     - FRONTEND_URL (set to your Vercel URL)
     - STRIPE_PUBLIC_KEY
     - STRIPE_SECRET_KEY
     - STRIPE_WEBHOOK_SECRET
     - RESEND_API_KEY
     - EMAILJS_SERVICE_ID
     - EMAILJS_TEMPLATE_ID
     - EMAILJS_PUBLIC_KEY
     - EMAILJS_PRIVATE_KEY

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### What's Configured for Vercel

- **vercel.json**: Configuration file with build settings, rewrites, and environment variables
- **api/index.js**: Serverless function that runs your Express app
- **package.json**: Updated scripts for Vercel deployment
- **.vercelignore**: Files to exclude from deployment

### Features After Deployment

- ✅ `index.html` served as the home page
- ✅ API routes work at `/api/v1/*`
- ✅ Static files served from `public/` directory
- ✅ Client-side routing supported with catch-all rewrites
- ✅ CORS configured for Vercel deployment
- ✅ Health check endpoint at `/health`

---

## Project Structure

```
ecommerce/
├── api/
│   └── index.js              # Vercel serverless function
├── controllers/
│   ├── userController.js
│   ├── productsControllers.js
│   ├── paymentController.js
│   ├── cashOutController.js
│   └── emailVerificationController.js
├── public/
│   ├── index.html            # Home page
│   ├── login.html
│   ├── register.html
│   ├── checkout.html
│   ├── payment-success.html
│   └── ...
├── routers/
│   ├── userRouters.js
│   ├── productRouters.js
│   ├── paymentRouters.js
│   ├── cashOutRouters.js
│   └── emailSetupRouter.js
├── schemas/
│   ├── userSchemas.js
│   └── productSchema.js
├── utils/
│   ├── emailService.js
│   ├── emailTransport.js
│   ├── jwtauthentication.js
│   ├── passportConfig.js
│   └── tokenUtils.js
├── config.env                # Environment variables (don't commit!)
├── index.js                  # Local development entry point
├── package.json
├── vercel.json              # Vercel configuration
├── .vercelignore
└── README.md
```

---

## API Endpoints

### Products
- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)

### Users
- `POST /api/v1/users/register` - Register user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/profile` - Get user profile (auth required)
- `POST /api/v1/users/logout` - Logout user

### Payments
- `POST /api/v1/payments/create-checkout` - Create checkout session
- `POST /api/v1/payments/webhook` - Stripe webhook

### Email
- `POST /api/v1/email/send-verification` - Send verification email
- `POST /api/v1/email/verify-email` - Verify email token

### Cash Out
- `POST /api/v1/cashout/request` - Request cash out
- `GET /api/v1/cashout/history` - Get cash out history

---

## Troubleshooting

### CORS Errors
Update the `FRONTEND_URL` environment variable to match your Vercel deployment URL.

### Database Connection Issues
Ensure your MongoDB connection string is correct and IP whitelist includes Vercel's IP addresses (or allow all IPs: `0.0.0.0/0`).

### Static Files Not Loading
Make sure all static files are in the `public/` directory and the file paths are correct.

### Environment Variables Not Found
1. Verify all variables are added in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names exactly match the code

---

## Development Tips

- Use `npm run dev` for local development with hot-reload
- Use `.env` file locally (don't commit to Git)
- Test Stripe webhooks locally with `stripe listen`
- Monitor MongoDB Atlas for connection issues

---

## License

ISC

## Author

Praizonah
