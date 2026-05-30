const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const prisma = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.BACKEND_URL}/oauth/google/callback`,
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    const name = profile.displayName;

                    let user = await prisma.user.findUnique({
                        where: {email: email}
                    });
                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: email,
                                name: name,
                                pwHash: ''
                            }
                        });
                    }
                    return done(null, user);
                }   catch  (error) {
                    return done(error, null);
                }
            }
        )
    );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
        new GitHubStrategy(
            {       
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/oauth/github/callback`,
            scope: ['user:email']                     
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    const name = profile.displayName || profile.username;

                    let user = await prisma.user.findUnique({
                        where: {email: email}
                    });
                    if (!user){
                        user = await prisma.user.create({
                            data: {
                                email: email,
                                name: name,
                                pwHash: ''
                            }
                        });
                    }
                    return done(null, user);
                }   catch(error){
                    return done(error, null);
                }
            }
        )
    );
}

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    session: false,
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` 
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { 
    session: false,
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` 
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

router.get('/providers', (req, res) => {
  res.json({
    providers: {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    }
  });
});

module.exports = router;
