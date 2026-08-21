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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  memoryStorage,
} from 'multer';

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
  ArchivosService,
} from './archivos.service';

import {
  ActualizarArchivoDto,
} from './dto/actualizar-archivo.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type RequestAutenticada =
  Request & {
    user:
      UsuarioAutenticado;
  };

type ArchivoMulter = {
  originalname:
    string;

  mimetype:
    string;

  size:
    number;

  buffer:
    Buffer;
};

@Controller(
  'archivos',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ArchivosController {
  constructor(
    private readonly archivosService:
      ArchivosService,
  ) {}

  @Post(
    'foro/cursos/:cursoId/temas/:foroId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      {
        storage:
          memoryStorage(),
        limits: {
          fileSize:
            100 *
            1024 *
            1024,
        },
      },
    ),
  )
  subirTema(
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

    @UploadedFile()
    archivo:
      ArchivoMulter | undefined,
  ) {
    return this.archivosService.subirArchivoTema(
      request.user,
      cursoId,
      foroId,
      archivo,
    );
  }

  @Post(
    'foro/cursos/:cursoId/respuestas/:respuestaId',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      {
        storage:
          memoryStorage(),
        limits: {
          fileSize:
            100 *
            1024 *
            1024,
        },
      },
    ),
  )
  subirRespuesta(
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

    @UploadedFile()
    archivo:
      ArchivoMulter | undefined,
  ) {
    return this.archivosService.subirArchivoRespuesta(
      request.user,
      cursoId,
      respuestaId,
      archivo,
    );
  }

  @Post(
    'foro/cursos/:cursoId/comentarios/:comentarioId',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      {
        storage:
          memoryStorage(),
        limits: {
          fileSize:
            100 *
            1024 *
            1024,
        },
      },
    ),
  )
  subirComentario(
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

    @UploadedFile()
    archivo:
      ArchivoMulter | undefined,
  ) {
    return this.archivosService.subirArchivoComentario(
      request.user,
      cursoId,
      comentarioId,
      archivo,
    );
  }

  @Post(
    'tareas/cursos/:cursoId/entregas/:entregaId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      {
        storage:
          memoryStorage(),
        limits: {
          fileSize:
            100 *
            1024 *
            1024,
        },
      },
    ),
  )
  subirEntregaTarea(
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
      'entregaId',
      ParseIntPipe,
    )
    entregaId:
      number,

    @UploadedFile()
    archivo:
      ArchivoMulter | undefined,
  ) {
    return this.archivosService.subirArchivoEntregaTarea(
      request.user,
      cursoId,
      entregaId,
      archivo,
    );
  }

  @Get(
    ':archivoId',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  obtener(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'archivoId',
      ParseIntPipe,
    )
    archivoId:
      number,
  ) {
    return this.archivosService.obtenerPorId(
      request.user,
      archivoId,
    );
  }

  @Get(
    ':archivoId/descargar',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  async descargar(
    @Req()
    request:
      RequestAutenticada,

    @Res()
    response:
      Response,

    @Param(
      'archivoId',
      ParseIntPipe,
    )
    archivoId:
      number,
  ) {
    const resultado =
      await this.archivosService.descargar(
        request.user,
        archivoId,
      );

    const nombreSeguro =
      resultado.nombreOriginal.replace(
        /[\r\n"]/g,
        '_',
      );

    response.setHeader(
      'Content-Type',
      resultado.mimeType,
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(nombreSeguro)}`,
    );
    response.setHeader(
      'Content-Length',
      resultado.buffer.length.toString(),
    );

    response.send(
      resultado.buffer,
    );
  }

  @Patch(
    ':archivoId',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  actualizar(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'archivoId',
      ParseIntPipe,
    )
    archivoId:
      number,

    @Body()
    datos:
      ActualizarArchivoDto,
  ) {
    return this.archivosService.actualizar(
      request.user,
      archivoId,
      datos,
    );
  }

  @Delete(
    ':archivoId',
  )
  @Roles(
    Rol.DOCENTE,
    Rol.ESTUDIANTE,
  )
  eliminar(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'archivoId',
      ParseIntPipe,
    )
    archivoId:
      number,
  ) {
    return this.archivosService.eliminar(
      request.user,
      archivoId,
    );
  }
}
