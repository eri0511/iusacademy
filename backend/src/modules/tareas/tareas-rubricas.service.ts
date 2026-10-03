import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

import { Prisma, Rol } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CalificarRutricaDto } from './dto/calificar-rubrica.dto';

import {
  CrearRubricaDto,
  RubricaCriterioDto,
  RubricaNivelDto,
} from './dto/crear-rubrica.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

import { TareasEvaluacionService } from './tareas-evaluacion.service';

@Injectable()
export class TareasRubricasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluacionService: TareasEvaluacionService,
  ) {}

  private async obtenerTareaAutorizada(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede administrar rúbricas',
      );
    }

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,
        cursoId,
        estaActiva: true,
      },
      select: {
        id: true,
        autorId: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe');
    }

    if (tarea.autorId !== usuario.id) {
      throw new ForbiddenException(
        'No puedes modificar una tarea que no te pertenece',
      );
    }

    return tarea;
  }

  async obtenerRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    return this.prisma.rubricaTarea.findUnique({
      where: {
        tareaId,
      },
      include: {
        criterios: {
          include: {
            niveles: {
              orderBy: {
                orden: 'asc',
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });
  }

  async crearRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    datos: CrearRubricaDto,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    if (datos.criterios.some((criterio) => !criterio.niveles?.length)) {
      throw new BadRequestException(
        'Cada criterio debe tener al menos un nivel',
      );
    }

    const sumaPesos = datos.criterios.reduce(
      (total, criterio) => total + Number(criterio.peso ?? 0),
      0,
    );

    const ponderacionMax = Number(datos.ponderacionMax ?? 100);

    if (Math.abs(sumaPesos - ponderacionMax) > 0.5) {
      throw new BadRequestException(
        `La suma de los pesos (${sumaPesos}) debe coincidir con la ponderación máxima (${ponderacionMax})`,
      );
    }

    await this.prisma.rubricaTarea.deleteMany({
      where: {
        tareaId,
      },
    });

    return this.prisma.rubricaTarea.create({
      data: {
        tareaId,
        nombre: datos.nombre,
        origen: datos.origen ?? 'MANUAL',
        ponderacionMax: new Prisma.Decimal(ponderacionMax),
        criterios: {
          create: datos.criterios.map((criterio) => ({
            orden: criterio.orden,
            nombre: criterio.nombre,
            descripcion: criterio.descripcion ?? null,
            peso: new Prisma.Decimal(Number(criterio.peso ?? 0)),
            niveles: {
              create: criterio.niveles.map((nivel) => ({
                orden: nivel.orden,
                etiqueta: nivel.etiqueta,
                descripcion: nivel.descripcion ?? null,
                puntos: new Prisma.Decimal(Number(nivel.puntos ?? 0)),
              })),
            },
          })),
        },
      },
      include: {
        criterios: {
          include: {
            niveles: true,
          },
        },
      },
    });
  }

  async eliminarRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    const resultado = await this.prisma.rubricaTarea.deleteMany({
      where: {
        tareaId,
      },
    });

    if (resultado.count === 0) {
      throw new NotFoundException('La tarea no tiene rúbrica');
    }

    return {
      eliminada: true,
    };
  }

  async importarRubricaDesdeArchivo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    archivo: Express.Multer.File,
  ): Promise<CrearRubricaDto> {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    if (!archivo) {
      throw new BadRequestException(
        'Selecciona un archivo de rúbrica en formato .xlsx o .pdf',
      );
    }

    if (!archivo.buffer || archivo.buffer.length === 0) {
      throw new BadRequestException('El archivo de rúbrica está vacío');
    }

    const nombreArchivo = archivo.originalname?.toLowerCase() ?? '';

    if (nombreArchivo.endsWith('.xlsx')) {
      return this.procesarRubricaExcel(archivo);
    }

    if (nombreArchivo.endsWith('.pdf')) {
      return this.procesarRubricaPdf(archivo);
    }

    throw new BadRequestException(
      'Formato no admitido. Solo se permiten archivos .xlsx y .pdf',
    );
  }

  async importarRubricaDesdeExcel(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    archivo: Express.Multer.File,
  ): Promise<CrearRubricaDto> {
    return this.importarRubricaDesdeArchivo(
      usuario,
      cursoId,
      tareaId,
      archivo,
    );
  }

  private async procesarRubricaExcel(
    archivo: Express.Multer.File,
  ): Promise<CrearRubricaDto> {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(archivo.buffer, {
        type: 'buffer',
        cellDates: false,
        cellNF: true,
        cellText: true,
      });
    } catch (error) {
      console.error('Error real al leer el Excel:', error);

      console.error('Información del archivo:', {
        nombre: archivo.originalname,
        mimetype: archivo.mimetype,
        tamanio: archivo.size,
        bufferLength: archivo.buffer?.length,
        primerosBytes: archivo.buffer
          ?.subarray(0, 8)
          .toString('hex'),
      });

      throw new BadRequestException(
        'No se pudo leer el archivo Excel. Verifica que sea un archivo .xlsx válido y que no esté dañado',
      );
    }

    const nombreHoja = workbook.SheetNames[0];

    if (!nombreHoja) {
      throw new BadRequestException(
        'El archivo Excel no contiene hojas',
      );
    }

    const hoja = workbook.Sheets[nombreHoja];

    if (!hoja) {
      throw new BadRequestException(
        'No se pudo leer la primera hoja del archivo Excel',
      );
    }

    const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (filas.length === 0) {
      throw new BadRequestException(
        'El archivo Excel no contiene datos',
      );
    }

    let filaEncabezado = -1;

    for (
      let indiceFila = 0;
      indiceFila < filas.length;
      indiceFila += 1
    ) {
      const fila = Array.isArray(filas[indiceFila])
        ? filas[indiceFila]
        : [];

      const etiquetasFila = fila.map((valor) =>
        this.textoCeldaExcel(valor),
      );

      const tieneColumnaCriterio = etiquetasFila.some((etiqueta) =>
        /^(criterio|aspecto|indicador)$/i.test(etiqueta),
      );

      if (tieneColumnaCriterio) {
        filaEncabezado = indiceFila;
        break;
      }
    }

    if (filaEncabezado === -1) {
      throw new BadRequestException(
        'No se encontró la fila de encabezados. El Excel debe contener una columna llamada "Criterio"',
      );
    }

    const encabezado = Array.isArray(filas[filaEncabezado])
      ? filas[filaEncabezado]
      : [];

    const etiquetas = encabezado.map((valor) =>
      this.textoCeldaExcel(valor),
    );

    const indiceCriterio = etiquetas.findIndex((etiqueta) =>
      /^(criterio|aspecto|indicador)$/i.test(etiqueta),
    );

    const indicePeso = etiquetas.findIndex((etiqueta) =>
      /^(peso|peso\s*\(%\)|ponderaci[oó]n|ponderaci[oó]n\s*\(%\)|porcentaje|%)$/i.test(
        etiqueta,
      ),
    );

    const indiceDescripcion = etiquetas.findIndex((etiqueta) =>
      /^(descripci[oó]n|detalle)$/i.test(etiqueta),
    );

    const columnasIgnoradas = etiquetas
      .map((etiqueta, indice) => ({
        etiqueta,
        indice,
      }))
      .filter(({ etiqueta }) =>
        /^(puntaje(\s+obtenido)?|nota|resultado|calificaci[oó]n|observaciones?|comentarios?)$/i.test(
          etiqueta,
        ),
      )
      .map(({ indice }) => indice);

    const indiceNiveles: number[] = [];

    etiquetas.forEach((etiqueta, indice) => {
      if (
        indice === indiceCriterio ||
        indice === indicePeso ||
        indice === indiceDescripcion ||
        columnasIgnoradas.includes(indice) ||
        !etiqueta.trim()
      ) {
        return;
      }

      indiceNiveles.push(indice);
    });

    if (indiceCriterio === -1) {
      throw new BadRequestException(
        'El Excel debe incluir una columna llamada "Criterio"',
      );
    }

    if (indiceNiveles.length === 0) {
      throw new BadRequestException(
        'La rúbrica debe incluir al menos una columna de nivel de desempeño',
      );
    }

    const criterios: RubricaCriterioDto[] = [];

    for (
      let indiceFila = filaEncabezado + 1;
      indiceFila < filas.length;
      indiceFila += 1
    ) {
      const fila = Array.isArray(filas[indiceFila])
        ? filas[indiceFila]
        : [];

      const nombre = this.textoCeldaExcel(
        fila[indiceCriterio],
      );

      if (!nombre) {
        continue;
      }

      if (
        /^(resumen|ponderaci[oó]n total|observaciones?|retroalimentaci[oó]n)$/i.test(
          nombre,
        )
      ) {
        continue;
      }

      const peso =
        indicePeso === -1
          ? 0
          : (this.extraerNumeroExcel(fila[indicePeso]) ?? 0);

      const descripcion =
        indiceDescripcion === -1
          ? undefined
          : this.textoCeldaExcel(
              fila[indiceDescripcion],
            ) || undefined;

      const niveles: RubricaNivelDto[] = indiceNiveles.map(
        (indiceNivel, posicion) => {
          const descripcionNivel =
            this.textoCeldaExcel(
              fila[indiceNivel],
            ) || undefined;

          return {
            orden: posicion + 1,
            etiqueta: etiquetas[indiceNivel],
            descripcion: descripcionNivel,
            puntos: 0,
          };
        },
      );

      criterios.push({
        orden: criterios.length + 1,
        nombre,
        descripcion,
        peso,
        niveles,
      });
    }

    if (criterios.length === 0) {
      throw new BadRequestException(
        'No se encontraron criterios válidos en el archivo Excel',
      );
    }

    this.normalizarPesosSinDefinir(
      criterios,
      indicePeso === -1,
    );

    this.calcularPuntosNiveles(criterios);

    const ponderacionMax =
      this.calcularPonderacion(criterios);

    this.validarPonderacion(ponderacionMax);

    return {
      nombre: this.obtenerNombreRubricaDesdeExcel(
        filas,
        nombreHoja,
      ),
      origen: 'EXCEL',
      ponderacionMax,
      criterios,
    };
  }

  private async procesarRubricaPdf(
    archivo: Express.Multer.File,
  ): Promise<CrearRubricaDto> {
    let texto = '';

    try {
      const resultado = await pdfParse(archivo.buffer);
      texto = resultado.text ?? '';
    } catch (error) {
      console.error('Error real al leer el PDF de rúbrica:', error);

      throw new BadRequestException(
        'No se pudo leer el PDF. Verifica que sea un archivo PDF válido y que no esté dañado',
      );
    }

    const textoNormalizado = texto
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!textoNormalizado) {
      throw new BadRequestException(
        'El PDF no contiene texto seleccionable. Si es un PDF escaneado, primero debe aplicarse OCR',
      );
    }

    const lineas = textoNormalizado
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);

    const nombre = this.obtenerNombreRubricaDesdePdf(lineas, archivo.originalname);
    const nivelesDetectados = this.detectarNivelesPdf(lineas);
    const criterios = this.extraerCriteriosPdf(lineas, nivelesDetectados);

    if (criterios.length === 0) {
      throw new BadRequestException(
        'No se pudieron identificar criterios y ponderaciones en el PDF. El PDF debe contener texto seleccionable y cada criterio debe incluir su peso o porcentaje',
      );
    }

    this.calcularPuntosNiveles(criterios);

    const ponderacionMax = this.calcularPonderacion(criterios);

    this.validarPonderacion(ponderacionMax);

    return {
      nombre,
      origen: 'MANUAL',
      ponderacionMax,
      criterios,
    };
  }

  private extraerCriteriosPdf(
    lineas: string[],
    nivelesDetectados: string[],
  ): RubricaCriterioDto[] {
    const candidatos: Array<{
      indice: number;
      nombre: string;
      peso: number;
      resto: string;
    }> = [];

    const expresiones = [
      /^(.+?)\s+(\d{1,3}(?:[.,]\d+)?)\s*%\s*(.*)$/i,
      /^(.+?)\s+\((\d{1,3}(?:[.,]\d+)?)\s*%\)\s*(.*)$/i,
      /^(.+?)\s*[-–—:]\s*(\d{1,3}(?:[.,]\d+)?)\s*%\s*(.*)$/i,
    ];

    lineas.forEach((linea, indice) => {
      if (
        /^(criterio|aspecto|indicador|peso|ponderaci[oó]n|porcentaje|nivel|desempeño)$/i.test(
          linea,
        )
      ) {
        return;
      }

      for (const expresion of expresiones) {
        const coincidencia = linea.match(expresion);

        if (!coincidencia) {
          continue;
        }

        const nombre = coincidencia[1].trim();
        const peso = Number(coincidencia[2].replace(',', '.'));
        const resto = coincidencia[3]?.trim() ?? '';

        if (
          nombre.length >= 2 &&
          Number.isFinite(peso) &&
          peso > 0 &&
          peso <= 100
        ) {
          candidatos.push({
            indice,
            nombre,
            peso,
            resto,
          });
        }

        break;
      }
    });

    return candidatos.map((candidato, posicion) => {
      const siguienteIndice =
        candidatos[posicion + 1]?.indice ?? lineas.length;

      const bloque = [
        candidato.resto,
        ...lineas.slice(candidato.indice + 1, siguienteIndice),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const niveles = nivelesDetectados.map((etiqueta, indiceNivel) => ({
        orden: indiceNivel + 1,
        etiqueta,
        descripcion: this.extraerDescripcionNivelPdf(
          bloque,
          etiqueta,
          nivelesDetectados,
        ),
        puntos: 0,
      }));

      const descripcion =
        this.extraerDescripcionCriterioPdf(
          bloque,
          nivelesDetectados,
        );

      return {
        orden: posicion + 1,
        nombre: candidato.nombre,
        descripcion,
        peso: candidato.peso,
        niveles,
      };
    });
  }

  private detectarNivelesPdf(lineas: string[]): string[] {
    const texto = lineas.join(' | ');
    const catalogo = [
      'Insuficiente',
      'Inicial',
      'Básico',
      'Basico',
      'En proceso',
      'Regular',
      'Satisfactorio',
      'Logrado',
      'Bueno',
      'Muy bueno',
      'Excelente',
      'Sobresaliente',
    ];

    const encontrados: string[] = [];

    catalogo.forEach((nivel) => {
      const expresion = new RegExp(
        `\\b${this.escaparRegex(nivel)}\\b`,
        'i',
      );

      if (expresion.test(texto)) {
        const etiqueta =
          nivel === 'Basico'
            ? 'Básico'
            : nivel;

        if (!encontrados.includes(etiqueta)) {
          encontrados.push(etiqueta);
        }
      }
    });

    if (encontrados.length >= 2) {
      return encontrados.slice(0, 6);
    }

    return [
      'Insuficiente',
      'Básico',
      'Bueno',
      'Excelente',
    ];
  }

  private extraerDescripcionNivelPdf(
    bloque: string,
    etiqueta: string,
    niveles: string[],
  ): string | undefined {
    if (!bloque) {
      return undefined;
    }

    const indiceActual = niveles.findIndex(
      (nivel) => nivel === etiqueta,
    );

    const siguiente =
      indiceActual >= 0
        ? niveles[indiceActual + 1]
        : undefined;

    const patronSiguiente = siguiente
      ? `(?=${this.escaparRegex(siguiente)}\\b|$)`
      : '$';

    const expresion = new RegExp(
      `${this.escaparRegex(etiqueta)}\\s*[:\\-–—]?\\s*(.+?)${patronSiguiente}`,
      'i',
    );

    const coincidencia = bloque.match(expresion);

    const descripcion = coincidencia?.[1]
      ?.replace(/\s+/g, ' ')
      .trim();

    return descripcion || undefined;
  }

  private extraerDescripcionCriterioPdf(
    bloque: string,
    niveles: string[],
  ): string | undefined {
    if (!bloque) {
      return undefined;
    }

    let descripcion = bloque;

    niveles.forEach((nivel) => {
      const expresion = new RegExp(
        `${this.escaparRegex(nivel)}\\s*[:\\-–—]?\\s*.*?(?=${niveles
          .filter((otro) => otro !== nivel)
          .map((otro) => `${this.escaparRegex(otro)}\\b`)
          .join('|')}|$)`,
        'gi',
      );

      descripcion = descripcion.replace(expresion, ' ');
    });

    descripcion = descripcion
      .replace(/\s+/g, ' ')
      .trim();

    return descripcion || undefined;
  }

  private obtenerNombreRubricaDesdePdf(
    lineas: string[],
    nombreArchivo: string,
  ): string {
    const primeraLineaUtil = lineas.find(
      (linea) =>
        linea.length >= 4 &&
        !/^(criterio|aspecto|indicador|peso|ponderaci[oó]n|porcentaje)$/i.test(
          linea,
        ),
    );

    if (primeraLineaUtil) {
      return primeraLineaUtil.slice(0, 150);
    }

    return nombreArchivo
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .slice(0, 150) || 'Rúbrica importada desde PDF';
  }

  private normalizarPesosSinDefinir(
    criterios: RubricaCriterioDto[],
    repartir: boolean,
  ): void {
    if (!repartir) {
      return;
    }

    const pesoBase = Math.round((100 / criterios.length) * 100) / 100;

    criterios.forEach((criterio) => {
      criterio.peso = pesoBase;
    });

    const diferencia =
      Math.round(
        (100 -
          criterios.reduce(
            (total, criterio) => total + Number(criterio.peso),
            0,
          )) *
          100,
      ) / 100;

    if (criterios.length > 0 && Math.abs(diferencia) > 0) {
      const ultimo = criterios[criterios.length - 1];

      ultimo.peso =
        Math.round((Number(ultimo.peso) + diferencia) * 100) / 100;
    }
  }

  private calcularPuntosNiveles(
    criterios: RubricaCriterioDto[],
  ): void {
    criterios.forEach((criterio) => {
      const cantidadNiveles = criterio.niveles.length;

      criterio.niveles.forEach((nivel, posicion) => {
        const porcentajeNivel = this.extraerPorcentajeNivel(
          nivel.etiqueta,
          nivel.descripcion,
          posicion,
          cantidadNiveles,
        );

        nivel.puntos =
          Math.round(
            Number(criterio.peso) *
              (porcentajeNivel / 100) *
              100,
          ) / 100;
      });
    });
  }

  private calcularPonderacion(
    criterios: RubricaCriterioDto[],
  ): number {
    return (
      Math.round(
        criterios.reduce(
          (total, criterio) => total + Number(criterio.peso),
          0,
        ) * 100,
      ) / 100
    );
  }

  private validarPonderacion(
    ponderacionMax: number,
  ): void {
    if (Math.abs(ponderacionMax - 100) > 0.5) {
      throw new BadRequestException(
        `La ponderación total de la rúbrica debe sumar 100%. Actualmente suma ${ponderacionMax}%`,
      );
    }
  }

  private textoCeldaExcel(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    if (typeof valor === 'string') {
      return valor.trim();
    }

    if (typeof valor === 'number' || typeof valor === 'boolean') {
      return String(valor).trim();
    }

    if (valor instanceof Date) {
      return valor.toISOString();
    }

    return String(valor).trim();
  }

  private extraerNumeroExcel(valor: unknown): number | undefined {
    if (typeof valor === 'number') {
      return Number.isFinite(valor)
        ? valor
        : undefined;
    }

    const texto = this.textoCeldaExcel(valor);

    if (!texto) {
      return undefined;
    }

    const coincidencia = texto.match(
      /(\d+(?:[.,]\d+)?)/,
    );

    if (!coincidencia) {
      return undefined;
    }

    const numero = Number(
      coincidencia[1].replace(',', '.'),
    );

    return Number.isFinite(numero)
      ? numero
      : undefined;
  }

  private obtenerNombreRubricaDesdeExcel(
    filas: unknown[][],
    nombreHoja: string,
  ): string {
    for (
      let indiceFila = 0;
      indiceFila < Math.min(filas.length, 8);
      indiceFila += 1
    ) {
      const fila = Array.isArray(filas[indiceFila])
        ? filas[indiceFila]
        : [];

      const texto = this.textoCeldaExcel(
        fila[0],
      );

      if (texto) {
        return texto.slice(0, 150);
      }
    }

    return nombreHoja || 'Rúbrica importada';
  }

  private extraerPorcentajeNivel(
    etiqueta: string,
    descripcion: string | null | undefined,
    posicion: number,
    cantidadNiveles: number,
  ): number {
    const prefijoDescripcion =
      (descripcion ?? '').split(':')[0];

    const texto =
      `${etiqueta} ${prefijoDescripcion}`;

    const valores = [
      ...texto.matchAll(
        /\d+(?:[.,]\d+)?/g,
      ),
    ]
      .map((coincidencia) =>
        Number(
          coincidencia[0].replace(
            ',',
            '.',
          ),
        ),
      )
      .filter(
        (valor) =>
          Number.isFinite(valor) &&
          valor >= 0 &&
          valor <= 100,
      );

    if (valores.length > 0) {
      return Math.max(
        ...valores,
      );
    }

    return (
      Math.round(
        ((posicion + 1) /
          cantidadNiveles) *
          100 *
          100,
      ) / 100
    );
  }

  private escaparRegex(valor: string): string {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async obtenerEvaluacionEntrega(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
  ) {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    return this.prisma.calificacionRubrica.findFirst({
      where: {
        entregaId,
        entrega: {
          tareaId,
        },
      },
      include: {
        items: {
          include: {
            criterio: true,
            nivel: true,
          },
        },
      },
    });
  }

  /**
   * Persiste la evaluación por rúbrica y devuelve la nota base sobre
   * escala de 100. La nota resultante (total / ponderacionMax * 100) se
   * propaga luego por la lógica de calificación existente.
   */
  async calificarEntregaConRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
    datos: CalificarRutricaDto,
  ): Promise<number> {
    await this.obtenerTareaAutorizada(usuario, cursoId, tareaId);

    const rubrica = await this.prisma.rubricaTarea.findUnique({
      where: {
        tareaId,
      },
      include: {
        criterios: {
          include: {
            niveles: true,
          },
        },
      },
    });

    if (!rubrica) {
      throw new NotFoundException('La tarea no tiene rúbrica');
    }

    const entrega = await this.prisma.entregaTarea.findFirst({
      where: {
        id: entregaId,
        tareaId,
        estaActiva: true,
      },
      select: {
        id: true,
      },
    });

    if (!entrega) {
      throw new NotFoundException('La entrega no existe');
    }

    const criterios = new Map(
      rubrica.criterios.map((criterio) => [criterio.id, criterio]),
    );

    let notaBase = 0;

    for (const item of datos.items) {
      const criterio = criterios.get(item.criterioId);

      if (!criterio) {
        throw new BadRequestException(
          `El criterio ${item.criterioId} no pertenece a esta rúbrica`,
        );
      }

      if (item.nivelId) {
        const nivel = criterio.niveles.find(
          (candidato) => candidato.id === item.nivelId,
        );

        if (!nivel) {
          throw new BadRequestException(
            `El nivel ${item.nivelId} no pertenece al criterio ${criterio.id}`,
          );
        }
      }

      const puntos =
        item.puntosAsignados ??
        (item.nivelId
          ? Number(
              criterio.niveles.find(
                (candidato) => candidato.id === item.nivelId,
              )?.puntos ?? 0,
            )
          : 0);

      if (puntos > Number(criterio.peso) + 0.01) {
        throw new BadRequestException(
          `Los puntos del criterio "${criterio.nombre}" no pueden superar su peso (${Number(criterio.peso)})`,
        );
      }

      notaBase += puntos;
    }

    const ponderacionMax = Number(rubrica.ponderacionMax);

    const notaBaseEscala100 =
      Math.round((notaBase / ponderacionMax) * 100 * 100) / 100;

    const retroalimentacionRubrica = datos.items
      .map((item) => item.retroalimentacion?.trim())
      .filter((texto): texto is string => Boolean(texto))
      .join(' | ')
      .slice(0, 4000);

    await this.prisma.$transaction(async (transaction) => {
      const calificacion = await transaction.calificacionRubrica.upsert({
        where: {
          entregaId,
        },
        update: {
          completada: true,
        },
        create: {
          entregaId,
          completada: true,
        },
      });

      await transaction.criterioCalificacionEntrega.deleteMany({
        where: {
          calificacionId: calificacion.id,
        },
      });

      await transaction.criterioCalificacionEntrega.createMany({
        data: datos.items.map((item) => {
          const criterio = criterios.get(item.criterioId)!;

          return {
            calificacionId: calificacion.id,
            criterioId: criterio.id,
            nivelId: item.nivelId ?? null,
            puntosAsignados: new Prisma.Decimal(
              item.puntosAsignados ??
                (item.nivelId
                  ? Number(
                      criterio.niveles.find(
                        (candidato) => candidato.id === item.nivelId,
                      )?.puntos ?? 0,
                    )
                  : 0),
            ),
            retroalimentacion: item.retroalimentacion ?? null,
          };
        }),
      });
    });

    try {
      await this.evaluacionService.calificarEntrega(
        usuario,
        cursoId,
        tareaId,
        entregaId,
        {
          notaBase: notaBaseEscala100,
          retroalimentacion: retroalimentacionRubrica || undefined,
        },
      );
    } catch (error) {
      await this.prisma.calificacionRubrica.update({
        where: {
          entregaId,
        },
        data: {
          completada: false,
        },
      });

      throw error;
    }

    return notaBaseEscala100;
  }
}
