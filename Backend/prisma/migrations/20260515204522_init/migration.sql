-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ENROUTE', 'DELAYED', 'STOPPED', 'ARRIVED');

-- CreateEnum
CREATE TYPE "RerouteStatus" AS ENUM ('ACCEPTED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "Vote" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryStop" (
    "id" SERIAL NOT NULL,
    "itineraryId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "eta" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberTripStatus" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "stopId" INTEGER,
    "status" "MemberStatus" NOT NULL,
    "currentLat" DOUBLE PRECISION,
    "currentLong" DOUBLE PRECISION,
    "eta" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberTripStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RerouteRequest" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "locId" INTEGER NOT NULL,
    "status" "RerouteStatus" NOT NULL DEFAULT 'PENDING',
    "etaImpact" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RerouteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RerouteVote" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "vote" "Vote" NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RerouteVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_tripId_key" ON "Itinerary"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberTripStatus_tripId_userId_key" ON "MemberTripStatus"("tripId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RerouteVote_requestId_userId_key" ON "RerouteVote"("requestId", "userId");

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTripStatus" ADD CONSTRAINT "MemberTripStatus_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTripStatus" ADD CONSTRAINT "MemberTripStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTripStatus" ADD CONSTRAINT "MemberTripStatus_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "ItineraryStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerouteRequest" ADD CONSTRAINT "RerouteRequest_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerouteRequest" ADD CONSTRAINT "RerouteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerouteRequest" ADD CONSTRAINT "RerouteRequest_locId_fkey" FOREIGN KEY ("locId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerouteVote" ADD CONSTRAINT "RerouteVote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RerouteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerouteVote" ADD CONSTRAINT "RerouteVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
