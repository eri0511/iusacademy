/*
  Warnings:

  - You are about to drop the column `debeCambiarPassword` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `passwordTemporalExpira` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "debeCambiarPassword",
DROP COLUMN "passwordTemporalExpira",
ADD COLUMN     "cuentaActivada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenActivacionExpira" TIMESTAMP(3),
ADD COLUMN     "tokenActivacionHash" TEXT;
