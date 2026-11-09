-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('APPROVED', 'PENDING');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('JAN_APR', 'JUL_OCT');

-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('LEARNING', 'CREDITS');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('ELITE', 'SILVER', 'GOLD', 'TOPPER');

-- CreateEnum
CREATE TYPE "DuplicateAction" AS ENUM ('OVERWRITE', 'ANOTHER');

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "institute" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "session" "Session",
    "semester" INTEGER,
    "purpose" "Purpose",
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "assignmentScore" DOUBLE PRECISION NOT NULL,
    "examScore" DOUBLE PRECISION NOT NULL,
    "overallPercent" DOUBLE PRECISION NOT NULL,
    "hasNumericals" BOOLEAN NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "tier" "Tier",
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "duplicateAction" "DuplicateAction",
    "duplicateId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "keyHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowExpiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("keyHash")
);

-- CreateTable
CREATE TABLE "CourseRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "institute" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Submission_courseId_year_idx" ON "Submission"("courseId", "year");

-- CreateIndex
CREATE INDEX "Submission_email_courseId_idx" ON "Submission"("email", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_email_courseId_attemptNumber_key" ON "Submission"("email", "courseId", "attemptNumber");

-- CreateIndex
CREATE INDEX "Otp_email_createdAt_idx" ON "Otp"("email", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowExpiresAt_idx" ON "RateLimitBucket"("windowExpiresAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

