import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoRecursoCurso,
  EstadoProcesamientoDataset,
  EstadoVersionRecurso,
  Rol,
  TipoContenidoRecurso,
  UsoRecursoCurso,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ArchivosService } from '../archivos/archivos.service';

import type { UsuarioAutenticado } from '../archivos/interfaces/usuario-autenticado.interface';

import type {
  BuscarDatasetQuizDto,
  TipoBusquedaDatasetQuiz,
} from './dto/buscar-dataset-quiz.dto';

import { SeleccionarFragmentosQuizDto } from './dto/seleccionar-fragmentos-quiz.dto';

type BloqueDocumento = {
  indice: number;

  tipo: string;

  titulo: string;

  texto: string;

  inicio: number;

  fin: number;
};

@Injectable()
export class QuizDatasetService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly archivosService: ArchivosService,
  ) {}

  private async validarCursoDocente(
    usuario: UsuarioAutenticado,

    cursoId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede administrar datasets de Quizzes',
      );
    }

    const curso = await this.prisma.curso.findFirst({
      where: {
        id: cursoId,

        docenteId: usuario.id,
      },

      select: {
        id: true,
      },
    });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no pertenece al docente',
      );
    }
  }

  private normalizar(valor: string) {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private limpiarTexto(texto: string) {
    return texto
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private detectarTipoLinea(linea: string) {
    const limpia = linea.trim();

    if (/^(ART[IÍ]CULO|ART\.)\s*(N[°º.]?\s*)?\d+/i.test(limpia)) {
      return 'ARTICULO';
    }

    if (/^T[IÍ]TULO\b/i.test(limpia)) {
      return 'TITULO';
    }

    if (/^CAP[IÍ]TULO\b/i.test(limpia)) {
      return 'CAPITULO';
    }

    if (/^SECCI[ÓO]N\b/i.test(limpia)) {
      return 'SECCION';
    }

    if (/^LIBRO\b/i.test(limpia)) {
      return 'LIBRO';
    }

    if (/^PARTE\b/i.test(limpia)) {
      return 'PARTE';
    }

    return null;
  }

  private construirBloques(texto: string) {
    const limpio = this.limpiarTexto(texto);

    const lineas = limpio.split('\n');

    const encabezados: Array<{
      linea: number;

      tipo: string;

      titulo: string;
    }> = [];

    lineas.forEach((linea, indice) => {
      const tipo = this.detectarTipoLinea(linea);

      if (tipo) {
        encabezados.push({
          linea: indice,

          tipo,

          titulo: linea.trim(),
        });
      }
    });

    if (encabezados.length === 0) {
      const tamanioBloque = 1800;

      const bloques: BloqueDocumento[] = [];

      for (let inicio = 0; inicio < limpio.length; inicio += tamanioBloque) {
        const textoBloque = limpio.slice(inicio, inicio + tamanioBloque).trim();

        if (textoBloque) {
          bloques.push({
            indice: bloques.length,

            tipo: 'FRAGMENTO',

            titulo: `Fragmento ${bloques.length + 1}`,

            texto: textoBloque,

            inicio,

            fin: inicio + textoBloque.length,
          });
        }
      }

      return bloques;
    }

    const bloques: BloqueDocumento[] = [];

    encabezados.forEach((encabezado, indice) => {
      const siguiente = encabezados[indice + 1];

      const inicioLinea = encabezado.linea;

      const finLinea = siguiente ? siguiente.linea : lineas.length;

      const textoBloque = lineas.slice(inicioLinea, finLinea).join('\n').trim();

      if (textoBloque) {
        bloques.push({
          indice: bloques.length,

          tipo: encabezado.tipo,

          titulo: encabezado.titulo,

          texto: textoBloque,

          inicio: inicioLinea,

          fin: finLinea - 1,
        });
      }
    });

    return bloques;
  }

  private puntuarBloque(
    bloque: BloqueDocumento,

    consulta: string,
  ) {
    const q = this.normalizar(consulta);

    if (!q) {
      return 1;
    }

    const titulo = this.normalizar(bloque.titulo);

    const texto = this.normalizar(bloque.texto);

    let puntaje = 0;

    if (titulo === q) {
      puntaje += 100;
    }

    if (titulo.includes(q)) {
      puntaje += 55;
    }

    if (texto.includes(q)) {
      puntaje += 30;
    }

    const tokens = q.split(' ').filter((token) => token.length >= 2);

    for (const token of tokens) {
      if (titulo.includes(token)) {
        puntaje += 9;
      }

      if (texto.includes(token)) {
        puntaje += 3;
      }
    }

    return puntaje;
  }

  private coincideTipo(
    bloque: BloqueDocumento,

    tipo: TipoBusquedaDatasetQuiz,
  ) {
    if (tipo === 'AUTO' || tipo === 'PALABRA_CLAVE') {
      return true;
    }

    return bloque.tipo === tipo;
  }

  private async obtenerVersionDataset(
    usuario: UsuarioAutenticado,

    cursoId: number,

    versionId: number,
  ) {
    await this.validarCursoDocente(usuario, cursoId);

    const version = await this.prisma.recursoContenidoVersion.findFirst({
      where: {
        id: versionId,

        estado: EstadoVersionRecurso.VIGENTE,

        esVigente: true,

        contenido: {
          estaActivo: true,

          tipo: TipoContenidoRecurso.ARCHIVO,

          disponibleParaQuiz: true,

          recurso: {
            cursoId,

            estado: EstadoRecursoCurso.ACTIVO,

            estaActivo: true,

            uso: {
              in: [
                UsoRecursoCurso.AULA_Y_QUIZZES,
                UsoRecursoCurso.SOLO_QUIZZES,
              ],
            },
          },
        },

        archivo: {
          extension: {
            equals: 'pdf',

            mode: 'insensitive',
          },
        },
      },

      include: {
        archivo: {
          select: {
            id: true,

            nombreOriginal: true,

            extension: true,

            tamanioBytes: true,

            textoExtraido: true,

            esAnalizadoIA: true,
          },
        },

        contenido: {
          include: {
            recurso: {
              include: {
                hito: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        'El PDF no está disponible como dataset para Quizzes',
      );
    }

    const ultimaVersion = await this.prisma.recursoContenidoVersion.findFirst({
      where: {
        contenidoId: version.contenidoId,

        estado: EstadoVersionRecurso.VIGENTE,

        esVigente: true,
      },

      orderBy: {
        numeroVersion: 'desc',
      },

      select: {
        id: true,

        numeroVersion: true,
      },
    });

    if (!ultimaVersion || ultimaVersion.id !== version.id) {
      throw new BadRequestException(
        'La versión seleccionada ya no es la versión vigente del recurso. Actualiza la lista de datasets y selecciona la versión más reciente.',
      );
    }

    const textoExtraido = version.archivo.textoExtraido?.trim() || null;

    if (
      version.estadoDataset !== EstadoProcesamientoDataset.LISTO ||
      !textoExtraido
    ) {
      throw new BadRequestException(
        version.estadoDataset === EstadoProcesamientoDataset.ERROR
          ? (version.errorDataset ?? 'No fue posible preparar este dataset.')
          : 'Este dataset todavía se está preparando. Intenta nuevamente en unos instantes.',
      );
    }

    return {
      ...version,

      archivo: {
        ...version.archivo,

        textoExtraido,
      },
    };
  }

  async analizar(
    usuario: UsuarioAutenticado,

    cursoId: number,

    versionId: number,
  ) {
    const version = await this.obtenerVersionDataset(
      usuario,
      cursoId,
      versionId,
    );

    const texto = this.limpiarTexto(version.archivo.textoExtraido);

    const bloques = this.construirBloques(texto);

    const conteo = bloques.reduce<Record<string, number>>(
      (acumulado, bloque) => {
        acumulado[bloque.tipo] = (acumulado[bloque.tipo] ?? 0) + 1;

        return acumulado;
      },
      {},
    );

    return {
      versionId: version.id,

      numeroVersion: version.numeroVersion,

      archivo: {
        id: version.archivo.id,

        nombre: version.archivo.nombreOriginal,

        extension: version.archivo.extension,

        tamanioBytes: version.archivo.tamanioBytes,
      },

      recurso: {
        id: version.contenido.recurso.id,

        titulo: version.contenido.recurso.titulo,

        alcance: version.contenido.recurso.alcance,

        hito: version.contenido.recurso.hito,
      },

      contenido: {
        id: version.contenido.id,

        titulo: version.contenido.titulo,
      },

      estadisticas: {
        caracteres: texto.length,

        palabras: texto.split(/\s+/).filter(Boolean).length,

        bloques: bloques.length,

        articulos: conteo.ARTICULO ?? 0,

        titulos: conteo.TITULO ?? 0,

        capitulos: conteo.CAPITULO ?? 0,

        secciones: conteo.SECCION ?? 0,

        libros: conteo.LIBRO ?? 0,
      },

      estructura: bloques
        .filter((bloque) =>
          [
            'LIBRO',
            'PARTE',
            'TITULO',
            'CAPITULO',
            'SECCION',
            'ARTICULO',
          ].includes(bloque.tipo),
        )
        .slice(0, 300)
        .map((bloque) => ({
          indice: bloque.indice,

          tipo: bloque.tipo,

          titulo: bloque.titulo,

          vistaPrevia: bloque.texto.replace(/\s+/g, ' ').slice(0, 220),
        })),
    };
  }

  async buscar(
    usuario: UsuarioAutenticado,

    cursoId: number,

    versionId: number,

    filtros: BuscarDatasetQuizDto,
  ) {
    const version = await this.obtenerVersionDataset(
      usuario,
      cursoId,
      versionId,
    );

    const tipo = filtros.tipo ?? 'AUTO';

    const limite = filtros.limite ?? 20;

    const consulta = filtros.q?.trim() ?? '';

    const bloques = this.construirBloques(version.archivo.textoExtraido);

    const resultados = bloques
      .filter((bloque) => this.coincideTipo(bloque, tipo))
      .map((bloque) => ({
        bloque,

        puntaje: this.puntuarBloque(bloque, consulta),
      }))
      .filter((item) => (consulta ? item.puntaje > 0 : true))
      .sort(
        (a, b) => b.puntaje - a.puntaje || a.bloque.indice - b.bloque.indice,
      )
      .slice(0, limite);

    return {
      versionId: version.id,

      consulta,

      tipo,

      total: resultados.length,

      resultados: resultados.map((item) => ({
        indice: item.bloque.indice,

        tipo: item.bloque.tipo,

        titulo: item.bloque.titulo,

        texto: item.bloque.texto,

        puntaje: item.puntaje,

        vistaPrevia: item.bloque.texto.replace(/\s+/g, ' ').slice(0, 360),
      })),
    };
  }

  async seleccionarFragmentos(
    usuario: UsuarioAutenticado,

    cursoId: number,

    quizId: number,

    fuenteId: number,

    datos: SeleccionarFragmentosQuizDto,
  ) {
    await this.validarCursoDocente(usuario, cursoId);

    const fuente = await this.prisma.fuenteQuiz.findFirst({
      where: {
        id: fuenteId,

        quizId,

        quiz: {
          cursoId,

          estado: 'BORRADOR',
        },
      },

      select: {
        id: true,

        fragmentos: {
          select: {
            id: true,

            texto: true,
          },
        },
      },
    });

    if (!fuente) {
      throw new BadRequestException(
        'La fuente no pertenece a un Quiz en borrador de este curso',
      );
    }

    const existentes = new Set(
      fuente.fragmentos.map((fragmento) => this.normalizar(fragmento.texto)),
    );

    const nuevos = datos.fragmentos.filter(
      (fragmento) => !existentes.has(this.normalizar(fragmento.texto)),
    );

    if (nuevos.length === 0) {
      throw new BadRequestException(
        'Los fragmentos seleccionados ya fueron agregados al Quiz',
      );
    }

    const cantidadActual = fuente.fragmentos.length;

    await this.prisma.fragmentoFuenteQuiz.createMany({
      data: nuevos.map((fragmento, indice) => ({
        fuenteId,

        tituloReferencia: fragmento.tituloReferencia?.trim() || null,

        tipoReferencia: fragmento.tipoReferencia?.trim() || null,

        paginaInicio: fragmento.paginaInicio,

        paginaFin: fragmento.paginaFin,

        texto: fragmento.texto.trim(),

        orden: fragmento.orden ?? cantidadActual + indice,
      })),
    });

    return this.prisma.fragmentoFuenteQuiz.findMany({
      where: {
        fuenteId,
      },

      orderBy: {
        orden: 'asc',
      },
    });
  }
}
