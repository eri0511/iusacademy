import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FilePenLine,
  Files,
  Image as ImageIcon,
  Info,
  ListChecks,
  Loader2,
  Pencil,
  Presentation,
  Save,
  Scale,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
  Workflow,
} from 'lucide-react';

import type {
  ChangeEvent,
  ComponentType,
} from 'react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';

import Toast, {
  type TipoToast,
} from '../shared/Toast';

import EditorRespuestaEscrita from './EditorRespuestaEscrita';
import EditorColaborativoIusAcademy from './EditorColaborativoIusAcademy';

import {
  useAuth,
} from '../../auth/AuthContext';

import useEntregaTareaEstudiante from '../../hooks/tareas/useEntregaTareaEstudiante';

import type {
  ArchivoEntregaTarea,
  ContextoGrupoEntregaTarea,
  EstadoEntregaTarea,
} from '../../types/tareas/entregas.types';

import type {
  TareaCurso,
  TipoTarea,
} from '../../types/tareas/tareas.types';

import {
  leerConfiguracionRespuesta,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionRespuestaEscrita,
} from '../../utils/tareas/respuestaEscrita';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type TipoVisual = {
  titulo: string;
  descripcion: string;
  accion: string;
  icono: ComponentType<{
    size?: number;
  }>;
};

type ToastActual = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

type SeccionesEstructuradas = Record<
  string,
  string
>;

type ContenidoEstructurado = {
  version?: number;
  formato?: string;
  secciones?: SeccionesEstructuradas;
  citas?: unknown[];
  [key: string]: unknown;
};

const visual: Record<
  TipoTarea,
  TipoVisual
> = {
  ENTREGA_ARCHIVOS: {
    titulo: 'Entrega de archivos',
    descripcion:
      'Adjunta los documentos o evidencias solicitadas por el docente.',
    accion: 'Subir archivos',
    icono: Files,
  },

  RESPUESTA_ESCRITA: {
    titulo: 'Respuesta escrita',
    descripcion:
      'Desarrolla tu respuesta directamente dentro de IusAcademy.',
    accion: 'Escribir respuesta',
    icono: FilePenLine,
  },

  DOCUMENTO_COLABORATIVO: {
    titulo: 'Documento colaborativo',
    descripcion:
      'Tu equipo construirá un documento compartido con seguimiento de autoría.',
    accion: 'Abrir documento',
    icono: Workflow,
  },

  REDACCION_JURIDICA: {
    titulo: 'Redacción jurídica',
    descripcion:
      'Redacta el documento jurídico siguiendo la estructura y consignas definidas.',
    accion: 'Iniciar redacción',
    icono: Scale,
  },

  EXPOSICION: {
    titulo: 'Exposición',
    descripcion:
      'Prepara la presentación y el material de apoyo solicitado.',
    accion: 'Subir presentación',
    icono: Presentation,
  },

  CASO_PRACTICO: {
    titulo: 'Caso práctico',
    descripcion:
      'Analiza el caso y desarrolla una respuesta jurídicamente fundamentada.',
    accion: 'Resolver caso',
    icono: BookOpenCheck,
  },

  MIXTA: {
    titulo: 'Actividad mixta',
    descripcion:
      'Completa cada uno de los componentes configurados por el docente.',
    accion: 'Comenzar actividad',
    icono: ListChecks,
  },

  PRESENCIAL: {
    titulo: 'Actividad presencial',
    descripcion:
      'Esta actividad se desarrolla principalmente en aula y será registrada por el docente.',
    accion: 'Sin entrega digital',
    icono: CheckCircle2,
  },
};

const nombresEstado: Record<
  EstadoEntregaTarea,
  string
> = {
  BORRADOR: 'Borrador',
  ENTREGADA: 'Entregada',
  TARDIA: 'Entregada con retraso',
  BLOQUEADA: 'Bloqueada',
  ANULADA: 'Anulada',
};

const nombresSeccion: Record<
  string,
  string
> = {
  relacionJuridica:
    'Relación jurídica',

  normas:
    'Normas aplicables',

  argumentacion:
    'Argumentación jurídica',

  conclusion:
    'Conclusión',

  antecedentes:
    'Antecedentes',

  hechos:
    'Hechos',

  fundamentos:
    'Fundamentos jurídicos',

  petitorio:
    'Petitorio',

  contenido:
    'Contenido',

  desarrollo:
    'Desarrollo',

  respuesta:
    'Respuesta',
};

type Props = {
  tarea: TareaCurso;
  disponible: boolean;
  tardia: boolean;
  onContextoGrupo?: (
    contexto:
      ContextoGrupoEntregaTarea | null,
  ) => void;
};

function extension(
  nombre: string,
) {
  return (
    nombre
      .split('.')
      .pop()
      ?.toLowerCase() ??
    ''
  );
}

function tamanio(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function fecha(
  valor?: string | null,
) {
  if (!valor) {
    return '—';
  }

  const objeto =
    new Date(valor);

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(objeto);
}

function esImagen(
  archivo:
    ArchivoEntregaTarea,
) {
  return (
    archivo.mimeType.startsWith(
      'image/',
    ) ||
    [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
    ].includes(
      archivo.extension.toLowerCase(),
    )
  );
}

function esPdf(
  archivo:
    ArchivoEntregaTarea,
) {
  return (
    archivo.mimeType ===
      'application/pdf' ||
    archivo.extension.toLowerCase() ===
      'pdf'
  );
}

function nombreTipoArchivo(
  archivo:
    ArchivoEntregaTarea,
) {
  if (esImagen(archivo)) {
    return 'Imagen';
  }

  if (esPdf(archivo)) {
    return 'Documento PDF';
  }

  if (
    [
      'doc',
      'docx',
    ].includes(
      archivo.extension.toLowerCase(),
    )
  ) {
    return 'Documento Word';
  }

  return archivo.extension
    ? archivo.extension.toUpperCase()
    : 'Archivo';
}

function intentarContenidoEstructurado(
  contenido?: string | null,
): ContenidoEstructurado | null {
  if (!contenido?.trim()) {
    return null;
  }

  try {
    const resultado =
      JSON.parse(
        contenido,
      ) as unknown;

    if (
      !resultado ||
      typeof resultado !==
        'object' ||
      Array.isArray(
        resultado,
      )
    ) {
      return null;
    }

    const objeto =
      resultado as ContenidoEstructurado;

    if (
      !objeto.secciones ||
      typeof objeto.secciones !==
        'object' ||
      Array.isArray(
        objeto.secciones,
      )
    ) {
      return null;
    }

    return objeto;
  } catch {
    return null;
  }
}

function etiquetaSeccion(
  clave: string,
) {
  if (
    nombresSeccion[clave]
  ) {
    return nombresSeccion[
      clave
    ];
  }

  return clave
    .replace(
      /([A-Z])/g,
      ' $1',
    )
    .replace(
      /[_-]+/g,
      ' ',
    )
    .trim()
    .replace(
      /^./,
      (
        letra,
      ) =>
        letra.toUpperCase(),
    );
}


type IntegranteEditorColaborativo = {
  estudianteId: number;
  estudiante: {
    id?: number;
    nombres: string;
    apellidoPaterno: string;
  };
};

type ContextoGrupoEditor = {
  integrantes?: IntegranteEditorColaborativo[];
};

type EstadoEditorColaborativo = {
  formato?: string;
  html?: string;
};

function extraerHtmlEditorColaborativo(
  valor:
    string,
) {
  if (
    !valor.trim()
  ) {
    return '';
  }

  try {
    const estado =
      JSON.parse(
        valor,
      ) as EstadoEditorColaborativo;

    if (
      estado.formato ===
        'IUSACADEMY_COLABORATIVO' &&
      typeof estado.html ===
        'string'
    ) {
      return estado.html;
    }
  } catch {
    return valor;
  }

  return valor;
}

function nombreCompletoUsuario(
  usuario:
    {
      nombres?: string;
      apellidoPaterno?: string;
    } | null | undefined,
) {
  if (
    !usuario
  ) {
    return '';
  }

  return [
    usuario.nombres,
    usuario.apellidoPaterno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export default function ExperienciaTareaEstudiante({
  tarea,
  disponible,
  tardia,
  onContextoGrupo,
}: Props) {
  const {
    accessToken,
    sesion,
  } =
    useAuth();

  const configuracion =
    visual[tarea.tipo];

  const Icono =
    configuracion.icono;

  const entregaApi =
    useEntregaTareaEstudiante({
      tarea,
    });

  useEffect(
    () => {
      onContextoGrupo?.(
        entregaApi.contextoGrupo,
      );
    },
    [
      entregaApi.contextoGrupo,
      onContextoGrupo,
    ],
  );

  const [
    modalEntrega,
    setModalEntrega,
  ] =
    useState(false);

  const [
    archivoDetalle,
    setArchivoDetalle,
  ] =
    useState<ArchivoEntregaTarea | null>(
      null,
    );

  const [
    urlVistaPrevia,
    setUrlVistaPrevia,
  ] =
    useState<string | null>(
      null,
    );

  const [
    cargandoVistaPrevia,
    setCargandoVistaPrevia,
  ] =
    useState(false);

  const [
    errorVistaPrevia,
    setErrorVistaPrevia,
  ] =
    useState<string | null>(
      null,
    );

  const [
    contenido,
    setContenido,
  ] =
    useState('');

  const [
    estructura,
    setEstructura,
  ] =
    useState<ContenidoEstructurado | null>(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastActual>({
      visible: false,
      tipo: 'informacion',
      titulo: '',
    });

  const usaEditorEmbebido =
    tarea.tipo ===
      'RESPUESTA_ESCRITA' ||
    tarea.tipo ===
      'DOCUMENTO_COLABORATIVO' ||
    tarea.tipo ===
      'REDACCION_JURIDICA';

  const configuracionRespuesta =
    useMemo<ConfiguracionRespuestaEscrita>(
      () =>
        leerConfiguracionRespuesta(
          tarea.configuracionTipo,
        ) ?? {
          areaDerecho:
            'LIBRE',
          minPalabras:
            1,
          maxPalabras:
            5000,
          estructuraGuiada:
            true,
          exigirCitas:
            false,
          minCitas:
            1,
          bancoNormativo:
            [],
        },
      [
        tarea.configuracionTipo,
      ],
    );

  const esRespuestaEscritaGrupal =
    tarea.tipo ===
      'RESPUESTA_ESCRITA' &&
    tarea.modalidad ===
      'GRUPAL';

  const usuarioActualColaborativo =
    useMemo(
      () => {
        const usuario =
          sesion?.usuario;

        if (
          !usuario
        ) {
          return null;
        }

        return {
          id:
            usuario.id,
          nombre:
            nombreCompletoUsuario(
              usuario,
            ) ||
            'Estudiante',
        };
      },
      [
        sesion?.usuario,
      ],
    );

  const colaboradoresRespuesta =
    useMemo(
      () => {
        const contexto =
          entregaApi.contextoGrupo as
            | (
                ContextoGrupoEntregaTarea &
                ContextoGrupoEditor
              )
            | null;

        const integrantesContexto =
          contexto?.integrantes ??
          [];

        const integrantesAfinidad =
          entregaApi.equipoAfinidad
            ?.integrantes ??
          [];

        const origen =
          integrantesContexto.length >
          0
            ? integrantesContexto
            : integrantesAfinidad;

        const mapa =
          new Map<
            number,
            {
              id: number;
              nombre: string;
              enLinea: boolean;
            }
          >();

        origen.forEach(
          (
            integrante,
          ) => {
            const id =
              integrante.estudianteId;

            mapa.set(
              id,
              {
                id,
                nombre:
                  `${integrante.estudiante.nombres} ${integrante.estudiante.apellidoPaterno}`.trim(),
                enLinea:
                  usuarioActualColaborativo?.id ===
                  id,
              },
            );
          },
        );

        if (
          usuarioActualColaborativo &&
          !mapa.has(
            usuarioActualColaborativo.id,
          )
        ) {
          mapa.set(
            usuarioActualColaborativo.id,
            {
              ...usuarioActualColaborativo,
              enLinea:
                true,
            },
          );
        }

        return Array.from(
          mapa.values(),
        );
      },
      [
        entregaApi.contextoGrupo,
        entregaApi.equipoAfinidad,
        usuarioActualColaborativo,
      ],
    );

  const respuestaGrupalHtml =
    useMemo(
      () => {
        if (
          !esRespuestaEscritaGrupal
        ) {
          return '';
        }

        if (
          estructura?.secciones
            ?.respuesta
        ) {
          return estructura
            .secciones
            .respuesta;
        }

        return contenido;
      },
      [
        contenido,
        esRespuestaEscritaGrupal,
        estructura,
      ],
    );

  const usaArchivos =
    tarea.capacidades.includes(
      'ARCHIVOS',
    ) ||
    tarea.tipo ===
      'ENTREGA_ARCHIVOS' ||
    tarea.tipo ===
      'EXPOSICION';

  const usaTextoModal =
    (
      tarea.capacidades.includes(
        'EDITOR_TEXTO',
      ) ||
      tarea.tipo ===
        'CASO_PRACTICO'
    ) &&
    !usaEditorEmbebido;

  const esPresencial =
    tarea.tipo ===
      'PRESENCIAL';

  const esColaborativa =
    tarea.tipo ===
      'DOCUMENTO_COLABORATIVO';

  const entregaEnviada =
    entregaApi.entrega?.estado ===
      'ENTREGADA' ||
    entregaApi.entrega?.estado ===
      'TARDIA';

  const puedeModificar =
    disponible &&
    entregaApi.permisos.puedeModificar &&
    (
      !entregaEnviada ||
      tarea.permitirEditarEntrega
    );

  const borradorVacio =
    entregaApi.entrega?.estado ===
      'BORRADOR' &&
    !entregaApi.entrega.contenido?.trim() &&
    entregaApi.entrega.archivos.length ===
      0;

  const entregaVisible =
    borradorVacio
      ? null
      : entregaApi.entrega;

  const mostrarEntregaRegistrada =
    entregaVisible &&
    entregaVisible.estado !==
      'BORRADOR';

  const aceptar =
    useMemo(
      () =>
        tarea.extensionesPermitidas
          .map(
            (item) =>
              item.startsWith('.')
                ? item
                : `.${item}`,
          )
          .join(','),
      [
        tarea.extensionesPermitidas,
      ],
    );

  const contenidoParaGuardar =
    useMemo(
      () => {
        if (
          estructura &&
          estructura.secciones
        ) {
          return JSON.stringify({
            ...estructura,
            secciones:
              estructura.secciones,
          });
        }

        return contenido;
      },
      [
        contenido,
        estructura,
      ],
    );

  const cantidadPalabras =
    useMemo(
      () => {
        const texto =
          estructura?.secciones
            ? Object.values(
                estructura.secciones,
              ).join(' ')
            : contenido;

        const limpio =
          texto.trim();

        if (!limpio) {
          return 0;
        }

        return limpio
          .split(/\s+/)
          .filter(Boolean)
          .length;
      },
      [
        contenido,
        estructura,
      ],
    );

  useEffect(
    () => {
      const contenidoServidor =
        entregaApi.entrega?.contenido ??
        '';

      const estructurado =
        intentarContenidoEstructurado(
          contenidoServidor,
        );

      if (
        estructurado
      ) {
        setEstructura(
          estructurado,
        );

        setContenido('');
      } else {
        setEstructura(null);

        setContenido(
          contenidoServidor,
        );
      }
    },
    [
      entregaApi.entrega?.contenido,
      entregaApi.entrega?.id,
    ],
  );

  useEffect(
    () => {
      return () => {
        if (urlVistaPrevia) {
          URL.revokeObjectURL(
            urlVistaPrevia,
          );
        }
      };
    },
    [urlVistaPrevia],
  );

  useEffect(
    () => {
      if (
        !usaEditorEmbebido ||
        !puedeModificar ||
        entregaApi.cargando ||
        entregaApi.procesando ||
        entregaApi.guardandoAutomatico
      ) {
        return;
      }

      const servidor =
        entregaApi.entrega?.contenido ??
        '';

      if (
        contenidoParaGuardar ===
        servidor
      ) {
        return;
      }

      const temporizador =
        window.setTimeout(
          () => {
            void entregaApi
              .autoguardar(
                contenidoParaGuardar,
              )
              .catch(
                () => undefined,
              );
          },
          1200,
        );

      return () => {
        window.clearTimeout(
          temporizador,
        );
      };
    },
    [
      contenidoParaGuardar,
      entregaApi.autoguardar,
      entregaApi.cargando,
      entregaApi.entrega?.contenido,
      entregaApi.guardandoAutomatico,
      entregaApi.procesando,
      puedeModificar,
      usaEditorEmbebido,
    ],
  );

  useEffect(
    () => {
      if (
        usaEditorEmbebido ||
        !modalEntrega ||
        !usaTextoModal ||
        !disponible ||
        !entregaApi.permisos.puedeModificar ||
        entregaApi.cargando ||
        entregaApi.procesando
      ) {
        return;
      }

      const servidor =
        entregaApi.entrega?.contenido ??
        '';

      if (
        contenido ===
        servidor
      ) {
        return;
      }

      const temporizador =
        window.setTimeout(
          () => {
            void entregaApi
              .autoguardar(
                contenido,
              )
              .catch(
                () => undefined,
              );
          },
          1000,
        );

      return () => {
        window.clearTimeout(
          temporizador,
        );
      };
    },
    [
      contenido,
      disponible,
      entregaApi.autoguardar,
      entregaApi.cargando,
      entregaApi.entrega?.contenido,
      entregaApi.permisos.puedeModificar,
      entregaApi.procesando,
      modalEntrega,
      usaEditorEmbebido,
      usaTextoModal,
    ],
  );

  const mostrarToast =
    (
      tipo: TipoToast,
      titulo: string,
      mensaje?: string,
    ) => {
      setToast({
        visible: true,
        tipo,
        titulo,
        mensaje,
      });
    };

  const actualizarSeccion =
    (
      clave: string,
      valor: string,
    ) => {
      setEstructura(
        (
          actual,
        ) => {
          if (
            !actual ||
            !actual.secciones
          ) {
            return actual;
          }

          return {
            ...actual,
            secciones: {
              ...actual.secciones,
              [clave]:
                valor,
            },
          };
        },
      );
    };

  const seleccionar =
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const nuevos =
        Array.from(
          evento.target.files ??
          [],
        );

      evento.currentTarget.value =
        '';

      if (
        nuevos.length ===
        0
      ) {
        return;
      }

      const maximoBytes =
        tarea.tamanioMaximoArchivoMb *
        1024 *
        1024;

      const permitidas =
        tarea.extensionesPermitidas.map(
          (item) =>
            item
              .replace('.', '')
              .toLowerCase(),
        );

      const invalidos =
        nuevos.filter(
          (archivo) =>
            !permitidas.includes(
              extension(
                archivo.name,
              ),
            ),
        );

      if (
        invalidos.length >
        0
      ) {
        mostrarToast(
          'advertencia',
          'Formato no permitido',
          `Solo puedes adjuntar: ${tarea.extensionesPermitidas.join(', ')}.`,
        );

        return;
      }

      const pesados =
        nuevos.filter(
          (archivo) =>
            archivo.size >
            maximoBytes,
        );

      if (
        pesados.length >
        0
      ) {
        mostrarToast(
          'advertencia',
          'Archivo demasiado grande',
          `Cada archivo puede pesar como máximo ${tarea.tamanioMaximoArchivoMb} MB.`,
        );

        return;
      }

      const existentes =
        entregaApi.entrega?.archivos.length ??
        0;

      if (
        existentes +
          nuevos.length >
        tarea.maximoArchivos
      ) {
        mostrarToast(
          'advertencia',
          'Límite de archivos',
          `La tarea permite como máximo ${tarea.maximoArchivos} archivo(s).`,
        );

        return;
      }

      const subir =
        async () => {
          try {
            const preparada =
              await entregaApi.preparar(
                usaEditorEmbebido
                  ? contenidoParaGuardar
                  : usaTextoModal
                    ? contenido
                    : undefined,
              );

            await entregaApi.subirArchivos(
              preparada.id,
              nuevos,
            );

            mostrarToast(
              'exito',
              'Archivos guardados',
              nuevos.length ===
                1
                ? 'El archivo quedó guardado en tu borrador.'
                : 'Los archivos quedaron guardados en tu borrador.',
            );
          } catch (causa) {
            mostrarToast(
              'error',
              'No se pudieron guardar los archivos',
              causa instanceof Error
                ? causa.message
                : undefined,
            );
          }
        };

      void subir();
    };

  const validarAntesDeGuardar =
    (
      texto:
        string,
    ) => {
      if (
        tarea.exigirContenidoEditor &&
        !texto.trim()
      ) {
        mostrarToast(
          'advertencia',
          'Contenido obligatorio',
          'Debes completar la respuesta antes de entregar.',
        );

        return false;
      }

      const totalArchivos =
        entregaApi.entrega?.archivos.length ??
        0;

      if (
        tarea.exigirArchivo &&
        usaArchivos &&
        totalArchivos ===
          0
      ) {
        mostrarToast(
          'advertencia',
          'Archivo obligatorio',
          'Debes adjuntar al menos un archivo.',
        );

        return false;
      }

      return true;
    };

  const guardarBorradorEmbebido =
    async () => {
      if (!puedeModificar) {
        return;
      }

      try {
        await entregaApi.preparar(
          contenidoParaGuardar,
        );

        mostrarToast(
          'exito',
          'Borrador guardado',
          'Tu trabajo quedó guardado correctamente.',
        );
      } catch (causa) {
        mostrarToast(
          'error',
          'No se pudo guardar el borrador',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const entregarEmbebido =
    async () => {
      if (
        !puedeModificar ||
        !validarAntesDeGuardar(
          contenidoParaGuardar,
        )
      ) {
        return;
      }

      try {
        const preparada =
          await entregaApi.preparar(
            contenidoParaGuardar,
          );

        const enviada =
          await entregaApi.enviar(
            preparada.id,
          );

        mostrarToast(
          'exito',
          enviada.entregadaTarde
            ? 'Tarea entregada con retraso'
            : 'Tarea entregada',
          enviada.entregadaTarde
            ? 'La entrega quedó registrada y se aplicará la penalización configurada.'
            : 'Tu entrega quedó registrada correctamente.',
        );
      } catch (causa) {
        mostrarToast(
          'error',
          'No se pudo entregar la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const entregarModal =
    async () => {
      if (
        !validarAntesDeGuardar(
          usaTextoModal
            ? contenido
            : 'OK',
        )
      ) {
        return;
      }

      try {
        const preparada =
          await entregaApi.preparar(
            usaTextoModal
              ? contenido
              : undefined,
          );

        const enviada =
          await entregaApi.enviar(
            preparada.id,
          );

        setModalEntrega(false);

        mostrarToast(
          'exito',
          enviada.entregadaTarde
            ? 'Tarea entregada con retraso'
            : 'Tarea entregada',
          enviada.entregadaTarde
            ? 'La entrega quedó registrada y se aplicará la penalización configurada.'
            : 'Tu entrega quedó registrada correctamente.',
        );
      } catch (causa) {
        mostrarToast(
          'error',
          'No se pudo entregar la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const eliminarArchivoExistente =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      try {
        await entregaApi.eliminarArchivo(
          archivo.id,
        );

        mostrarToast(
          'exito',
          'Archivo eliminado',
          `${archivo.nombreOriginal} fue retirado de la entrega.`,
        );
      } catch (causa) {
        mostrarToast(
          'error',
          'No se pudo eliminar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const cerrarDetalleArchivo =
    () => {
      if (urlVistaPrevia) {
        URL.revokeObjectURL(
          urlVistaPrevia,
        );
      }

      setUrlVistaPrevia(null);
      setArchivoDetalle(null);
      setErrorVistaPrevia(null);
      setCargandoVistaPrevia(false);
    };

  const abrirDetalleArchivo =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      setArchivoDetalle(archivo);
      setErrorVistaPrevia(null);

      if (urlVistaPrevia) {
        URL.revokeObjectURL(
          urlVistaPrevia,
        );

        setUrlVistaPrevia(null);
      }

      if (
        !esImagen(archivo) &&
        !esPdf(archivo)
      ) {
        return;
      }

      if (!accessToken) {
        setErrorVistaPrevia(
          'Tu sesión terminó. Inicia sesión nuevamente.',
        );

        return;
      }

      setCargandoVistaPrevia(true);

      try {
        const respuesta =
          await fetch(
            `${API_URL}/archivos/${archivo.id}/descargar`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        if (
          !respuesta.ok
        ) {
          const cuerpo =
            await respuesta
              .json()
              .catch(
                () => null,
              );

          const mensaje =
            cuerpo &&
            typeof cuerpo ===
              'object' &&
            'message' in
              cuerpo
              ? String(
                  (
                    cuerpo as {
                      message?:
                        string;
                    }
                  ).message ??
                  '',
                )
              : '';

          throw new Error(
            mensaje ||
            'No fue posible cargar la vista previa.',
          );
        }

        const blob =
          await respuesta.blob();

        setUrlVistaPrevia(
          URL.createObjectURL(
            blob,
          ),
        );
      } catch (causa) {
        setErrorVistaPrevia(
          causa instanceof Error
            ? causa.message
            : 'No fue posible cargar la vista previa.',
        );
      } finally {
        setCargandoVistaPrevia(false);
      }
    };

  const descargar =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      try {
        await entregaApi.descargarArchivo(
          archivo,
        );
      } catch (causa) {
        mostrarToast(
          'error',
          'No se pudo descargar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const cerrarModal =
    async () => {
      if (
        entregaApi.procesando ||
        entregaApi.guardandoAutomatico
      ) {
        return;
      }

      if (
        usaTextoModal &&
        entregaApi.permisos.puedeModificar
      ) {
        const contenidoServidor =
          entregaApi.entrega?.contenido ??
          '';

        if (
          contenido !==
          contenidoServidor
        ) {
          try {
            await entregaApi.autoguardar(
              contenido,
            );
          } catch (causa) {
            mostrarToast(
              'error',
              'No se pudo guardar el borrador',
              causa instanceof Error
                ? causa.message
                : undefined,
            );

            return;
          }
        }
      }

      setModalEntrega(false);
    };

  const abrirEntregaModal =
    () => {
      if (!disponible) {
        mostrarToast(
          'advertencia',
          'La tarea no admite entregas ahora',
          'Revisa el contador para conocer el período habilitado.',
        );

        return;
      }

      if (
        !entregaApi.permisos.puedeModificar
      ) {
        mostrarToast(
          'informacion',
          'Entrega grupal',
          'La entrega oficial debe ser realizada por el representante del grupo.',
        );

        return;
      }

      setContenido(
        entregaApi.entrega?.contenido ??
        '',
      );

      setModalEntrega(true);
    };

  const textoEstadoEntrega =
    entregaVisible
      ? nombresEstado[
          entregaVisible.estado
        ]
      : 'Pendiente';

  const tituloEditor =
    tarea.tipo ===
      'DOCUMENTO_COLABORATIVO'
      ? 'Documento del equipo'
      : tarea.tipo ===
          'REDACCION_JURIDICA'
        ? 'Redacción del documento jurídico'
        : 'Tu respuesta';

  const placeholderEditor =
    tarea.tipo ===
      'DOCUMENTO_COLABORATIVO'
      ? 'Comienza a desarrollar el documento del equipo...'
      : tarea.tipo ===
          'REDACCION_JURIDICA'
        ? 'Comienza a redactar el documento jurídico...'
        : 'Escribe aquí tu respuesta...';

  return (
    <section className="ete-experience">
      <header className="ete-experience__head">
        <span className="ete-experience__icon">
          <Icono size={22} />
        </span>

        <div>
          <small>
            Cómo realizarás esta tarea
          </small>

          <h3>
            {configuracion.titulo}
          </h3>

          <p>
            {configuracion.descripcion}
          </p>
        </div>
      </header>

      {tarea.componentes.length >
        0 && (
        <div className="ete-experience__components">
          {tarea.componentes.map(
            (componente) => (
              <article
                key={componente.id}
              >
                <div>
                  <strong>
                    {componente.titulo}
                  </strong>

                  {componente.obligatorio && (
                    <span>
                      Obligatorio
                    </span>
                  )}
                </div>

                <p>
                  {componente.descripcion ||
                    'Componente configurado por el docente.'}
                </p>
              </article>
            ),
          )}
        </div>
      )}

      {entregaApi.error && (
        <div className="ete-inline-error">
          <AlertTriangle size={17} />

          <span>
            {entregaApi.error}
          </span>
        </div>
      )}

      {entregaApi.cargando ? (
        <div className="ete-loading">
          <Loader2 size={20} />

          <span>
            Consultando tu entrega…
          </span>
        </div>
      ) : entregaApi.requiereEquipoAfinidad ? (
        <section className="ete-group-required">
          <UsersRound size={22} />

          <div>
            <small>
              Trabajo por afinidad
            </small>

            <strong>
              Primero debes formar o integrar un equipo
            </strong>

            <p>
              La tarea necesita un equipo por afinidad válido antes de habilitar la entrega.
            </p>
          </div>
        </section>
      ) : esPresencial ? (
        <section className="ete-delivery-card">
          <div className="ete-delivery-card__content">
            <span className="ete-delivery-card__icon">
              <CheckCircle2 size={22} />
            </span>

            <div>
              <small>
                Registro de actividad
              </small>

              <strong>
                No requiere una entrega digital
              </strong>

              <p>
                El docente registrará la evidencia o evaluación correspondiente a la actividad presencial.
              </p>
            </div>
          </div>
        </section>
      ) : usaEditorEmbebido ? (
        <>
          <section
            className={`ete-delivery-card ${
              entregaEnviada
                ? 'is-delivered'
                : ''
            }`}
          >
            <div className="ete-delivery-card__content">
              <span className="ete-delivery-card__icon">
                {entregaEnviada ? (
                  <CheckCircle2 size={22} />
                ) : esColaborativa ? (
                  <Workflow size={22} />
                ) : (
                  <FilePenLine size={22} />
                )}
              </span>

              <div>
                <small>
                  Mi entrega
                </small>

                <strong>
                  {textoEstadoEntrega}
                </strong>

                <p>
                  {entregaVisible?.enviadaEn
                    ? `Registrada el ${fecha(
                        entregaVisible.enviadaEn,
                      )}.`
                    : entregaApi.permisos.puedeModificar
                      ? 'Trabaja en tu respuesta y realiza la entrega cuando esté lista.'
                      : 'La entrega pertenece al grupo y debe ser registrada por el representante.'}
                </p>
              </div>
            </div>

            <span
              className={`ete-delivery-status ${
                entregaEnviada
                  ? 'is-success'
                  : ''
              }`}
            >
              {entregaApi.guardandoAutomatico ? (
                <>
                  <Loader2
                    size={13}
                    className="ete-spin"
                  />

                  Guardando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />

                  Autoguardado
                </>
              )}
            </span>
          </section>

          <section className="ete-workspace">
            <header className="ete-workspace__head">
              <div>
                <small>
                  Área de trabajo
                </small>

                <h4>
                  {tituloEditor}
                </h4>

                <p>
                  {tarea.tipo ===
                  'DOCUMENTO_COLABORATIVO'
                    ? 'Desarrolla aquí el documento asignado al equipo.'
                    : tarea.tipo ===
                        'REDACCION_JURIDICA'
                      ? 'Completa la estructura jurídica solicitada por el docente.'
                      : 'Desarrolla tu respuesta de forma clara y fundamentada.'}
                </p>
              </div>

              {tarea.tipo !==
                'RESPUESTA_ESCRITA' && (
                <div className="ete-workspace__counter">
                  <strong>
                    {cantidadPalabras}
                  </strong>

                  <span>
                    {cantidadPalabras ===
                    1
                      ? 'palabra'
                      : 'palabras'}
                  </span>
                </div>
              )}
            </header>

            {tarea.tipo ===
            'RESPUESTA_ESCRITA' ? (
              esRespuestaEscritaGrupal ? (
                <EditorColaborativoIusAcademy
                  valor={
                    respuestaGrupalHtml
                  }
                  usuario={
                    usuarioActualColaborativo
                  }
                  colaboradores={
                    colaboradoresRespuesta
                  }
                  deshabilitado={
                    !puedeModificar
                  }
                  titulo="Respuesta del equipo"
                  descripcion="Todos los integrantes trabajan sobre una sola respuesta compartida."
                  placeholder="Redacten aquí la respuesta del equipo..."
                  altoMinimo={
                    430
                  }
                  onChange={(
                    valorColaborativo,
                  ) => {
                    const html =
                      extraerHtmlEditorColaborativo(
                        valorColaborativo,
                      );

                    setEstructura(
                      (
                        actual,
                      ) => ({
                        version:
                          typeof actual?.version ===
                            'number'
                            ? actual.version
                            : 1,
                        formato:
                          'RESPUESTA_ESCRITA',
                        ...actual,
                        secciones: {
                          ...(
                            actual?.secciones ??
                            {}
                          ),
                          respuesta:
                            html,
                        },
                        citas:
                          Array.isArray(
                            actual?.citas,
                          )
                            ? actual.citas
                            : [],
                      }),
                    );

                    setContenido(
                      '',
                    );
                  }}
                />
              ) : (
                <EditorRespuestaEscrita
                  valor={
                    contenidoParaGuardar
                  }
                  config={
                    configuracionRespuesta
                  }
                  deshabilitado={
                    !puedeModificar
                  }
                  onChange={(
                    serializado,
                  ) => {
                    const siguiente =
                      intentarContenidoEstructurado(
                        serializado,
                      );

                    if (
                      siguiente
                    ) {
                      setEstructura(
                        siguiente,
                      );

                      setContenido(
                        '',
                      );
                    } else {
                      setEstructura(
                        null,
                      );

                      setContenido(
                        serializado,
                      );
                    }
                  }}
                />
              )
            ) : estructura?.secciones ? (
              <div className="ete-structured-editor">
                {Object.entries(
                  estructura.secciones,
                ).map(
                  ([
                    clave,
                    valor,
                  ]) => (
                    <label
                      key={clave}
                      className="ete-structured-editor__field"
                    >
                      <span>
                        {etiquetaSeccion(
                          clave,
                        )}
                      </span>

                      <textarea
                        value={
                          valor
                        }
                        rows={
                          clave ===
                            'argumentacion' ||
                          clave ===
                            'fundamentos' ||
                          clave ===
                            'desarrollo'
                            ? 8
                            : 5
                        }
                        disabled={
                          !puedeModificar
                        }
                        placeholder={`Escribe ${etiquetaSeccion(
                          clave,
                        ).toLowerCase()}...`}
                        onChange={(
                          evento,
                        ) =>
                          actualizarSeccion(
                            clave,
                            evento.target.value,
                          )
                        }
                      />
                    </label>
                  ),
                )}
              </div>
            ) : (
              <textarea
                className="ete-workspace__textarea"
                value={contenido}
                disabled={
                  !puedeModificar
                }
                placeholder={
                  placeholderEditor
                }
                onChange={(
                  evento,
                ) =>
                  setContenido(
                    evento.target.value,
                  )
                }
              />
            )}

            {usaArchivos && (
              <div className="ete-workspace__attachments">
                <div className="ete-workspace__attachments-head">
                  <div>
                    <strong>
                      Archivos adjuntos
                    </strong>

                    <small>
                      Hasta {tarea.maximoArchivos} archivo(s) · {tarea.tamanioMaximoArchivoMb} MB cada uno.
                    </small>
                  </div>

                  <span>
                    {entregaApi.entrega?.archivos.length ??
                      0}
                    /
                    {tarea.maximoArchivos}
                  </span>
                </div>

                {entregaApi.entrega?.archivos &&
                  entregaApi.entrega.archivos.length >
                    0 && (
                    <div className="ete-upload__existing">
                      {entregaApi.entrega.archivos.map(
                        (archivo) => (
                          <article
                            key={archivo.id}
                          >
                            <Files size={17} />

                            <div>
                              <strong>
                                {archivo.nombreOriginal}
                              </strong>

                              <small>
                                {archivo.extension.toUpperCase()}
                                {' · '}
                                {tamanio(
                                  archivo.tamanioBytes,
                                )}
                              </small>
                            </div>

                            <div className="ete-upload__file-actions">
                              <button
                                type="button"
                                title="Ver detalles"
                                onClick={() =>
                                  void abrirDetalleArchivo(
                                    archivo,
                                  )
                                }
                              >
                                <Eye size={14} />
                              </button>

                              {archivo.permiteDescarga && (
                                <button
                                  type="button"
                                  title="Descargar"
                                  onClick={() =>
                                    void descargar(
                                      archivo,
                                    )
                                  }
                                >
                                  <Download size={14} />
                                </button>
                              )}

                              {puedeModificar && (
                                <button
                                  type="button"
                                  className="danger"
                                  title="Eliminar"
                                  disabled={
                                    entregaApi.procesando
                                  }
                                  onClick={() =>
                                    void eliminarArchivoExistente(
                                      archivo,
                                    )
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  )}

                {puedeModificar && (
                  <label className="ete-upload__selector">
                    <Upload size={21} />

                    <div>
                      <strong>
                        Seleccionar archivos
                      </strong>

                      <span>
                        {tarea.extensionesPermitidas.join(
                          ', ',
                        )}
                      </span>
                    </div>

                    <input
                      type="file"
                      multiple={
                        tarea.maximoArchivos >
                        1
                      }
                      accept={aceptar}
                      disabled={
                        entregaApi.procesando ||
                        entregaApi.guardandoAutomatico
                      }
                      onChange={
                        seleccionar
                      }
                    />
                  </label>
                )}
              </div>
            )}

            <footer className="ete-workspace__footer">
              <div className="ete-workspace__save-info">
                {entregaApi.guardandoAutomatico ? (
                  <>
                    <Loader2
                      size={14}
                      className="ete-spin"
                    />

                    Guardando cambios…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />

                    Los cambios se guardan automáticamente.
                  </>
                )}
              </div>

              {puedeModificar && (
                <div className="ete-workspace__actions">
                  <button
                    type="button"
                    className="ete-secondary"
                    disabled={
                      entregaApi.procesando ||
                      entregaApi.guardandoAutomatico
                    }
                    onClick={() =>
                      void guardarBorradorEmbebido()
                    }
                  >
                    {entregaApi.procesando ? (
                      <Loader2
                        size={15}
                        className="ete-spin"
                      />
                    ) : (
                      <Save size={15} />
                    )}

                    Guardar borrador
                  </button>

                  <button
                    type="button"
                    className="ete-primary"
                    disabled={
                      entregaApi.procesando ||
                      entregaApi.guardandoAutomatico
                    }
                    onClick={() =>
                      void entregarEmbebido()
                    }
                  >
                    {entregaApi.procesando ? (
                      <Loader2
                        size={15}
                        className="ete-spin"
                      />
                    ) : (
                      <Send size={15} />
                    )}

                    {entregaEnviada
                      ? 'Actualizar entrega'
                      : tardia
                        ? 'Entregar con retraso'
                        : 'Entregar tarea'}
                  </button>
                </div>
              )}
            </footer>
          </section>

          {mostrarEntregaRegistrada && (
            <section className="ete-current">
              <div className="ete-current__head">
                <div>
                  <small>
                    Entrega registrada
                  </small>

                  <strong>
                    {nombresEstado[
                      entregaVisible.estado
                    ]}
                  </strong>
                </div>

                {entregaVisible.entregadaTarde && (
                  <span className="ete-current__late">
                    <Clock3 size={13} />
                    Con retraso
                  </span>
                )}
              </div>

              <div className="ete-current__meta">
                <span>
                  Enviada:{' '}
                  <strong>
                    {fecha(
                      entregaVisible.enviadaEn,
                    )}
                  </strong>
                </span>

                {entregaVisible.entregadaTarde && (
                  <>
                    <span>
                      Retraso:{' '}
                      <strong>
                        {entregaVisible.minutosRetraso}{' '}
                        min
                      </strong>
                    </span>

                    <span>
                      Descuento:{' '}
                      <strong>
                        {Number(
                          entregaVisible.descuentoCalculado,
                        )}
                      </strong>
                    </span>
                  </>
                )}

                {entregaVisible.autorEntrega && (
                  <span>
                    Registró:{' '}
                    <strong>
                      {entregaVisible.autorEntrega.nombres}{' '}
                      {entregaVisible.autorEntrega.apellidoPaterno}
                    </strong>
                  </span>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <section
            className={`ete-delivery-card ${
              entregaEnviada
                ? 'is-delivered'
                : ''
            }`}
          >
            <div className="ete-delivery-card__content">
              <span className="ete-delivery-card__icon">
                {entregaEnviada ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <Upload size={22} />
                )}
              </span>

              <div>
                <small>
                  Mi entrega
                </small>

                <strong>
                  {textoEstadoEntrega}
                </strong>

                <p>
                  {entregaVisible?.enviadaEn
                    ? `Registrada el ${fecha(
                        entregaVisible.enviadaEn,
                      )}.`
                    : entregaApi.permisos.puedeModificar
                      ? 'Aún no realizaste la entrega oficial.'
                      : 'La entrega pertenece al grupo y debe ser registrada por el representante.'}
                </p>
              </div>
            </div>

            {entregaApi.permisos.puedeModificar && (
              <button
                type="button"
                className="ete-delivery-card__action"
                disabled={
                  !disponible ||
                  entregaApi.procesando ||
                  (
                    entregaEnviada &&
                    !tarea.permitirEditarEntrega
                  )
                }
                onClick={
                  abrirEntregaModal
                }
              >
                {entregaEnviada ? (
                  <Pencil size={16} />
                ) : (
                  <Upload size={16} />
                )}

                {entregaEnviada
                  ? 'Editar entrega'
                  : configuracion.accion}
              </button>
            )}
          </section>

          {entregaVisible && (
            <section className="ete-current">
              <div className="ete-current__head">
                <div>
                  <small>
                    Entrega registrada
                  </small>

                  <strong>
                    {nombresEstado[
                      entregaVisible.estado
                    ]}
                  </strong>
                </div>

                {entregaVisible.entregadaTarde && (
                  <span className="ete-current__late">
                    <Clock3 size={13} />
                    Con retraso
                  </span>
                )}
              </div>

              <div className="ete-current__meta">
                <span>
                  Enviada:{' '}
                  <strong>
                    {fecha(
                      entregaVisible.enviadaEn,
                    )}
                  </strong>
                </span>

                {entregaVisible.autorEntrega && (
                  <span>
                    Registró:{' '}
                    <strong>
                      {entregaVisible.autorEntrega.nombres}{' '}
                      {entregaVisible.autorEntrega.apellidoPaterno}
                    </strong>
                  </span>
                )}
              </div>

              {usaTextoModal &&
                entregaVisible.contenido && (
                <div className="ete-current__text">
                  <small>
                    Respuesta
                  </small>

                  <p>
                    {entregaVisible.contenido}
                  </p>
                </div>
              )}

              {entregaVisible.archivos.length >
                0 && (
                <div className="ete-current__files">
                  {entregaVisible.archivos.map(
                    (archivo) => (
                      <article
                        key={archivo.id}
                      >
                        <Files size={17} />

                        <div>
                          <strong>
                            {archivo.nombreOriginal}
                          </strong>

                          <small>
                            {archivo.extension.toUpperCase()}
                            {' · '}
                            {tamanio(
                              archivo.tamanioBytes,
                            )}
                          </small>
                        </div>

                        <div className="ete-current__file-actions">
                          <button
                            type="button"
                            title="Ver detalles"
                            onClick={() =>
                              void abrirDetalleArchivo(
                                archivo,
                              )
                            }
                          >
                            <Eye size={14} />
                          </button>

                          {archivo.permiteDescarga && (
                            <button
                              type="button"
                              title="Descargar"
                              onClick={() =>
                                void descargar(
                                  archivo,
                                )
                              }
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

              {entregaEnviada &&
                tarea.permitirEditarEntrega &&
                !disponible && (
                <div className="ete-current__locked">
                  <ShieldCheck size={15} />

                  La tarea permite edición, pero el período de entrega ya terminó.
                </div>
              )}
            </section>
          )}
        </>
      )}

      <AulaModal
        abierto={modalEntrega}
        ancho="amplio"
        titulo={
          entregaEnviada
            ? 'Editar entrega'
            : configuracion.titulo
        }
        etiqueta="Mi entrega"
        descripcion={
          entregaEnviada
            ? 'Actualiza la evidencia y confirma nuevamente para registrar los cambios.'
            : 'Completa los requisitos y confirma la entrega cuando esté lista.'
        }
        icono={
          entregaEnviada
            ? Pencil
            : Icono
        }
        bloqueado={
          entregaApi.procesando ||
          entregaApi.guardandoAutomatico
        }
        onCerrar={() =>
          void cerrarModal()
        }
        footer={
          <div className="ete-modal-footer">
            <button
              type="button"
              className="ete-secondary"
              disabled={
                entregaApi.procesando ||
                entregaApi.guardandoAutomatico
              }
              onClick={() =>
                void cerrarModal()
              }
            >
              Cerrar
            </button>

            <button
              type="button"
              className="ete-primary"
              disabled={
                entregaApi.procesando ||
                entregaApi.guardandoAutomatico
              }
              onClick={() =>
                void entregarModal()
              }
            >
              {entregaApi.procesando ? (
                <Loader2
                  size={15}
                  className="ete-spin"
                />
              ) : (
                <Send size={15} />
              )}

              {entregaEnviada
                ? 'Actualizar entrega'
                : tardia
                  ? 'Entregar con retraso'
                  : 'Entregar tarea'}
            </button>
          </div>
        }
      >
        <div className="ete-editor">
          <div className="ete-autosave">
            {entregaApi.guardandoAutomatico ||
            entregaApi.procesando ? (
              <>
                <Loader2
                  size={15}
                  className="ete-spin"
                />

                <div>
                  <strong>
                    Guardando borrador…
                  </strong>

                  <p>
                    Tus cambios se están almacenando automáticamente.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />

                <div>
                  <strong>
                    Guardado automático activado
                  </strong>

                  <p>
                    Los cambios se conservan mientras trabajas.
                  </p>
                </div>
              </>
            )}
          </div>

          {usaTextoModal && (
            <section className="ete-editor__section">
              <div className="ete-editor__title">
                <FilePenLine size={17} />

                <div>
                  <strong>
                    Respuesta
                  </strong>

                  <small>
                    Escribe el desarrollo solicitado.
                  </small>
                </div>
              </div>

              <textarea
                value={contenido}
                rows={12}
                disabled={
                  entregaApi.procesando
                }
                placeholder="Escribe tu respuesta..."
                onChange={(
                  evento,
                ) =>
                  setContenido(
                    evento.target.value,
                  )
                }
              />
            </section>
          )}

          {usaArchivos && (
            <section className="ete-editor__section">
              <div className="ete-editor__title">
                <Files size={17} />

                <div>
                  <strong>
                    Archivos
                  </strong>

                  <small>
                    Hasta {tarea.maximoArchivos} archivo(s) · {tarea.tamanioMaximoArchivoMb} MB cada uno.
                  </small>
                </div>

                <span>
                  {entregaApi.entrega?.archivos.length ??
                    0}
                  /
                  {tarea.maximoArchivos}
                </span>
              </div>

              {entregaApi.entrega &&
                entregaApi.entrega.archivos.length >
                  0 && (
                  <div className="ete-upload__existing">
                    {entregaApi.entrega.archivos.map(
                      (archivo) => (
                        <article
                          key={archivo.id}
                        >
                          <Files size={17} />

                          <div>
                            <strong>
                              {archivo.nombreOriginal}
                            </strong>

                            <small>
                              {archivo.extension.toUpperCase()}
                              {' · '}
                              {tamanio(
                                archivo.tamanioBytes,
                              )}
                            </small>
                          </div>

                          <div className="ete-upload__file-actions">
                            <button
                              type="button"
                              title="Ver detalles"
                              onClick={() =>
                                void abrirDetalleArchivo(
                                  archivo,
                                )
                              }
                            >
                              <Eye size={14} />
                            </button>

                            {archivo.permiteDescarga && (
                              <button
                                type="button"
                                title="Descargar"
                                onClick={() =>
                                  void descargar(
                                    archivo,
                                  )
                                }
                              >
                                <Download size={14} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="danger"
                              title="Eliminar"
                              disabled={
                                entregaApi.procesando
                              }
                              onClick={() =>
                                void eliminarArchivoExistente(
                                  archivo,
                                )
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}

              <label className="ete-upload__selector">
                <Upload size={22} />

                <div>
                  <strong>
                    Seleccionar archivos
                  </strong>

                  <span>
                    {tarea.extensionesPermitidas.join(
                      ', ',
                    )}
                  </span>
                </div>

                <input
                  type="file"
                  multiple={
                    tarea.maximoArchivos >
                    1
                  }
                  accept={aceptar}
                  disabled={
                    entregaApi.procesando ||
                    entregaApi.guardandoAutomatico
                  }
                  onChange={seleccionar}
                />
              </label>
            </section>
          )}

          {!usaTextoModal &&
            !usaArchivos && (
            <div className="ete-editor__info">
              <Info size={16} />

              <p>
                Esta actividad no tiene una evidencia digital estándar configurada.
              </p>
            </div>
          )}
        </div>
      </AulaModal>

      <AulaModal
        abierto={
          archivoDetalle !==
          null
        }
        ancho="amplio"
        titulo={
          archivoDetalle?.nombreOriginal ??
          'Detalle del archivo'
        }
        etiqueta="Archivo entregado"
        descripcion="Consulta la información y la vista previa del archivo guardado en tu entrega."
        icono={
          archivoDetalle &&
          esImagen(
            archivoDetalle,
          )
            ? ImageIcon
            : Files
        }
        onCerrar={
          cerrarDetalleArchivo
        }
        footer={
          <div className="ete-file-modal__footer">
            <button
              type="button"
              className="ete-secondary"
              onClick={
                cerrarDetalleArchivo
              }
            >
              Cerrar
            </button>

            {archivoDetalle?.permiteDescarga && (
              <button
                type="button"
                className="ete-primary"
                onClick={() =>
                  void descargar(
                    archivoDetalle,
                  )
                }
              >
                <Download size={15} />
                Descargar
              </button>
            )}
          </div>
        }
      >
        {archivoDetalle && (
          <div className="ete-file-modal">
            <div className="ete-file-modal__meta">
              <article>
                <small>
                  Tipo
                </small>

                <strong>
                  {nombreTipoArchivo(
                    archivoDetalle,
                  )}
                </strong>
              </article>

              <article>
                <small>
                  Extensión
                </small>

                <strong>
                  {archivoDetalle.extension.toUpperCase()}
                </strong>
              </article>

              <article>
                <small>
                  Tamaño
                </small>

                <strong>
                  {tamanio(
                    archivoDetalle.tamanioBytes,
                  )}
                </strong>
              </article>

              <article>
                <small>
                  Guardado
                </small>

                <strong>
                  {fecha(
                    archivoDetalle.creadoEn,
                  )}
                </strong>
              </article>
            </div>

            <div className="ete-file-modal__preview">
              {cargandoVistaPrevia ? (
                <div className="ete-file-modal__state">
                  <Loader2
                    size={23}
                    className="ete-spin"
                  />

                  <strong>
                    Cargando vista previa…
                  </strong>
                </div>
              ) : errorVistaPrevia ? (
                <div className="ete-file-modal__state">
                  <AlertTriangle size={22} />

                  <strong>
                    No se pudo mostrar la vista previa
                  </strong>

                  <p>
                    {errorVistaPrevia}
                  </p>
                </div>
              ) : esImagen(
                  archivoDetalle,
                ) &&
                urlVistaPrevia ? (
                <img
                  src={urlVistaPrevia}
                  alt={
                    archivoDetalle.nombreOriginal
                  }
                />
              ) : esPdf(
                  archivoDetalle,
                ) &&
                urlVistaPrevia ? (
                <iframe
                  src={urlVistaPrevia}
                  title={`Vista previa de ${archivoDetalle.nombreOriginal}`}
                />
              ) : (
                <div className="ete-file-modal__state">
                  <Files size={26} />

                  <strong>
                    Vista previa no disponible
                  </strong>

                  <p>
                    Puedes descargar el archivo para abrirlo con la aplicación correspondiente.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </AulaModal>

      <Toast
        visible={toast.visible}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={() =>
          setToast(
            (actual) => ({
              ...actual,
              visible: false,
            }),
          )
        }
      />

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .ete-experience {
    display: grid;
    gap: 14px;
    padding: 20px 22px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .ete-experience__head {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
  }

  .ete-experience__icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--dte-color, var(--app-accent-dark));
    background: var(--dte-fondo, var(--app-accent-soft));
  }

  .ete-experience__head small {
    color: var(--app-text-muted);
    font-size: 11px;
  }

  .ete-experience__head h3 {
    margin: 2px 0 3px;
    font-size: 16px;
  }

  .ete-experience__head p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: 11.5px;
    line-height: 1.5;
  }

  .ete-experience__components {
    display: grid;
    gap: 7px;
  }

  .ete-experience__components article {
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface-alt);
  }

  .ete-experience__components article > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .ete-experience__components strong {
    font-size: 11.5px;
  }

  .ete-experience__components span {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 850;
  }

  .ete-experience__components p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: 10.5px;
  }

  .ete-inline-error,
  .ete-group-required,
  .ete-loading {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 11px 12px;
    border-radius: 11px;
    font-size: 11px;
  }

  .ete-inline-error {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .ete-group-required {
    border: 1px solid var(--app-warning-border);
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .ete-group-required div {
    display: grid;
    gap: 3px;
  }

  .ete-group-required p {
    margin: 0;
  }

  .ete-loading svg,
  .ete-spin {
    animation: ete-spin .8s linear infinite;
  }

  .ete-delivery-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .ete-delivery-card.is-delivered {
    border-color: var(--app-success-border);
  }

  .ete-delivery-card__content {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ete-delivery-card__icon {
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--dte-color, var(--app-accent-dark));
    background: var(--dte-fondo, var(--app-accent-soft));
  }

  .ete-delivery-card__content div {
    min-width: 0;
  }

  .ete-delivery-card__content small,
  .ete-delivery-card__content strong {
    display: block;
  }

  .ete-delivery-card__content small {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .ete-delivery-card__content strong {
    margin-top: 2px;
    font-size: 12px;
  }

  .ete-delivery-card__content p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: 10.5px;
    line-height: 1.45;
  }

  .ete-delivery-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    padding: 6px 9px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    font-size: 9.5px;
    font-weight: 800;
  }

  .ete-delivery-status.is-success {
    border-color: var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .ete-delivery-card__action,
  .ete-primary,
  .ete-secondary {
    min-height: 35px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 11px;
    border-radius: 9px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 850;
    cursor: pointer;
  }

  .ete-delivery-card__action,
  .ete-primary {
    border: 1px solid var(--dte-color, var(--app-accent));
    color: #fff;
    background: var(--dte-color, var(--app-accent));
  }

  .ete-secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .ete-delivery-card__action:disabled,
  .ete-primary:disabled,
  .ete-secondary:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .ete-workspace {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface);
  }

  .ete-workspace__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 15px 16px;
    border-bottom: 1px solid var(--app-border);
    background: var(--app-surface-alt);
  }

  .ete-workspace__head small {
    color: var(--dte-color, var(--app-accent));
    font-size: 9.5px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .ete-workspace__head h4 {
    margin: 3px 0 3px;
    font-size: 14px;
  }

  .ete-workspace__head p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: 10.5px;
    line-height: 1.45;
  }

  .ete-workspace__counter {
    min-width: 78px;
    display: grid;
    place-items: center;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .ete-workspace__counter strong {
    font-size: 14px;
  }

  .ete-workspace__counter span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .ete-workspace__textarea {
    width: 100%;
    min-height: 430px;
    display: block;
    box-sizing: border-box;
    padding: 18px;
    border: 0;
    outline: none;
    resize: vertical;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 13px;
    line-height: 1.75;
  }

  .ete-workspace__textarea:disabled,
  .ete-structured-editor textarea:disabled {
    opacity: .7;
    cursor: not-allowed;
  }

  .ete-structured-editor {
    display: grid;
    gap: 0;
  }

  .ete-structured-editor__field {
    display: grid;
    gap: 7px;
    padding: 15px 16px;
    border-bottom: 1px solid var(--app-border);
  }

  .ete-structured-editor__field:last-child {
    border-bottom: 0;
  }

  .ete-structured-editor__field > span {
    color: var(--app-text-secondary);
    font-size: 10.5px;
    font-weight: 850;
  }

  .ete-structured-editor textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: none;
    resize: vertical;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 12px;
    line-height: 1.65;
  }

  .ete-structured-editor textarea:focus,
  .ete-editor textarea:focus {
    border-color: var(--dte-color, var(--app-accent));
    box-shadow: 0 0 0 3px var(--dte-fondo, var(--app-accent-soft));
  }

  .ete-workspace__attachments {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-top: 1px solid var(--app-border);
    background: var(--app-surface-alt);
  }

  .ete-workspace__attachments-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .ete-workspace__attachments-head strong,
  .ete-workspace__attachments-head small {
    display: block;
  }

  .ete-workspace__attachments-head strong {
    font-size: 11px;
  }

  .ete-workspace__attachments-head small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .ete-workspace__attachments-head > span {
    color: var(--app-text-muted);
    font-size: 10px;
    font-weight: 800;
  }

  .ete-workspace__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--app-border);
    background: var(--app-surface-alt);
  }

  .ete-workspace__save-info {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .ete-workspace__save-info svg {
    color: var(--app-success);
  }

  .ete-workspace__actions {
    display: flex;
    gap: 7px;
  }

  .ete-current {
    display: grid;
    gap: 10px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .ete-current__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ete-current__head small,
  .ete-current__head strong {
    display: block;
  }

  .ete-current__head small {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .ete-current__head strong {
    margin-top: 2px;
    font-size: 11.5px;
  }

  .ete-current__late {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-warning);
    background: var(--app-warning-bg);
    font-size: 10px;
    font-weight: 850;
  }

  .ete-current__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 13px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .ete-current__meta strong {
    color: var(--app-text-secondary);
  }

  .ete-current__text {
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .ete-current__text small {
    color: var(--dte-color, var(--app-accent));
    font-size: 10px;
    font-weight: 850;
  }

  .ete-current__text p {
    margin: 5px 0 0;
    color: var(--app-text-secondary);
    white-space: pre-wrap;
    font-size: 11.5px;
    line-height: 1.5;
  }

  .ete-current__files,
  .ete-upload__existing {
    display: grid;
    gap: 7px;
  }

  .ete-current__files article,
  .ete-upload__existing article {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    background: var(--app-surface);
  }

  .ete-current__files strong,
  .ete-upload__existing strong {
    display: block;
    overflow: hidden;
    font-size: 10.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ete-current__files small,
  .ete-upload__existing small {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .ete-current__file-actions,
  .ete-upload__file-actions {
    display: flex;
    gap: 4px;
  }

  .ete-current__file-actions button,
  .ete-upload__file-actions button {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .ete-upload__file-actions button.danger {
    color: var(--app-danger);
  }

  .ete-current__locked {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .ete-modal-footer,
  .ete-file-modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .ete-editor {
    display: grid;
    gap: 13px;
  }

  .ete-autosave {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 11px;
    border: 1px solid var(--app-success-border);
    border-radius: 10px;
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .ete-autosave strong,
  .ete-autosave p {
    display: block;
    margin: 0;
  }

  .ete-autosave strong {
    font-size: 10.5px;
  }

  .ete-autosave p {
    margin-top: 2px;
    font-size: 9.5px;
  }

  .ete-editor__section {
    display: grid;
    gap: 10px;
  }

  .ete-editor__title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ete-editor__title > div {
    min-width: 0;
    flex: 1;
  }

  .ete-editor__title strong,
  .ete-editor__title small {
    display: block;
  }

  .ete-editor__title strong {
    font-size: 11.5px;
  }

  .ete-editor__title small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .ete-editor textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: none;
    resize: vertical;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 12px;
    line-height: 1.6;
  }

  .ete-upload__selector {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 10px;
    background: var(--app-surface);
    cursor: pointer;
  }

  .ete-upload__selector:hover {
    border-color: var(--dte-color, var(--app-accent));
  }

  .ete-upload__selector div {
    display: grid;
    gap: 2px;
  }

  .ete-upload__selector strong {
    font-size: 10.5px;
  }

  .ete-upload__selector span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .ete-upload__selector input {
    display: none;
  }

  .ete-editor__info {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .ete-file-modal {
    display: grid;
    gap: 12px;
  }

  .ete-file-modal__meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .ete-file-modal__meta article {
    padding: 9px 10px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    background: var(--app-surface-alt);
  }

  .ete-file-modal__meta small,
  .ete-file-modal__meta strong {
    display: block;
  }

  .ete-file-modal__meta small {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .ete-file-modal__meta strong {
    margin-top: 3px;
    font-size: 10.5px;
  }

  .ete-file-modal__preview {
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .ete-file-modal__preview img,
  .ete-file-modal__preview iframe {
    width: 100%;
    height: 520px;
    border: 0;
    object-fit: contain;
  }

  .ete-file-modal__state {
    display: grid;
    place-items: center;
    gap: 6px;
    max-width: 460px;
    padding: 22px;
    text-align: center;
    color: var(--app-text-muted);
  }

  .ete-file-modal__state strong {
    color: var(--app-text-secondary);
    font-size: 11px;
  }

  .ete-file-modal__state p {
    margin: 0;
    font-size: 10px;
    line-height: 1.5;
  }

  @keyframes ete-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .ete-delivery-card,
    .ete-workspace__head,
    .ete-workspace__footer {
      align-items: stretch;
      flex-direction: column;
    }

    .ete-delivery-status {
      width: fit-content;
    }

    .ete-workspace__counter {
      width: fit-content;
    }

    .ete-workspace__actions {
      width: 100%;
    }

    .ete-workspace__actions button {
      flex: 1;
    }

    .ete-delivery-card__action {
      width: 100%;
    }

    .ete-file-modal__meta {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .ete-experience {
      padding: 16px;
    }

    .ete-experience__head {
      grid-template-columns: 42px minmax(0, 1fr);
    }

    .ete-experience__icon {
      width: 42px;
      height: 42px;
    }

    .ete-workspace__actions {
      flex-direction: column;
    }

    .ete-file-modal__meta {
      grid-template-columns: 1fr;
    }
  }
`;
