-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MERCHANT', 'STAFF');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "RugStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('WIDGET_OPENED', 'AR_STARTED', 'VIEW_3D', 'PRODUCT_VIEWED', 'ADDED_TO_CART', 'PURCHASED', 'SHARED');

-- CreateEnum
CREATE TYPE "AiScanType" AS ENUM ('ROOM_DETECTION', 'FLOOR_DETECTION', 'COLOR_MATCH', 'RECOMMENDATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "merchantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "productLimit" INTEGER NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "currentStart" TIMESTAMP(3) NOT NULL,
    "currentEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rugs" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "widthCm" INTEGER NOT NULL,
    "lengthCm" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "colors" TEXT[],
    "coverImage" TEXT,
    "model3dUrl" TEXT,
    "status" "RugStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_settings" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "buttonColor" TEXT DEFAULT '#111827',
    "buttonText" TEXT DEFAULT 'Odamda Gor',
    "borderRadius" INTEGER DEFAULT 9999,
    "logoUrl" TEXT,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "rugId" TEXT,
    "userId" TEXT,
    "eventType" "AnalyticsEventType" NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "userId" TEXT,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_scans" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "rugId" TEXT,
    "scanType" "AiScanType" NOT NULL,
    "inputImageUrl" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_slug_key" ON "merchants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_userId_key" ON "staff_members"("userId");

-- CreateIndex
CREATE INDEX "staff_members_merchantId_idx" ON "staff_members"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_merchantId_key" ON "subscriptions"("merchantId");

-- CreateIndex
CREATE INDEX "rugs_merchantId_idx" ON "rugs"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "rugs_merchantId_sku_key" ON "rugs"("merchantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "rugs_merchantId_slug_key" ON "rugs"("merchantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "widget_settings_merchantId_key" ON "widget_settings"("merchantId");

-- CreateIndex
CREATE INDEX "analytics_events_merchantId_eventType_occurredAt_idx" ON "analytics_events"("merchantId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_rugId_idx" ON "analytics_events"("rugId");

-- CreateIndex
CREATE INDEX "domains_host_idx" ON "domains"("host");

-- CreateIndex
CREATE UNIQUE INDEX "domains_merchantId_host_key" ON "domains"("merchantId", "host");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_merchantId_idx" ON "api_keys"("merchantId");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "ai_scans_merchantId_scanType_createdAt_idx" ON "ai_scans"("merchantId", "scanType", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rugs" ADD CONSTRAINT "rugs_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_settings" ADD CONSTRAINT "widget_settings_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_rugId_fkey" FOREIGN KEY ("rugId") REFERENCES "rugs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_scans" ADD CONSTRAINT "ai_scans_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
