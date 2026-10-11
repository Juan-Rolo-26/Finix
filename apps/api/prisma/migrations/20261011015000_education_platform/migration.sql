-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EducationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "EducationCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationSubcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "level" "EducationLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "EducationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "order" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "formula" TEXT,
    "interactiveWidget" TEXT,
    "keyTakeaways" JSONB,
    "commonMistakes" JSONB,
    "prosCons" JSONB,
    "practicalExample" TEXT,
    "sources" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationArticleRelation" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "EducationArticleRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLearningPath" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "EducationLevel" NOT NULL DEFAULT 'BEGINNER',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLearningPathItem" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EducationLearningPathItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationUserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationUserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationCategory_slug_key" ON "EducationCategory"("slug");

-- CreateIndex
CREATE INDEX "EducationCategory_order_idx" ON "EducationCategory"("order");

-- CreateIndex
CREATE INDEX "EducationCategory_slug_idx" ON "EducationCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EducationSubcategory_slug_key" ON "EducationSubcategory"("slug");

-- CreateIndex
CREATE INDEX "EducationSubcategory_categoryId_idx" ON "EducationSubcategory"("categoryId");

-- CreateIndex
CREATE INDEX "EducationSubcategory_order_idx" ON "EducationSubcategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "EducationArticle_slug_key" ON "EducationArticle"("slug");

-- CreateIndex
CREATE INDEX "EducationArticle_slug_idx" ON "EducationArticle"("slug");

-- CreateIndex
CREATE INDEX "EducationArticle_categoryId_idx" ON "EducationArticle"("categoryId");

-- CreateIndex
CREATE INDEX "EducationArticle_subcategoryId_idx" ON "EducationArticle"("subcategoryId");

-- CreateIndex
CREATE INDEX "EducationArticle_status_idx" ON "EducationArticle"("status");

-- CreateIndex
CREATE INDEX "EducationArticle_level_idx" ON "EducationArticle"("level");

-- CreateIndex
CREATE INDEX "EducationArticle_isFeatured_idx" ON "EducationArticle"("isFeatured");

-- CreateIndex
CREATE INDEX "EducationArticle_order_idx" ON "EducationArticle"("order");

-- CreateIndex
CREATE INDEX "EducationArticleRelation_sourceId_idx" ON "EducationArticleRelation"("sourceId");

-- CreateIndex
CREATE INDEX "EducationArticleRelation_targetId_idx" ON "EducationArticleRelation"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "EducationArticleRelation_sourceId_targetId_key" ON "EducationArticleRelation"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLearningPath_slug_key" ON "EducationLearningPath"("slug");

-- CreateIndex
CREATE INDEX "EducationLearningPath_order_idx" ON "EducationLearningPath"("order");

-- CreateIndex
CREATE INDEX "EducationLearningPath_slug_idx" ON "EducationLearningPath"("slug");

-- CreateIndex
CREATE INDEX "EducationLearningPathItem_pathId_idx" ON "EducationLearningPathItem"("pathId");

-- CreateIndex
CREATE INDEX "EducationLearningPathItem_articleId_idx" ON "EducationLearningPathItem"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLearningPathItem_pathId_articleId_key" ON "EducationLearningPathItem"("pathId", "articleId");

-- CreateIndex
CREATE INDEX "EducationUserProgress_userId_idx" ON "EducationUserProgress"("userId");

-- CreateIndex
CREATE INDEX "EducationUserProgress_articleId_idx" ON "EducationUserProgress"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "EducationUserProgress_userId_articleId_key" ON "EducationUserProgress"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "EducationSubcategory" ADD CONSTRAINT "EducationSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EducationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationArticle" ADD CONSTRAINT "EducationArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EducationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationArticle" ADD CONSTRAINT "EducationArticle_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "EducationSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationArticle" ADD CONSTRAINT "EducationArticle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationArticleRelation" ADD CONSTRAINT "EducationArticleRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EducationArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationArticleRelation" ADD CONSTRAINT "EducationArticleRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "EducationArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLearningPathItem" ADD CONSTRAINT "EducationLearningPathItem_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "EducationLearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationLearningPathItem" ADD CONSTRAINT "EducationLearningPathItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "EducationArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationUserProgress" ADD CONSTRAINT "EducationUserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationUserProgress" ADD CONSTRAINT "EducationUserProgress_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "EducationArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

