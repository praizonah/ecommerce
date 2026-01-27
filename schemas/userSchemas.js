import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"]
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        trim: true,
        isLowercase: true,
        validator: [validator.isEmail, "Please provide a valid email"]
    },
    password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    validate: {
      validator: function (value) {
        // Require at least one special character
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);
      },
      message: "Password should contain at least one special character",
    },
    select: false, // hide password by default when querying
  },
    confirmPassword: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords do not match"
        }
    },
     profilepic: {
        type: String,
        default: "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png"
    },
    role:{
        type: String,
        enum: ["user","admin"],
        default: "user",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailConfirmationToken: String,
    emailConfirmationExpires: Date,
    isEmailConfirmed: {
        type: Boolean,
        default: false
    },
    // Stripe Connect fields for cash out
    stripeConnectId: {
        type: String,
        default: null
    },
    bankAccount: {
        accountHolder: String,
        accountNumber: String,
        routingNumber: String,
        bankName: String
    },
    wallet: {
        balance: {
            type: Number,
            default: 0
        },
        totalEarned: {
            type: Number,
            default: 0
        }
    },
    cashOutRequests: [{
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'pending'
        },
        transferId: String,
        requestedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: Date,
        failureMessage: String
    }]
});

//Hash password before saving
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    this.confirmPassword = undefined;
})

//Compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword,hashedPassword){
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

export const User = mongoose.model('User', userSchema);
