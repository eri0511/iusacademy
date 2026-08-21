import {
  Injectable,
} from '@nestjs/common';

import {
  Rol,
} from '../../../generated/prisma/client';

import {
  PrismaService,
} from '../../../prisma/prisma.service';

import {
  AlineacionReporte,
  ArchivoReporteGenerado,
  DefinicionReporte,
  FormatoReporte,
  OrientacionReporte,
  ReportesVerificacionService,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../../reportes';

import {
  EstadoActivacionReporte,
  EstadoUsuarioReporte,
  ExportarUsuariosDto,
} from '../dto/exportar-usuarios.dto';

import type {
  UsuarioAutenticado,
} from '../interfaces/usuario-autenticado.interface';

type UsuarioConsultado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
  estaActivo: boolean;
  cuentaActivada: boolean;
  accesoEnviadoEn: Date | null;
  creadoEn: Date;
};

type FilaResumenUsuarios = Record<string, ValorCeldaReporte> & {
  total: number;
  estudiantes: number;
  docentes: number;
  administradores: number;
  activos: number;
  pendientes: number;
};

type FilaUsuario = Record<string, ValorCeldaReporte> & {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  estado: string;
  activacion: string;
  accesoEnviadoEn: Date | null;
  creadoEn: Date;
};

@Injectable()
export class UsuariosReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  async generarReporteGeneral(
    formato: FormatoReporte,
    filtros: ExportarUsuariosDto,
    generadoPor: UsuarioAutenticado,
  ): Promise<ArchivoReporteGenerado> {
    const usuarios = await this.consultarUsuarios(filtros);
    const definicion = this.construirDefinicion(
      usuarios,
      filtros,
      generadoPor,
    );

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo: 'USUARIOS_GENERAL',
        generadoPorId: generadoPor.id,
        filtros: this.etiquetasFiltros(filtros),
      },
      'reporte-general-usuarios-iusacademy',
    );
  }

  private consultarUsuarios(
    filtros: ExportarUsuariosDto,
  ): Promise<UsuarioConsultado[]> {
    return this.prisma.usuario.findMany({
      where: {
        rol: filtros.rol,
        estaActivo:
          filtros.estado === EstadoUsuarioReporte.ACTIVOS
            ? true
            : filtros.estado === EstadoUsuarioReporte.INACTIVOS
              ? false
              : undefined,
        cuentaActivada:
          filtros.activacion === EstadoActivacionReporte.ACTIVADOS
            ? true
            : filtros.activacion === EstadoActivacionReporte.PENDIENTES
              ? false
              : undefined,
      },
      orderBy: [
        { rol: 'asc' },
        { apellidoPaterno: 'asc' },
        { nombres: 'asc' },
      ],
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        accesoEnviadoEn: true,
        creadoEn: true,
      },
    });
  }

  private construirDefinicion(
    usuarios: UsuarioConsultado[],
    filtros: ExportarUsuariosDto,
    generadoPor: UsuarioAutenticado,
  ): DefinicionReporte<FilaResumenUsuarios | FilaUsuario> {
    const resumen: FilaResumenUsuarios = {
      total: usuarios.length,
      estudiantes: usuarios.filter((usuario) => usuario.rol === Rol.ESTUDIANTE).length,
      docentes: usuarios.filter((usuario) => usuario.rol === Rol.DOCENTE).length,
      administradores: usuarios.filter((usuario) => usuario.rol === Rol.ADMINISTRADOR).length,
      activos: usuarios.filter((usuario) => usuario.estaActivo).length,
      pendientes: usuarios.filter((usuario) => !usuario.cuentaActivada).length,
    };

    const filas: FilaUsuario[] = usuarios.map((usuario) => ({
      id: usuario.id,
      nombreCompleto: [
        usuario.nombres,
        usuario.apellidoPaterno,
        usuario.apellidoMaterno,
      ].filter(Boolean).join(' '),
      correo: usuario.correo,
      rol: this.etiquetaRol(usuario.rol),
      estado: usuario.estaActivo ? 'Activo' : 'Inactivo',
      activacion: usuario.cuentaActivada ? 'Activada' : 'Pendiente',
      accesoEnviadoEn: usuario.accesoEnviadoEn,
      creadoEn: usuario.creadoEn,
    }));

    return {
      metadatos: {
        titulo: 'Reporte general de usuarios',
        subtitulo: 'Gestión administrativa de cuentas de IusAcademy',
        descripcion:
          'Resumen institucional de usuarios registrados, roles, estado de acceso y activación de cuentas.',
        generadoPor: [
          generadoPor.nombres,
          generadoPor.apellidoPaterno,
        ].filter(Boolean).join(' '),
        filtros: this.etiquetasFiltros(filtros),
        textoPie: 'IusAcademy · Formación jurídica por competencias · UNIFRANZ',
      },
      opciones: {
        orientacion: OrientacionReporte.HORIZONTAL,
        incluirQr: true,
        incluirFiltros: true,
        incluirFechaHora: true,
        nombreHojaExcel: 'Usuarios',
        incluirBomCsv: true,
      },
      secciones: [
        {
          id: 'resumen',
          titulo: 'Resumen general',
          filas: [resumen],
          mostrarNumeroFila: false,
          columnas: [
            { clave: 'total', etiqueta: 'Total', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
            { clave: 'estudiantes', etiqueta: 'Estudiantes', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
            { clave: 'docentes', etiqueta: 'Docentes', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
            { clave: 'administradores', etiqueta: 'Administradores', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
            { clave: 'activos', etiqueta: 'Activos', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
            { clave: 'pendientes', etiqueta: 'Pendientes', tipo: TipoDatoReporte.NUMERO, alineacion: AlineacionReporte.CENTRO },
          ],
        },
        {
          id: 'usuarios',
          titulo: 'Detalle de usuarios',
          descripcion: `${usuarios.length} usuario(s) encontrado(s)`,
          filas,
          mostrarNumeroFila: true,
          columnas: [
            { clave: 'nombreCompleto', etiqueta: 'Nombre completo', ancho: 1.7 },
            { clave: 'correo', etiqueta: 'Correo', ancho: 1.8 },
            { clave: 'rol', etiqueta: 'Rol', ancho: 0.9, alineacion: AlineacionReporte.CENTRO },
            { clave: 'estado', etiqueta: 'Estado', ancho: 0.8, alineacion: AlineacionReporte.CENTRO },
            { clave: 'activacion', etiqueta: 'Activación', ancho: 0.9, alineacion: AlineacionReporte.CENTRO },
            { clave: 'accesoEnviadoEn', etiqueta: 'Acceso enviado', tipo: TipoDatoReporte.FECHA_HORA, ancho: 1.15 },
            { clave: 'creadoEn', etiqueta: 'Registro', tipo: TipoDatoReporte.FECHA_HORA, ancho: 1.15 },
          ],
        },
      ],
    };
  }

  private etiquetasFiltros(
    filtros: ExportarUsuariosDto,
  ): Record<string, string> {
    return {
      Rol: filtros.rol ? this.etiquetaRol(filtros.rol) : 'Todos',
      Estado:
        filtros.estado === EstadoUsuarioReporte.ACTIVOS
          ? 'Activos'
          : filtros.estado === EstadoUsuarioReporte.INACTIVOS
            ? 'Inactivos'
            : 'Todos',
      Activación:
        filtros.activacion === EstadoActivacionReporte.ACTIVADOS
          ? 'Activadas'
          : filtros.activacion === EstadoActivacionReporte.PENDIENTES
            ? 'Pendientes'
            : 'Todas',
    };
  }

  private etiquetaRol(rol: Rol): string {
    switch (rol) {
      case Rol.ADMINISTRADOR:
        return 'Administrador';
      case Rol.DOCENTE:
        return 'Docente';
      case Rol.ESTUDIANTE:
        return 'Estudiante';
    }
  }
}

