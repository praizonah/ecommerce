import crypto from "crypto";

// Generate a random reset token
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
};

// Hash the reset token to store in database
export const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
