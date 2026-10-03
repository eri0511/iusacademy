import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import type { Request, Response } from 'express';

import { Rol } from '../../generated/prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { BibliotecaGestionGuard } from './biblioteca-gestion.guard';

import { BibliotecaService } from './biblioteca.service';

import type {
  ArchivoBiblioteca,
  UsuarioBiblioteca,
} from './biblioteca.service';

import {
  ActualizarRecursoBibliotecaDto,
  ArchivoBibliotecaDto,
  AtenderReporteBibliotecaDto,
  ColeccionBibliotecaDto,
  ConsultarBibliotecaDto,
  CrearRecursoBibliotecaDto,
  EnlaceBibliotecaDto,
  EstadoBibliotecaDto,
  RelacionesBibliotecaDto,
  ReportarBibliotecaDto,
} from './dto/biblioteca.dto';
type Peticion = Request & { user: UsuarioBiblioteca };
const subida = {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 3, fieldSize: 5000 },
};
@Controller('biblioteca')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR, Rol.DOCENTE, Rol.ESTUDIANTE)
export class BibliotecaController {
  constructor(private readonly servicio: BibliotecaService) {}
  @Get('capacidades') capacidades(@Req() r: Peticion) {
    return this.servicio.capacidades(r.user);
  }
  @Get('resumen') resumen(@Req() r: Peticion) {
    return this.servicio.resumen(r.user);
  }
  @Get('mis-descargas') descargasPersonales(
    @Req() r: Peticion,
    @Query() q: ConsultarBibliotecaDto,
  ) {
    return this.servicio.actividadPersonal(r.user, 'descarga', q);
  }
  @Get('mis-consultas') consultasPersonales(
    @Req() r: Peticion,
    @Query() q: ConsultarBibliotecaDto,
  ) {
    return this.servicio.actividadPersonal(r.user, 'consulta', q);
  }
  @Post('recursos/:id/visualizaciones') visualizar(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.registrarConsulta(r.user, id);
  }
  @Get('filtros') filtros() {
    return this.servicio.filtros();
  }
  @Get('recursos') listar(
    @Req() r: Peticion,
    @Query() q: ConsultarBibliotecaDto,
  ) {
    return this.servicio.listar(r.user, q);
  }
  @Post('recursos')
  @UseGuards(BibliotecaGestionGuard)
  crear(@Req() r: Peticion, @Body() dto: CrearRecursoBibliotecaDto) {
    return this.servicio.crear(r.user, dto);
  }
  @Get('recursos/:id') detalle(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.detalle(r.user, id);
  }
  @Patch('recursos/:id')
  @UseGuards(BibliotecaGestionGuard)
  actualizar(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRecursoBibliotecaDto,
  ) {
    return this.servicio.actualizar(r.user, id, dto);
  }
  @Patch('recursos/:id/estado')
  @UseGuards(BibliotecaGestionGuard)
  estado(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EstadoBibliotecaDto,
  ) {
    return this.servicio.estado(r.user, id, dto.estado);
  }
  @Delete('recursos/:id')
  @Roles(Rol.ADMINISTRADOR)
  @UseGuards(BibliotecaGestionGuard)
  archivar(@Req() r: Peticion, @Param('id', ParseIntPipe) id: number) {
    return this.servicio.estado(r.user, id, 'ARCHIVADO');
  }
  @Post('recursos/:id/enlaces')
  @UseGuards(BibliotecaGestionGuard)
  enlace(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnlaceBibliotecaDto,
  ) {
    return this.servicio.agregarEnlace(r.user, id, dto);
  }
  @Patch('recursos/:id/enlaces/:contenidoId')
  @UseGuards(BibliotecaGestionGuard)
  actualizarEnlace(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
    @Body() dto: EnlaceBibliotecaDto,
  ) {
    return this.servicio.actualizarEnlace(r.user, id, contenidoId, dto);
  }
  @Post('recursos/:id/archivos')
  @UseGuards(BibliotecaGestionGuard)
  @UseInterceptors(FileInterceptor('archivo', subida))
  archivo(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ArchivoBibliotecaDto,
    @UploadedFile() archivo?: ArchivoBiblioteca,
  ) {
    return this.servicio.subir(r.user, id, dto, archivo);
  }
  @Post('recursos/:id/contenidos/:contenidoId/versiones')
  @UseGuards(BibliotecaGestionGuard)
  @UseInterceptors(FileInterceptor('archivo', subida))
  version(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
    @Body() dto: ArchivoBibliotecaDto,
    @UploadedFile() archivo?: ArchivoBiblioteca,
  ) {
    return this.servicio.subir(r.user, id, dto, archivo, contenidoId);
  }
  @Get('recursos/:id/contenidos/:contenidoId/versiones')
  @UseGuards(BibliotecaGestionGuard)
  versiones(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
  ) {
    return this.servicio.versiones(r.user, id, contenidoId);
  }
  @Delete('recursos/:id/contenidos/:contenidoId')
  @Roles(Rol.ADMINISTRADOR)
  @UseGuards(BibliotecaGestionGuard)
  quitarContenido(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
  ) {
    return this.servicio.desactivarContenido(r.user, id, contenidoId);
  }
  @Put('recursos/:id/relacionados')
  @UseGuards(BibliotecaGestionGuard)
  relacionados(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RelacionesBibliotecaDto,
  ) {
    return this.servicio.relacionar(r.user, id, dto.ids);
  }
  @Get('archivos/:versionId/vista-previa')
  async vista(
    @Req() r: Peticion,
    @Param('versionId', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.servir(r.user, id, res, false);
  }
  @Get('archivos/:versionId/descargar')
  async descargar(
    @Req() r: Peticion,
    @Param('versionId', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.servir(r.user, id, res, true);
  }
  private async servir(
    usuario: UsuarioBiblioteca,
    id: number,
    res: Response,
    descarga: boolean,
  ) {
    const archivo = await this.servicio.archivo(usuario, id, descarga);
    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${descarga ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
    );
    res.setHeader('Content-Length', archivo.buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(archivo.buffer);
  }
  @Get('favoritos') favoritos(@Req() r: Peticion) {
    return this.servicio.favoritos(r.user);
  }
  @Put('recursos/:id/favorito') favorito(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.favorito(r.user, id, true);
  }
  @Delete('recursos/:id/favorito') quitarFavorito(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.favorito(r.user, id, false);
  }
  @Get('colecciones') colecciones(@Req() r: Peticion) {
    return this.servicio.colecciones(r.user);
  }
  @Post('colecciones') crearColeccion(
    @Req() r: Peticion,
    @Body() dto: ColeccionBibliotecaDto,
  ) {
    return this.servicio.crearColeccion(r.user, dto);
  }
  @Patch('colecciones/:id')
  actualizarColeccion(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ColeccionBibliotecaDto,
  ) {
    return this.servicio.actualizarColeccion(r.user, id, dto);
  }
  @Delete('colecciones/:id') eliminarColeccion(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.eliminarColeccion(r.user, id);
  }
  @Put('colecciones/:coleccionId/recursos/:id') agregarColeccion(
    @Req() r: Peticion,
    @Param('coleccionId', ParseIntPipe) coleccionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.coleccionRecurso(r.user, coleccionId, id, true);
  }
  @Delete('colecciones/:coleccionId/recursos/:id') quitarColeccion(
    @Req() r: Peticion,
    @Param('coleccionId', ParseIntPipe) coleccionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicio.coleccionRecurso(r.user, coleccionId, id, false);
  }
  @Post('recursos/:id/reportes') reportar(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReportarBibliotecaDto,
  ) {
    return this.servicio.reportar(r.user, id, dto.motivo);
  }
  @Get('reportes')
  @UseGuards(BibliotecaGestionGuard)
  reportes(@Req() r: Peticion, @Query() q: ConsultarBibliotecaDto) {
    return this.servicio.reportes(r.user, q.pagina);
  }
  @Patch('reportes/:id')
  @UseGuards(BibliotecaGestionGuard)
  atender(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtenderReporteBibliotecaDto,
  ) {
    return this.servicio.atenderReporte(r.user, id, dto);
  }
  @Get('historial')
  @Roles(Rol.ADMINISTRADOR)
  historialGeneral(@Req() r: Peticion, @Query() q: ConsultarBibliotecaDto) {
    return this.servicio.historialGeneral(r.user, q.pagina);
  }
  @Get('permisos')
  @Roles(Rol.ADMINISTRADOR)
  permisos(@Req() r: Peticion) {
    return this.servicio.permisos(r.user);
  }
  @Get('docentes')
  @Roles(Rol.ADMINISTRADOR)
  docentes(@Req() r: Peticion) {
    return this.servicio.docentes(r.user);
  }
  @Put('permisos/:docenteId')
  @Roles(Rol.ADMINISTRADOR)
  otorgar(@Req() r: Peticion, @Param('docenteId', ParseIntPipe) id: number) {
    return this.servicio.permiso(r.user, id, true);
  }
  @Delete('permisos/:docenteId')
  @Roles(Rol.ADMINISTRADOR)
  revocar(@Req() r: Peticion, @Param('docenteId', ParseIntPipe) id: number) {
    return this.servicio.permiso(r.user, id, false);
  }
  @Get('recursos/:id/historial')
  @UseGuards(BibliotecaGestionGuard)
  historial(
    @Req() r: Peticion,
    @Param('id', ParseIntPipe) id: number,
    @Query() q: ConsultarBibliotecaDto,
  ) {
    return this.servicio.historialRecurso(r.user, id, q.pagina);
  }
}
