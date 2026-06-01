/*
  Warnings:

  - You are about to drop the column `partyId` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the `Party` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartyMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[inviteCode]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Party" DROP CONSTRAINT "Party_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "PartyMember" DROP CONSTRAINT "PartyMember_partyId_fkey";

-- DropForeignKey
ALTER TABLE "PartyMember" DROP CONSTRAINT "PartyMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_partyId_fkey";

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "partyId",
ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Party";

-- DropTable
DROP TABLE "PartyMember";

-- CreateTable
CREATE TABLE "TripMember" (
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMember_pkey" PRIMARY KEY ("tripId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_inviteCode_key" ON "Trip"("inviteCode");

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
