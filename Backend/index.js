const express = require('express');
// const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcrypt'); // for hashing

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
  console.log(`Server is awake and listening on port ${PORT}`);
});