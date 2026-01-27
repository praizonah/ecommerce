import passport from 'passport';

// Middleware to authenticate using JWT
export const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error', error: err.message });
    }

    if (!user) {
      return res.status(401).json({ 
        message: info?.message || 'Authentication failed. Please provide a valid token.' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to authenticate using local strategy (login)
export const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error', error: err.message });
    }

    if (!user) {
      return res.status(401).json({ 
        message: info?.message || 'Invalid email or password' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Please authenticate first' });
  }
  next();
};

// Middleware to check user authorization by role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Please authenticate first' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role(s): ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if email is confirmed
export const requireEmailConfirmed = (req, res, next) => {
  if (!req.user.isEmailConfirmed) {
    return res.status(403).json({ 
      message: 'Please confirm your email before accessing this resource' 
    });
  }
  next();
};
