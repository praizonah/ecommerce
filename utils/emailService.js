import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config({ path: "./config.env" });

// EmailJS Configuration
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_6q301ys";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_confirmation";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "GIhVMfmfPiVw3o40X";

// Configure Resend API
const resend = new Resend(process.env.RESEND_API_KEY || "re_WM9q9DWV_GjVg38Hjo1oVHZ7NmXLwEDYh");

// Configure Nodemailer for Gmail with enhanced security
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Add these settings for better reliability
  pool: {
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 20000,
    rateLimit: true,
  },
  secure: true,
  tls: {
    rejectUnauthorized: true,
  },
  socketTimeout: 5 * 60 * 1000, // 5 minutes
  connectionTimeout: 5 * 1000,  // 5 seconds
});

// In development mode, log tokens to console for testing
const isDevelopment = process.env.NODE_ENV !== 'production';

// Function to send email via EmailJS
const sendEmailViaEmailJS = async (toEmail, toName, subject, confirmationLink) => {
  console.log('🔧 [INIT] sendEmailViaEmailJS called');
  try {
    console.log('🔧 [TRACE] About to log EmailJS details');
    console.log('\n' + '='.repeat(70));
    console.log('📧 EMAILJS EMAIL SENDING');
    console.log('='.repeat(70));
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('To Email:', toEmail);
    console.log('To Name:', toName);
    console.log('Subject:', subject);
    console.log('Link:', confirmationLink);
    
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        to_name: toName,
        subject: subject,
        confirmation_link: confirmationLink,
        confirmation_url: confirmationLink
      }
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('EmailJS Response Status:', response.status);
    console.log('EmailJS Response Body:', responseText);
    console.log('='.repeat(70));

    if (response.ok) {
      console.log("✅ Email sent successfully via EmailJS to:", toEmail);
      return { success: true, provider: 'emailjs' };
    } else {
      // Try to parse as JSON
      try {
        const result = JSON.parse(responseText);
        throw new Error(`EmailJS Error (${response.status}): ${result.message || responseText}`);
      } catch (parseErr) {
        throw new Error(`EmailJS Error (${response.status}): ${responseText}`);
      }
    }
  } catch (err) {
    console.error("❌ EmailJS error:", err.message);
    throw err;
  }
};

// Function to send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    // Create the reset link (adjust the URL to match your frontend)
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5500"}/reset-password.html?token=${resetToken}`;

    const emailContent = {
      from: process.env.EMAIL_USER || "noreply@resend.dev",
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
            <h2 style="margin: 0;">Password Reset Request</h2>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px;">Or copy and paste this link in your browser:</p>
            <p style="font-size: 12px; color: #4CAF50; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${resetLink}</p>
            
            <div style="background: #ffe6e6; border-left: 4px solid #ff6b6b; padding: 12px; border-radius: 3px; margin-top: 20px;">
              <p style="font-size: 12px; color: #c53030; margin: 0;">
                <strong>Important:</strong> This password reset link will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact our support team immediately.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Best regards,<br>
              <strong>The Support Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    // Try Resend API first
    try {
      const resendResult = await resend.emails.send(emailContent);
      console.log("✅ Password reset email sent via Resend:", resendResult);
      return { success: true, message: "Password reset email sent successfully via Resend", provider: "resend" };
    } catch (resendError) {
      console.warn("⚠️ Resend failed, falling back to Nodemailer:", resendError.message);
      
      // Fallback to Nodemailer
      const mailOptions = {
        ...emailContent,
        from: process.env.EMAIL_USER,
      };
      
      await transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent via Nodemailer");
      return { success: true, message: "Password reset email sent successfully via Nodemailer", provider: "nodemailer" };
    }
  } catch (err) {
    console.error("❌ Error sending password reset email:", err);
    return { success: false, message: err.message };
  }
};

// Function to verify transporter connection (optional)
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (err) {
    console.error("Email service error:", err);
    return false;
  }
};

// Function to send email confirmation (using EmailJS as primary)
export const sendConfirmationEmail = async (email, confirmationToken, userName) => {
  console.log('\n🔧 [INIT] sendConfirmationEmail called with email:', email);
  try {
    // Create the confirmation link
    const confirmationLink = `${process.env.FRONTEND_URL || "http://localhost:5500"}/confirm-email.html?token=${confirmationToken}`;

    // Try EmailJS first
    try {
      console.log('🔧 [TRACE] About to call sendEmailViaEmailJS');
      await sendEmailViaEmailJS(email, userName, "Confirm Your Email Address", confirmationLink);
      console.log("✅ Confirmation email sent via EmailJS to:", email);
      return { success: true, message: "Confirmation email sent successfully via EmailJS", provider: "emailjs" };
    } catch (emailJSError) {
      console.warn("⚠️ EmailJS failed with error:", emailJSError.message);
      console.error("📌 Full error object:", emailJSError);
      
      // Fallback: Try Resend API
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;">Email Verification Required</h2>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
              <p style="font-size: 14px; color: #666; line-height: 1.6;">Thank you for registering with us! To complete your signup, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationLink}" style="background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px;">Or copy and paste this link in your browser:</p>
              <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${confirmationLink}</p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 3px; margin-top: 20px;">
                <p style="font-size: 12px; color: #856404; margin: 0;">
                  <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email or contact our support team.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                Best regards,<br>
                <strong>The Support Team</strong>
              </p>
            </div>
          </div>
        `;

        const resendResult = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Confirm Your Email Address",
          html: htmlContent,
        });
        
        if (resendResult.error) {
          throw new Error(resendResult.error.message);
        }
        
        console.log("✅ Confirmation email sent via Resend:", email);
        return { success: true, message: "Confirmation email sent successfully via Resend", provider: "resend" };
      } catch (resendError) {
        console.error("❌ Resend failed:", resendError.message);
        
        // Fallback: Development mode - log token
        if (isDevelopment) {
          console.log("\n📧 DEVELOPMENT MODE - Email Verification Token:");
          console.log("━".repeat(70));
          console.log(`📧 Email: ${email}`);
          console.log(`👤 Name: ${userName}`);
          console.log(`🔐 Token: ${confirmationToken}`);
          console.log(`🔗 Link: ${confirmationLink}`);
          console.log("━".repeat(70));
          
          return { 
            success: true, 
            message: "Email sent (development mode - check server console)", 
            provider: "development", 
            token: confirmationToken 
          };
        }
        
        throw resendError;
      }
    }
  } catch (err) {
    console.error("❌ Error sending confirmation email:", err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Send Email Verification Token via Nodemailer (Gmail)
 * This is a dedicated function for email verification on user registration
 * 
 * @param {string} email - Recipient email address
 * @param {string} verificationToken - The verification token
 * @param {string} userName - User's name for personalization
 * @returns {Promise<Object>} - Success status and message
 */
export const sendEmailVerificationToken = async (email, verificationToken, userName) => {
  try {
    // Create verification link
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5500"}/confirm-email.html?token=${verificationToken}`;

    // Email template with professional styling
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .email-container { max-width: 600px; margin: 30px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 20px; color: #333; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .description { font-size: 14px; color: #666; line-height: 1.8; margin-bottom: 30px; }
          .cta-button { text-align: center; margin: 40px 0; }
          .cta-button a { display: inline-block; background-color: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; }
          .cta-button a:hover { background-color: #764ba2; }
          .token-info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 30px 0; border-left: 4px solid #667eea; }
          .token-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .token-value { font-family: 'Courier New', monospace; font-size: 13px; color: #667eea; word-break: break-all; }
          .link-text { font-size: 12px; color: #999; margin-top: 20px; }
          .link-url { background-color: #f9f9f9; padding: 10px; border-radius: 3px; word-break: break-all; font-size: 11px; color: #667eea; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 3px; margin: 20px 0; }
          .warning-text { font-size: 12px; color: #856404; margin: 0; }
          .footer { text-align: center; padding: 30px 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          .footer p { margin: 5px 0; }
          .expiry-info { color: #d32f2f; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <h1>✉️ Verify Your Email Address</h1>
          </div>

          <!-- Main Content -->
          <div class="content">
            <p class="greeting">Hi <strong>${userName}</strong>,</p>
            
            <p class="description">
              Thank you for creating an account with us! To complete your registration and unlock all features, 
              please verify your email address by clicking the button below:
            </p>

            <!-- CTA Button -->
            <div class="cta-button">
              <a href="${verificationLink}">Verify Your Email</a>
            </div>

            <!-- Token Information -->
            <div class="token-info">
              <div class="token-label">Verification Token</div>
              <div class="token-value">${verificationToken}</div>
            </div>

            <!-- Link Alternative -->
            <p class="link-text">Or copy and paste this verification link in your browser:</p>
            <div class="link-url">${verificationLink}</div>

            <!-- Warning -->
            <div class="warning">
              <p class="warning-text">
                <strong>⏱️ Important:</strong> This verification link will expire in <span class="expiry-info">24 hours</span>. 
                If you didn't create this account, please ignore this email or contact our support team immediately.
              </p>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 30px;">
              If you're having trouble clicking the button, copy and paste the link above into your web browser.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>The Support Team</strong></p>
            <p>If you have any questions, don't hesitate to reach out to us.</p>
            <p style="margin-top: 15px; font-size: 10px; color: #bbb;">© 2026 All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Nodemailer
    const mailOptions = {
      from: `"${process.env.SENDER_NAME || 'Support Team'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Email Address - Action Required",
      html: htmlTemplate,
      text: `Hi ${userName},\n\nThank you for creating an account! Please verify your email using this token: ${verificationToken}\n\nVerification link: ${verificationLink}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe Support Team`,
      priority: 'high',
      headers: {
        'X-Priority': '1 (Highest)',
        'Importance': 'high',
        'X-MSMail-Priority': 'High',
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log("\n✅ Email Verification Sent Successfully");
    console.log("═".repeat(70));
    console.log(`📧 To: ${email}`);
    console.log(`👤 Name: ${userName}`);
    console.log(`📨 Response ID: ${info.response}`);
    console.log(`🔗 Link: ${verificationLink}`);
    console.log("═".repeat(70));

    return {
      success: true,
      message: "Email verification sent successfully",
      provider: "nodemailer",
      email: email,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("\n❌ Error sending email verification:");
    console.error("Error Type:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error Response:", error.response);
    
    // Log for debugging
    if (error.code === 'EAUTH') {
      console.error("⚠️ Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in config.env");
      console.error("💡 If using Gmail, ensure you have 'App Passwords' enabled (not regular password)");
    } else if (error.code === 'ESOCKET') {
      console.error("⚠️ Socket error. Check your internet connection or Gmail SMTP settings");
    }

    return {
      success: false,
      message: `Failed to send verification email: ${error.message}`,
      provider: "nodemailer",
      error: error.code,
    };
  }
};

/**
 * Verify Nodemailer Configuration
 * Call this on application startup to ensure email service is ready
 */
export const testEmailConfiguration = async () => {
  try {
    console.log("\n🧪 Testing Email Configuration...");
    console.log("─".repeat(70));
    
    await transporter.verify();
    
    console.log("✅ Email service is properly configured and ready to use");
    console.log("📧 Email: " + process.env.EMAIL_USER);
    console.log("─".repeat(70));
    return true;
  } catch (error) {
    console.error("\n❌ Email service configuration error:");
    console.error("Error:", error.message);
    console.error("─".repeat(70));
    
    if (error.code === 'EAUTH') {
      console.error("\n💡 TROUBLESHOOTING:");
      console.error("   1. Verify EMAIL_USER and EMAIL_PASSWORD in config.env");
      console.error("   2. For Gmail: Create an 'App Password' (not regular password)");
      console.error("   3. Steps: gmail.com → Account → Security → App Passwords");
      console.error("   4. Allow 'Less secure apps' if using basic Gmail password");
    }
    
    return false;
  }
};
