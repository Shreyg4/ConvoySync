# ConvoySync

ConvoySync is a mobile app for coordinating group road trips ("convoys"). One person
creates a trip, shares an invite code, and the group plans a shared multi-stop
itinerary on a map. Everyone can then open live directions and turn-by-turn navigation
toward the next stop.

The project is a JavaScript/TypeScript stack:

- **Frontend** — a React Native app built with [Expo](https://expo.dev) (file-based
  routing via Expo Router). UI is written in JSX/TSX with React Native `StyleSheet`
  (the React-Native equivalents of HTML and CSS).
- **Backend** — a [Node.js](https://nodejs.org) + [Express](https://expressjs.com)
  REST API using [Prisma](https://www.prisma.io) over a PostgreSQL database, with JWT
  auth and Google/GitHub OAuth.

---

## Prerequisites

- **Node.js 18+** (developed on Node 24) and npm
- The **[Expo Go](https://expo.dev/go)** app on your phone (or an iOS/Android simulator)
- A **Google Maps API key** with the *Places API and Directions API* enabled (used by the map and
  place-search screens)

The backend is already deployed on Render, so you don't need a database or any
backend setup to run the app.

---

## Quick start

```bash
cd Frontend/convoysync
npm install
cp .env.example .env        # then set the two values below
npx expo start --go         # scan the QR code with Expo Go (or press i / a / w)
```

In `.env`, set:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL — `https://convoysync.onrender.com` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps key (Places API + Directions API enabled) |

From the Expo dev server, scan the QR code. It opens a page prompting you to choose
between **Development build** and **Expo Go** — choose **Expo Go** (the app takes a few
seconds to bundle and load). You can also press `i` for an iOS simulator, `a` for an
Android emulator, or `w` for web.

---

## Walkthrough

With the app running (`npx expo start`):

1. **Create an account** — open the app → *Create Account* → register. You're signed
   in automatically and land on *My Journeys*.
2. **Create a trip** — tap *+ Plan New Adventure*, give it a name, date, and start
   time. You'll see the trip's **invite code**.
3. **Plan the itinerary** — open the trip → *Edit Itinerary* → set a start location,
   a destination, and up to four extra stops using place search → *Save Trip*. The
   stops appear on the trip's timeline.
4. **Directions & navigation** — from the trip, tap *Directions* to see the route, or
   *Start Trip* for live turn-by-turn navigation.
5. **Join from a second account** — register a different account on another device (or
   log out and make one), tap the *Join* tab, and enter the invite code to join the
   same trip.
6. **Log out** — *Settings* → *Log out* clears the stored session.

---

## Roadmap & known limitations

These features were **part of our original design** — the database schema was built to
support them from the start — but they were **scoped out of the MVP** so we could ship a
solid, working core (auth, trip creation/joining, collaborative itinerary planning, and
live navigation). They are intentional next steps, not abandoned work:

- **Live member status sharing.** The schema already models this with the
  `MemberTripStatus` table (per-member location, ETA, and status like `ENROUTE`/`ARRIVED`).
  The plan is to broadcast each member's position so the whole convoy can see one another
  on the map in real time. The data model is ready; the API endpoints and UI are not yet
  wired up.
- **Reroute voting.** Modeled by the `RerouteRequest` and `RerouteVote` tables — a member
  proposes a detour/new stop, the group votes, and the itinerary updates on a majority.
  Again, the schema is in place; the voting flow is future work.
- **Computed ETAs.** Itinerary stop ETAs are currently placeholder values. The intended
  implementation derives them from the Google Directions API already used on the
  navigation screen.

We deliberately designed the data model to accommodate all of the above so these features
can be layered on without reworking the schema — we simply could not get to them within
the MVP timeframe.

---
