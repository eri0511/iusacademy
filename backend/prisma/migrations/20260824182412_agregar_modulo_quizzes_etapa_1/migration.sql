/*
  Warnings:

  - A unique constraint covering the columns `[quizId]` on the table `ActividadCalificable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[intentoQuizId]` on the table `CalificacionEstudiante` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DificultadQuiz" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL', 'MIXTA');

-- CreateEnum
CREATE TYPE "ModalidadQuiz" AS ENUM ('EN_VIVO', 'PROGRAMADO');

-- CreateEnum
CREATE TYPE "EstadoQuiz" AS ENUM ('BORRADOR', 'ESPERANDO', 'CUENTA_REGRESIVA', 'EN_CURSO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RitmoQuiz" AS ENUM ('AUTOMATICO', 'CONTROL_DOCENTE');

-- CreateEnum
CREATE TYPE "ModoTiempoQuiz" AS ENUM ('FIJO', 'AUTOMATICO_DIFICULTAD');

-- CreateEnum
CREATE TYPE "TipoPreguntaQuiz" AS ENUM ('OPCION_MULTIPLE', 'VERDADERO_FALSO', 'SELECCION_MULTIPLE');

-- CreateEnum
CREATE TYPE "OrigenPreguntaQuiz" AS ENUM ('GENERADA', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoParticipanteQuiz" AS ENUM ('ESPERANDO', 'LISTO', 'EN_CURSO', 'FINALIZADO', 'DESCONECTADO', 'AUSENTE');

-- CreateEnum
CREATE TYPE "EstadoIntentoQuiz" AS ENUM ('ESPERANDO', 'EN_CURSO', 'FINALIZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "CriterioRankingQuiz" AS ENUM ('PUNTAJE_Y_TIEMPO', 'SOLO_TIEMPO');

-- AlterTable
ALTER TABLE "ActividadCalificable" ADD COLUMN     "quizId" INTEGER;

-- AlterTable
ALTER TABLE "CalificacionEstudiante" ADD COLUMN     "intentoQuizId" INTEGER;

-- CreateTable
CREATE TABLE "QuizCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "hitoId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "dificultad" "DificultadQuiz" NOT NULL DEFAULT 'MEDIO',
    "esCalificable" BOOLEAN NOT NULL DEFAULT false,
    "componente" "ComponenteEvaluacion",
    "modalidad" "ModalidadQuiz" NOT NULL DEFAULT 'EN_VIVO',
    "estado" "EstadoQuiz" NOT NULL DEFAULT 'BORRADOR',
    "ritmo" "RitmoQuiz" NOT NULL DEFAULT 'CONTROL_DOCENTE',
    "modoTiempo" "ModoTiempoQuiz" NOT NULL DEFAULT 'FIJO',
    "tiempoPreguntaSegundos" INTEGER NOT NULL DEFAULT 20,
    "tiempoFacilSegundos" INTEGER NOT NULL DEFAULT 20,
    "tiempoMedioSegundos" INTEGER NOT NULL DEFAULT 30,
    "tiempoDificilSegundos" INTEGER NOT NULL DEFAULT 45,
    "cantidadPreguntas" INTEGER NOT NULL DEFAULT 10,
    "puntajeMaximo" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "usarRanking" BOOLEAN NOT NULL DEFAULT false,
    "criterioRanking" "CriterioRankingQuiz" NOT NULL DEFAULT 'PUNTAJE_Y_TIEMPO',
    "descuentoPorPuesto" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "puntajeMinimoRanking" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "permiteInicioConAusentes" BOOLEAN NOT NULL DEFAULT true,
    "cuentaRegresivaSegundos" INTEGER NOT NULL DEFAULT 3,
    "aperturaProgramada" TIMESTAMP(3),
    "cierreProgramado" TIMESTAMP(3),
    "salaPublicadaEn" TIMESTAMP(3),
    "inicioEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "canceladoEn" TIMESTAMP(3),
    "preguntaActualOrden" INTEGER,
    "preguntaIniciadaEn" TIMESTAMP(3),
    "preguntaCierraEn" TIMESTAMP(3),
    "resultadosPublicados" BOOLEAN NOT NULL DEFAULT false,
    "resultadosPublicadosEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuenteQuiz" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tituloSnapshot" TEXT,
    "nombreArchivoSnapshot" TEXT,
    "numeroVersionSnapshot" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuenteQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FragmentoFuenteQuiz" (
    "id" SERIAL NOT NULL,
    "fuenteId" INTEGER NOT NULL,
    "tituloReferencia" TEXT,
    "tipoReferencia" TEXT,
    "paginaInicio" INTEGER,
    "paginaFin" INTEGER,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FragmentoFuenteQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaQuiz" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "fragmentoId" INTEGER,
    "enunciado" TEXT NOT NULL,
    "tipo" "TipoPreguntaQuiz" NOT NULL DEFAULT 'OPCION_MULTIPLE',
    "dificultad" "DificultadQuiz" NOT NULL DEFAULT 'MEDIO',
    "origen" "OrigenPreguntaQuiz" NOT NULL DEFAULT 'GENERADA',
    "explicacion" TEXT,
    "tiempoSegundos" INTEGER,
    "puntaje" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreguntaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcionPreguntaQuiz" (
    "id" SERIAL NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpcionPreguntaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteQuiz" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "estado" "EstadoParticipanteQuiz" NOT NULL DEFAULT 'ESPERANDO',
    "conectadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listoEn" TIMESTAMP(3),
    "inicioEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "desconectadoEn" TIMESTAMP(3),
    "ultimaConexionEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipanteQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentoQuiz" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "participanteId" INTEGER NOT NULL,
    "estado" "EstadoIntentoQuiz" NOT NULL DEFAULT 'ESPERANDO',
    "iniciadoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "anuladoEn" TIMESTAMP(3),
    "tiempoTotalMs" INTEGER,
    "posicionFinal" INTEGER,
    "respuestasCorrectas" INTEGER NOT NULL DEFAULT 0,
    "respuestasIncorrectas" INTEGER NOT NULL DEFAULT 0,
    "respuestasOmitidas" INTEGER NOT NULL DEFAULT 0,
    "puntajeBruto" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notaBase" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "descuentoPosicion" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notaFinal" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentoQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaIntentoQuiz" (
    "id" SERIAL NOT NULL,
    "intentoId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "respondidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tiempoRespuestaMs" INTEGER,
    "esCorrecta" BOOLEAN,
    "puntajeObtenido" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespuestaIntentoQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaOpcionQuiz" (
    "id" SERIAL NOT NULL,
    "respuestaId" INTEGER NOT NULL,
    "opcionId" INTEGER NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaOpcionQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizCurso_cursoId_idx" ON "QuizCurso"("cursoId");

-- CreateIndex
CREATE INDEX "QuizCurso_hitoId_idx" ON "QuizCurso"("hitoId");

-- CreateIndex
CREATE INDEX "QuizCurso_creadorId_idx" ON "QuizCurso"("creadorId");

-- CreateIndex
CREATE INDEX "QuizCurso_estado_idx" ON "QuizCurso"("estado");

-- CreateIndex
CREATE INDEX "QuizCurso_modalidad_idx" ON "QuizCurso"("modalidad");

-- CreateIndex
CREATE INDEX "QuizCurso_dificultad_idx" ON "QuizCurso"("dificultad");

-- CreateIndex
CREATE INDEX "QuizCurso_esCalificable_idx" ON "QuizCurso"("esCalificable");

-- CreateIndex
CREATE INDEX "QuizCurso_componente_idx" ON "QuizCurso"("componente");

-- CreateIndex
CREATE INDEX "QuizCurso_cursoId_hitoId_idx" ON "QuizCurso"("cursoId", "hitoId");

-- CreateIndex
CREATE INDEX "QuizCurso_cursoId_estado_idx" ON "QuizCurso"("cursoId", "estado");

-- CreateIndex
CREATE INDEX "QuizCurso_cursoId_modalidad_estado_idx" ON "QuizCurso"("cursoId", "modalidad", "estado");

-- CreateIndex
CREATE INDEX "FuenteQuiz_quizId_idx" ON "FuenteQuiz"("quizId");

-- CreateIndex
CREATE INDEX "FuenteQuiz_versionId_idx" ON "FuenteQuiz"("versionId");

-- CreateIndex
CREATE INDEX "FuenteQuiz_orden_idx" ON "FuenteQuiz"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "FuenteQuiz_quizId_versionId_key" ON "FuenteQuiz"("quizId", "versionId");

-- CreateIndex
CREATE INDEX "FragmentoFuenteQuiz_fuenteId_idx" ON "FragmentoFuenteQuiz"("fuenteId");

-- CreateIndex
CREATE INDEX "FragmentoFuenteQuiz_orden_idx" ON "FragmentoFuenteQuiz"("orden");

-- CreateIndex
CREATE INDEX "FragmentoFuenteQuiz_fuenteId_orden_idx" ON "FragmentoFuenteQuiz"("fuenteId", "orden");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_quizId_idx" ON "PreguntaQuiz"("quizId");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_fragmentoId_idx" ON "PreguntaQuiz"("fragmentoId");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_tipo_idx" ON "PreguntaQuiz"("tipo");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_dificultad_idx" ON "PreguntaQuiz"("dificultad");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_orden_idx" ON "PreguntaQuiz"("orden");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_estaActiva_idx" ON "PreguntaQuiz"("estaActiva");

-- CreateIndex
CREATE INDEX "PreguntaQuiz_quizId_orden_estaActiva_idx" ON "PreguntaQuiz"("quizId", "orden", "estaActiva");

-- CreateIndex
CREATE INDEX "OpcionPreguntaQuiz_preguntaId_idx" ON "OpcionPreguntaQuiz"("preguntaId");

-- CreateIndex
CREATE INDEX "OpcionPreguntaQuiz_esCorrecta_idx" ON "OpcionPreguntaQuiz"("esCorrecta");

-- CreateIndex
CREATE INDEX "OpcionPreguntaQuiz_orden_idx" ON "OpcionPreguntaQuiz"("orden");

-- CreateIndex
CREATE INDEX "OpcionPreguntaQuiz_preguntaId_orden_idx" ON "OpcionPreguntaQuiz"("preguntaId", "orden");

-- CreateIndex
CREATE INDEX "ParticipanteQuiz_quizId_idx" ON "ParticipanteQuiz"("quizId");

-- CreateIndex
CREATE INDEX "ParticipanteQuiz_estudianteId_idx" ON "ParticipanteQuiz"("estudianteId");

-- CreateIndex
CREATE INDEX "ParticipanteQuiz_estado_idx" ON "ParticipanteQuiz"("estado");

-- CreateIndex
CREATE INDEX "ParticipanteQuiz_ultimaConexionEn_idx" ON "ParticipanteQuiz"("ultimaConexionEn");

-- CreateIndex
CREATE INDEX "ParticipanteQuiz_quizId_estado_idx" ON "ParticipanteQuiz"("quizId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteQuiz_quizId_estudianteId_key" ON "ParticipanteQuiz"("quizId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "IntentoQuiz_participanteId_key" ON "IntentoQuiz"("participanteId");

-- CreateIndex
CREATE INDEX "IntentoQuiz_quizId_idx" ON "IntentoQuiz"("quizId");

-- CreateIndex
CREATE INDEX "IntentoQuiz_estudianteId_idx" ON "IntentoQuiz"("estudianteId");

-- CreateIndex
CREATE INDEX "IntentoQuiz_estado_idx" ON "IntentoQuiz"("estado");

-- CreateIndex
CREATE INDEX "IntentoQuiz_posicionFinal_idx" ON "IntentoQuiz"("posicionFinal");

-- CreateIndex
CREATE INDEX "IntentoQuiz_quizId_estado_idx" ON "IntentoQuiz"("quizId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "IntentoQuiz_quizId_estudianteId_key" ON "IntentoQuiz"("quizId", "estudianteId");

-- CreateIndex
CREATE INDEX "RespuestaIntentoQuiz_intentoId_idx" ON "RespuestaIntentoQuiz"("intentoId");

-- CreateIndex
CREATE INDEX "RespuestaIntentoQuiz_preguntaId_idx" ON "RespuestaIntentoQuiz"("preguntaId");

-- CreateIndex
CREATE INDEX "RespuestaIntentoQuiz_respondidaEn_idx" ON "RespuestaIntentoQuiz"("respondidaEn");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaIntentoQuiz_intentoId_preguntaId_key" ON "RespuestaIntentoQuiz"("intentoId", "preguntaId");

-- CreateIndex
CREATE INDEX "RespuestaOpcionQuiz_respuestaId_idx" ON "RespuestaOpcionQuiz"("respuestaId");

-- CreateIndex
CREATE INDEX "RespuestaOpcionQuiz_opcionId_idx" ON "RespuestaOpcionQuiz"("opcionId");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaOpcionQuiz_respuestaId_opcionId_key" ON "RespuestaOpcionQuiz"("respuestaId", "opcionId");

-- CreateIndex
CREATE UNIQUE INDEX "ActividadCalificable_quizId_key" ON "ActividadCalificable"("quizId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_quizId_idx" ON "ActividadCalificable"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionEstudiante_intentoQuizId_key" ON "CalificacionEstudiante"("intentoQuizId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_intentoQuizId_idx" ON "CalificacionEstudiante"("intentoQuizId");

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_intentoQuizId_fkey" FOREIGN KEY ("intentoQuizId") REFERENCES "IntentoQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCurso" ADD CONSTRAINT "QuizCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCurso" ADD CONSTRAINT "QuizCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCurso" ADD CONSTRAINT "QuizCurso_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuenteQuiz" ADD CONSTRAINT "FuenteQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuenteQuiz" ADD CONSTRAINT "FuenteQuiz_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RecursoContenidoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FragmentoFuenteQuiz" ADD CONSTRAINT "FragmentoFuenteQuiz_fuenteId_fkey" FOREIGN KEY ("fuenteId") REFERENCES "FuenteQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaQuiz" ADD CONSTRAINT "PreguntaQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaQuiz" ADD CONSTRAINT "PreguntaQuiz_fragmentoId_fkey" FOREIGN KEY ("fragmentoId") REFERENCES "FragmentoFuenteQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcionPreguntaQuiz" ADD CONSTRAINT "OpcionPreguntaQuiz_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteQuiz" ADD CONSTRAINT "ParticipanteQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteQuiz" ADD CONSTRAINT "ParticipanteQuiz_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoQuiz" ADD CONSTRAINT "IntentoQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoQuiz" ADD CONSTRAINT "IntentoQuiz_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoQuiz" ADD CONSTRAINT "IntentoQuiz_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaIntentoQuiz" ADD CONSTRAINT "RespuestaIntentoQuiz_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "IntentoQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaIntentoQuiz" ADD CONSTRAINT "RespuestaIntentoQuiz_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaOpcionQuiz" ADD CONSTRAINT "RespuestaOpcionQuiz_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "RespuestaIntentoQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaOpcionQuiz" ADD CONSTRAINT "RespuestaOpcionQuiz_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "OpcionPreguntaQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
