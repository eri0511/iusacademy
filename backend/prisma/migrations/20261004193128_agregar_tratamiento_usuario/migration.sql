-- CreateEnum
CREATE TYPE "TratamientoUsuario" AS ENUM ('DR', 'DRA');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "tratamiento" "TratamientoUsuario";
