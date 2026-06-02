const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcrypt'); // for hashing
const jwt = require('jsonwebtoken');
const passport = require('passport');
const oauthRoutes = require('./oauth');
const { TripStatus } = require('@prisma/client'); // enum

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

// OAuth routes (Google / GitHub)
app.use('/oauth', oauthRoutes);

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
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email already tied to an existing account',
      });
    }

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
    };

    res.status(200).json(user);
  } catch (error) {
      console.error("Database read error:", error);
      res.status(400).json({ error: "Could not get user account" });
  }
});


// NOTE: MODIFY/REPLACE THIS AFTER AUTH IS IMPLEMENTED
app.post('/users/:userId/trips', async (req, res) => {
  const id = parseInt(req.params.userId);
  const { tripName, tripDate, tripTime } = req.body;

  // need to convert strings to an actual Date
  const convertedDate = new Date(tripDate);
  const convertedTime = new Date(tripTime);

  const combinedDateTime = new Date(convertedDate);

  combinedDateTime.setHours(
    convertedTime.getHours(),
    convertedTime.getMinutes(),
    0,
    0
  );

  function generateInviteCode(length = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
  }

  try {
    let newTrip;

    // if unique constraint fails, try again
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode();

      try {
        newTrip = await prisma.trip.create({
          data: {
            ownerId: id,
            name: tripName,
            inviteCode: code,
            estStart: combinedDateTime,

            itinerary: {
              create: {},
            },

            members: {
              create: {
                userId: id,
                role: "owner"
              },
            },
          },

          include: {
            itinerary: true,
            members: true,
          }
        });

        return res.status(201).json(newTrip);
      } catch (error) {
        if (error.code == "P2002") {
          continue;
        }

        throw error;
      }
    }

    return res.status(500).json({
      error: "Could not generate unique invite code",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: "Could not create trip",
    });
  }
});

// same instructions as above
app.get("/users/:userId/trips", async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const memberships = await prisma.tripMember.findMany({
      where: { userId },
      include: {
        trip: true,
      },
    });

    const trips = memberships.map((membership) => ({
      ...membership.trip,
      role: membership.role,
    }));

    return res.status(200).json(trips);
  } catch (error) {
    console.error("Database read error:", error);
    return res.status(400).json({ error: "Could not get trips" });
  }
});

app.put("/trips/:tripId/itinerary/stops", async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const { startLocation, stops } = req.body;

  if (!Array.isArray(stops)) {
        return res.status(400).json({ error: "stops must be an array" });
  }

  try {
    const createdStops = await prisma.$transaction(async (tx) => {
      if (startLocation) {
        await tx.trip.update({
          where: { id: tripId },
          data: {
            startLocation: {
              create: {
                name: startLocation.name,
                address: startLocation.address,
                latitude: startLocation.lat,
                longitude: startLocation.long,
              },
            },
          },
        });
      }

      const itinerary = await tx.itinerary.findUnique({
        where: { tripId },
      });

      if (!itinerary) {
        throw new Error("ITINERARY_NOT_FOUND");
      }

      await tx.itineraryStop.deleteMany({
        where: { itineraryId: itinerary.id },
      });

      return Promise.all(
        stops.map((stop) =>
          tx.itineraryStop.create({
            data: {
              stopOrder: stop.order,
              eta: new Date(2026, 5, 28), // temp
              itinerary: {
                connect: { id: itinerary.id },
              },
              location: {
                create: {
                  name: stop.location.name,
                  address: stop.location.address,
                  latitude: stop.location.lat,
                  longitude: stop.location.long,
                },
              },
            },
            include: {
              location: true,
            },
          })
        )
      );
    });

    return res.status(200).json(createdStops);
  } catch (error) {
    if (error.message === "ITINERARY_NOT_FOUND") {
      return res.status(404).json({
        error: "Itinerary not found",
      });
    }

    console.error("Replace stops error:", error);
    return res.status(400).json({
      error: "Could not replace itinerary stops",
    });
  }
});

// for retrieving the stops from a specified tripId
app.get("/trips/:tripId/itinerary/stops", async (req, res) => {
  const tripId = parseInt(req.params.tripId);

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        startLocation: true,
        itinerary: {
          include: {
            stops: {
              include: { location: true },
              orderBy: { stopOrder: "asc" },
            },
          },
        },
      },
    });

    if (!trip || !trip.itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    return res.status(200).json({
      startLocation: trip.startLocation,
      stops: trip.itinerary?.stops ?? [],
    });
  } catch (error) {
    console.error("Load stops error:", error);
    return res.status(400).json({ error: "Could not load itinerary stops" });
  }
});

app.get("/trips/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId);

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        startLocation: true,
        members: {
          include: {
            user: true,
          },
        },
        itinerary: {
          include: {
            stops: {
              include: {
                location: true,
              },
              orderBy: {
                stopOrder: "asc",
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Load trip error:", error);
    return res.status(400).json({ error: "Could not load trip" });
  }
});

app.post("/trips/join", async (req, res) => {
  const userId = parseInt(req.body.userId);
  const { inviteCode } = req.body;

  try {
    const trip = await prisma.trip.findUnique({
      where: {
        inviteCode,
      },
    });

    if (!trip) {
      return res.status(404).json({
        error: "Invalid invite code",
      });
    }

    const member = await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        userId,
        role: "member",
      },
    });

    return res.status(201).json({
      trip,
      member,
    });
  } catch (error) {
    console.error("Join trip error:", error);
    return res.status(400).json({ error: "Could not join trip" });
  }
});

// A simple test route
app.get('/', (req, res) => {
  res.send('ConvoySync Backend is successfully running!');
});

// Render dynamically assigns a port via process.env.PORT; fall back to 8080 locally.
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is awake and listening on port ${PORT} at ${new Date().toLocaleString()} with available endpoints:
  POST   /auth/signup           - Create account
  POST   /auth/login            - Login
  GET    /auth/me               - Get profile        (req auth)
  PUT    /auth/profile          - Update profile      (req auth)
  GET    /oauth/google          - Google OAuth start
  GET    /oauth/github          - GitHub OAuth start
  POST   /users                 - Create user
  GET    /users/:userId         - Get user
  POST   /users/:userId/trips   - Create trip
  GET    /users/:userId/trips   - List user trips
  `);
});
