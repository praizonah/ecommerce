import crypto from "crypto";
import { User } from "../schemas/userSchemas.js";

export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailConfirmationToken: hashedToken,
      emailConfirmationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isEmailConfirmed = true;
    user.emailConfirmationToken = undefined;
    user.emailConfirmationExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully 🎉" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};