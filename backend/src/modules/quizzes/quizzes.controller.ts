import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import type { UsuarioAutenticado } from '../archivos/interfaces/usuario-autenticado.interface';

import { ActualizarQuizDto } from './dto/actualizar-quiz.dto';

import { AgregarFragmentoQuizDto } from './dto/agregar-fragmento-quiz.dto';

import { AgregarFuenteQuizDto } from './dto/agregar-fuente-quiz.dto';

import { CrearPreguntaQuizDto } from './dto/crear-pregunta-quiz.dto';

import { CrearQuizDto } from './dto/crear-quiz.dto';

import { ResponderPreguntaQuizDto } from './dto/responder-pregunta-quiz.dto';

import { BuscarDatasetQuizDto } from './dto/buscar-dataset-quiz.dto';

import { GenerarBorradorPreguntasQuizDto } from './dto/generar-borrador-preguntas-quiz.dto';

import { SeleccionarFragmentosQuizDto } from './dto/seleccionar-fragmentos-quiz.dto';

import { SeleccionarAvatarQuizDto } from './dto/seleccionar-avatar-quiz.dto';

import { QuizDatasetService } from './quiz-dataset.service';

import { QuizGeneradorService } from './quiz-generador.service';

import { QuizzesService } from './quizzes.service';

type RequestAutenticada = Request & {
  user: UsuarioAutenticado;
};

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,

    private readonly quizDatasetService: QuizDatasetService,

    private readonly quizGeneradorService: QuizGeneradorService,
  ) {}

  @Get('cursos/:cursoId')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  listar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,
  ) {
    return this.quizzesService.listar(req.user, cursoId);
  }

  @Get('cursos/:cursoId/datasets/:versionId/analizar')
  @Roles(Rol.DOCENTE)
  analizarDataset(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('versionId', ParseIntPipe)
    versionId: number,
  ) {
    return this.quizDatasetService.analizar(req.user, cursoId, versionId);
  }

  @Get('cursos/:cursoId/datasets/:versionId/buscar')
  @Roles(Rol.DOCENTE)
  buscarEnDataset(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('versionId', ParseIntPipe)
    versionId: number,

    @Query()
    filtros: BuscarDatasetQuizDto,
  ) {
    return this.quizDatasetService.buscar(
      req.user,
      cursoId,
      versionId,
      filtros,
    );
  }

  @Get('cursos/:cursoId/datasets')
  @Roles(Rol.DOCENTE)
  listarDatasets(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,
  ) {
    return this.quizzesService.listarDatasets(req.user, cursoId);
  }

  @Get('cursos/:cursoId/:quizId')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  obtener(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.obtener(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId')
  @Roles(Rol.DOCENTE)
  crear(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Body()
    datos: CrearQuizDto,
  ) {
    return this.quizzesService.crear(req.user, cursoId, datos);
  }

  @Patch('cursos/:cursoId/:quizId')
  @Roles(Rol.DOCENTE)
  actualizar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: ActualizarQuizDto,
  ) {
    return this.quizzesService.actualizar(req.user, cursoId, quizId, datos);
  }

  @Delete('cursos/:cursoId/:quizId')
  @Roles(Rol.DOCENTE)
  eliminar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.eliminar(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/fuentes')
  @Roles(Rol.DOCENTE)
  agregarFuente(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: AgregarFuenteQuizDto,
  ) {
    return this.quizzesService.agregarFuente(req.user, cursoId, quizId, datos);
  }

  @Delete('cursos/:cursoId/:quizId/fuentes/:fuenteId')
  @Roles(Rol.DOCENTE)
  eliminarFuente(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Param('fuenteId', ParseIntPipe)
    fuenteId: number,
  ) {
    return this.quizzesService.eliminarFuente(
      req.user,
      cursoId,
      quizId,
      fuenteId,
    );
  }

  @Post('cursos/:cursoId/:quizId/fuentes/:fuenteId/fragmentos/seleccionar')
  @Roles(Rol.DOCENTE)
  seleccionarFragmentos(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Param('fuenteId', ParseIntPipe)
    fuenteId: number,

    @Body()
    datos: SeleccionarFragmentosQuizDto,
  ) {
    return this.quizDatasetService.seleccionarFragmentos(
      req.user,
      cursoId,
      quizId,
      fuenteId,
      datos,
    );
  }

  @Post('cursos/:cursoId/:quizId/fuentes/:fuenteId/fragmentos')
  @Roles(Rol.DOCENTE)
  agregarFragmento(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Param('fuenteId', ParseIntPipe)
    fuenteId: number,

    @Body()
    datos: AgregarFragmentoQuizDto,
  ) {
    return this.quizzesService.agregarFragmento(
      req.user,
      cursoId,
      quizId,
      fuenteId,
      datos,
    );
  }

  @Post('cursos/:cursoId/:quizId/generar-borrador')
  @Roles(Rol.DOCENTE)
  generarBorrador(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: GenerarBorradorPreguntasQuizDto,
  ) {
    return this.quizGeneradorService.generarBorrador(
      req.user,
      cursoId,
      quizId,
      datos,
    );
  }

  @Post('cursos/:cursoId/:quizId/preguntas')
  @Roles(Rol.DOCENTE)
  crearPregunta(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: CrearPreguntaQuizDto,
  ) {
    return this.quizzesService.crearPregunta(req.user, cursoId, quizId, datos);
  }

  @Delete('cursos/:cursoId/:quizId/preguntas/:preguntaId')
  @Roles(Rol.DOCENTE)
  eliminarPregunta(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Param('preguntaId', ParseIntPipe)
    preguntaId: number,
  ) {
    return this.quizzesService.eliminarPregunta(
      req.user,
      cursoId,
      quizId,
      preguntaId,
    );
  }

  @Post('cursos/:cursoId/:quizId/publicar-sala')
  @Roles(Rol.DOCENTE)
  publicarSala(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.publicarSala(req.user, cursoId, quizId);
  }

  @Patch('cursos/:cursoId/:quizId/avatar')
  @Roles(Rol.ESTUDIANTE)
  seleccionarAvatar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: SeleccionarAvatarQuizDto,
  ) {
    return this.quizzesService.seleccionarAvatar(
      req.user,
      cursoId,
      quizId,
      datos,
    );
  }

  @Post('cursos/:cursoId/:quizId/heartbeat')
  @Roles(Rol.ESTUDIANTE)
  heartbeat(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.heartbeat(req.user, cursoId, quizId);
  }

  @Get('cursos/:cursoId/:quizId/lobby')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  lobby(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.lobby(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/iniciar')
  @Roles(Rol.DOCENTE)
  iniciar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.iniciar(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/activar')
  @Roles(Rol.DOCENTE)
  activar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.activarEnCurso(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/pausar')
  @Roles(Rol.DOCENTE)
  pausar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.pausar(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/reanudar')
  @Roles(Rol.DOCENTE)
  reanudar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.reanudar(req.user, cursoId, quizId);
  }

  @Get('cursos/:cursoId/:quizId/estado-en-vivo')
  @Roles(Rol.DOCENTE)
  estadoEnVivo(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.estadoEnVivo(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/siguiente-pregunta')
  @Roles(Rol.DOCENTE)
  siguientePregunta(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.siguientePregunta(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/finalizar')
  @Roles(Rol.DOCENTE)
  finalizar(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.finalizar(req.user, cursoId, quizId);
  }

  @Get('cursos/:cursoId/:quizId/resultados')
  @Roles(Rol.DOCENTE)
  resultados(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.resultadosDocente(req.user, cursoId, quizId);
  }

  @Get('cursos/:cursoId/:quizId/resultados/:estudianteId')
  @Roles(Rol.DOCENTE)
  detalleResultadoEstudiante(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Param('estudianteId', ParseIntPipe)
    estudianteId: number,
  ) {
    return this.quizzesService.detalleResultadoEstudiante(
      req.user,
      cursoId,
      quizId,
      estudianteId,
    );
  }

  @Post('cursos/:cursoId/:quizId/resultados/publicar')
  @Roles(Rol.DOCENTE)
  publicarResultados(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.publicarResultados(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/unirse')
  @Roles(Rol.ESTUDIANTE)
  unirse(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.unirse(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/listo')
  @Roles(Rol.ESTUDIANTE)
  marcarListo(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.marcarListo(req.user, cursoId, quizId);
  }

  @Post('cursos/:cursoId/:quizId/responder')
  @Roles(Rol.ESTUDIANTE)
  responder(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,

    @Body()
    datos: ResponderPreguntaQuizDto,
  ) {
    return this.quizzesService.responder(req.user, cursoId, quizId, datos);
  }

  @Get('cursos/:cursoId/:quizId/ranking-final')
  @Roles(Rol.ESTUDIANTE)
  rankingFinalEstudiante(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.rankingFinalEstudiante(
      req.user,
      cursoId,
      quizId,
    );
  }

  @Get('cursos/:cursoId/:quizId/mi-resultado')
  @Roles(Rol.ESTUDIANTE)
  miResultado(
    @Req()
    req: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('quizId', ParseIntPipe)
    quizId: number,
  ) {
    return this.quizzesService.miResultado(req.user, cursoId, quizId);
  }
}
