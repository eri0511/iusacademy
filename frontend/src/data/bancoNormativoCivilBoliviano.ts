import type {
  AreaDerechoCivil,
  BancoNormativoItem,
} from '../utils/tareas/respuestaEscrita';

/**
 * Sugerencias orientativas de normativa para el banco normativo de una
 * respuesta escrita. El docente puede editarlas o reemplazarlas al crear
 * la tarea, y debe verificar la vigencia de cada fuente antes de usarla.
 */
export const BANCO_NORMATIVO_POR_AREA:
  Record<
    AreaDerechoCivil,
    BancoNormativoItem[]
  > = {
    OBLIGACIONES: [
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Fuentes de las obligaciones: contrato, cuasicontrato, hecho ilícito, cuasidelito y la ley.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Noción de contrato y sus requisitos esenciales (consentimiento, capacidad, objeto y forma).',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Responsabilidad civil y régimen de daños (responsabilidad extracontractual).',
      },
      {
        norma: 'Código Procesal Civil (Ley N° 439)',
        detalle:
          'Estructura y requisitos de la demanda civil.',
      },
      {
        norma: 'Jurisprudencia del Tribunal Supremo de Justicia',
        detalle:
          'Criterios reiterados en materia de incumplimiento y responsabilidad civil.',
      },
    ],

    CONTRATOS: [
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Noción de contrato, requisitos esenciales y formación del consentimiento.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Compraventa: obligaciones del vendedor y del comprador y transmisión del dominio.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Arrendamiento, comodato y mutuo: obligaciones de las partes y plazo.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Donación y mandato: requisitos de validez y límites.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Nulidad, anulabilidad, rescisión y resolución de los contratos.',
      },
      {
        norma: 'Jurisprudencia del Tribunal Supremo de Justicia',
        detalle:
          'Interpretación de los contratos según la voluntad de las partes.',
      },
    ],

    FAMILIA: [
      {
        norma: 'Ley N° 603, Código de las Familias y del Proceso Familiar',
        detalle:
          'Matrimonio, divorcio y regímenes patrimoniales del matrimonio.',
      },
      {
        norma: 'Ley N° 603, Código de las Familias y del Proceso Familiar',
        detalle:
          'Filiación, reconocimiento y responsabilidad parental.',
      },
      {
        norma: 'Ley N° 603, Código de las Familias y del Proceso Familiar',
        detalle:
          'Prestación de alimentos y medidas de protección del menor.',
      },
      {
        norma: 'Constitución Política del Estado (2009)',
        detalle:
          'Protección de la familia y el interés superior de la niña, niño y adolescente.',
      },
    ],

    SUCESIONES: [
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Sucesión mortis causa: apertura, vocación y órdenes de sucesión intestada.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Testamento: capacidad, formalidades y clases.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Legítima, desheredación, acervo hereditario y colación.',
      },
      {
        norma: 'Código Procesal Civil (Ley N° 439)',
        detalle:
          'Sucesión procesal y trámite del proceso sucesorio.',
      },
    ],

    DERECHOS_REALES: [
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Derechos reales en general y modos de adquirir la propiedad.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Inscripción en el Registro de Derechos Reales y sus efectos frente a terceros.',
      },
      {
        norma: 'Código Civil (Bolivia)',
        detalle:
          'Usufructo, uso, habitación y servidumbres.',
      },
      {
        norma: 'Constitución Política del Estado (2009)',
        detalle:
          'Función social y función económica-social de la propiedad.',
      },
    ],

    LIBRE: [],
  };