-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "accesoEnviadoEn" TIMESTAMP(3),
ALTER COLUMN "passwordHash" DROP NOT NULL;
