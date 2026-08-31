import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: string;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body()
    datos: LoginDto,
  ) {
    return this.authService.login(datos);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(
    @Req()
    request: RequestConUsuario,
  ) {
    return {
      usuario: request.user,
    };
  }
}
