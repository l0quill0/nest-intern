/*
  Warnings:

  - You are about to drop the column `postOffice` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "postOffice",
ADD COLUMN     "officeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "PostOffice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
