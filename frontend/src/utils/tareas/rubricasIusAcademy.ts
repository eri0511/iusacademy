import type {
  CrearRubricaDatos,
  RubricaCriterioForm,
  RubricaNivelForm,
} from '../../types/tareas/rubricas.types';

import type {
  TipoTarea,
} from '../../types/tareas/tareas.types';

const niveles = (
  criterio: string,
): RubricaNivelForm[] => [
  {
    orden: 0,
    etiqueta: 'Insuficiente',
    puntos: 49,
    descripcion: `Presenta dificultades importantes en ${criterio.toLowerCase()}.`,
  },
  {
    orden: 1,
    etiqueta: 'Básico',
    puntos: 69,
    descripcion: `Cumple parcialmente con ${criterio.toLowerCase()}, pero todavía presenta vacíos o imprecisiones.`,
  },
  {
    orden: 2,
    etiqueta: 'Bueno',
    puntos: 89,
    descripcion: `Cumple correctamente con ${criterio.toLowerCase()} y demuestra un desempeño adecuado.`,
  },
  {
    orden: 3,
    etiqueta: 'Excelente',
    puntos: 100,
    descripcion: `Demuestra un dominio sólido y completo en ${criterio.toLowerCase()}.`,
  },
];

const criterio = (
  orden: number,
  nombre: string,
  descripcion: string,
  peso: number,
): RubricaCriterioForm => ({
  orden,
  nombre,
  descripcion,
  peso,
  niveles: niveles(nombre),
});

const crearRubrica = (
  nombre: string,
  criterios: Array<{
    nombre: string;
    descripcion: string;
    peso: number;
  }>,
): CrearRubricaDatos => ({
  nombre,
  origen: 'MANUAL',
  ponderacionMax: 100,
  criterios: criterios.map((item, indice) =>
    criterio(
      indice,
      item.nombre,
      item.descripcion,
      item.peso,
    ),
  ),
});

const RUBRICAS: Record<TipoTarea, CrearRubricaDatos> = {
  ENTREGA_ARCHIVOS: crearRubrica(
    'Rúbrica IusAcademy · Entrega de archivos',
    [
      {
        nombre: 'Cumplimiento de la consigna',
        descripcion: 'Responde de manera completa a los requisitos y productos solicitados en la actividad.',
        peso: 35,
      },
      {
        nombre: 'Calidad del contenido',
        descripcion: 'Presenta información pertinente, suficiente, ordenada y jurídicamente coherente.',
        peso: 30,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Sustenta el trabajo con normativa, doctrina, jurisprudencia u otras fuentes pertinentes.',
        peso: 20,
      },
      {
        nombre: 'Presentación y formato',
        descripcion: 'Cumple el formato solicitado y presenta los archivos de forma clara, legible y organizada.',
        peso: 15,
      },
    ],
  ),

  RESPUESTA_ESCRITA: crearRubrica(
    'Rúbrica IusAcademy · Respuesta escrita',
    [
      {
        nombre: 'Dominio y comprensión',
        descripcion: 'Comprende el problema planteado y desarrolla correctamente los conceptos jurídicos relacionados.',
        peso: 40,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Sustenta la respuesta con argumentos jurídicos y fuentes pertinentes.',
        peso: 35,
      },
      {
        nombre: 'Redacción y presentación',
        descripcion: 'Expresa las ideas con claridad, coherencia, terminología jurídica adecuada y buena presentación.',
        peso: 25,
      },
    ],
  ),

  DOCUMENTO_COLABORATIVO: crearRubrica(
    'Rúbrica IusAcademy · Documento colaborativo',
    [
      {
        nombre: 'Calidad jurídica del documento',
        descripcion: 'El contenido jurídico es correcto, pertinente y responde al propósito del documento.',
        peso: 30,
      },
      {
        nombre: 'Coherencia e integración',
        descripcion: 'Los aportes se integran en un documento uniforme, lógico y sin contradicciones.',
        peso: 25,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Utiliza adecuadamente normativa, doctrina, jurisprudencia u otras fuentes jurídicas.',
        peso: 20,
      },
      {
        nombre: 'Aporte colaborativo',
        descripcion: 'Evidencia participación, responsabilidad y contribución efectiva en la construcción conjunta.',
        peso: 15,
      },
      {
        nombre: 'Presentación final',
        descripcion: 'El documento mantiene orden, formato, legibilidad y terminología jurídica apropiada.',
        peso: 10,
      },
    ],
  ),

  REDACCION_JURIDICA: crearRubrica(
    'Rúbrica IusAcademy · Redacción jurídica',
    [
      {
        nombre: 'Estructura jurídica',
        descripcion: 'Respeta la estructura, partes y formalidades propias del documento jurídico solicitado.',
        peso: 25,
      },
      {
        nombre: 'Fundamentación normativa',
        descripcion: 'Emplea normas aplicables y las relaciona correctamente con los hechos o pretensiones.',
        peso: 30,
      },
      {
        nombre: 'Argumentación jurídica',
        descripcion: 'Construye argumentos claros, coherentes y jurídicamente sostenibles.',
        peso: 25,
      },
      {
        nombre: 'Terminología y redacción',
        descripcion: 'Utiliza lenguaje técnico adecuado, precisión conceptual, ortografía y coherencia textual.',
        peso: 10,
      },
      {
        nombre: 'Presentación',
        descripcion: 'Cumple las pautas formales y presenta un documento ordenado y legible.',
        peso: 10,
      },
    ],
  ),

  EXPOSICION: crearRubrica(
    'Rúbrica IusAcademy · Exposición',
    [
      {
        nombre: 'Dominio del tema',
        descripcion: 'Demuestra comprensión del tema, explica sus elementos principales y responde con seguridad.',
        peso: 25,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Sustenta la exposición con normativa y fuentes jurídicas pertinentes.',
        peso: 25,
      },
      {
        nombre: 'Análisis jurídico y procesal',
        descripcion: 'Relaciona las normas con el procedimiento, sus etapas, actos y consecuencias jurídicas.',
        peso: 20,
      },
      {
        nombre: 'Claridad y comunicación',
        descripcion: 'Expone con orden, claridad, vocabulario jurídico apropiado y capacidad comunicativa.',
        peso: 15,
      },
      {
        nombre: 'Material de apoyo',
        descripcion: 'Utiliza recursos visuales o documentales pertinentes, legibles y coherentes con la exposición.',
        peso: 10,
      },
      {
        nombre: 'Manejo del tiempo y preguntas',
        descripcion: 'Administra adecuadamente el tiempo y responde de forma pertinente a las preguntas formuladas.',
        peso: 5,
      },
    ],
  ),

  CASO_PRACTICO: crearRubrica(
    'Rúbrica IusAcademy · Caso práctico',
    [
      {
        nombre: 'Identificación del problema jurídico',
        descripcion: 'Reconoce correctamente los hechos relevantes, el conflicto y las cuestiones jurídicas centrales.',
        peso: 20,
      },
      {
        nombre: 'Análisis jurídico',
        descripcion: 'Analiza los hechos de manera lógica y los relaciona con las instituciones jurídicas aplicables.',
        peso: 30,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Sustenta el análisis con normas y fuentes jurídicas pertinentes.',
        peso: 25,
      },
      {
        nombre: 'Solución propuesta',
        descripcion: 'Plantea una solución jurídicamente viable, coherente y relacionada con el problema identificado.',
        peso: 15,
      },
      {
        nombre: 'Argumentación',
        descripcion: 'Justifica la solución mediante argumentos claros, ordenados y consistentes.',
        peso: 10,
      },
    ],
  ),

  MIXTA: crearRubrica(
    'Rúbrica IusAcademy · Actividad mixta',
    [
      {
        nombre: 'Calidad jurídica integral',
        descripcion: 'Integra correctamente los conocimientos y habilidades jurídicas requeridos por los componentes de la actividad.',
        peso: 30,
      },
      {
        nombre: 'Cumplimiento de componentes',
        descripcion: 'Desarrolla de forma completa y coherente los distintos componentes definidos para la actividad.',
        peso: 25,
      },
      {
        nombre: 'Fundamentación jurídica',
        descripcion: 'Utiliza fuentes jurídicas pertinentes para sustentar el trabajo desarrollado.',
        peso: 25,
      },
      {
        nombre: 'Integración y presentación de evidencias',
        descripcion: 'Relaciona las evidencias y productos entregados de manera ordenada, clara y consistente.',
        peso: 20,
      },
    ],
  ),

  PRESENCIAL: crearRubrica(
    'Rúbrica IusAcademy · Actividad presencial',
    [
      {
        nombre: 'Dominio práctico',
        descripcion: 'Demuestra dominio de los conocimientos y destrezas requeridos durante la actividad presencial.',
        peso: 35,
      },
      {
        nombre: 'Aplicación jurídica',
        descripcion: 'Aplica correctamente conceptos, normas y procedimientos al ejercicio planteado.',
        peso: 30,
      },
      {
        nombre: 'Argumentación',
        descripcion: 'Sustenta sus decisiones o respuestas mediante razonamiento jurídico claro y consistente.',
        peso: 20,
      },
      {
        nombre: 'Participación y desempeño',
        descripcion: 'Participa activamente y desarrolla la actividad con responsabilidad y cumplimiento.',
        peso: 15,
      },
    ],
  ),
};

export function rubricaIusAcademyPorTipo(
  tipo: TipoTarea,
): CrearRubricaDatos {
  const rubrica = RUBRICAS[tipo] ?? RUBRICAS.RESPUESTA_ESCRITA;

  return {
    ...rubrica,
    criterios: rubrica.criterios.map((item) => ({
      ...item,
      niveles: item.niveles.map((nivel) => ({
        ...nivel,
      })),
    })),
  };
}

export function totalPonderacionRubrica(
  rubrica: CrearRubricaDatos,
): number {
  return rubrica.criterios.reduce(
    (total, item) => total + item.peso,
    0,
  );
}
