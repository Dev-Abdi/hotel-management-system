-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CASHIER', 'WAITER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MPESA', 'CREDIT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD_SUPPLIES', 'DRINKS', 'SALARIES', 'TRANSPORT', 'UTILITIES', 'MAINTENANCE', 'RENT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WAITER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod",
    "description" TEXT,
    "postedById" TEXT NOT NULL,
    "creditCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "totalCredit" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPayment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TIMESTAMP(3) NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "cashSales" INTEGER NOT NULL DEFAULT 0,
    "mpesaSales" INTEGER NOT NULL DEFAULT 0,
    "creditSales" INTEGER NOT NULL DEFAULT 0,
    "totalExpenses" INTEGER NOT NULL DEFAULT 0,
    "actualCash" INTEGER NOT NULL DEFAULT 0,
    "actualMpesa" INTEGER NOT NULL DEFAULT 0,
    "cashDifference" INTEGER NOT NULL DEFAULT 0,
    "mpesaDifference" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "reconciledById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "hotelName" TEXT NOT NULL DEFAULT 'Hotel Management System',
    "hotelPhone" TEXT,
    "hotelEmail" TEXT,
    "hotelAddress" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KSh',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "Sale_postedById_idx" ON "Sale"("postedById");

-- CreateIndex
CREATE INDEX "Sale_creditCustomerId_idx" ON "Sale"("creditCustomerId");

-- CreateIndex
CREATE INDEX "CreditPayment_customerId_idx" ON "CreditPayment"("customerId");

-- CreateIndex
CREATE INDEX "CreditPayment_receivedById_idx" ON "CreditPayment"("receivedById");

-- CreateIndex
CREATE INDEX "CreditPayment_createdAt_idx" ON "CreditPayment"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_recordedById_idx" ON "Expense"("recordedById");

-- CreateIndex
CREATE INDEX "Document_approvedById_idx" ON "Document"("approvedById");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_creditCustomerId_fkey" FOREIGN KEY ("creditCustomerId") REFERENCES "CreditCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CreditCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
