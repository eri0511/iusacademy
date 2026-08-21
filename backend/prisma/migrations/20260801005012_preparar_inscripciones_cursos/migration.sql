-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "codigoExpiraEn" TIMESTAMP(3),
ALTER COLUMN "codigoInscripcionActivo" SET DEFAULT false;
