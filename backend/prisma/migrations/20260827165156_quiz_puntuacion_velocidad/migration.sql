-- AlterTable
ALTER TABLE "QuizCurso" ADD COLUMN     "descuentoVelocidadPorPosicion" DECIMAL(6,2) NOT NULL DEFAULT 1,
ADD COLUMN     "puntajeMinimoVelocidad" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "usarPuntuacionVelocidad" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RespuestaIntentoQuiz" ADD COLUMN     "descuentoVelocidad" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN     "posicionRespuestaCorrecta" INTEGER;

-- CreateIndex
CREATE INDEX "RespuestaIntentoQuiz_preguntaId_esCorrecta_respondidaEn_idx" ON "RespuestaIntentoQuiz"("preguntaId", "esCorrecta", "respondidaEn");
