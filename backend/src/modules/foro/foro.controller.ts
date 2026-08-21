import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';

import {
  Rol,
} from '../../generated/prisma/client';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  ActualizarComentarioForoDto,
} from './dto/actualizar-comentario-foro.dto';

import {
  ActualizarForoDto,
} from './dto/actualizar-foro.dto';

import {
  ActualizarRespuestaForoDto,
} from './dto/actualizar-respuesta-foro.dto';

import {
  CambiarEstadoForoDto,
} from './dto/cambiar-estado-foro.dto';

import {
  CambiarFijadoForoDto,
} from './dto/cambiar-fijado-foro.dto';

import {
  BloquearRespuestaForoDto,
} from './dto/bloquear-respuesta-foro.dto';

import {
  CrearComentarioForoDto,
} from './dto/crear-comentario-foro.dto';

import {
  CrearForoDto,
} from './dto/crear-foro.dto';

import {
  CrearRespuestaForoDto,
} from './dto/crear-respuesta-foro.dto';

import {
  DuplicarForoDto,
} from './dto/duplicar-foro.dto';

import {
  ExtenderPlazoForoDto,
} from './dto/extender-plazo-foro.dto';

import {
  ModerarComentarioForoDto,
} from './dto/moderar-comentario-foro.dto';

import {
  ModerarRespuestaForoDto,
} from './dto/moderar-respuesta-foro.dto';

import {
  PublicarNotasForoDto,
} from './dto/publicar-notas-foro.dto';

import {
  ReabrirNotasForoDto,
} from './dto/reabrir-notas-foro.dto';

import {
  ListarForosQueryDto,
} from './dto/listar-foros-query.dto';

import {
  CalificarForoMasivamenteDto,
} from './dto/calificar-foro-masivamente.dto';

import {
  GuardarCalificacionForoDto,
} from './dto/guardar-calificacion-foro.dto';

import {
  GuardarCriterioRubricaForoDto,
} from './dto/guardar-criterio-rubrica-foro.dto';

import {
  ForoAdministracionService,
} from './foro-administracion.service';

import {
  ForoCalificacionMasivaService,
} from './foro-calificacion-masiva.service';

import {
  ForoCalificacionService,
} from './foro-calificacion.service';

import {
  ForoCicloVidaService,
} from './foro-ciclo-vida.service';

import {
  ForoComentariosService,
} from './foro-comentarios.service';

import {
  ForoEstadisticasService,
} from './foro-estadisticas.service';

import {
  ForoLibroCalificacionesService,
} from './foro-libro-calificaciones.service';

import {
  ForoLecturasService,
} from './foro-lecturas.service';

import {
  ForoModeracionService,
} from './foro-moderacion.service';

import {
  ForoPublicacionNotasService,
} from './foro-publicacion-notas.service';

import {
  ForoRespuestasService,
} from './foro-respuestas.service';

import {
  ForoService,
} from './foro.service';

import {
  enviarArchivoReporte,
} from '../reportes/helpers/respuesta-reporte.helper';

import {
  ForoReportesService,
} from './foro-reportes.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type RequestAutenticada =
  Request & {
    user:
      UsuarioAutenticado;
  };

@Controller(
  'foro',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ForoController {
  constructor(
    private readonly foroService:
      ForoService,

    private readonly respuestasService:
      ForoRespuestasService,

    private readonly comentariosService:
      ForoComentariosService,

    private readonly administracionService:
      ForoAdministracionService,

    private readonly cicloVidaService:
      ForoCicloVidaService,

    private readonly moderacionService:
      ForoModeracionService,

    private readonly calificacionService:
      ForoCalificacionService,

    private readonly calificacionMasivaService:
      ForoCalificacionMasivaService,

    private readonly publicacionNotasService:
      ForoPublicacionNotasService,

    private readonly libroCalificacionesService:
      ForoLibroCalificacionesService,

    private readonly lecturasService:
      ForoLecturasService,

    private readonly estadisticasService:
      ForoEstadisticasService,

    private readonly reportesForoService:
      ForoReportesService,
  ) {}

  @Post(
    'cursos/:cursoId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  crearForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Body()
    datos:
      CrearForoDto,
  ) {
    return this.foroService.crearForo(
      request.user,
      cursoId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId',
  )
  @Header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  async listarForos(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Query()
    filtros:
      ListarForosQueryDto,
  ) {
    const foros =
      await this.foroService.listarForos(
      request.user,
      cursoId,
      filtros,
    );

    const forosConIndicadores =
      await this.lecturasService.enriquecerListado(
      request.user,
      cursoId,
      foros,
    );

    return this.lecturasService.filtrarOrdenarPaginar(
      forosConIndicadores,
      filtros,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId',
  )
  @Header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  async obtenerDetalle(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    const foro =
      await this.foroService.obtenerDetalle(
      request.user,
      cursoId,
      foroId,
    );

    await this.lecturasService.registrarLectura(
      request.user,
      cursoId,
      foroId,
    );

    return foro;
  }

  @Post(
    'cursos/:cursoId/:foroId/lectura',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  registrarLectura(
    @Req()
    request: RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId: number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId: number,
  ) {
    return this.lecturasService.registrarLectura(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/lecturas/resumen',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerResumenLecturas(
    @Req()
    request: RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId: number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId: number,
  ) {
    return this.lecturasService.obtenerResumenDocente(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/estadisticas',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerEstadisticas(
    @Req()
    request: RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId: number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId: number,
  ) {
    return this.estadisticasService.obtenerEstadisticas(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Put(
    'cursos/:cursoId/:foroId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  actualizarForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      ActualizarForoDto,
  ) {
    return this.foroService.actualizarForo(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/:foroId/estado',
  )
  @Roles(
    Rol.DOCENTE,
  )
  cambiarEstadoForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      CambiarEstadoForoDto,
  ) {
    return this.foroService.cambiarEstado(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Post(
    'cursos/:cursoId/:foroId/respuestas',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  crearRespuesta(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      CrearRespuestaForoDto,
  ) {
    return this.respuestasService.crear(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/respuestas',
  )
  @Header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  listarRespuestas(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.respuestasService.listar(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Put(
    'cursos/:cursoId/respuestas/:respuestaId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  actualizarRespuesta(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'respuestaId',
      ParseIntPipe,
    )
    respuestaId:
      number,

    @Body()
    datos:
      ActualizarRespuestaForoDto,
  ) {
    return this.respuestasService.actualizar(
      request.user,
      cursoId,
      respuestaId,
      datos,
    );
  }

  @Delete(
    'cursos/:cursoId/respuestas/:respuestaId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  eliminarRespuesta(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'respuestaId',
      ParseIntPipe,
    )
    respuestaId:
      number,
  ) {
    return this.respuestasService.eliminar(
      request.user,
      cursoId,
      respuestaId,
    );
  }

  @Post(
    'cursos/:cursoId/respuestas/:respuestaId/comentarios',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  crearComentario(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'respuestaId',
      ParseIntPipe,
    )
    respuestaId:
      number,

    @Body()
    datos:
      CrearComentarioForoDto,
  ) {
    return this.comentariosService.crear(
      request.user,
      cursoId,
      respuestaId,
      datos,
    );
  }

  @Put(
    'cursos/:cursoId/comentarios/:comentarioId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  actualizarComentario(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'comentarioId',
      ParseIntPipe,
    )
    comentarioId:
      number,

    @Body()
    datos:
      ActualizarComentarioForoDto,
  ) {
    return this.comentariosService.actualizar(
      request.user,
      cursoId,
      comentarioId,
      datos,
    );
  }

  @Delete(
    'cursos/:cursoId/comentarios/:comentarioId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  eliminarComentario(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'comentarioId',
      ParseIntPipe,
    )
    comentarioId:
      number,
  ) {
    return this.comentariosService.eliminar(
      request.user,
      cursoId,
      comentarioId,
    );
  }

  @Post(
    'cursos/:cursoId/:foroId/duplicar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  duplicarForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      DuplicarForoDto,
  ) {
    return this.administracionService.duplicarForo(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Delete(
    'cursos/:cursoId/:foroId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  eliminarForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.administracionService.eliminarForo(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/historial',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerHistorialForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.administracionService.obtenerHistorial(
      request.user,
      cursoId,
      foroId,
    );
  }


  @Patch(
    'cursos/:cursoId/:foroId/fijado',
  )
  @Roles(
    Rol.DOCENTE,
  )
  cambiarFijadoForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      CambiarFijadoForoDto,
  ) {
    return this.cicloVidaService.cambiarFijado(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/:foroId/plazo',
  )
  @Roles(
    Rol.DOCENTE,
  )
  extenderPlazoForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      ExtenderPlazoForoDto,
  ) {
    return this.cicloVidaService.extenderPlazo(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/:foroId/sincronizar-estado',
  )
  @Roles(
    Rol.DOCENTE,
  )
  sincronizarEstadoForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.cicloVidaService.sincronizarEstado(
      request.user,
      cursoId,
      foroId,
    );
  }


  @Patch(
    'cursos/:cursoId/respuestas/:respuestaId/moderar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  moderarRespuesta(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'respuestaId',
      ParseIntPipe,
    )
    respuestaId:
      number,

    @Body()
    datos:
      ModerarRespuestaForoDto,
  ) {
    return this.moderacionService.moderarRespuesta(
      request.user,
      cursoId,
      respuestaId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/respuestas/:respuestaId/bloqueo',
  )
  @Roles(
    Rol.DOCENTE,
  )
  bloquearRespuesta(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'respuestaId',
      ParseIntPipe,
    )
    respuestaId:
      number,

    @Body()
    datos:
      BloquearRespuestaForoDto,
  ) {
    return this.moderacionService.bloquearRespuesta(
      request.user,
      cursoId,
      respuestaId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/comentarios/:comentarioId/moderar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  moderarComentario(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'comentarioId',
      ParseIntPipe,
    )
    comentarioId:
      number,

    @Body()
    datos:
      ModerarComentarioForoDto,
  ) {
    return this.moderacionService.moderarComentario(
      request.user,
      cursoId,
      comentarioId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/moderacion',
  )
  @Roles(
    Rol.DOCENTE,
  )
  listarContenidoModerado(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.moderacionService.listarContenidoModerado(
      request.user,
      cursoId,
      foroId,
    );
  }


  @Get(
    'cursos/:cursoId/:foroId/calificaciones/panel',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerPanelCalificacion(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.calificacionService.obtenerPanel(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/calificaciones/exportar/:formato',
  )
  @Roles(
    Rol.DOCENTE,
  )
  async exportarCalificacionesForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Param(
      'formato',
    )
    formato:
      string,

    @Res()
    response:
      Response,
  ) {
    const archivo =
      await this.reportesForoService.generarCalificaciones(
        request.user,
        cursoId,
        foroId,
        formato,
      );

    enviarArchivoReporte(
      response,
      archivo,
    );
  }


  @Put(
    'cursos/:cursoId/:foroId/calificaciones/grupos/:origen/:grupoId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  guardarCalificacionGrupalForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Param(
      'origen',
    )
    origen:
      string,

    @Param(
      'grupoId',
      ParseIntPipe,
    )
    grupoId:
      number,

    @Body()
    datos:
      GuardarCalificacionForoDto,
  ) {
    return this.calificacionService.guardarCalificacionGrupo(
      request.user,
      cursoId,
      foroId,
      origen,
      grupoId,
      datos,
    );
  }

  @Put(
    'cursos/:cursoId/:foroId/calificaciones/estudiantes/:estudianteId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  guardarCalificacionForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Param(
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,

    @Body()
    datos:
      GuardarCalificacionForoDto,
  ) {
    return this.calificacionService.guardarCalificacion(
      request.user,
      cursoId,
      foroId,
      estudianteId,
      datos,
    );
  }

  @Put(
    'cursos/:cursoId/:foroId/calificaciones/estudiantes/:estudianteId/criterios/:criterioId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  guardarCriterioRubrica(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Param(
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,

    @Param(
      'criterioId',
      ParseIntPipe,
    )
    criterioId:
      number,

    @Body()
    datos:
      GuardarCriterioRubricaForoDto,
  ) {
    return this.calificacionService.guardarCriterioRubrica(
      request.user,
      cursoId,
      foroId,
      estudianteId,
      criterioId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId/:foroId/calificaciones/estudiantes/:estudianteId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerCalificacionEstudiante(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Param(
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,
  ) {
    return this.calificacionService.obtenerCalificacionEstudiante(
      request.user,
      cursoId,
      foroId,
      estudianteId,
    );
  }


  @Post(
    'cursos/:cursoId/:foroId/calificaciones/masivas/previsualizar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  previsualizarCalificacionMasiva(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      CalificarForoMasivamenteDto,
  ) {
    return this.calificacionMasivaService.previsualizar(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Post(
    'cursos/:cursoId/:foroId/calificaciones/masivas/aplicar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  aplicarCalificacionMasiva(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      CalificarForoMasivamenteDto,
  ) {
    return this.calificacionMasivaService.aplicar(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }


  @Get(
    'cursos/:cursoId/:foroId/calificaciones/publicacion/previsualizar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  previsualizarPublicacionNotas(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.publicacionNotasService.previsualizarPublicacion(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Patch(
    'cursos/:cursoId/:foroId/calificaciones/publicar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  publicarNotasForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      PublicarNotasForoDto,
  ) {
    return this.publicacionNotasService.publicarNotas(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/:foroId/calificaciones/reabrir',
  )
  @Roles(
    Rol.DOCENTE,
  )
  reabrirNotasForo(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,

    @Body()
    datos:
      ReabrirNotasForoDto,
  ) {
    return this.publicacionNotasService.reabrirNotas(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Get(
    'estudiante/cursos/:cursoId/:foroId/calificacion',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  obtenerNotaPublicadaEstudiante(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'foroId',
      ParseIntPipe,
    )
    foroId:
      number,
  ) {
    return this.publicacionNotasService.obtenerNotasPublicadasEstudiante(
      request.user,
      cursoId,
      foroId,
    );
  }


  @Get(
    'libro/cursos/:cursoId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerLibroCompletoDocente(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.libroCalificacionesService.obtenerLibroCompletoDocente(
      request.user,
      cursoId,
    );
  }

  @Get(
    'libro/cursos/:cursoId/estudiantes/:estudianteId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerLibroEstudianteDocente(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,
  ) {
    return this.libroCalificacionesService.obtenerLibroEstudianteDocente(
      request.user,
      cursoId,
      estudianteId,
    );
  }

  @Get(
    'libro/estudiante/cursos/:cursoId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  obtenerMiLibro(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.libroCalificacionesService.obtenerMiLibro(
      request.user,
      cursoId,
    );
  }

}