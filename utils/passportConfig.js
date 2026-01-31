import passport from 'passport';
import LocalStrategy from 'passport-local';
import JWTStrategy from 'passport-jwt';
import { User } from '../schemas/userSchemas.js';
import bcrypt from 'bcryptjs';

const JWTExtract = JWTStrategy.ExtractJwt;

// Local Strategy for login (email + password)
passport.use('local', new LocalStrategy.Strategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Incorrect password' });
      }

      // Allow login regardless of email confirmation status
      // Users can still login to confirm their email after registration
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// JWT Strategy for token-based authentication - Initialize lazily
let jwtStrategyInitialized = false;

const initializeJWTStrategy = () => {
  if (jwtStrategyInitialized) {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  if (!jwtSecret) {
    console.warn('⚠️  JWT_SECRET not set - using default. Set JWT_SECRET in production!');
  }

  passport.use('jwt', new JWTStrategy.Strategy(
    {
      jwtFromRequest: JWTExtract.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        if (!user.isEmailConfirmed) {
          return done(null, false, { message: 'Email not confirmed' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  jwtStrategyInitialized = true;
};

// Serialize user for sessions (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export { initializeJWTStrategy };
export default passport;
