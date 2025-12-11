/*
  Warnings:

  - You are about to drop the `_ItemCategories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `image` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryName` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ItemCategories" DROP CONSTRAINT "_ItemCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_ItemCategories" DROP CONSTRAINT "_ItemCategories_B_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "categoryName" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ItemCategories";

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
