import {
  Body,
  Controller,
  Delete,
  Get,
  ParseFilePipeBuilder,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import type {
  Request,
} from 'express';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  ActualizarPerfilDto,
} from './dto/actualizar-perfil.dto';

import {
  CambiarPasswordPerfilDto,
} from './dto/cambiar-password-perfil.dto';

import {
  PerfilService,
} from './perfil.service';

import type {
  ArchivoPerfil,
} from './types/archivo-perfil.type';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: string;
};

type RequestConUsuario =
  Request & {
    user:
      UsuarioAutenticado;
  };

@Controller('perfil')
@UseGuards(
  JwtAuthGuard,
)
export class PerfilController {
  constructor(
    private readonly perfilService:
      PerfilService,
  ) {}

  @Get()
  obtenerPerfil(
    @Req()
    request:
      RequestConUsuario,
  ) {
    return this.perfilService
      .obtenerPerfil(
        request.user.id,
      );
  }

  @Put()
  actualizarPerfil(
    @Req()
    request:
      RequestConUsuario,

    @Body()
    datos:
      ActualizarPerfilDto,
  ) {
    return this.perfilService
      .actualizarPerfil(
        request.user.id,
        datos,
      );
  }

  @Put('password')
  cambiarPassword(
    @Req()
    request:
      RequestConUsuario,

    @Body()
    datos:
      CambiarPasswordPerfilDto,
  ) {
    return this.perfilService
      .cambiarPassword(
        request.user.id,
        datos,
      );
  }

  @Post('foto')
  @UseInterceptors(
    FileInterceptor(
      'foto',
      {
        limits: {
          fileSize:
            3 *
            1024 *
            1024,
        },
      },
    ),
  )
  actualizarFoto(
    @Req()
    request:
      RequestConUsuario,

    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize:
            3 *
            1024 *
            1024,

          message:
            'La fotografía no puede superar los 3 MB',
        })
        .addFileTypeValidator({
          fileType:
            /^image\/(jpeg|png|webp)$/,
        })
        .build({
          fileIsRequired:
            true,

          errorHttpStatusCode:
            400,
        }),
    )
    archivo:
      ArchivoPerfil,
  ) {
    return this.perfilService
      .actualizarFoto(
        request.user.id,
        archivo,
      );
  }

  @Delete('foto')
  eliminarFoto(
    @Req()
    request:
      RequestConUsuario,
  ) {
    return this.perfilService
      .eliminarFoto(
        request.user.id,
      );
  }
}