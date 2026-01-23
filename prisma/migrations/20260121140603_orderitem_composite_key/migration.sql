/*
  Warnings:

  - A unique constraint covering the columns `[itemId,orderId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_itemId_orderId_key" ON "OrderItem"("itemId", "orderId");
