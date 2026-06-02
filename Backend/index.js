const express = require('express');
// const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcrypt'); // for hashing
const { TripStatus } = require('@prisma/client'); // enum

const app = express();

// Middleware
// app.use(cors());
app.use(express.json());


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

// POST: login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Invalid email or password"
      });
    }

    const check = await bcrypt.compare(
      password,
      user.pwHash
    );

    if (!check) {
      return res.status(404).json({
        error: "Invalid email or password"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Database read error:", error);
    res.status(400).json({ error: "Could not complete GET request" });
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

// Create a party
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

// A simple test route
app.get('/', (req, res) => {
  res.send('ConvoySync Backend is successfully running!');
});

// Render dynamically assigns a port, so we must use process.env.PORT
// const PORT = process.env.PORT || 10000;
const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is awake and listening on port ${PORT}`);
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