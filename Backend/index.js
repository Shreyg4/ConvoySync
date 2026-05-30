const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcrypt'); // for hashing
const jwt = require('jsonwebtoken');
const passport = require('passport');
const oauthRoutes = require('./oauth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
const JWT_SECRET = process.env.JWT_SECRET

//generate a token for the user
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
}

//verifies JWT token and attaches to request
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
 
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
 
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });
 
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
 
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

//POST: auth signup
app.post('/auth/signup', async (req, res) => {
  const { email, name, password } = req.body;
 
  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({ 
      error: 'Email, name, and password are required' 
    });
  }
 
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters' 
    });
  }
 
  try {
    // Hash password
    const hash = await bcrypt.hash(password, 10);
 
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: name,
        pwHash: hash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
 
    // Generate JWT token
    const token = generateToken(newUser);
 
    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      token: token
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle duplicate email
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    res.status(400).json({ error: "Could not create user account" });
  }
});

//POST: auth login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
 
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }
 
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
 
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
 
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.pwHash);
 
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
 
    // Generate JWT token
    const token = generateToken(user);
 
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token: token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

//GET: current profile
app.get('/auth/me', authenticateToken, async (req, res) => {
  res.json({
    user: req.user
  });
});

//PUT: update user profile
app.put('/auth/profile', authenticateToken, async (req, res) => {
  const { name } = req.body;
 
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
 
    res.json({
      message: 'Profile updated',
      user: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(400).json({ error: "Could not update profile" });
  }
});

//GET: get party info
app.get('/parties', authenticateToken, async (req, res) => {
  try {
    const parties = await prisma.party.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
 
    res.json({ parties });
  } catch (error) {
    console.error("Get parties error:", error);
    res.status(500).json({ error: "Could not fetch parties" });
  }
});

//POST: create party info
app.post('/parties', authenticateToken, async (req, res) => {
  const { name } = req.body;
 
  if (!name) {
    return res.status(400).json({ error: 'Party name is required' });
  }
 
  try {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
 
    const newParty = await prisma.party.create({
      data: {
        name: name,
        ownerId: req.user.id,
        inviteCode: inviteCode,
        members: {
          create: {
            userId: req.user.id,
            role: 'owner'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
 
    res.status(201).json({
      message: 'Party created',
      party: newParty
    });
  } catch (error) {
    console.error("Create party error:", error);
    res.status(500).json({ error: "Could not create party" });
  }
});

app.use('/oauth', oauthRoutes);




// Stafford's user system
// POST: create a user
app.post('/users', async (req, res) => {
  const { email, name, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: name,
        pwHash: hash,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
      console.error("Database write error:", error);
      res.status(400).json({ error: "Could not create user account" });
  }
});

// GET: retrieve a user
app.get('/users/:userId', async (req, res) => {
  try {
    const id = parseInt(req.params.userId);
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
      console.error("Database read error:", error);
      res.status(400).json({ error: "Could not get user account" });
  }
});

// A simple test route
app.get('/', (req, res) => {
  res.send('ConvoySync Backend is successfully running!');
});

// Render dynamically assigns a port, so we must use process.env.PORT
// const PORT = process.env.PORT || 10000;
const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is awake and listening on port ${PORT} at ${new Date().toLocaleString()} with available endpoints:
  POST   /auth/signup    - Create account
  POST   /auth/login     - Login
  GET    /auth/me        - Get profile    (req auth) 
  PUT    /auth/profile   - Update profile (req auth)
  GET    /parties        - Get parties    (req auth)
  POST   /parties        - Create party   (req auth)
  `);
});