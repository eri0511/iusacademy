import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'crypto';
import { access, readFile } from 'fs/promises';
import * as path from 'path';

import pdfParse from 'pdf-parse';

import {
  EstadoAnalisisExposicion,
  EstadoTurnoExposicion,
  Prisma,
  Rol,
  TipoTarea,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type ObjetoJson = Record<string, unknown>;

type ConfiguracionExposicionAnalisis = {
  estructuraGuiada: boolean;
  secciones: Array<{
    titulo: string;
    consigna: string;
  }>;
  minPalabras: number | null;
  maxPalabras: number | null;
  exigirCitas: boolean;
  minCitas: number;
};

type RespuestaExposicionAnalisis = {
  tema: string;
  secciones: Array<{
    titulo: string;
    consigna: string;
    contenido: string;
  }>;
  citas: Array<ObjetoJson>;
  enlacePresentacion: string;
  preparacionConfirmada: boolean;
};

type ArchivoAnalizado = {
  id: number;
  nombre: string;
  extension: string;
  paginas: number | null;
  palabras: number;
  textoDisponible: boolean;
};

type ResultadoAnalisis = {
  puntuacionEstructura: number | null;
  puntuacionContenidoJuridico: number | null;
  puntuacionPresentacion: number | null;
  puntuacionGlobal: number | null;
  resumen: string;
  fortalezas: string[];
  advertencias: string[];
  omisiones: string[];
  retroalimentacionSugerida: string;
  evidencias: Prisma.InputJsonValue;
  hashEntrada: string;
};

@Injectable()
export class TareasExposicionesAnalisisService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDocente(usuario: UsuarioAutenticado): void {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede generar o consultar el análisis de la exposición',
      );
    }
  }

  private comoObjeto(valor: unknown): ObjetoJson | null {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      return null;
    }

    return valor as ObjetoJson;
  }

  private numeroSeguro(valor: unknown): number | null {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      return null;
    }

    return valor;
  }

  private limitar(valor: number): number {
    return Math.max(0, Math.min(100, Math.round(valor * 100) / 100));
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private contarPalabras(texto: string): number {
    const limpio = texto.trim();

    if (!limpio) {
      return 0;
    }

    return limpio.split(/\s+/).filter(Boolean).length;
  }

  private leerConfiguracionExposicion(
    configuracionTipo: unknown,
  ): ConfiguracionExposicionAnalisis {
    const raiz = this.comoObjeto(configuracionTipo);
    const exposicion = this.comoObjeto(raiz?.exposicion);

    const secciones = Array.isArray(exposicion?.secciones)
      ? exposicion.secciones
          .map((valor) => this.comoObjeto(valor))
          .filter((valor): valor is ObjetoJson => Boolean(valor))
          .map((valor) => ({
            titulo:
              typeof valor.titulo === 'string'
                ? valor.titulo.trim()
                : '',
            consigna:
              typeof valor.consigna === 'string'
                ? valor.consigna.trim()
                : '',
          }))
          .filter((seccion) => Boolean(seccion.titulo))
      : [];

    const minimo = this.numeroSeguro(exposicion?.minPalabras);
    const maximo = this.numeroSeguro(exposicion?.maxPalabras);
    const minCitas = this.numeroSeguro(exposicion?.minCitas);

    return {
      estructuraGuiada: exposicion?.estructuraGuiada === true,
      secciones,
      minPalabras: minimo,
      maxPalabras: maximo,
      exigirCitas: exposicion?.exigirCitas === true,
      minCitas: Math.max(1, Math.floor(minCitas ?? 1)),
    };
  }

  private leerRespuestaExposicion(
    contenido: string | null,
  ): RespuestaExposicionAnalisis | null {
    if (!contenido?.trim()) {
      return null;
    }

    try {
      const raiz = this.comoObjeto(JSON.parse(contenido));

      if (!raiz || raiz.formato !== 'EXPOSICION') {
        return null;
      }

      const secciones = Array.isArray(raiz.secciones)
        ? raiz.secciones
            .map((valor) => this.comoObjeto(valor))
            .filter((valor): valor is ObjetoJson => Boolean(valor))
            .map((valor) => ({
              titulo:
                typeof valor.titulo === 'string'
                  ? valor.titulo.trim()
                  : '',
              consigna:
                typeof valor.consigna === 'string'
                  ? valor.consigna.trim()
                  : '',
              contenido:
                typeof valor.contenido === 'string'
                  ? valor.contenido.trim()
                  : '',
            }))
        : [];

      const citas = Array.isArray(raiz.citas)
        ? raiz.citas
            .map((valor) => this.comoObjeto(valor))
            .filter((valor): valor is ObjetoJson => Boolean(valor))
        : [];

      return {
        tema:
          typeof raiz.tema === 'string'
            ? raiz.tema.trim()
            : '',
        secciones,
        citas,
        enlacePresentacion:
          typeof raiz.enlacePresentacion === 'string'
            ? raiz.enlacePresentacion.trim()
            : '',
        preparacionConfirmada: raiz.preparacionConfirmada === true,
      };
    } catch {
      return null;
    }
  }

  private async resolverRutaArchivo(ruta: string): Promise<string | null> {
    const candidatos = [
      ruta,
      path.resolve(process.cwd(), ruta.replace(/^[/\\]+/, '')),
    ];

    for (const candidato of candidatos) {
      try {
        await access(candidato);
        return candidato;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async extraerTextoArchivo(archivo: {
    id: number;
    nombreOriginal: string;
    extension: string;
    mimeType: string;
    ruta: string;
    textoExtraido: string | null;
  }): Promise<{
    texto: string;
    paginas: number | null;
    evidencia: ArchivoAnalizado;
  }> {
    if (archivo.textoExtraido?.trim()) {
      const texto = archivo.textoExtraido.trim();

      return {
        texto,
        paginas: null,
        evidencia: {
          id: archivo.id,
          nombre: archivo.nombreOriginal,
          extension: archivo.extension,
          paginas: null,
          palabras: this.contarPalabras(texto),
          textoDisponible: true,
        },
      };
    }

    const esPdf =
      archivo.mimeType === 'application/pdf' ||
      archivo.extension.toLowerCase().replace(/^\./, '') === 'pdf';

    if (!esPdf) {
      return {
        texto: '',
        paginas: null,
        evidencia: {
          id: archivo.id,
          nombre: archivo.nombreOriginal,
          extension: archivo.extension,
          paginas: null,
          palabras: 0,
          textoDisponible: false,
        },
      };
    }

    const rutaReal = await this.resolverRutaArchivo(archivo.ruta);

    if (!rutaReal) {
      return {
        texto: '',
        paginas: null,
        evidencia: {
          id: archivo.id,
          nombre: archivo.nombreOriginal,
          extension: archivo.extension,
          paginas: null,
          palabras: 0,
          textoDisponible: false,
        },
      };
    }

    try {
      const buffer = await readFile(rutaReal);
      const resultado = await pdfParse(buffer);
      const texto = (resultado.text ?? '').replace(/\s+/g, ' ').trim();
      const paginas = Number.isFinite(resultado.numpages)
        ? resultado.numpages
        : null;

      return {
        texto,
        paginas,
        evidencia: {
          id: archivo.id,
          nombre: archivo.nombreOriginal,
          extension: archivo.extension,
          paginas,
          palabras: this.contarPalabras(texto),
          textoDisponible: Boolean(texto),
        },
      };
    } catch {
      return {
        texto: '',
        paginas: null,
        evidencia: {
          id: archivo.id,
          nombre: archivo.nombreOriginal,
          extension: archivo.extension,
          paginas: null,
          palabras: 0,
          textoDisponible: false,
        },
      };
    }
  }

  private calcularEstructura(
    configuracion: ConfiguracionExposicionAnalisis,
    respuesta: RespuestaExposicionAnalisis | null,
    textoTotal: string,
  ): {
    puntuacion: number | null;
    fortalezas: string[];
    advertencias: string[];
    omisiones: string[];
  } {
    const fortalezas: string[] = [];
    const advertencias: string[] = [];
    const omisiones: string[] = [];

    const textoNormalizado = this.normalizarTexto(textoTotal);
    const palabras = this.contarPalabras(textoTotal);

    if (!textoNormalizado) {
      return {
        puntuacion: null,
        fortalezas,
        advertencias: [
          'No se encontró suficiente texto para evaluar la estructura del contenido.',
        ],
        omisiones,
      };
    }

    let puntuacion = 0;

    if (configuracion.estructuraGuiada && configuracion.secciones.length > 0) {
      const seccionesRespuesta = respuesta?.secciones ?? [];
      let cumplidas = 0;

      for (const esperada of configuracion.secciones) {
        const tituloEsperado = this.normalizarTexto(esperada.titulo);
        const encontrada = seccionesRespuesta.find((seccion) =>
          this.normalizarTexto(seccion.titulo).includes(tituloEsperado),
        );

        const tieneContenido = Boolean(encontrada?.contenido.trim());
        const apareceEnMaterial = textoNormalizado.includes(tituloEsperado);

        if (tieneContenido || apareceEnMaterial) {
          cumplidas += 1;
        } else {
          omisiones.push(
            `No se detectó claramente la sección esperada: ${esperada.titulo}.`,
          );
        }
      }

      const proporcion = cumplidas / configuracion.secciones.length;
      puntuacion += proporcion * 75;

      if (proporcion === 1) {
        fortalezas.push(
          'Se identificaron todas las secciones solicitadas en el guion de la exposición.',
        );
      } else if (proporcion >= 0.6) {
        advertencias.push(
          'La estructura general está presente, pero algunas secciones del guion requieren mayor claridad.',
        );
      }
    } else {
      const grupos = [
        ['introduccion', 'presentacion', 'contexto', 'planteamiento'],
        ['desarrollo', 'analisis', 'fundamento', 'argumentacion'],
        ['conclusion', 'conclusiones', 'cierre', 'reflexion final'],
      ];

      const detectados = grupos.filter((grupo) =>
        grupo.some((termino) => textoNormalizado.includes(termino)),
      ).length;

      puntuacion += (detectados / grupos.length) * 75;

      if (detectados === 3) {
        fortalezas.push(
          'El material presenta una secuencia reconocible de introducción, desarrollo y cierre.',
        );
      }

      if (detectados < 3) {
        advertencias.push(
          'Conviene diferenciar con mayor claridad la introducción, el desarrollo y la conclusión.',
        );
      }
    }

    if (
      configuracion.minPalabras !== null &&
      configuracion.maxPalabras !== null
    ) {
      if (
        palabras >= configuracion.minPalabras &&
        palabras <= configuracion.maxPalabras
      ) {
        puntuacion += 15;
        fortalezas.push(
          'La extensión textual se encuentra dentro del rango configurado para el guion.',
        );
      } else {
        puntuacion += 7;
        advertencias.push(
          `La extensión detectada (${palabras} palabras) se encuentra fuera del rango orientativo de ${configuracion.minPalabras} a ${configuracion.maxPalabras}.`,
        );
      }
    } else {
      puntuacion += 15;
    }

    if (respuesta?.tema) {
      puntuacion += 10;
      fortalezas.push('El tema de la exposición está identificado de forma explícita.');
    } else {
      advertencias.push('No se detectó un tema explícitamente identificado en el guion.');
    }

    return {
      puntuacion: this.limitar(puntuacion),
      fortalezas,
      advertencias,
      omisiones,
    };
  }

  private calcularContenidoJuridico(
    configuracion: ConfiguracionExposicionAnalisis,
    respuesta: RespuestaExposicionAnalisis | null,
    textoTotal: string,
  ): {
    puntuacion: number | null;
    fortalezas: string[];
    advertencias: string[];
    omisiones: string[];
    referenciasNormativas: number;
  } {
    const fortalezas: string[] = [];
    const advertencias: string[] = [];
    const omisiones: string[] = [];

    const texto = this.normalizarTexto(textoTotal);

    if (!texto) {
      return {
        puntuacion: null,
        fortalezas,
        advertencias: [
          'No existe texto suficiente para estimar el sustento jurídico del material.',
        ],
        omisiones,
        referenciasNormativas: 0,
      };
    }

    const referenciasArticulo = texto.match(
      /\b(?:articulo|art|arts)\.?\s*\d+[a-z]?\b/g,
    ) ?? [];

    const referenciasNorma = texto.match(
      /\b(?:codigo civil|codigo procesal civil|constitucion politica del estado|cpe|ley\s+n?[º°]?\s*\d+|decreto supremo\s+n?[º°]?\s*\d+)\b/g,
    ) ?? [];

    const referenciasJurisprudencia = texto.match(
      /\b(?:sentencia constitucional|sentencia suprema|auto supremo|jurisprudencia|precedente)\b/g,
    ) ?? [];

    const conectoresArgumentativos = [
      'por tanto',
      'en consecuencia',
      'debido a',
      'conforme a',
      'de acuerdo con',
      'en virtud de',
      'se concluye',
    ].filter((termino) => texto.includes(termino)).length;

    const citasGuion = respuesta?.citas.length ?? 0;
    const referenciasNormativas =
      referenciasArticulo.length + referenciasNorma.length;

    let puntuacion = 0;

    if (referenciasNormativas >= 4) {
      puntuacion += 45;
      fortalezas.push(
        'Se detectó sustento normativo recurrente en el contenido presentado.',
      );
    } else if (referenciasNormativas >= 2) {
      puntuacion += 35;
      fortalezas.push('Se identificaron referencias normativas en el desarrollo.');
    } else if (referenciasNormativas === 1) {
      puntuacion += 20;
      advertencias.push(
        'El sustento normativo detectado es limitado; puede reforzarse con normas y artículos pertinentes.',
      );
    } else {
      omisiones.push('No se detectaron referencias normativas explícitas en el material analizado.');
    }

    const citasObjetivo = configuracion.exigirCitas
      ? configuracion.minCitas
      : 1;

    if (citasGuion >= citasObjetivo) {
      puntuacion += 25;
      fortalezas.push(
        'El guion incluye las citas o fuentes mínimas esperadas para la exposición.',
      );
    } else if (citasGuion > 0) {
      puntuacion += 15;
      advertencias.push(
        `Se registraron ${citasGuion} cita(s), por debajo del mínimo esperado de ${citasObjetivo}.`,
      );
    } else if (configuracion.exigirCitas) {
      omisiones.push('El docente solicitó citas y no se detectaron citas registradas en el guion.');
    } else {
      puntuacion += 10;
    }

    if (referenciasJurisprudencia.length > 0) {
      puntuacion += 15;
      fortalezas.push(
        'Se detectaron referencias jurisprudenciales o a precedentes jurídicos.',
      );
    } else {
      puntuacion += 5;
    }

    if (conectoresArgumentativos >= 3) {
      puntuacion += 15;
      fortalezas.push(
        'El contenido utiliza conectores que reflejan una argumentación jurídica organizada.',
      );
    } else if (conectoresArgumentativos > 0) {
      puntuacion += 9;
      advertencias.push(
        'La argumentación puede fortalecerse explicitando mejor la relación entre norma, análisis y conclusión.',
      );
    } else {
      puntuacion += 3;
      advertencias.push(
        'No se detectó una secuencia argumentativa jurídica suficientemente explícita.',
      );
    }

    return {
      puntuacion: this.limitar(puntuacion),
      fortalezas,
      advertencias,
      omisiones,
      referenciasNormativas,
    };
  }

  private calcularPresentacion(datos: {
    segundosAsignados: number;
    segundosUtilizados: number;
    paginas: number | null;
    palabrasMaterial: number;
    cantidadPreguntas: number;
    preparacionConfirmada: boolean;
  }): {
    puntuacion: number;
    fortalezas: string[];
    advertencias: string[];
  } {
    const fortalezas: string[] = [];
    const advertencias: string[] = [];

    const proporcionTiempo =
      datos.segundosAsignados > 0
        ? datos.segundosUtilizados / datos.segundosAsignados
        : 1;

    let tiempo = 0;

    if (proporcionTiempo >= 0.75 && proporcionTiempo <= 1.1) {
      tiempo = 45;
      fortalezas.push(
        'La duración real se mantuvo dentro de un rango adecuado respecto al tiempo asignado.',
      );
    } else if (proporcionTiempo >= 0.6 && proporcionTiempo <= 1.25) {
      tiempo = 32;
      advertencias.push(
        'El manejo del tiempo fue aceptable, aunque puede ajustarse mejor al tiempo asignado.',
      );
    } else {
      tiempo = 18;
      advertencias.push(
        'La duración de la exposición se alejó de forma importante del tiempo planificado.',
      );
    }

    let material = 20;

    if (datos.paginas && datos.paginas > 0) {
      const palabrasPorPagina = datos.palabrasMaterial / datos.paginas;

      if (palabrasPorPagina <= 120) {
        material = 35;
        fortalezas.push(
          'La densidad textual promedio del material de apoyo es adecuada para una presentación.',
        );
      } else if (palabrasPorPagina <= 220) {
        material = 27;
        advertencias.push(
          'Algunas diapositivas podrían simplificarse para facilitar la lectura durante la exposición.',
        );
      } else {
        material = 15;
        advertencias.push(
          'El material presenta una densidad textual alta; conviene reducir texto y priorizar ideas clave.',
        );
      }
    } else {
      advertencias.push(
        'No fue posible estimar la densidad de las diapositivas con los archivos disponibles.',
      );
    }

    let interaccion = 10;

    if (datos.cantidadPreguntas >= 2) {
      interaccion = 15;
      fortalezas.push(
        'La exposición generó participación del auditorio mediante preguntas registradas.',
      );
    }

    const preparacion = datos.preparacionConfirmada ? 5 : 0;

    if (datos.preparacionConfirmada) {
      fortalezas.push('El estudiante confirmó la preparación previa de la exposición.');
    }

    return {
      puntuacion: this.limitar(tiempo + material + interaccion + preparacion),
      fortalezas,
      advertencias,
    };
  }

  private calcularGlobal(
    estructura: number | null,
    juridico: number | null,
    presentacion: number | null,
  ): number | null {
    const componentes = [
      { valor: estructura, peso: 0.35 },
      { valor: juridico, peso: 0.4 },
      { valor: presentacion, peso: 0.25 },
    ].filter(
      (item): item is { valor: number; peso: number } =>
        item.valor !== null,
    );

    if (componentes.length === 0) {
      return null;
    }

    const sumaPesos = componentes.reduce(
      (total, item) => total + item.peso,
      0,
    );

    const resultado = componentes.reduce(
      (total, item) => total + item.valor * item.peso,
      0,
    );

    return this.limitar(resultado / sumaPesos);
  }

  private construirRetroalimentacion(
    fortalezas: string[],
    advertencias: string[],
    omisiones: string[],
  ): string {
    const partes: string[] = [];

    if (fortalezas.length > 0) {
      partes.push(`Fortalezas: ${fortalezas.slice(0, 3).join(' ')}`);
    }

    const mejoras = [...omisiones, ...advertencias].slice(0, 4);

    if (mejoras.length > 0) {
      partes.push(`Aspectos a reforzar: ${mejoras.join(' ')}`);
    }

    return partes.join('\n\n');
  }

  private async analizarTurno(turno: {
    id: number;
    segundosUtilizados: number;
    jornada: {
      duracionSegundos: number;
      tarea: {
        configuracionTipo: Prisma.JsonValue | null;
      };
    };
    entrega: {
      contenido: string | null;
      archivos: Array<{
        id: number;
        nombreOriginal: string;
        extension: string;
        mimeType: string;
        ruta: string;
        textoExtraido: string | null;
      }>;
    };
    preguntas: Array<{
      id: number;
      diapositiva: number | null;
      segundosExposicion: number | null;
      estado: string;
    }>;
  }): Promise<ResultadoAnalisis> {
    const configuracion = this.leerConfiguracionExposicion(
      turno.jornada.tarea.configuracionTipo,
    );

    const respuesta = this.leerRespuestaExposicion(turno.entrega.contenido);

    const textosArchivo: string[] = [];
    const archivosAnalizados: ArchivoAnalizado[] = [];
    let paginasTotales = 0;
    let tienePaginas = false;

    for (const archivo of turno.entrega.archivos) {
      const extraido = await this.extraerTextoArchivo(archivo);

      if (extraido.texto) {
        textosArchivo.push(extraido.texto);
      }

      archivosAnalizados.push(extraido.evidencia);

      if (extraido.paginas !== null) {
        paginasTotales += extraido.paginas;
        tienePaginas = true;
      }
    }

    const textoGuion = respuesta
      ? [
          respuesta.tema,
          ...respuesta.secciones.flatMap((seccion) => [
            seccion.titulo,
            seccion.consigna,
            seccion.contenido,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
      : turno.entrega.contenido ?? '';

    const textoMaterial = textosArchivo.join(' ');
    const textoTotal = `${textoGuion} ${textoMaterial}`.trim();

    const estructura = this.calcularEstructura(
      configuracion,
      respuesta,
      textoTotal,
    );

    const juridico = this.calcularContenidoJuridico(
      configuracion,
      respuesta,
      textoTotal,
    );

    const presentacion = this.calcularPresentacion({
      segundosAsignados: turno.jornada.duracionSegundos,
      segundosUtilizados: turno.segundosUtilizados,
      paginas: tienePaginas ? paginasTotales : null,
      palabrasMaterial: this.contarPalabras(textoMaterial),
      cantidadPreguntas: turno.preguntas.length,
      preparacionConfirmada: respuesta?.preparacionConfirmada ?? false,
    });

    const fortalezas = Array.from(
      new Set([
        ...estructura.fortalezas,
        ...juridico.fortalezas,
        ...presentacion.fortalezas,
      ]),
    ).slice(0, 8);

    const advertencias = Array.from(
      new Set([
        ...estructura.advertencias,
        ...juridico.advertencias,
        ...presentacion.advertencias,
      ]),
    ).slice(0, 8);

    const omisiones = Array.from(
      new Set([...estructura.omisiones, ...juridico.omisiones]),
    ).slice(0, 8);

    const puntuacionGlobal = this.calcularGlobal(
      estructura.puntuacion,
      juridico.puntuacion,
      presentacion.puntuacion,
    );

    const resumen =
      puntuacionGlobal === null
        ? 'El análisis se completó con evidencia limitada. Revisa las observaciones antes de utilizarlas como apoyo en la retroalimentación.'
        : puntuacionGlobal >= 85
          ? 'La exposición presenta una estructura sólida, buen sustento y un desempeño general consistente según las evidencias disponibles.'
          : puntuacionGlobal >= 70
            ? 'La exposición cumple adecuadamente con los elementos principales, aunque existen aspectos concretos que pueden reforzarse.'
            : 'La exposición presenta elementos rescatables, pero requiere reforzar varios aspectos de estructura, sustento o presentación.';

    const palabrasGuion = this.contarPalabras(textoGuion);
    const palabrasMaterial = this.contarPalabras(textoMaterial);

    const evidenciaBase = {
      versionMotor: 1,
      estructuraGuiada: configuracion.estructuraGuiada,
      seccionesEsperadas: configuracion.secciones.map((seccion) => seccion.titulo),
      palabrasGuion,
      palabrasMaterial,
      palabrasTotales: palabrasGuion + palabrasMaterial,
      citasRegistradas: respuesta?.citas.length ?? 0,
      referenciasNormativasDetectadas: juridico.referenciasNormativas,
      segundosAsignados: turno.jornada.duracionSegundos,
      segundosUtilizados: turno.segundosUtilizados,
      preguntasRegistradas: turno.preguntas.length,
      preguntasConContexto: turno.preguntas.filter(
        (pregunta) =>
          pregunta.diapositiva !== null ||
          pregunta.segundosExposicion !== null,
      ).length,
      diapositivasEstimadas: tienePaginas ? paginasTotales : null,
      archivos: archivosAnalizados,
    };

    const hashEntrada = createHash('sha256')
      .update(
        JSON.stringify({
          configuracion,
          respuesta,
          textoTotal,
          evidenciaBase,
        }),
      )
      .digest('hex');

    return {
      puntuacionEstructura: estructura.puntuacion,
      puntuacionContenidoJuridico: juridico.puntuacion,
      puntuacionPresentacion: presentacion.puntuacion,
      puntuacionGlobal,
      resumen,
      fortalezas,
      advertencias,
      omisiones,
      retroalimentacionSugerida: this.construirRetroalimentacion(
        fortalezas,
        advertencias,
        omisiones,
      ),
      evidencias: evidenciaBase as Prisma.InputJsonValue,
      hashEntrada,
    };
  }

  private async obtenerTurnoAutorizado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    this.validarDocente(usuario);

    const turno = await this.prisma.turnoExposicion.findFirst({
      where: {
        id: turnoId,
        jornadaId,
        jornada: {
          id: jornadaId,
          tareaId,
          tarea: {
            id: tareaId,
            cursoId,
            tipo: TipoTarea.EXPOSICION,
            estaActiva: true,
            curso: {
              docenteId: usuario.id,
            },
          },
        },
      },
      include: {
        jornada: {
          include: {
            tarea: {
              select: {
                id: true,
                configuracionTipo: true,
              },
            },
          },
        },
        entrega: {
          select: {
            id: true,
            contenido: true,
            archivos: {
              where: {
                estaActivo: true,
              },
              select: {
                id: true,
                nombreOriginal: true,
                extension: true,
                mimeType: true,
                ruta: true,
                textoExtraido: true,
              },
            },
          },
        },
        preguntas: {
          select: {
            id: true,
            diapositiva: true,
            segundosExposicion: true,
            estado: true,
          },
        },
      },
    });

    if (!turno) {
      throw new NotFoundException(
        'El turno de exposición no existe o no pertenece al docente',
      );
    }

    return turno;
  }

  async obtenerAnalisis(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    await this.obtenerTurnoAutorizado(
      usuario,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );

    return this.prisma.analisisExposicion.findUnique({
      where: {
        turnoId,
      },
    });
  }

  async generarAnalisis(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    jornadaId: number,
    turnoId: number,
  ) {
    const turno = await this.obtenerTurnoAutorizado(
      usuario,
      cursoId,
      tareaId,
      jornadaId,
      turnoId,
    );

    if (turno.estado !== EstadoTurnoExposicion.FINALIZADO) {
      throw new BadRequestException(
        'El análisis inteligente solo puede generarse después de finalizar la exposición',
      );
    }

    const ahora = new Date();

    await this.prisma.analisisExposicion.upsert({
      where: {
        turnoId,
      },
      update: {
        generadoPorId: usuario.id,
        estado: EstadoAnalisisExposicion.PROCESANDO,
        version: {
          increment: 1,
        },
        error: null,
        iniciadoEn: ahora,
        finalizadoEn: null,
      },
      create: {
        turnoId,
        generadoPorId: usuario.id,
        estado: EstadoAnalisisExposicion.PROCESANDO,
        version: 1,
        iniciadoEn: ahora,
      },
    });

    try {
      const resultado = await this.analizarTurno(turno);

      return await this.prisma.analisisExposicion.update({
        where: {
          turnoId,
        },
        data: {
          estado: EstadoAnalisisExposicion.COMPLETADO,
          puntuacionEstructura:
            resultado.puntuacionEstructura === null
              ? null
              : new Prisma.Decimal(resultado.puntuacionEstructura),
          puntuacionContenidoJuridico:
            resultado.puntuacionContenidoJuridico === null
              ? null
              : new Prisma.Decimal(resultado.puntuacionContenidoJuridico),
          puntuacionPresentacion:
            resultado.puntuacionPresentacion === null
              ? null
              : new Prisma.Decimal(resultado.puntuacionPresentacion),
          puntuacionGlobal:
            resultado.puntuacionGlobal === null
              ? null
              : new Prisma.Decimal(resultado.puntuacionGlobal),
          resumen: resultado.resumen,
          fortalezas: resultado.fortalezas,
          advertencias: resultado.advertencias,
          omisiones: resultado.omisiones,
          retroalimentacionSugerida:
            resultado.retroalimentacionSugerida || null,
          evidencias: resultado.evidencias,
          hashEntrada: resultado.hashEntrada,
          error: null,
          finalizadoEn: new Date(),
        },
      });
    } catch (causa) {
      const mensaje =
        causa instanceof Error
          ? causa.message
          : 'No fue posible completar el análisis inteligente';

      await this.prisma.analisisExposicion.update({
        where: {
          turnoId,
        },
        data: {
          estado: EstadoAnalisisExposicion.ERROR,
          error: mensaje,
          finalizadoEn: new Date(),
        },
      });

      throw new BadRequestException(
        `No se pudo generar el análisis de la exposición: ${mensaje}`,
      );
    }
  }
}
