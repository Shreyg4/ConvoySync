-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "startLocationId" INTEGER;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_startLocationId_fkey" FOREIGN KEY ("startLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
