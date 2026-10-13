import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { extname } from 'node:path';

import {
  Rol,
  CategoriaBiblioteca,
  Prisma,
  EstadoRecursoBiblioteca,
  TipoContenidoBiblioteca,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AlmacenamientoArchivos } from '../archivos/almacenamiento/almacenamiento.interface';

import {
  ActualizarRecursoBibliotecaDto,
  CrearRecursoBibliotecaDto,
  ConsultarBibliotecaDto,
  ArchivoBibliotecaDto,
  EnlaceBibliotecaDto,
  ColeccionBibliotecaDto,
  AtenderReporteBibliotecaDto,
} from './dto/biblioteca.dto';
export type UsuarioBiblioteca = { id: number; rol: Rol };
export type ArchivoBiblioteca = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype: string;
};
type Tx = Prisma.TransactionClient;
const archivoSelect = {
  id: true,
  numeroVersion: true,
  nombreOriginal: true,
  mimeType: true,
  extension: true,
  tamanioBytes: true,
  motivoActualizacion: true,
  creadoEn: true,
} as const;
const contenidoInclude = {
  versiones: {
    where: { esVigente: true },
    orderBy: { numeroVersion: 'desc' as const },
    take: 1,
    select: archivoSelect,
  },
};
@Injectable()
export class BibliotecaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly almacenamiento: AlmacenamientoArchivos,
  ) {}

  async puedeGestionar(
    usuario: UsuarioBiblioteca,
    db: Tx | PrismaService = this.prisma,
  ) {
    const actual = await db.usuario.findUnique({
      where: { id: usuario.id },
      select: { rol: true, estaActivo: true, cuentaActivada: true },
    });
    if (!actual?.estaActivo || !actual.cuentaActivada) return false;
    if (actual.rol === Rol.ADMINISTRADOR) return true;
    if (actual.rol !== Rol.DOCENTE) return false;
    return !!(await db.permisoGestionBiblioteca.findFirst({
      where: { docenteId: usuario.id, estaActivo: true },
      select: { id: true },
    }));
  }
  private async exigirAdmin(
    db: Tx | PrismaService,
    usuario: UsuarioBiblioteca,
  ) {
    const actual = await db.usuario.findUnique({
      where: { id: usuario.id },
      select: { rol: true, estaActivo: true, cuentaActivada: true },
    });
    if (
      !actual?.estaActivo ||
      !actual.cuentaActivada ||
      actual.rol !== Rol.ADMINISTRADOR
    )
      throw new ForbiddenException(
        'Esta operación está reservada al administrador de biblioteca',
      );
  }
  private async gestionar<T>(
    usuario: UsuarioBiblioteca,
    accion: (tx: Tx) => Promise<T>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // Serializa cambios y revocaciones; una operación posterior a revocar debe volver a validar.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(184702, 1)`;
        if (!(await this.puedeGestionar(usuario, tx)))
          throw new ForbiddenException(
            'No tienes permiso para gestionar la biblioteca',
          );
        return accion(tx);
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }
  private historial(
    tx: Tx,
    usuario: UsuarioBiblioteca,
    accion: string,
    recursoId?: number,
    datos?: Prisma.InputJsonValue,
  ) {
    return tx.historialBiblioteca.create({
      data: {
        actorId: usuario.id,
        accion,
        recursoId,
        ...(datos !== undefined ? { datos } : {}),
      },
    });
  }
  private async buscar(db: Tx | PrismaService, id: number) {
    const recurso = await db.recursoBiblioteca.findUnique({ where: { id } });
    if (!recurso) throw new NotFoundException('El recurso no existe');
    return recurso;
  }
  private async consultar(usuario: UsuarioBiblioteca, id: number) {
    const recurso = await this.buscar(this.prisma, id);
    if (
      recurso.estado !== EstadoRecursoBiblioteca.PUBLICADO &&
      !(await this.puedeGestionar(usuario))
    )
      throw new NotFoundException('El recurso no está disponible');
    return recurso;
  }
  private datos(
    dto: CrearRecursoBibliotecaDto | ActualizarRecursoBibliotecaDto,
  ) {
    const { fechaDocumento, ...otros } = dto;
    const datos: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(otros)) {
      if (value === undefined) continue;
      if (value === null)
        throw new BadRequestException(
          'Usa un texto vacío para limpiar campos opcionales',
        );
      datos[key] = typeof value === 'string' ? value.trim() : value;
    }
    if (datos.titulo !== undefined && String(datos.titulo).length < 3)
      throw new BadRequestException('El título es demasiado corto');
    if (
      datos.descripcion !== undefined &&
      String(datos.descripcion).length < 10
    )
      throw new BadRequestException('La descripción es demasiado corta');
    if (datos.tema !== undefined && String(datos.tema).length < 2)
      throw new BadRequestException('Debes indicar el tema');
    if (dto.etiquetas)
      datos.etiquetas = [
        ...new Set(
          dto.etiquetas.map((x) => x.trim().toLowerCase()).filter(Boolean),
        ),
      ];
    if (fechaDocumento !== undefined) {
      if (!fechaDocumento)
        throw new BadRequestException('Fecha de documento inválida');
      datos.fechaDocumento = new Date(fechaDocumento);
    }
    if (dto.vigencia !== undefined)
      datos.vigenciaVerificadaEn =
        dto.vigencia === 'POR_VERIFICAR' || dto.vigencia === 'NO_APLICA'
          ? null
          : new Date();
    return datos;
  }
  async registrarConsulta(usuario: UsuarioBiblioteca, id: number) {
    const recurso = await this.consultar(usuario, id);
    if (recurso.estado !== 'PUBLICADO') return { registrado: false };
    await this.prisma.$transaction((tx) =>
      this.historial(tx, usuario, 'CONSULTADO', id),
    );
    return { registrado: true };
  }
  async actividadPersonal(
    usuario: UsuarioBiblioteca,
    tipo: 'consulta' | 'descarga',
    dto: ConsultarBibliotecaDto,
  ) {
    const where: Prisma.HistorialBibliotecaWhereInput = {
      actorId: usuario.id,
      accion: tipo === 'consulta' ? 'CONSULTADO' : 'DESCARGADO',
      recurso: {
        estado: 'PUBLICADO',
        ...(dto.q
          ? { titulo: { contains: dto.q.trim(), mode: 'insensitive' } }
          : {}),
      },
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.historialBiblioteca.count({ where }),
      this.prisma.historialBiblioteca.findMany({
        where,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        skip: (dto.pagina - 1) * dto.limite,
        take: dto.limite,
        select: {
          id: true,
          creadoEn: true,
          datos: true,
          recurso: { select: { id: true, titulo: true, categoria: true } },
        },
      }),
    ]);
    return {
      items: items.flatMap((item) =>
        item.recurso
          ? [
              {
                registroId: item.id,
                ...item.recurso,
                fecha: item.creadoEn,
                archivo:
                  typeof item.datos === 'object' &&
                  item.datos !== null &&
                  'archivo' in item.datos
                    ? item.datos.archivo
                    : null,
              },
            ]
          : [],
      ),
      total,
      pagina: dto.pagina,
      paginas: Math.ceil(total / dto.limite),
    };
  }
  async resumen(usuario: UsuarioBiblioteca) {
    const [recursos, consultas, descargas, favoritos] = await Promise.all([
      this.prisma.recursoBiblioteca.findMany({
        where: { estado: 'PUBLICADO' },
        select: { id: true, categoria: true },
      }),
      this.prisma.historialBiblioteca.groupBy({
        by: ['recursoId'],
        where: { accion: 'CONSULTADO', recurso: { estado: 'PUBLICADO' } },
        _count: { _all: true },
      }),
      this.prisma.historialBiblioteca.count({
        where: {
          actorId: usuario.id,
          accion: 'DESCARGADO',
          recurso: { estado: 'PUBLICADO' },
        },
      }),
      this.prisma.favoritoBiblioteca.count({
        where: { usuarioId: usuario.id, recurso: { estado: 'PUBLICADO' } },
      }),
    ]);
    const porRecurso = new Map(
      consultas.map((c) => [c.recursoId, c._count._all]),
    );
    return {
      totalRecursos: recursos.length,
      descargasPersonales: descargas,
      favoritosPersonales: favoritos,
      categorias: Object.values(CategoriaBiblioteca)
        .map((categoria) => ({
          categoria,
          total: recursos.filter((r) => r.categoria === categoria).length,
          visualizaciones: recursos
            .filter((r) => r.categoria === categoria)
            .reduce((n, r) => n + (porRecurso.get(r.id) ?? 0), 0),
        }))
        .sort((a, b) => b.visualizaciones - a.visualizaciones),
    };
  }
  async capacidades(usuario: UsuarioBiblioteca) {
    const gestor = await this.puedeGestionar(usuario);
    const actual = await this.prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: { rol: true },
    });
    const admin = gestor && actual?.rol === Rol.ADMINISTRADOR;
    return {
      puedeConsultar: true,
      puedeGestionar: gestor,
      puedeCrear: gestor,
      puedeEditar: gestor,
      puedeEliminar: admin,
      puedeDelegar: admin,
    };
  }
  async listar(usuario: UsuarioBiblioteca, dto: ConsultarBibliotecaDto) {
    const gestor = await this.puedeGestionar(usuario);
    if (dto.estado && dto.estado !== 'PUBLICADO' && !gestor)
      throw new ForbiddenException('No puedes consultar recursos sin publicar');
    const where: Prisma.RecursoBibliotecaWhereInput = {
      estado: dto.estado ?? 'PUBLICADO',
      ...(dto.categoria ? { categoria: dto.categoria } : {}),
      ...(dto.tema ? { tema: { equals: dto.tema, mode: 'insensitive' } } : {}),
    };
    if (dto.anio)
      where.fechaDocumento = {
        gte: new Date(Date.UTC(dto.anio, 0, 1)),
        lt: new Date(Date.UTC(dto.anio + 1, 0, 1)),
      };
    const q = dto.q?.trim();
    if (q)
      where.OR = (
        ['titulo', 'descripcion', 'tema', 'autorInstitucion'].map((campo) => ({
          [campo]: { contains: q, mode: 'insensitive' },
        })) as Prisma.RecursoBibliotecaWhereInput[]
      ).concat([
        { etiquetas: { has: q.toLowerCase() } },
      ] as Prisma.RecursoBibliotecaWhereInput[]);
    if (dto.formato)
      where.contenidos = {
        some: {
          estaActivo: true,
          ...(dto.formato === 'enlace'
            ? { tipo: 'ENLACE' }
            : {
                tipo: 'ARCHIVO',
                versiones: {
                  some: { extension: dto.formato, esVigente: true },
                },
              }),
        },
      };
    const [total, recursos] = await this.prisma.$transaction([
      this.prisma.recursoBiblioteca.count({ where }),
      this.prisma.recursoBiblioteca.findMany({
        where,
        skip: (dto.pagina - 1) * dto.limite,
        take: dto.limite,
        orderBy:
          dto.orden === 'titulo'
            ? [{ titulo: 'asc' }, { id: 'asc' }]
            : dto.orden === 'antiguos'
              ? [{ actualizadoEn: 'asc' }, { id: 'asc' }]
              : [{ actualizadoEn: 'desc' }, { id: 'desc' }],
        include: {
          contenidos: {
            where: { estaActivo: true },
            orderBy: { orden: 'asc' },
            include: contenidoInclude,
          },
          favoritos: {
            where: { usuarioId: usuario.id },
            select: { usuarioId: true },
          },
          creadoPor: {
            select: {
              id: true,
              nombres: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              rol: true,
            },
          },
        },
      }),
    ]);
    return {
      recursos: recursos.map(({ favoritos, ...r }) => ({
        ...r,
        esFavorito: favoritos.length > 0,
      })),
      total,
      pagina: dto.pagina,
      limite: dto.limite,
      paginas: Math.ceil(total / dto.limite),
    };
  }
  async filtros() {
    const temas = await this.prisma.recursoBiblioteca.findMany({
      where: { estado: 'PUBLICADO' },
      distinct: ['tema'],
      select: { tema: true },
      orderBy: { tema: 'asc' },
    });
    const fechas = await this.prisma.recursoBiblioteca.findMany({
      where: { estado: 'PUBLICADO', fechaDocumento: { not: null } },
      select: { fechaDocumento: true },
    });
    return {
      temas: temas.map((x) => x.tema),
      anios: [
        ...new Set(
          fechas.flatMap((r) =>
            r.fechaDocumento ? [r.fechaDocumento.getUTCFullYear()] : [],
          ),
        ),
      ].sort((a, b) => b - a),
    };
  }
  async detalle(usuario: UsuarioBiblioteca, id: number) {
    await this.consultar(usuario, id);
    const gestor = await this.puedeGestionar(usuario);
    const recurso = await this.prisma.recursoBiblioteca.findUnique({
      where: { id },
      include: {
        contenidos: {
          where: { estaActivo: true },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
          include: contenidoInclude,
        },
        favoritos: {
          where: { usuarioId: usuario.id },
          select: { usuarioId: true },
        },
        relacionesOrigen: {
          where: { destino: gestor ? {} : { estado: 'PUBLICADO' } },
          select: {
            destino: {
              select: {
                id: true,
                titulo: true,
                categoria: true,
                tema: true,
                estado: true,
              },
            },
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            rol: true,
          },
        },
      },
    });
    if (!recurso) throw new NotFoundException('El recurso no existe');
    const { favoritos, relacionesOrigen, creadoPor, ...datos } = recurso;
    return {
      ...datos,
      esFavorito: favoritos.length > 0,
      relacionado: creadoPor
        ? creadoPor.rol === Rol.ADMINISTRADOR
          ? 'Equipo IusAcademy'
          : `${creadoPor.nombres} ${creadoPor.apellidoPaterno}`
        : 'Equipo IusAcademy',
      relacionados: relacionesOrigen.map((x) => x.destino),
    };
  }
  crear(usuario: UsuarioBiblioteca, dto: CrearRecursoBibliotecaDto) {
    return this.gestionar(usuario, async (tx) => {
      const recurso = await tx.recursoBiblioteca.create({
        data: {
          ...this.datos(dto),
          creadoPorId: usuario.id,
        } as Prisma.RecursoBibliotecaUncheckedCreateInput,
      });
      await this.historial(tx, usuario, 'RECURSO_CREADO', recurso.id);
      return recurso;
    });
  }
  actualizar(
    usuario: UsuarioBiblioteca,
    id: number,
    dto: ActualizarRecursoBibliotecaDto,
  ) {
    return this.gestionar(usuario, async (tx) => {
      const anterior = await this.buscar(tx, id);
      const recurso = await tx.recursoBiblioteca.update({
        where: { id },
        data: this.datos(dto) as Prisma.RecursoBibliotecaUpdateInput,
      });
      await this.historial(tx, usuario, 'RECURSO_ACTUALIZADO', id, {
        anterior: JSON.parse(JSON.stringify(anterior)),
        nuevo: JSON.parse(JSON.stringify(recurso)),
      });
      return recurso;
    });
  }
  estado(
    usuario: UsuarioBiblioteca,
    id: number,
    estado: EstadoRecursoBiblioteca,
  ) {
    return this.gestionar(usuario, async (tx) => {
      const anterior = await this.buscar(tx, id);
      if (estado === 'PUBLICADO') {
        const contenidos = await tx.contenidoBiblioteca.findMany({
          where: { recursoId: id, estaActivo: true },
          include: { _count: { select: { versiones: true } } },
        });
        if (
          !contenidos.some((x) =>
            x.tipo === 'ENLACE' ? !!x.urlExterna : x._count.versiones > 0,
          )
        )
          throw new BadRequestException(
            'Agrega un archivo o enlace antes de publicar',
          );
      }
      if (estado === 'ARCHIVADO') await this.exigirAdmin(tx, usuario);
      const recurso = await tx.recursoBiblioteca.update({
        where: { id },
        data: {
          estado,
          publicadoEn:
            estado === 'PUBLICADO'
              ? (anterior.publicadoEn ?? new Date())
              : anterior.publicadoEn,
          archivadoEn: estado === 'ARCHIVADO' ? new Date() : null,
        },
      });
      await this.historial(tx, usuario, 'ESTADO_CAMBIADO', id, {
        anterior: anterior.estado,
        nuevo: estado,
      });
      return recurso;
    });
  }
  agregarEnlace(
    usuario: UsuarioBiblioteca,
    id: number,
    dto: EnlaceBibliotecaDto,
  ) {
    const url = new URL(dto.url);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new BadRequestException(
        'El enlace debe ser HTTP o HTTPS sin credenciales',
      );
    if (!dto.titulo.trim())
      throw new BadRequestException('Indica el título del enlace');
    return this.gestionar(usuario, async (tx) => {
      await this.buscar(tx, id);
      const contenido = await tx.contenidoBiblioteca.create({
        data: {
          recursoId: id,
          titulo: dto.titulo.trim(),
          tipo: 'ENLACE',
          urlExterna: url.toString(),
        },
      });
      await this.historial(tx, usuario, 'ENLACE_AGREGADO', id, {
        contenidoId: contenido.id,
      });
      return contenido;
    });
  }
  actualizarEnlace(
    usuario: UsuarioBiblioteca,
    id: number,
    contenidoId: number,
    dto: EnlaceBibliotecaDto,
  ) {
    const url = new URL(dto.url);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      !dto.titulo.trim()
    )
      throw new BadRequestException(
        'Indica un título y un enlace válido sin credenciales',
      );
    return this.gestionar(usuario, async (tx) => {
      const contenido = await tx.contenidoBiblioteca.findFirst({
        where: {
          id: contenidoId,
          recursoId: id,
          tipo: 'ENLACE',
          estaActivo: true,
        },
      });
      if (!contenido) throw new NotFoundException('El enlace no existe');
      const actualizado = await tx.contenidoBiblioteca.update({
        where: { id: contenidoId },
        data: { titulo: dto.titulo.trim(), urlExterna: url.toString() },
      });
      await this.historial(tx, usuario, 'ENLACE_ACTUALIZADO', id, {
        contenidoId,
        anterior: contenido.urlExterna,
        nuevo: url.toString(),
      });
      return actualizado;
    });
  }
  private validarArchivo(archivo?: ArchivoBiblioteca) {
    if (!archivo?.buffer.length || archivo.buffer.length > 20 * 1024 * 1024)
      throw new BadRequestException('Selecciona un archivo de hasta 20 MB');
    const extension = extname(archivo.originalname).slice(1).toLowerCase();
    const b = archivo.buffer;
    const valido =
      extension === 'pdf'
        ? b.subarray(0, 5).toString() === '%PDF-'
        : extension === 'doc'
          ? b.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))
          : extension === 'docx'
            ? b.subarray(0, 4).equals(Buffer.from('504b0304', 'hex')) &&
              b.includes(Buffer.from('word/document.xml')) &&
              b.includes(Buffer.from('[Content_Types].xml'))
            : false;
    if (!valido)
      throw new BadRequestException(
        'Solo se permiten PDF, DOC y DOCX con estructura compatible',
      );
    const mimeType =
      extension === 'pdf'
        ? 'application/pdf'
        : extension === 'doc'
          ? 'application/msword'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return {
      extension,
      mimeType,
      hashSha256: createHash('sha256').update(b).digest('hex'),
    };
  }
  async subir(
    usuario: UsuarioBiblioteca,
    id: number,
    dto: ArchivoBibliotecaDto,
    archivo?: ArchivoBiblioteca,
    contenidoId?: number,
  ) {
    const validado = this.validarArchivo(archivo);
    if (!dto.titulo.trim())
      throw new BadRequestException('Indica el título del archivo');
    if (contenidoId && !dto.motivoActualizacion?.trim())
      throw new BadRequestException('Indica el motivo de actualización');
    let rutaGuardada: string | undefined;
    try {
      return await this.gestionar(usuario, async (tx) => {
        await this.buscar(tx, id);
        const contenido = contenidoId
          ? await tx.contenidoBiblioteca.findFirst({
              where: {
                id: contenidoId,
                recursoId: id,
                estaActivo: true,
                tipo: 'ARCHIVO',
              },
            })
          : await tx.contenidoBiblioteca.create({
              data: {
                recursoId: id,
                titulo: dto.titulo.trim(),
                tipo: 'ARCHIVO',
              },
            });
        if (!contenido) throw new NotFoundException('El contenido no existe');
        const ultima = await tx.versionContenidoBiblioteca.findFirst({
          where: { contenidoId: contenido.id },
          orderBy: { numeroVersion: 'desc' },
        });
        const numeroVersion = (ultima?.numeroVersion ?? 0) + 1;
        const guardado = await this.almacenamiento.guardar({
          buffer: archivo!.buffer,
          nombreOriginal: archivo!.originalname,
          extension: validado.extension,
          carpeta: `biblioteca/${id}/${contenido.id}/${numeroVersion}`,
        });
        rutaGuardada = guardado.rutaRelativa;
        await tx.versionContenidoBiblioteca.updateMany({
          where: { contenidoId: contenido.id, esVigente: true },
          data: { esVigente: false },
        });
        const version = await tx.versionContenidoBiblioteca.create({
          data: {
            contenidoId: contenido.id,
            numeroVersion,
            nombreOriginal: archivo!.originalname.replace(/[\r\n\x00]/g, '_'),
            nombreAlmacenado: guardado.nombreAlmacenado,
            ruta: guardado.rutaRelativa,
            ...validado,
            tamanioBytes: archivo!.buffer.length,
            motivoActualizacion: dto.motivoActualizacion?.trim(),
            subidoPorId: usuario.id,
          },
          select: archivoSelect,
        });
        await tx.contenidoBiblioteca.update({
          where: { id: contenido.id },
          data: { titulo: dto.titulo.trim() },
        });
        await tx.recursoBiblioteca.update({
          where: { id },
          data: { actualizadoEn: new Date() },
        });
        await this.historial(
          tx,
          usuario,
          contenidoId ? 'ARCHIVO_VERSIONADO' : 'ARCHIVO_AGREGADO',
          id,
          { contenidoId: contenido.id, versionId: version.id },
        );
        return { contenidoId: contenido.id, version };
      });
    } catch (error) {
      if (rutaGuardada)
        await this.almacenamiento.eliminar(rutaGuardada).catch(() => undefined);
      throw error;
    }
  }
  desactivarContenido(
    usuario: UsuarioBiblioteca,
    id: number,
    contenidoId: number,
  ) {
    return this.gestionar(usuario, async (tx) => {
      await this.exigirAdmin(tx, usuario);
      const recurso = await this.buscar(tx, id);
      const contenido = await tx.contenidoBiblioteca.findFirst({
        where: { id: contenidoId, recursoId: id, estaActivo: true },
      });
      if (!contenido) throw new NotFoundException('El contenido no existe');
      if (
        recurso.estado === 'PUBLICADO' &&
        (await tx.contenidoBiblioteca.count({
          where: { recursoId: id, estaActivo: true },
        })) <= 1
      )
        throw new BadRequestException(
          'Pasa el recurso a borrador antes de quitar su último contenido',
        );
      await tx.contenidoBiblioteca.update({
        where: { id: contenidoId },
        data: { estaActivo: false },
      });
      await this.historial(tx, usuario, 'CONTENIDO_ARCHIVADO', id, {
        contenidoId,
      });
      return { mensaje: 'Contenido archivado; sus versiones se conservan' };
    });
  }
  async versiones(usuario: UsuarioBiblioteca, id: number, contenidoId: number) {
    if (!(await this.puedeGestionar(usuario)))
      throw new ForbiddenException(
        'Solo los gestores pueden consultar versiones anteriores',
      );
    const contenido = await this.prisma.contenidoBiblioteca.findFirst({
      where: { id: contenidoId, recursoId: id },
    });
    if (!contenido) throw new NotFoundException('El contenido no existe');
    return this.prisma.versionContenidoBiblioteca.findMany({
      where: { contenidoId },
      orderBy: { numeroVersion: 'desc' },
      select: archivoSelect,
    });
  }
  async archivo(
    usuario: UsuarioBiblioteca,
    versionId: number,
    descargar: boolean,
  ) {
    const version = await this.prisma.versionContenidoBiblioteca.findUnique({
      where: { id: versionId },
      include: { contenido: true },
    });
    if (!version) throw new NotFoundException('El archivo no existe');
    await this.consultar(usuario, version.contenido.recursoId);
    const gestor = await this.puedeGestionar(usuario);
    if (!gestor) {
      if (!version.contenido.estaActivo)
        throw new NotFoundException('El archivo no está disponible');
      const ultima = await this.prisma.versionContenidoBiblioteca.findFirst({
        where: { contenidoId: version.contenidoId },
        orderBy: { numeroVersion: 'desc' },
        select: { id: true },
      });
      if (ultima?.id !== version.id)
        throw new NotFoundException('La versión ya fue reemplazada');
    }
    if (!descargar && version.extension !== 'pdf')
      throw new BadRequestException(
        'La vista previa está disponible para PDF; descarga el documento Word',
      );
    let buffer: Buffer;
    try {
      buffer = await this.almacenamiento.leer(version.ruta);
    } catch {
      throw new NotFoundException('El archivo físico no está disponible');
    }
    if (descargar)
      await this.prisma.$transaction(async (tx) => {
        await tx.versionContenidoBiblioteca.update({
          where: { id: versionId },
          data: { cantidadDescargas: { increment: 1 } },
        });
        await this.historial(
          tx,
          usuario,
          'DESCARGADO',
          version.contenido.recursoId,
          { archivo: version.nombreOriginal, versionId },
        );
      });
    return {
      buffer,
      nombre: version.nombreOriginal,
      mimeType: version.mimeType,
    };
  }
  relacionar(usuario: UsuarioBiblioteca, id: number, ids: number[]) {
    return this.gestionar(usuario, async (tx) => {
      await this.buscar(tx, id);
      const unicos = [...new Set(ids)];
      if (unicos.includes(id))
        throw new BadRequestException(
          'Un recurso no puede relacionarse consigo mismo',
        );
      if (
        (await tx.recursoBiblioteca.count({
          where: { id: { in: unicos } },
        })) !== unicos.length
      )
        throw new BadRequestException('Hay recursos relacionados inexistentes');
      await tx.relacionRecursoBiblioteca.deleteMany({
        where: { origenId: id },
      });
      if (unicos.length)
        await tx.relacionRecursoBiblioteca.createMany({
          data: unicos.map((destinoId) => ({ origenId: id, destinoId })),
        });
      await this.historial(tx, usuario, 'RELACIONES_ACTUALIZADAS', id, {
        ids: unicos,
      });
      return { ids: unicos };
    });
  }
  async favoritos(usuario: UsuarioBiblioteca) {
    return this.prisma.favoritoBiblioteca.findMany({
      where: { usuarioId: usuario.id, recurso: { estado: 'PUBLICADO' } },
      orderBy: { creadoEn: 'desc' },
      include: {
        recurso: {
          include: {
            contenidos: {
              where: { estaActivo: true },
              orderBy: { orden: 'asc' },
              include: contenidoInclude,
            },
            creadoPor: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                rol: true,
              },
            },
          },
        },
      },
    });
  }
  async favorito(usuario: UsuarioBiblioteca, id: number, agregar: boolean) {
    await this.consultar(usuario, id);
    if (agregar)
      await this.prisma.favoritoBiblioteca.upsert({
        where: {
          usuarioId_recursoId: { usuarioId: usuario.id, recursoId: id },
        },
        create: { usuarioId: usuario.id, recursoId: id },
        update: {},
      });
    else
      await this.prisma.favoritoBiblioteca.deleteMany({
        where: { usuarioId: usuario.id, recursoId: id },
      });
    return { esFavorito: agregar };
  }
  async colecciones(usuario: UsuarioBiblioteca) {
    const colecciones = await this.prisma.coleccionBiblioteca.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { actualizadoEn: 'desc' },
      include: {
        recursos: {
          where: { recurso: { estado: 'PUBLICADO' } },
          include: {
            recurso: {
              include: {
                contenidos: {
                  where: { estaActivo: true },
                  orderBy: { orden: 'asc' },
                  include: contenidoInclude,
                },
                favoritos: {
                  where: { usuarioId: usuario.id },
                  select: { usuarioId: true },
                },
                creadoPor: {
                  select: {
                    id: true,
                    nombres: true,
                    apellidoPaterno: true,
                    apellidoMaterno: true,
                    rol: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return colecciones.map((coleccion) => ({
      ...coleccion,
      recursos: coleccion.recursos.map(({ recurso, ...relacion }) => {
        const { favoritos, ...datosRecurso } = recurso;
        return {
          ...relacion,
          recurso: {
            ...datosRecurso,
            esFavorito: favoritos.length > 0,
          },
        };
      }),
    }));
  }
  async crearColeccion(
    usuario: UsuarioBiblioteca,
    dto: ColeccionBibliotecaDto,
  ) {
    if (dto.nombre.trim().length < 2)
      throw new BadRequestException('Indica el nombre de la colección');
    try {
      return await this.prisma.coleccionBiblioteca.create({
        data: {
          usuarioId: usuario.id,
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim(),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new BadRequestException('Ya tienes una colección con ese nombre');
      throw e;
    }
  }
  async coleccionRecurso(
    usuario: UsuarioBiblioteca,
    coleccionId: number,
    recursoId: number,
    agregar: boolean,
  ) {
    await this.consultar(usuario, recursoId);
    return this.prisma.$transaction(async (tx) => {
      const coleccion = await tx.coleccionBiblioteca.findFirst({
        where: { id: coleccionId, usuarioId: usuario.id },
      });
      if (!coleccion) throw new NotFoundException('La colección no existe');
      if (agregar)
        await tx.coleccionRecursoBiblioteca.upsert({
          where: { coleccionId_recursoId: { coleccionId, recursoId } },
          create: { coleccionId, recursoId },
          update: {},
        });
      else
        await tx.coleccionRecursoBiblioteca.deleteMany({
          where: { coleccionId, recursoId },
        });
      return { agregado: agregar };
    });
  }
  async actualizarColeccion(
    usuario: UsuarioBiblioteca,
    id: number,
    dto: ColeccionBibliotecaDto,
  ) {
    if (dto.nombre.trim().length < 2)
      throw new BadRequestException('Indica el nombre de la colección');
    return this.prisma.$transaction(async (tx) => {
      const propia = await tx.coleccionBiblioteca.findFirst({
        where: { id, usuarioId: usuario.id },
      });
      if (!propia) throw new NotFoundException('La colección no existe');
      try {
        return await tx.coleccionBiblioteca.update({
          where: { id },
          data: {
            nombre: dto.nombre.trim(),
            descripcion: dto.descripcion?.trim(),
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        )
          throw new BadRequestException(
            'Ya tienes una colección con ese nombre',
          );
        throw e;
      }
    });
  }
  async eliminarColeccion(usuario: UsuarioBiblioteca, id: number) {
    const result = await this.prisma.coleccionBiblioteca.deleteMany({
      where: { id, usuarioId: usuario.id },
    });
    if (!result.count) throw new NotFoundException('La colección no existe');
    return { mensaje: 'Colección eliminada' };
  }
  async reportar(usuario: UsuarioBiblioteca, id: number, motivo: string) {
    await this.consultar(usuario, id);
    if (motivo.trim().length < 10)
      throw new BadRequestException(
        'Describe el problema con al menos 10 caracteres',
      );
    return this.prisma.reporteRecursoBiblioteca.create({
      data: { recursoId: id, usuarioId: usuario.id, motivo: motivo.trim() },
    });
  }
  async reportes(usuario: UsuarioBiblioteca, pagina: number) {
    if (!(await this.puedeGestionar(usuario)))
      throw new ForbiddenException('No puedes consultar los reportes');
    return this.prisma.reporteRecursoBiblioteca.findMany({
      skip: (pagina - 1) * 30,
      take: 30,
      orderBy: { creadoEn: 'desc' },
      include: {
        recurso: { select: { id: true, titulo: true } },
        usuario: { select: { id: true, nombres: true, apellidoPaterno: true } },
      },
    });
  }
  atenderReporte(
    usuario: UsuarioBiblioteca,
    id: number,
    dto: AtenderReporteBibliotecaDto,
  ) {
    return this.gestionar(usuario, async (tx) => {
      const reporte = await tx.reporteRecursoBiblioteca.findUnique({
        where: { id },
      });
      if (!reporte) throw new NotFoundException('El reporte no existe');
      const actualizado = await tx.reporteRecursoBiblioteca.update({
        where: { id },
        data: {
          estado: dto.estado,
          respuesta: dto.respuesta.trim(),
          atendidoPorId: usuario.id,
          atendidoEn: new Date(),
        },
      });
      await this.historial(tx, usuario, 'REPORTE_ATENDIDO', reporte.recursoId, {
        reporteId: id,
        estado: dto.estado,
      });
      return actualizado;
    });
  }
  async permisos(usuario: UsuarioBiblioteca) {
    await this.exigirAdmin(this.prisma, usuario);
    return this.prisma.permisoGestionBiblioteca.findMany({
      include: {
        docente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            correo: true,
            estaActivo: true,
          },
        },
      },
      orderBy: { otorgadoEn: 'desc' },
    });
  }
  async docentes(usuario: UsuarioBiblioteca) {
    await this.exigirAdmin(this.prisma, usuario);
    return this.prisma.usuario.findMany({
      where: { rol: 'DOCENTE', estaActivo: true, cuentaActivada: true },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
      },
      orderBy: { apellidoPaterno: 'asc' },
    });
  }
  permiso(usuario: UsuarioBiblioteca, docenteId: number, otorgar: boolean) {
    return this.gestionar(usuario, async (tx) => {
      await this.exigirAdmin(tx, usuario);
      const docente = await tx.usuario.findUnique({
        where: { id: docenteId },
        select: { rol: true, estaActivo: true, cuentaActivada: true },
      });
      if (
        !docente ||
        docente.rol !== 'DOCENTE' ||
        (otorgar && (!docente.estaActivo || !docente.cuentaActivada))
      )
        throw new BadRequestException('Selecciona un docente válido y activo');
      let permiso;
      if (otorgar)
        permiso = await tx.permisoGestionBiblioteca.upsert({
          where: { docenteId },
          create: { docenteId, otorgadoPorId: usuario.id },
          update: {
            estaActivo: true,
            otorgadoPorId: usuario.id,
            otorgadoEn: new Date(),
            revocadoPorId: null,
            revocadoEn: null,
          },
        });
      else {
        const existente = await tx.permisoGestionBiblioteca.findUnique({
          where: { docenteId },
        });
        if (!existente)
          throw new NotFoundException(
            'El docente no tiene un permiso registrado',
          );
        permiso = await tx.permisoGestionBiblioteca.update({
          where: { docenteId },
          data: {
            estaActivo: false,
            revocadoPorId: usuario.id,
            revocadoEn: new Date(),
          },
        });
      }
      await this.historial(
        tx,
        usuario,
        otorgar ? 'PERMISO_OTORGADO' : 'PERMISO_REVOCADO',
        undefined,
        { docenteId },
      );
      return permiso;
    });
  }
  async historialGeneral(usuario: UsuarioBiblioteca, pagina: number) {
    await this.exigirAdmin(this.prisma, usuario);
    return this.prisma.historialBiblioteca.findMany({
      skip: (pagina - 1) * 30,
      take: 30,
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      include: {
        actor: { select: { id: true, nombres: true, apellidoPaterno: true } },
      },
    });
  }
  async historialRecurso(
    usuario: UsuarioBiblioteca,
    id: number,
    pagina: number,
  ) {
    if (!(await this.puedeGestionar(usuario)))
      throw new ForbiddenException('No puedes consultar el historial');
    await this.buscar(this.prisma, id);
    return this.prisma.historialBiblioteca.findMany({
      where: { recursoId: id },
      skip: (pagina - 1) * 30,
      take: 30,
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      include: {
        actor: { select: { id: true, nombres: true, apellidoPaterno: true } },
      },
    });
  }
}
 