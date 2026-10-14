-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "localDate" TEXT,
    "parentId" TEXT,
    "exerciseSlug" TEXT,
    "revision" INTEGER NOT NULL,
    "lastOperationId" TEXT NOT NULL,
    "deletedAt" TEXT
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "localDate" TEXT,
    "parentId" TEXT,
    "exerciseSlug" TEXT,
    "revision" INTEGER NOT NULL,
    "lastOperationId" TEXT NOT NULL,
    "deletedAt" TEXT
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "localDate" TEXT,
    "parentId" TEXT,
    "exerciseSlug" TEXT,
    "revision" INTEGER NOT NULL,
    "lastOperationId" TEXT NOT NULL,
    "deletedAt" TEXT
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "localDate" TEXT,
    "parentId" TEXT,
    "exerciseSlug" TEXT,
    "revision" INTEGER NOT NULL,
    "lastOperationId" TEXT NOT NULL,
    "deletedAt" TEXT
);

-- CreateTable
CREATE TABLE "BodyWeightEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "localDate" TEXT,
    "parentId" TEXT,
    "exerciseSlug" TEXT,
    "revision" INTEGER NOT NULL,
    "lastOperationId" TEXT NOT NULL,
    "deletedAt" TEXT
);

-- CreateTable
CREATE TABLE "SyncReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "resultRevision" INTEGER NOT NULL,
    "resultPayload" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Exercise" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "payload" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PlanTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "revision" INTEGER NOT NULL,
    "payload" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PlanExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "payload" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "UserSettings_userId_localDate_idx" ON "UserSettings"("userId", "localDate");

-- CreateIndex
CREATE INDEX "UserSettings_userId_exerciseSlug_localDate_idx" ON "UserSettings"("userId", "exerciseSlug", "localDate");

-- CreateIndex
CREATE INDEX "UserSettings_parentId_idx" ON "UserSettings"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_localDate_idx" ON "WorkoutSession"("userId", "localDate");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_exerciseSlug_localDate_idx" ON "WorkoutSession"("userId", "exerciseSlug", "localDate");

-- CreateIndex
CREATE INDEX "WorkoutSession_parentId_idx" ON "WorkoutSession"("parentId");

-- CreateIndex
CREATE INDEX "SessionExercise_userId_localDate_idx" ON "SessionExercise"("userId", "localDate");

-- CreateIndex
CREATE INDEX "SessionExercise_userId_exerciseSlug_localDate_idx" ON "SessionExercise"("userId", "exerciseSlug", "localDate");

-- CreateIndex
CREATE INDEX "SessionExercise_parentId_idx" ON "SessionExercise"("parentId");

-- CreateIndex
CREATE INDEX "WorkoutSet_userId_localDate_idx" ON "WorkoutSet"("userId", "localDate");

-- CreateIndex
CREATE INDEX "WorkoutSet_userId_exerciseSlug_localDate_idx" ON "WorkoutSet"("userId", "exerciseSlug", "localDate");

-- CreateIndex
CREATE INDEX "WorkoutSet_parentId_idx" ON "WorkoutSet"("parentId");

-- CreateIndex
CREATE INDEX "BodyWeightEntry_userId_localDate_idx" ON "BodyWeightEntry"("userId", "localDate");

-- CreateIndex
CREATE INDEX "BodyWeightEntry_userId_exerciseSlug_localDate_idx" ON "BodyWeightEntry"("userId", "exerciseSlug", "localDate");

-- CreateIndex
CREATE INDEX "BodyWeightEntry_parentId_idx" ON "BodyWeightEntry"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeightEntry_userId_localDate_key" ON "BodyWeightEntry"("userId", "localDate");

-- CreateIndex
CREATE INDEX "SyncReceipt_userId_createdAt_idx" ON "SyncReceipt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncReceipt_userId_operationId_key" ON "SyncReceipt"("userId", "operationId");

-- CreateIndex
CREATE INDEX "PlanExercise_templateId_order_idx" ON "PlanExercise"("templateId", "order");
