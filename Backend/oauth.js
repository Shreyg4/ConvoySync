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

// --- Helpers for redirecting the token back to the right client ---

// The mobile app (Expo Go / standalone) passes a redirect_uri it can catch
// (e.g. exp://192.168.x.x:8081 or convoysync://). We stash it in the OAuth
// `state` param so the whole flow stays stateless. Providers only ever see the
// BACKEND callback URL, never the exp:// URL -- which is what makes this work
// in Expo Go (Google rejects non-https/exp redirect URIs otherwise).
function encodeState(redirectUri) {
  return Buffer.from(JSON.stringify({ r: redirectUri || '' })).toString('base64url');
}

function decodeState(state) {
  try {
    const { r } = JSON.parse(Buffer.from(String(state), 'base64url').toString());
    return r || null;
  } catch {
    return null;
  }
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Redirect to the app's redirect_uri if one was provided, otherwise fall back
// to the web frontend's /auth/callback page (original behaviour).
function redirectWithToken(res, state, token) {
  const appRedirect = decodeState(state);
  if (appRedirect) {
    const sep = appRedirect.includes('?') ? '&' : '?';
    return res.redirect(`${appRedirect}${sep}token=${token}`);
  }
  return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
}

// Google OAuth routes
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    state: encodeState(req.query.redirect_uri)
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    const token = issueToken(req.user);
    redirectWithToken(res, req.query.state, token);
  }
);

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  passport.authenticate('github', {
    session: false,
    scope: ['user:email'],
    state: encodeState(req.query.redirect_uri)
  })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    const token = issueToken(req.user);
    redirectWithToken(res, req.query.state, token);
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
