const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg') // bridges prisma to pg driver (so an "adapter")
const { Pool } = require('pg'); // actual Node Postgres driver

// connection init, driver
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool); // driver-to-prisma

const prisma = new PrismaClient({ adapter }); // pass our adapter to the client, so we know how to communicate

module.exports = prisma; // commonjs notation export

// TODO: Need DB password