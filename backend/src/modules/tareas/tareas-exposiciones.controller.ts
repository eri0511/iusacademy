import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActualizarDiapositivaExposicionDto } from './dto/actualizar-diapositiva-exposicion.dto';
import { ActualizarPreguntaExposicionDto } from './dto/actualizar-pregunta-exposicion.dto';
import { ConfigurarJornadaExposicionDto } from './dto/configurar-jornada-exposicion.dto';
import { CrearPreguntaExposicionDto } from './dto/crear-pregunta-exposicion.dto';
import { ReordenarTurnosExposicionDto } from './dto/reordenar-turnos-exposicion.dto';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';
import { TareasExposicionesAnalisisService } from './tareas-exposiciones-analisis.service';
import { TareasExposicionesService } from './tareas-exposiciones.service';

type RequestAutenticada = Request & { user: UsuarioAutenticado };

@Controller('tareas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TareasExposicionesController {
  constructor(
    private readonly exposicionesService: TareasExposicionesService,
    private readonly analisisService: TareasExposicionesAnalisisService,
  ) {}

  @Post('docente/cursos/:cursoId/:tareaId/exposicion/jornadas')
  @Roles(Rol.DOCENTE)
  configurarJornada(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Body() datos: ConfigurarJornadaExposicionDto,
  ) {
    return this.exposicionesService.configurarJornada(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }

  @Get('docente/cursos/:cursoId/:tareaId/exposicion/sala')
  @Roles(Rol.DOCENTE)
  obtenerSalaDocente(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
  ) {
    return this.exposicionesService.obtenerSalaDocente(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/orden')
  @Roles(Rol.DOCENTE)
  reordenar(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Body() datos: ReordenarTurnosExposicionDto,
  ) {
    return this.exposicionesService.reordenar(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      datos,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/iniciar')
  @Roles(Rol.DOCENTE)
  iniciarJornada(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.exposicionesService.iniciarJornada(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/finalizar')
  @Roles(Rol.DOCENTE)
  finalizarJornada(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
  ) {
    return this.exposicionesService.finalizarJornada(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/iniciar')
  @Roles(Rol.DOCENTE)
  iniciarTurno(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.exposicionesService.iniciarTurno(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/pausar')
  @Roles(Rol.DOCENTE)
  pausarTurno(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.exposicionesService.pausarTurno(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/reanudar')
  @Roles(Rol.DOCENTE)
  reanudarTurno(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.exposicionesService.reanudarTurno(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/finalizar')
  @Roles(Rol.DOCENTE)
  finalizarTurno(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.exposicionesService.finalizarTurno(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/diapositiva')
  @Roles(Rol.DOCENTE)
  actualizarDiapositiva(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() datos: ActualizarDiapositivaExposicionDto,
  ) {
    return this.exposicionesService.actualizarDiapositiva(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
      datos,
    );
  }

  @Patch('estudiante/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/presentar')
  @Roles(Rol.ESTUDIANTE)
  tomarControlPresentacion(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.exposicionesService.tomarControlPresentacionEstudiante(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Patch('estudiante/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/diapositiva')
  @Roles(Rol.ESTUDIANTE)
  actualizarDiapositivaEstudiante(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() datos: ActualizarDiapositivaExposicionDto,
  ) {
    return this.exposicionesService.actualizarDiapositivaEstudiante(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
      datos,
    );
  }

  @Get(
    'docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/analisis',
  )
  @Roles(Rol.DOCENTE)
  obtenerAnalisisExposicion(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.analisisService.obtenerAnalisis(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Post(
    'docente/cursos/:cursoId/:tareaId/exposicion/jornadas/:jornadaId/turnos/:turnoId/analisis',
  )
  @Roles(Rol.DOCENTE)
  generarAnalisisExposicion(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('jornadaId', ParseIntPipe) jornadaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ) {
    return this.analisisService.generarAnalisis(
      request.user,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );
  }

  @Get('estudiante/cursos/:cursoId/:tareaId/exposicion/sala')
  @Roles(Rol.ESTUDIANTE)
  obtenerSalaEstudiante(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
  ) {
    return this.exposicionesService.obtenerSalaEstudiante(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Post('estudiante/cursos/:cursoId/:tareaId/exposicion/turnos/:turnoId/preguntas')
  @Roles(Rol.ESTUDIANTE)
  crearPregunta(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() datos: CrearPreguntaExposicionDto,
  ) {
    return this.exposicionesService.crearPregunta(
      request.user,
      cursoId,
      tareaId,
      turnoId,
      datos,
    );
  }

  @Post('estudiante/cursos/:cursoId/:tareaId/exposicion/preguntas/:preguntaId/voto')
  @Roles(Rol.ESTUDIANTE)
  votarPregunta(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('preguntaId', ParseIntPipe) preguntaId: number,
  ) {
    return this.exposicionesService.votarPregunta(
      request.user,
      cursoId,
      tareaId,
      preguntaId,
    );
  }

  @Delete('estudiante/cursos/:cursoId/:tareaId/exposicion/preguntas/:preguntaId/voto')
  @Roles(Rol.ESTUDIANTE)
  quitarVotoPregunta(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('preguntaId', ParseIntPipe) preguntaId: number,
  ) {
    return this.exposicionesService.quitarVotoPregunta(
      request.user,
      cursoId,
      tareaId,
      preguntaId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/exposicion/preguntas/:preguntaId')
  @Roles(Rol.DOCENTE)
  actualizarPregunta(
    @Req() request: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('tareaId', ParseIntPipe) tareaId: number,
    @Param('preguntaId', ParseIntPipe) preguntaId: number,
    @Body() datos: ActualizarPreguntaExposicionDto,
  ) {
    return this.exposicionesService.actualizarPregunta(
      request.user,
      cursoId,
      tareaId,
      preguntaId,
      datos,
    );
  }
}
