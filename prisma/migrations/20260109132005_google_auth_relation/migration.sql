-- CreateTable
CREATE TABLE "AuthFlow" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AuthFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuthFlowToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AuthFlowToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthFlow_name_key" ON "AuthFlow"("name");

-- CreateIndex
CREATE INDEX "_AuthFlowToUser_B_index" ON "_AuthFlowToUser"("B");

-- AddForeignKey
ALTER TABLE "_AuthFlowToUser" ADD CONSTRAINT "_AuthFlowToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "AuthFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthFlowToUser" ADD CONSTRAINT "_AuthFlowToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
