sendConfirmationEmail(newUser.email, confirmationToken, newUser.name)


import { emailTransporter } from "./emailTransport.js";

export const sendConfirmationEmail = async (email, token, name) => {
  try {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await emailTransporter.sendMail({
      from: `"My App 🚀" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hey ${name} 👋</h2>
          <p>Thanks for registering!</p>
          <p>Please confirm your email by clicking the button below:</p>

          <a href="${verificationLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#4CAF50;
              color:#fff;
              text-decoration:none;
              border-radius:5px;
              margin-top:10px;
            ">
            Verify Email
          </a>

          <p style="margin-top:20px;">
            This link will expire in <strong>24 hours</strong>.
          </p>

          <p>If you didn’t create this account, just ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false };
  }
};