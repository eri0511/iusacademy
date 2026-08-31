import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DificultadQuiz,
  EstadoQuiz,
  OrigenPreguntaQuiz,
  Rol,
  TipoPreguntaQuiz,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import type { UsuarioAutenticado } from '../archivos/interfaces/usuario-autenticado.interface';

import { GenerarBorradorPreguntasQuizDto } from './dto/generar-borrador-preguntas-quiz.dto';

type FragmentoGeneracion = {
  id: number;

  tituloReferencia: string | null;

  tipoReferencia: string | null;

  texto: string;
};

@Injectable()
export class QuizGeneradorService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizarEspacios(texto: string) {
    return texto.replace(/\s+/g, ' ').trim();
  }

  private dividirOraciones(texto: string) {
    return this.normalizarEspacios(texto)
      .split(/(?<=[.!?])\s+/)
      .map((oracion) => oracion.trim())
      .filter((oracion) => oracion.length >= 45 && oracion.length <= 360);
  }

  private obtenerBancoOraciones(fragmentos: FragmentoGeneracion[]) {
    const banco = fragmentos.flatMap((fragmento) =>
      this.dividirOraciones(fragmento.texto).map((texto) => ({
        fragmentoId: fragmento.id,

        texto,
      })),
    );

    const vistos = new Set<string>();

    return banco.filter((item) => {
      const clave = item.texto.toLocaleLowerCase('es');

      if (vistos.has(clave)) {
        return false;
      }

      vistos.add(clave);

      return true;
    });
  }

  private tomarDistractores(
    banco: Array<{
      fragmentoId: number;

      texto: string;
    }>,

    correcta: string,

    fragmentoId: number,

    cantidad: number,
  ) {
    const candidatos = banco.filter(
      (item) => item.texto !== correcta && item.fragmentoId !== fragmentoId,
    );

    const resultado: string[] = [];

    for (const candidato of candidatos) {
      if (resultado.length >= cantidad) {
        break;
      }

      resultado.push(candidato.texto);
    }

    if (resultado.length < cantidad) {
      const secundarios = banco.filter(
        (item) => item.texto !== correcta && !resultado.includes(item.texto),
      );

      for (const candidato of secundarios) {
        if (resultado.length >= cantidad) {
          break;
        }

        resultado.push(candidato.texto);
      }
    }

    return resultado;
  }

  private construirPreguntaOpcionMultiple(
    fragmento: FragmentoGeneracion,

    correcta: string,

    distractores: string[],

    dificultad: DificultadQuiz,

    orden: number,
  ) {
    const referencia =
      fragmento.tituloReferencia ?? 'el fragmento jurídico seleccionado';

    const enunciado =
      dificultad === DificultadQuiz.FACIL
        ? `Según ${referencia}, ¿cuál de las siguientes afirmaciones corresponde al texto seleccionado?`
        : dificultad === DificultadQuiz.DIFICIL
          ? `A partir de ${referencia}, identifica la afirmación que se ajusta con mayor precisión al contenido jurídico seleccionado.`
          : `Con base en ${referencia}, selecciona la afirmación compatible con el contenido del documento.`;

    const opciones = [correcta, ...distractores]
      .slice(0, 4)
      .map((texto, indice) => ({
        texto,

        esCorrecta: indice === 0,

        orden: indice,
      }));

    return {
      fragmentoId: fragmento.id,

      enunciado,

      tipo: TipoPreguntaQuiz.OPCION_MULTIPLE,

      dificultad,

      origen: OrigenPreguntaQuiz.GENERADA,

      explicacion: `La respuesta correcta se encuentra en ${referencia}.`,

      tiempoSegundos: null,

      puntaje: 1,

      orden,

      opciones,
    };
  }

  private construirPreguntaVerdaderoFalso(
    fragmento: FragmentoGeneracion,

    afirmacion: string,

    dificultad: DificultadQuiz,

    orden: number,
  ) {
    const referencia =
      fragmento.tituloReferencia ?? 'el fragmento seleccionado';

    return {
      fragmentoId: fragmento.id,

      enunciado: `De acuerdo con ${referencia}, determina si la siguiente afirmación es correcta: “${afirmacion}”`,

      tipo: TipoPreguntaQuiz.VERDADERO_FALSO,

      dificultad,

      origen: OrigenPreguntaQuiz.GENERADA,

      explicacion: `La afirmación fue tomada directamente del contenido seleccionado de ${referencia}.`,

      tiempoSegundos: null,

      puntaje: 1,

      orden,

      opciones: [
        {
          texto: 'Verdadero',

          esCorrecta: true,

          orden: 0,
        },

        {
          texto: 'Falso',

          esCorrecta: false,

          orden: 1,
        },
      ],
    };
  }

  private construirSeleccionMultiple(
    fragmento: FragmentoGeneracion,

    correctas: string[],

    distractores: string[],

    dificultad: DificultadQuiz,

    orden: number,
  ) {
    const referencia =
      fragmento.tituloReferencia ?? 'el fragmento jurídico seleccionado';

    const opciones = [
      ...correctas.map((texto) => ({
        texto,

        esCorrecta: true,
      })),

      ...distractores.map((texto) => ({
        texto,

        esCorrecta: false,
      })),
    ]
      .slice(0, 4)
      .map((opcion, indice) => ({
        ...opcion,

        orden: indice,
      }));

    return {
      fragmentoId: fragmento.id,

      enunciado: `Según ${referencia}, selecciona todas las afirmaciones que corresponden al contenido del documento.`,

      tipo: TipoPreguntaQuiz.SELECCION_MULTIPLE,

      dificultad,

      origen: OrigenPreguntaQuiz.GENERADA,

      explicacion: `Las respuestas correctas se fundamentan en ${referencia}.`,

      tiempoSegundos: null,

      puntaje: 1,

      orden,

      opciones,
    };
  }

  async generarBorrador(
    usuario: UsuarioAutenticado,

    cursoId: number,

    quizId: number,

    datos: GenerarBorradorPreguntasQuizDto,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede generar preguntas');
    }

    const quiz = await this.prisma.quizCurso.findFirst({
      where: {
        id: quizId,

        cursoId,

        creadorId: usuario.id,

        estado: EstadoQuiz.BORRADOR,
      },

      select: {
        id: true,

        titulo: true,

        dificultad: true,

        cantidadPreguntas: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        'El Quiz no existe, no pertenece al docente o ya no está en borrador',
      );
    }

    const fragmentos = await this.prisma.fragmentoFuenteQuiz.findMany({
      where: {
        id: {
          in: datos.fragmentoIds,
        },

        fuente: {
          quizId,
        },
      },

      select: {
        id: true,

        tituloReferencia: true,

        tipoReferencia: true,

        texto: true,
      },

      orderBy: {
        orden: 'asc',
      },
    });

    if (fragmentos.length !== new Set(datos.fragmentoIds).size) {
      throw new BadRequestException(
        'Uno o más fragmentos no pertenecen al Quiz',
      );
    }

    const banco = this.obtenerBancoOraciones(fragmentos);

    if (banco.length < 2) {
      throw new BadRequestException(
        'Los fragmentos seleccionados no contienen suficiente texto útil para generar un borrador de preguntas',
      );
    }

    const tipos = datos.tipos?.length
      ? datos.tipos
      : [TipoPreguntaQuiz.OPCION_MULTIPLE];

    const preguntas: Array<Record<string, unknown>> = [];

    let cursorBanco = 0;

    let cursorFragmento = 0;

    while (
      preguntas.length < datos.cantidad &&
      cursorBanco < banco.length * 3
    ) {
      const fragmento = fragmentos[cursorFragmento % fragmentos.length];

      const oracionesFragmento = banco.filter(
        (item) => item.fragmentoId === fragmento.id,
      );

      if (oracionesFragmento.length === 0) {
        cursorFragmento += 1;

        cursorBanco += 1;

        continue;
      }

      const principal =
        oracionesFragmento[cursorBanco % oracionesFragmento.length];

      const tipo = tipos[preguntas.length % tipos.length];

      if (tipo === TipoPreguntaQuiz.VERDADERO_FALSO) {
        preguntas.push(
          this.construirPreguntaVerdaderoFalso(
            fragmento,
            principal.texto,
            datos.dificultad,
            preguntas.length,
          ),
        );
      } else if (tipo === TipoPreguntaQuiz.SELECCION_MULTIPLE) {
        const correctas = oracionesFragmento
          .slice(0, 2)
          .map((item) => item.texto);

        if (correctas.length < 2) {
          cursorBanco += 1;

          cursorFragmento += 1;

          continue;
        }

        const distractores = this.tomarDistractores(
          banco,
          correctas[0],
          fragmento.id,
          2,
        );

        if (distractores.length < 2) {
          cursorBanco += 1;

          cursorFragmento += 1;

          continue;
        }

        preguntas.push(
          this.construirSeleccionMultiple(
            fragmento,
            correctas,
            distractores,
            datos.dificultad,
            preguntas.length,
          ),
        );
      } else {
        const distractores = this.tomarDistractores(
          banco,
          principal.texto,
          fragmento.id,
          3,
        );

        if (distractores.length < 3) {
          cursorBanco += 1;

          cursorFragmento += 1;

          continue;
        }

        preguntas.push(
          this.construirPreguntaOpcionMultiple(
            fragmento,
            principal.texto,
            distractores,
            datos.dificultad,
            preguntas.length,
          ),
        );
      }

      cursorBanco += 1;

      cursorFragmento += 1;
    }

    if (preguntas.length === 0) {
      throw new BadRequestException(
        'No fue posible construir preguntas con los fragmentos seleccionados',
      );
    }

    return {
      quizId: quiz.id,

      titulo: quiz.titulo,

      motor: 'BORRADOR_INTELIGENTE_LOCAL',

      requiereRevisionDocente: true,

      cantidadSolicitada: datos.cantidad,

      cantidadGenerada: preguntas.length,

      dificultad: datos.dificultad,

      advertencia:
        'Las preguntas generadas son un borrador y deben ser revisadas, editadas o descartadas por el docente antes de guardarse en el Quiz.',

      preguntas,
    };
  }
}
