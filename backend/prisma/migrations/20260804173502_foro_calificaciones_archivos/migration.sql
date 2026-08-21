/*
  Warnings:

  - Added the required column `titulo` to the `RespuestaForoCurso` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoForo" AS ENUM ('BORRADOR', 'PROGRAMADO', 'ABIERTO', 'VENCIDO', 'CERRADO', 'CALIFICANDO', 'CALIFICADO', 'NOTAS_PUBLICADAS', 'ANULADO');

-- CreateEnum
CREATE TYPE "ModalidadParticipacionForo" AS ENUM ('INDIVIDUAL', 'GRUPAL');

-- CreateEnum
CREATE TYPE "OrigenGrupoForo" AS ENUM ('NINGUNO', 'PLATAFORMA', 'AFINIDAD');

-- CreateEnum
CREATE TYPE "DinamicaGrupalForo" AS ENUM ('NINGUNA', 'REPRESENTANTE_UNICO', 'PARTICIPACION_DISTRIBUIDA', 'COLABORACION_ABIERTA');

-- CreateEnum
CREATE TYPE "TipoEvaluacionForo" AS ENUM ('AUTOMATICA', 'MANUAL', 'RUBRICA');

-- CreateEnum
CREATE TYPE "ModalidadNotaForo" AS ENUM ('INDIVIDUAL', 'GRUPAL', 'GRUPAL_E_INDIVIDUAL');

-- CreateEnum
CREATE TYPE "TipoDescuentoRetraso" AS ENUM ('NINGUNO', 'PUNTOS_FIJOS', 'PORCENTAJE', 'POR_HORA', 'POR_DIA', 'NOTA_MAXIMA');

-- CreateEnum
CREATE TYPE "VisibilidadRespuestasForo" AS ENUM ('DESDE_EL_INICIO', 'DESPUES_DE_RESPONDER', 'AL_CERRAR');

-- CreateEnum
CREATE TYPE "EstadoRespuestaForo" AS ENUM ('BORRADOR', 'PUBLICADA', 'TARDIA', 'BLOQUEADA', 'OCULTA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoEquipoForo" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'BLOQUEADO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoOrigenActividad" AS ENUM ('FORO', 'TAREA', 'QUIZ', 'SIMULACION', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActividadCalificable" AS ENUM ('BORRADOR', 'ACTIVA', 'CERRADA', 'CALIFICANDO', 'CALIFICADA', 'PUBLICADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoCalificacion" AS ENUM ('PENDIENTE', 'BORRADOR', 'CALIFICADA', 'PUBLICADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "CategoriaArchivoAdjunto" AS ENUM ('PERFIL', 'RECURSO', 'FORO_TEMA', 'FORO_RESPUESTA', 'FORO_COMENTARIO', 'TAREA', 'DOCUMENTO', 'REPORTE', 'OTRO');

-- CreateEnum
CREATE TYPE "AccionHistorialForo" AS ENUM ('FORO_CREADO', 'FORO_ACTUALIZADO', 'FORO_ABIERTO', 'FORO_CERRADO', 'FORO_REABIERTO', 'FORO_ANULADO', 'RESPUESTA_CREADA', 'RESPUESTA_EDITADA', 'RESPUESTA_BLOQUEADA', 'RESPUESTA_OCULTADA', 'RESPUESTA_ANULADA', 'COMENTARIO_CREADO', 'COMENTARIO_EDITADO', 'COMENTARIO_OCULTADO', 'COMENTARIO_ANULADO', 'EQUIPO_CREADO', 'EQUIPO_APROBADO', 'EQUIPO_RECHAZADO', 'EQUIPO_BLOQUEADO', 'INTEGRANTE_AGREGADO', 'INTEGRANTE_RETIRADO', 'REPRESENTANTE_ASIGNADO', 'CALIFICACION_GUARDADA', 'NOTAS_PUBLICADAS', 'PLAZO_EXTENDIDO');

-- CreateEnum
CREATE TYPE "AccionHistorialCalificacion" AS ENUM ('ACTIVIDAD_CREADA', 'ACTIVIDAD_ACTUALIZADA', 'CALIFICACION_CREADA', 'CALIFICACION_ACTUALIZADA', 'AJUSTE_APLICADO', 'DESCUENTO_APLICADO', 'RETROALIMENTACION_ACTUALIZADA', 'CALIFICACION_PUBLICADA', 'CALIFICACIONES_PUBLICADAS', 'CALIFICACION_ANULADA');

-- DropIndex
DROP INDEX "RespuestaForoCurso_temaId_estaActiva_publicadoEn_idx";

-- DropIndex
DROP INDEX "TemaForoCurso_cursoId_hitoId_estaActivo_idx";

-- DropIndex
DROP INDEX "TemaForoCurso_fechaVencimiento_idx";

-- AlterTable
ALTER TABLE "RespuestaForoCurso" ADD COLUMN     "bloqueadaEn" TIMESTAMP(3),
ADD COLUMN     "descuentoCalculado" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "entregadaTarde" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "equipoAfinidadId" INTEGER,
ADD COLUMN     "esRespuestaGrupal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estado" "EstadoRespuestaForo" NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "grupoCursoId" INTEGER,
ADD COLUMN     "minutosRetraso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "titulo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "bloquearEquipoAlResponder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "calificacionAutomaticaAlCumplir" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cantidadMaximaIntegrantes" INTEGER,
ADD COLUMN     "cantidadMinimaIntegrantes" INTEGER,
ADD COLUMN     "conjuntoGrupoId" INTEGER,
ADD COLUMN     "dinamicaGrupal" "DinamicaGrupalForo" NOT NULL DEFAULT 'NINGUNA',
ADD COLUMN     "estado" "EstadoForo" NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "exigirAdjuntoRespuesta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extensionesPermitidas" TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp']::TEXT[],
ADD COLUMN     "fechaApertura" TIMESTAMP(3),
ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ADD COLUMN     "fechaLimite" TIMESTAMP(3),
ADD COLUMN     "fechaMaximaRetraso" TIMESTAMP(3),
ADD COLUMN     "instrucciones" TEXT,
ADD COLUMN     "maximoArchivosComentario" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maximoArchivosRespuesta" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maximoArchivosTema" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maximoComentariosPorEstudiante" INTEGER,
ADD COLUMN     "minimoComentariosPorEstudiante" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modalidadNota" "ModalidadNotaForo" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "modalidadParticipacion" "ModalidadParticipacionForo" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "notasPublicadasEn" TIMESTAMP(3),
ADD COLUMN     "origenGrupo" "OrigenGrupoForo" NOT NULL DEFAULT 'NINGUNO',
ADD COLUMN     "palabrasMaximasComentario" INTEGER,
ADD COLUMN     "palabrasMaximasRespuesta" INTEGER,
ADD COLUMN     "palabrasMinimasComentario" INTEGER,
ADD COLUMN     "palabrasMinimasRespuesta" INTEGER,
ADD COLUMN     "permitirAdjuntosComentario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permitirAdjuntosRespuesta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permitirAdjuntosTema" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirComentarios" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirDescargaAdjuntos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirRetrasos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "porcentajeNotaGrupal" DECIMAL(5,2),
ADD COLUMN     "porcentajeNotaIndividual" DECIMAL(5,2),
ADD COLUMN     "puntajeMaximo" DECIMAL(6,2) NOT NULL DEFAULT 100,
ADD COLUMN     "requiereAprobacionEquipos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiereRepresentante" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tamanioMaximoArchivoMb" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "tipoDescuentoRetraso" "TipoDescuentoRetraso" NOT NULL DEFAULT 'NINGUNO',
ADD COLUMN     "tipoEvaluacion" "TipoEvaluacionForo" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "valorDescuentoRetraso" DECIMAL(6,2),
ADD COLUMN     "visibilidadRespuestas" "VisibilidadRespuestasForo" NOT NULL DEFAULT 'DESDE_EL_INICIO';

-- CreateTable
CREATE TABLE "ComentarioRespuestaForo" (
    "id" SERIAL NOT NULL,
    "respuestaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "comentarioPadreId" INTEGER,
    "contenido" TEXT NOT NULL,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "estaOculto" BOOLEAN NOT NULL DEFAULT false,
    "estaBloqueado" BOOLEAN NOT NULL DEFAULT false,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComentarioRespuestaForo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipoAfinidadForo" (
    "id" SERIAL NOT NULL,
    "temaId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoEquipoForo" NOT NULL DEFAULT 'PENDIENTE',
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "aprobadoEn" TIMESTAMP(3),
    "bloqueadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipoAfinidadForo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegranteEquipoForo" (
    "id" SERIAL NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "esRepresentante" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "agregadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegranteEquipoForo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActividadCalificable" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "hitoId" INTEGER,
    "creadorId" INTEGER NOT NULL,
    "foroId" INTEGER,
    "origen" "TipoOrigenActividad" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntajeMaximo" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "estado" "EstadoActividadCalificable" NOT NULL DEFAULT 'BORRADOR',
    "visibleParaEstudiantes" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEn" TIMESTAMP(3),
    "cerradaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActividadCalificable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaEvaluacion" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntajeTotal" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubricaEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioRubrica" (
    "id" SERIAL NOT NULL,
    "rubricaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntajeMaximo" DECIMAL(6,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterioRubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalificacionEstudiante" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "calificadorId" INTEGER,
    "respuestaForoId" INTEGER,
    "grupoCursoId" INTEGER,
    "equipoAfinidadId" INTEGER,
    "notaBase" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "descuentoRetraso" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "ajusteIndividual" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notaFinal" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "retroalimentacion" TEXT,
    "estado" "EstadoCalificacion" NOT NULL DEFAULT 'PENDIENTE',
    "calificadaEn" TIMESTAMP(3),
    "publicadaEn" TIMESTAMP(3),
    "anuladaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalificacionEstudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionCriterioRubrica" (
    "id" SERIAL NOT NULL,
    "calificacionId" INTEGER NOT NULL,
    "criterioId" INTEGER NOT NULL,
    "puntajeObtenido" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionCriterioRubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoAdjunto" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER,
    "subidoPorId" INTEGER NOT NULL,
    "temaForoId" INTEGER,
    "respuestaForoId" INTEGER,
    "comentarioForoId" INTEGER,
    "categoria" "CategoriaArchivoAdjunto" NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreAlmacenado" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "urlPublica" TEXT,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "hashSha256" TEXT,
    "descripcion" TEXT,
    "permiteDescarga" BOOLEAN NOT NULL DEFAULT true,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchivoAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialForoCurso" (
    "id" SERIAL NOT NULL,
    "temaId" INTEGER NOT NULL,
    "respuestaId" INTEGER,
    "comentarioId" INTEGER,
    "equipoId" INTEGER,
    "actorId" INTEGER NOT NULL,
    "accion" "AccionHistorialForo" NOT NULL,
    "detalle" JSONB,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialForoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialCalificacion" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "calificacionId" INTEGER,
    "actorId" INTEGER NOT NULL,
    "accion" "AccionHistorialCalificacion" NOT NULL,
    "detalle" JSONB,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialCalificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_respuestaId_idx" ON "ComentarioRespuestaForo"("respuestaId");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_autorId_idx" ON "ComentarioRespuestaForo"("autorId");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_comentarioPadreId_idx" ON "ComentarioRespuestaForo"("comentarioPadreId");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_estaActivo_idx" ON "ComentarioRespuestaForo"("estaActivo");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_estaOculto_idx" ON "ComentarioRespuestaForo"("estaOculto");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_publicadoEn_idx" ON "ComentarioRespuestaForo"("publicadoEn");

-- CreateIndex
CREATE INDEX "ComentarioRespuestaForo_respuestaId_estaActivo_publicadoEn_idx" ON "ComentarioRespuestaForo"("respuestaId", "estaActivo", "publicadoEn");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_temaId_idx" ON "EquipoAfinidadForo"("temaId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_cursoId_idx" ON "EquipoAfinidadForo"("cursoId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_creadorId_idx" ON "EquipoAfinidadForo"("creadorId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_estado_idx" ON "EquipoAfinidadForo"("estado");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_estaActivo_idx" ON "EquipoAfinidadForo"("estaActivo");

-- CreateIndex
CREATE INDEX "EquipoAfinidadForo_temaId_estado_estaActivo_idx" ON "EquipoAfinidadForo"("temaId", "estado", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoAfinidadForo_temaId_nombre_key" ON "EquipoAfinidadForo"("temaId", "nombre");

-- CreateIndex
CREATE INDEX "IntegranteEquipoForo_equipoId_idx" ON "IntegranteEquipoForo"("equipoId");

-- CreateIndex
CREATE INDEX "IntegranteEquipoForo_estudianteId_idx" ON "IntegranteEquipoForo"("estudianteId");

-- CreateIndex
CREATE INDEX "IntegranteEquipoForo_esRepresentante_idx" ON "IntegranteEquipoForo"("esRepresentante");

-- CreateIndex
CREATE INDEX "IntegranteEquipoForo_estaActivo_idx" ON "IntegranteEquipoForo"("estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "IntegranteEquipoForo_equipoId_estudianteId_key" ON "IntegranteEquipoForo"("equipoId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "ActividadCalificable_foroId_key" ON "ActividadCalificable"("foroId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_cursoId_idx" ON "ActividadCalificable"("cursoId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_hitoId_idx" ON "ActividadCalificable"("hitoId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_creadorId_idx" ON "ActividadCalificable"("creadorId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_origen_idx" ON "ActividadCalificable"("origen");

-- CreateIndex
CREATE INDEX "ActividadCalificable_estado_idx" ON "ActividadCalificable"("estado");

-- CreateIndex
CREATE INDEX "ActividadCalificable_visibleParaEstudiantes_idx" ON "ActividadCalificable"("visibleParaEstudiantes");

-- CreateIndex
CREATE INDEX "ActividadCalificable_cursoId_estado_idx" ON "ActividadCalificable"("cursoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "RubricaEvaluacion_actividadId_key" ON "RubricaEvaluacion"("actividadId");

-- CreateIndex
CREATE INDEX "RubricaEvaluacion_actividadId_idx" ON "RubricaEvaluacion"("actividadId");

-- CreateIndex
CREATE INDEX "RubricaEvaluacion_creadorId_idx" ON "RubricaEvaluacion"("creadorId");

-- CreateIndex
CREATE INDEX "RubricaEvaluacion_estaActiva_idx" ON "RubricaEvaluacion"("estaActiva");

-- CreateIndex
CREATE INDEX "CriterioRubrica_rubricaId_idx" ON "CriterioRubrica"("rubricaId");

-- CreateIndex
CREATE INDEX "CriterioRubrica_orden_idx" ON "CriterioRubrica"("orden");

-- CreateIndex
CREATE INDEX "CriterioRubrica_estaActivo_idx" ON "CriterioRubrica"("estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioRubrica_rubricaId_nombre_key" ON "CriterioRubrica"("rubricaId", "nombre");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_actividadId_idx" ON "CalificacionEstudiante"("actividadId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_estudianteId_idx" ON "CalificacionEstudiante"("estudianteId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_calificadorId_idx" ON "CalificacionEstudiante"("calificadorId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_respuestaForoId_idx" ON "CalificacionEstudiante"("respuestaForoId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_grupoCursoId_idx" ON "CalificacionEstudiante"("grupoCursoId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_equipoAfinidadId_idx" ON "CalificacionEstudiante"("equipoAfinidadId");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_estado_idx" ON "CalificacionEstudiante"("estado");

-- CreateIndex
CREATE INDEX "CalificacionEstudiante_actividadId_estado_idx" ON "CalificacionEstudiante"("actividadId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionEstudiante_actividadId_estudianteId_key" ON "CalificacionEstudiante"("actividadId", "estudianteId");

-- CreateIndex
CREATE INDEX "EvaluacionCriterioRubrica_calificacionId_idx" ON "EvaluacionCriterioRubrica"("calificacionId");

-- CreateIndex
CREATE INDEX "EvaluacionCriterioRubrica_criterioId_idx" ON "EvaluacionCriterioRubrica"("criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionCriterioRubrica_calificacionId_criterioId_key" ON "EvaluacionCriterioRubrica"("calificacionId", "criterioId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_cursoId_idx" ON "ArchivoAdjunto"("cursoId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_subidoPorId_idx" ON "ArchivoAdjunto"("subidoPorId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_temaForoId_idx" ON "ArchivoAdjunto"("temaForoId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_respuestaForoId_idx" ON "ArchivoAdjunto"("respuestaForoId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_comentarioForoId_idx" ON "ArchivoAdjunto"("comentarioForoId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_categoria_idx" ON "ArchivoAdjunto"("categoria");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_hashSha256_idx" ON "ArchivoAdjunto"("hashSha256");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_estaActivo_idx" ON "ArchivoAdjunto"("estaActivo");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_creadoEn_idx" ON "ArchivoAdjunto"("creadoEn");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_temaId_idx" ON "HistorialForoCurso"("temaId");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_respuestaId_idx" ON "HistorialForoCurso"("respuestaId");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_comentarioId_idx" ON "HistorialForoCurso"("comentarioId");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_equipoId_idx" ON "HistorialForoCurso"("equipoId");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_actorId_idx" ON "HistorialForoCurso"("actorId");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_accion_idx" ON "HistorialForoCurso"("accion");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_registradoEn_idx" ON "HistorialForoCurso"("registradoEn");

-- CreateIndex
CREATE INDEX "HistorialForoCurso_temaId_registradoEn_idx" ON "HistorialForoCurso"("temaId", "registradoEn");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_actividadId_idx" ON "HistorialCalificacion"("actividadId");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_calificacionId_idx" ON "HistorialCalificacion"("calificacionId");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_actorId_idx" ON "HistorialCalificacion"("actorId");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_accion_idx" ON "HistorialCalificacion"("accion");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_registradoEn_idx" ON "HistorialCalificacion"("registradoEn");

-- CreateIndex
CREATE INDEX "HistorialCalificacion_actividadId_registradoEn_idx" ON "HistorialCalificacion"("actividadId", "registradoEn");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_grupoCursoId_idx" ON "RespuestaForoCurso"("grupoCursoId");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_equipoAfinidadId_idx" ON "RespuestaForoCurso"("equipoAfinidadId");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_estado_idx" ON "RespuestaForoCurso"("estado");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_entregadaTarde_idx" ON "RespuestaForoCurso"("entregadaTarde");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_temaId_estado_estaActiva_idx" ON "RespuestaForoCurso"("temaId", "estado", "estaActiva");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_temaId_grupoCursoId_idx" ON "RespuestaForoCurso"("temaId", "grupoCursoId");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_temaId_equipoAfinidadId_idx" ON "RespuestaForoCurso"("temaId", "equipoAfinidadId");

-- CreateIndex
CREATE INDEX "TemaForoCurso_conjuntoGrupoId_idx" ON "TemaForoCurso"("conjuntoGrupoId");

-- CreateIndex
CREATE INDEX "TemaForoCurso_estado_idx" ON "TemaForoCurso"("estado");

-- CreateIndex
CREATE INDEX "TemaForoCurso_modalidadParticipacion_idx" ON "TemaForoCurso"("modalidadParticipacion");

-- CreateIndex
CREATE INDEX "TemaForoCurso_origenGrupo_idx" ON "TemaForoCurso"("origenGrupo");

-- CreateIndex
CREATE INDEX "TemaForoCurso_tipoEvaluacion_idx" ON "TemaForoCurso"("tipoEvaluacion");

-- CreateIndex
CREATE INDEX "TemaForoCurso_fechaApertura_idx" ON "TemaForoCurso"("fechaApertura");

-- CreateIndex
CREATE INDEX "TemaForoCurso_fechaLimite_idx" ON "TemaForoCurso"("fechaLimite");

-- CreateIndex
CREATE INDEX "TemaForoCurso_fechaCierre_idx" ON "TemaForoCurso"("fechaCierre");

-- CreateIndex
CREATE INDEX "TemaForoCurso_cursoId_estado_estaActivo_idx" ON "TemaForoCurso"("cursoId", "estado", "estaActivo");

-- CreateIndex
CREATE INDEX "TemaForoCurso_cursoId_hitoId_estado_estaActivo_idx" ON "TemaForoCurso"("cursoId", "hitoId", "estado", "estaActivo");

-- AddForeignKey
ALTER TABLE "TemaForoCurso" ADD CONSTRAINT "TemaForoCurso_conjuntoGrupoId_fkey" FOREIGN KEY ("conjuntoGrupoId") REFERENCES "ConjuntoGrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaForoCurso" ADD CONSTRAINT "RespuestaForoCurso_grupoCursoId_fkey" FOREIGN KEY ("grupoCursoId") REFERENCES "GrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaForoCurso" ADD CONSTRAINT "RespuestaForoCurso_equipoAfinidadId_fkey" FOREIGN KEY ("equipoAfinidadId") REFERENCES "EquipoAfinidadForo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRespuestaForo" ADD CONSTRAINT "ComentarioRespuestaForo_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "RespuestaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRespuestaForo" ADD CONSTRAINT "ComentarioRespuestaForo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRespuestaForo" ADD CONSTRAINT "ComentarioRespuestaForo_comentarioPadreId_fkey" FOREIGN KEY ("comentarioPadreId") REFERENCES "ComentarioRespuestaForo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadForo" ADD CONSTRAINT "EquipoAfinidadForo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadForo" ADD CONSTRAINT "EquipoAfinidadForo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadForo" ADD CONSTRAINT "EquipoAfinidadForo_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteEquipoForo" ADD CONSTRAINT "IntegranteEquipoForo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "EquipoAfinidadForo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteEquipoForo" ADD CONSTRAINT "IntegranteEquipoForo_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_foroId_fkey" FOREIGN KEY ("foroId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaEvaluacion" ADD CONSTRAINT "RubricaEvaluacion_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "ActividadCalificable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaEvaluacion" ADD CONSTRAINT "RubricaEvaluacion_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioRubrica" ADD CONSTRAINT "CriterioRubrica_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "RubricaEvaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "ActividadCalificable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_calificadorId_fkey" FOREIGN KEY ("calificadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_respuestaForoId_fkey" FOREIGN KEY ("respuestaForoId") REFERENCES "RespuestaForoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_grupoCursoId_fkey" FOREIGN KEY ("grupoCursoId") REFERENCES "GrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_equipoAfinidadId_fkey" FOREIGN KEY ("equipoAfinidadId") REFERENCES "EquipoAfinidadForo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCriterioRubrica" ADD CONSTRAINT "EvaluacionCriterioRubrica_calificacionId_fkey" FOREIGN KEY ("calificacionId") REFERENCES "CalificacionEstudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCriterioRubrica" ADD CONSTRAINT "EvaluacionCriterioRubrica_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "CriterioRubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_temaForoId_fkey" FOREIGN KEY ("temaForoId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_respuestaForoId_fkey" FOREIGN KEY ("respuestaForoId") REFERENCES "RespuestaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_comentarioForoId_fkey" FOREIGN KEY ("comentarioForoId") REFERENCES "ComentarioRespuestaForo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialForoCurso" ADD CONSTRAINT "HistorialForoCurso_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialForoCurso" ADD CONSTRAINT "HistorialForoCurso_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "RespuestaForoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialForoCurso" ADD CONSTRAINT "HistorialForoCurso_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "ComentarioRespuestaForo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialForoCurso" ADD CONSTRAINT "HistorialForoCurso_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "EquipoAfinidadForo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialForoCurso" ADD CONSTRAINT "HistorialForoCurso_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCalificacion" ADD CONSTRAINT "HistorialCalificacion_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "ActividadCalificable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCalificacion" ADD CONSTRAINT "HistorialCalificacion_calificacionId_fkey" FOREIGN KEY ("calificacionId") REFERENCES "CalificacionEstudiante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCalificacion" ADD CONSTRAINT "HistorialCalificacion_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
