import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  ListChecks,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Pin,
  Send,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import AvatarUsuario from '../../../components/shared/AvatarUsuario';

import useForoEstudiante, {
  type ComentarioForoEstudiante,
  type RespuestaForoEstudiante,
} from '../../../hooks/foro/useForoEstudiante';

import FormarEquipoAfinidadModal from '../../../components/foro/FormarEquipoAfinidadModal';

type ToastActual = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

function fecha(
  valor?: string | null,
): string {
  if (
    !valor
  ) {
    return 'Sin definir';
  }

  const objeto =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        '2-digit',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
      hour12:
        false,
    },
  ).format(
    objeto,
  );
}

function etiqueta(
  valor?: string | null,
): string {
  return String(
    valor ??
      '—',
  )
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /^./,
      (
        caracter,
      ) =>
        caracter.toUpperCase(),
    );
}


function formatearPenalizacionRetraso(
  tipo?: string | null,
  valor?: number | string | null,
): string | null {
  const tipoNormalizado =
    String(
      tipo ??
      'NINGUNO',
    ).toUpperCase();

  if (
    tipoNormalizado ===
      'NINGUNO'
  ) {
    return 'Sin penalización';
  }

  const numero =
    valor ===
      null ||
    valor ===
      undefined ||
    valor ===
      ''
      ? null
      : Number(
          valor,
        );

  const valorTexto =
    numero !==
      null &&
    Number.isFinite(
      numero,
    )
      ? new Intl.NumberFormat(
          'es-BO',
          {
            maximumFractionDigits:
              2,
          },
        ).format(
          numero,
        )
      : '—';

  if (
    tipoNormalizado ===
      'PORCENTAJE'
  ) {
    return `Penalización: −${valorTexto}% de la nota`;
  }

  if (
    tipoNormalizado ===
      'PUNTOS_FIJOS'
  ) {
    return `Penalización: −${valorTexto} punto${numero === 1 ? '' : 's'}`;
  }

  if (
    tipoNormalizado ===
      'POR_HORA'
  ) {
    return `Penalización: −${valorTexto} punto${numero === 1 ? '' : 's'} por hora`;
  }

  if (
    tipoNormalizado ===
      'POR_DIA'
  ) {
    return `Penalización: −${valorTexto} punto${numero === 1 ? '' : 's'} por día`;
  }

  if (
    tipoNormalizado ===
      'NOTA_MAXIMA'
  ) {
    return `Nota máxima por retraso: ${valorTexto}`;
  }

  return `Penalización por retraso: ${valorTexto}`;
}

function formatearPenalizacionComentarios(
  tipo?: string | null,
  valor?: number | string | null,
): string | null {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero) || numero <= 0) return null;

  return tipo === 'PORCENTAJE'
    ? `-${numero}% por participación incompleta`
    : `-${numero} punto${numero === 1 ? '' : 's'} por participación incompleta`;
}

function contarPalabras(
  valor:
    string,
): number {
  return valor
    .trim()
    .split(
      /\s+/,
    )
    .filter(
      Boolean,
    )
    .length;
}

function formatearTiempoRestante(
  milisegundos:
    number,
): {
  texto: string;
  nivel:
    'normal' |
    'urgente' |
    'critico' |
    'finalizado';
} {
  if (
    milisegundos <=
    0
  ) {
    return {
      texto:
        'Plazo finalizado',
      nivel:
        'finalizado',
    };
  }

  const totalSegundos =
    Math.floor(
      milisegundos /
      1000,
    );

  const dias =
    Math.floor(
      totalSegundos /
      86400,
    );

  const horas =
    Math.floor(
      (
        totalSegundos %
        86400
      ) /
      3600,
    );

  const minutos =
    Math.floor(
      (
        totalSegundos %
        3600
      ) /
      60,
    );

  const segundos =
    totalSegundos %
    60;

  const texto =
    dias >
    0
      ? `${dias} d ${horas} h ${minutos} min ${segundos} s`
      : horas >
        0
        ? `${horas} h ${minutos} min ${segundos} s`
        : `${minutos} min ${segundos} s`;

  const nivel =
    milisegundos <=
    60 *
      60 *
      1000
      ? 'critico'
      : milisegundos <=
        24 *
          60 *
          60 *
          1000
        ? 'urgente'
        : 'normal';

  return {
    texto,
    nivel,
  };
}

function obtenerExtensionArchivo(
  nombre?: string | null,
): string {
  if (
    !nombre
  ) {
    return '';
  }

  const partes =
    nombre
      .toLowerCase()
      .split(
        '.',
      );

  return partes.length >
    1
      ? partes.at(
          -1,
        ) ??
        ''
      : '';
}

function clasificarArchivo(
  nombre?: string | null,
): 'IMAGEN' | 'PDF' | 'WORD' | 'EXCEL' | 'OTRO' {
  const extension =
    obtenerExtensionArchivo(
      nombre,
    );

  if (
    [
      'jpg',
      'jpeg',
      'png',
      'webp',
      'gif',
      'bmp',
    ].includes(
      extension,
    )
  ) {
    return 'IMAGEN';
  }

  if (
    extension ===
    'pdf'
  ) {
    return 'PDF';
  }

  if (
    [
      'doc',
      'docx',
    ].includes(
      extension,
    )
  ) {
    return 'WORD';
  }

  if (
    [
      'xls',
      'xlsx',
      'csv',
    ].includes(
      extension,
    )
  ) {
    return 'EXCEL';
  }

  return 'OTRO';
}

function nombreArchivo(
  archivo: {
    nombreOriginal?: string | null;
    nombre?: string | null;
  },
): string {
  return (
    archivo.nombreOriginal ??
    archivo.nombre ??
    'Archivo adjunto'
  );
}

function urlArchivo(
  archivo: {
    url?: string | null;
    urlPublica?: string | null;
    ruta?: string | null;
  },
): string | null {
  const ubicacion =
    archivo.urlPublica ??
    archivo.url ??
    archivo.ruta ??
    null;

  if (!ubicacion) {
    return null;
  }

  if (
    ubicacion.startsWith('http://') ||
    ubicacion.startsWith('https://')
  ) {
    return ubicacion;
  }

  return `${
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000'
  }${
    ubicacion.startsWith('/')
      ? ubicacion
      : `/${ubicacion}`
  }`;
}

function nombreAutor(
  respuesta:
    RespuestaForoEstudiante,
): string {
  return [
    respuesta.autor.nombres,
    respuesta.autor.apellidoPaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function ComentarioItem({
  comentario,
}: {
  comentario:
    ComentarioForoEstudiante;
}) {
  return (
    <article className="dfe-comment">
      <AvatarUsuario
        fotoPerfilUrl={
          comentario.autor.fotoPerfilUrl
        }
        nombres={
          comentario.autor.nombres
        }
        apellidoPaterno={
          comentario.autor.apellidoPaterno
        }
        size={36}
      />

      <div className="dfe-comment__body">
        <header>
          <strong>
            {
              comentario.autor
                .nombres
            }
            {' '}
            {
              comentario.autor
                .apellidoPaterno
            }
          </strong>

          <span>
            {fecha(
              comentario.publicadoEn,
            )}
          </span>
        </header>

        <p>
          {comentario.contenido}
        </p>
      </div>
    </article>
  );
}

export default function DetalleForoEstudiante() {
  const navigate =
    useNavigate();

  const {
    cursoId,
    foroId,
  } =
    useParams();

  const idCurso =
    Number(
      cursoId,
    );

  const idForo =
    Number(
      foroId,
    );

  const d =
    useForoEstudiante(
      idCurso,
      idForo,
    );

  const [
    ahora,
    setAhora,
  ] =
    useState(
      () =>
        Date.now(),
    );

  const [
    tituloRespuesta,
    setTituloRespuesta,
  ] =
    useState(
      '',
    );

  const [
    contenidoRespuesta,
    setContenidoRespuesta,
  ] =
    useState(
      '',
    );

  const [
    modalRespuesta,
    setModalRespuesta,
  ] =
    useState(
      false,
    );

  const [
    modalDetalle,
    setModalDetalle,
  ] =
    useState(
      false,
    );

  const [
    archivosRespuesta,
    setArchivosRespuesta,
  ] =
    useState<File[]>(
      [],
    );

  const [
    modalAfinidad,
    setModalAfinidad,
  ] =
    useState(
      false,
    );

  const [
    modalDetalleEquipo,
    setModalDetalleEquipo,
  ] =
    useState(
      false,
    );

  const [
    modalMiParticipacion,
    setModalMiParticipacion,
  ] =
    useState(
      false,
    );

  const [
    archivoPreview,
    setArchivoPreview,
  ] =
    useState<{
      nombre: string;
      url: string;
      tipo: 'IMAGEN' | 'PDF' | 'OTRO';
    } | null>(
      null,
    );

  const [
    respuestaSeleccionadaId,
    setRespuestaSeleccionadaId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    respuestaComentando,
    setRespuestaComentando,
  ] =
    useState<number | null>(
      null,
    );

  const [
    comentario,
    setComentario,
  ] =
    useState(
      '',
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastActual>({
      visible:
        false,
      tipo:
        'exito',
      titulo:
        '',
    });

  const mostrarToast =
    (
      tipo:
        TipoToast,
      titulo:
        string,
      mensaje?:
        string,
    ) => {
      setToast({
        visible:
          true,
        tipo,
        titulo,
        mensaje,
      });
    };

  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () =>
            setAhora(
              Date.now(),
            ),
          1000,
        );

      return () =>
        window.clearInterval(
          intervalo,
        );
    },
    [],
  );

  const foro =
    d.foro;

  const miParticipacion =
    d.miParticipacion;

  const componenteParticipacion =
    miParticipacion?.componente ??
    foro?.actividadCalificable?.componente ??
    null;

  const cierreNormal =
    foro
      ? foro.fechaLimite ||
        foro.fechaCierre
      : null;

  const cierreConRetraso =
    foro?.permitirRetrasos
      ? foro.fechaMaximaRetraso ||
        foro.fechaCierre ||
        foro.fechaLimite
      : null;

  const cierreEfectivo =
    foro?.permitirRetrasos &&
    cierreConRetraso
      ? cierreConRetraso
      : cierreNormal;

  const penalizacionRetraso =
    foro?.permitirRetrasos
      ? formatearPenalizacionRetraso(
          foro.tipoDescuentoRetraso,
          foro.valorDescuentoRetraso,
        )
      : null;

  const penalizacionComentarios =
    foro?.penalizarIncumplimientoComentarios
      ? formatearPenalizacionComentarios(
          foro.tipoPenalizacionComentarios,
          foro.valorPenalizacionComentarios,
        )
      : null;

  const aperturaMs =
    foro?.fechaApertura
      ? new Date(
          foro.fechaApertura,
        ).getTime()
      : null;

  const cierreNormalMs =
    cierreNormal
      ? new Date(
          cierreNormal,
        ).getTime()
      : null;

  const cierreConRetrasoMs =
    cierreConRetraso
      ? new Date(
          cierreConRetraso,
        ).getTime()
      : null;

  const cierreEfectivoMs =
    cierreEfectivo
      ? new Date(
          cierreEfectivo,
        ).getTime()
      : null;

  const estadoActual =
    foro?.estado ??
    null;

  const estadoFinalAcademico =
    estadoActual ===
      'CERRADO' ||
    estadoActual ===
      'CALIFICANDO' ||
    estadoActual ===
      'CALIFICADO' ||
    estadoActual ===
      'NOTAS_PUBLICADAS' ||
    estadoActual ===
      'ANULADO';

  const esperandoApertura =
    Boolean(
      !estadoFinalAcademico &&
        estadoActual ===
          'PROGRAMADO' &&
        aperturaMs !==
          null &&
        ahora <
          aperturaMs,
    );

  const esperandoConfirmacionApertura =
    Boolean(
      !estadoFinalAcademico &&
        estadoActual ===
          'PROGRAMADO' &&
        aperturaMs !==
          null &&
        ahora >=
          aperturaMs,
    );

  const cierreNormalVencido =
    Boolean(
      cierreNormalMs !==
        null &&
        ahora >=
          cierreNormalMs,
    );

  const cierreConRetrasoVencido =
    Boolean(
      cierreConRetrasoMs !==
        null &&
        ahora >=
          cierreConRetrasoMs,
    );

  const plazoFinalizado =
    Boolean(
      cierreEfectivoMs !==
        null &&
        ahora >=
          cierreEfectivoMs,
    );

  const cerrado =
    Boolean(
      estadoFinalAcademico ||
        plazoFinalizado,
    );

  const foroAbiertoPorEstado =
    estadoActual ===
      'ABIERTO' ||
    (
      estadoActual ===
        'VENCIDO' &&
      foro?.permitirRetrasos ===
        true
    );

  const disponibleParaParticipar =
    Boolean(
      foro &&
        foroAbiertoPorEstado &&
        !esperandoApertura &&
        !esperandoConfirmacionApertura &&
        !cerrado,
    );

  const tiempoParaAbrir =
    esperandoApertura &&
    aperturaMs !==
      null
      ? formatearTiempoRestante(
          aperturaMs -
            ahora,
        )
      : null;

  const tiempoParaCierreNormal =
    disponibleParaParticipar &&
    cierreNormalMs !==
      null &&
    !cierreNormalVencido
      ? formatearTiempoRestante(
          cierreNormalMs -
            ahora,
        )
      : null;

  const tiempoParaCierreConRetraso =
    foro?.permitirRetrasos &&
    cierreNormalVencido &&
    cierreConRetrasoMs !==
      null &&
    !cierreConRetrasoVencido
      ? formatearTiempoRestante(
          cierreConRetrasoMs -
            ahora,
        )
      : null;

  const nivelTemporal =
    tiempoParaAbrir?.nivel ??
    tiempoParaCierreNormal?.nivel ??
    tiempoParaCierreConRetraso?.nivel ??
    (
      cerrado
        ? 'finalizado'
        : 'normal'
    );

  const textoEstadoTemporal =
    esperandoApertura
      ? 'Disponible próximamente'
      : esperandoConfirmacionApertura
        ? 'Preparando apertura'
        : cerrado
          ? estadoActual ===
              'CALIFICANDO'
            ? 'En proceso de calificación'
            : estadoActual ===
                'CALIFICADO' ||
              estadoActual ===
                'NOTAS_PUBLICADAS'
              ? 'Actividad calificada'
              : 'Participación cerrada'
          : disponibleParaParticipar
            ? (
                foro?.permitirRetrasos &&
                cierreNormalVencido
                  ? 'Disponible con retraso'
                  : 'Disponible para participar'
              )
            : 'Participación no disponible';

  const recargarDetalle =
    d.cargar;

  useEffect(
    () => {
      if (
        !esperandoConfirmacionApertura
      ) {
        return;
      }

      /*
       * Al llegar a 00:00 no habilitamos botones por nuestra cuenta:
       * esperamos a que el backend confirme ABIERTO.
       *
       * La consulta es silenciosa y ya no muestra Skeleton, por eso
       * la pantalla permanece completamente estable.
       */
      void recargarDetalle();

      const intervalo =
        window.setInterval(
          () => {
            void recargarDetalle();
          },
          2000,
        );

      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [
      esperandoConfirmacionApertura,
      recargarDetalle,
    ],
  );

  useEffect(
    () => {
      if (
        disponibleParaParticipar
      ) {
        return;
      }

      setModalRespuesta(
        false,
      );

      setModalAfinidad(
        false,
      );

      setRespuestaComentando(
        null,
      );
    },
    [
      disponibleParaParticipar,
    ],
  );

  const miRespuesta =
    useMemo(
      () => {
        if (
          !foro ||
          !miParticipacion
        ) {
          return null;
        }

        if (
          foro.modalidadParticipacion ===
          'INDIVIDUAL'
        ) {
          return (
            d.respuestas.find(
              (
                respuesta,
              ) =>
                respuesta.autorId ===
                miParticipacion.estudianteId,
            ) ??
            null
          );
        }

        if (
          !miParticipacion.grupo
        ) {
          return null;
        }

        if (
          miParticipacion.origenGrupo ===
          'PLATAFORMA'
        ) {
          return (
            d.respuestas.find(
              (
                respuesta,
              ) =>
                respuesta.grupoCurso?.id ===
                miParticipacion.grupo?.id,
            ) ??
            null
          );
        }

        if (
          miParticipacion.origenGrupo ===
          'AFINIDAD'
        ) {
          return (
            d.respuestas.find(
              (
                respuesta,
              ) =>
                respuesta.equipoAfinidad?.id ===
                miParticipacion.grupo?.id,
            ) ??
            null
          );
        }

        return null;
      },
      [
        foro,
        miParticipacion,
        d.respuestas,
      ],
    );

  const nombreRepresentante =
    miParticipacion?.representante
      ? [
          miParticipacion.representante
            .nombres,
          miParticipacion.representante
            .apellidoPaterno,
        ]
          .filter(
            Boolean,
          )
          .join(
            ' ',
          )
      : null;

  const textoRolParticipacion =
    useMemo(
      () => {
        if (
          !foro ||
          foro.modalidadParticipacion !==
            'GRUPAL' ||
          !miParticipacion
        ) {
          return null;
        }

        if (
          miParticipacion.origenGrupo ===
            'AFINIDAD' &&
          !miParticipacion.grupo
        ) {
          return 'Primero debes formar tu equipo por afinidad para poder participar.';
        }

        if (
          !miParticipacion.grupo
        ) {
          return 'Todavía no se pudo identificar tu grupo para esta actividad.';
        }

        if (
          miParticipacion.dinamicaGrupal ===
          'REPRESENTANTE_UNICO'
        ) {
          return miParticipacion.esRepresentante
            ? 'Eres el representante. Te corresponde publicar la única respuesta principal de tu grupo.'
            : `La respuesta principal será publicada por ${nombreRepresentante ?? 'el representante de tu grupo'}.`;
        }

        if (
          miParticipacion.dinamicaGrupal ===
          'PARTICIPACION_DISTRIBUIDA'
        ) {
          return miParticipacion.esRepresentante
            ? 'Eres el representante: publica la respuesta principal. Después, tu equipo podrá complementarla mediante comentarios.'
            : 'Tu función es complementar mediante comentarios únicamente la respuesta principal de tu propio grupo.';
        }

        if (
          miParticipacion.dinamicaGrupal ===
          'COLABORACION_ABIERTA'
        ) {
          return miParticipacion.esRepresentante
            ? 'Eres el representante: publica la respuesta principal de tu grupo. La colaboración se realiza comentando respuestas de otros grupos.'
            : 'Tu participación consiste en comentar respuestas de otros grupos. La respuesta de tu propio grupo no admite comentarios en esta dinámica.';
        }

        return 'Revisa las reglas de participación antes de intervenir en el foro.';
      },
      [
        foro,
        miParticipacion,
        nombreRepresentante,
      ],
    );

  const respuestaSeleccionada =
    useMemo(
      () =>
        d.respuestas.find(
          (
            respuesta,
          ) =>
            respuesta.id ===
            respuestaSeleccionadaId,
        ) ??
        null,
      [
        d.respuestas,
        respuestaSeleccionadaId,
      ],
    );

  const puedeComentarSeleccionada =
    Boolean(
      respuestaSeleccionada &&
        disponibleParaParticipar &&
        d.puedeComentarRespuesta(
          respuestaSeleccionada,
        ),
    );

  const palabrasRespuesta =
    contarPalabras(
      contenidoRespuesta,
    );

  const palabrasComentario =
    contarPalabras(
      comentario,
    );

  const aceptarAdjuntos =
    foro?.permitirAdjuntosRespuesta ===
    true;

  const extensionesAceptadas =
    foro?.extensionesPermitidas?.length
      ? foro.extensionesPermitidas
          .map(
            (
              extension,
            ) =>
              extension.startsWith(
                '.',
              )
                ? extension
                : `.${extension}`,
          )
          .join(
            ',',
          )
      : undefined;

  const maximoArchivos =
    foro?.maximoArchivosRespuesta ??
    1;

  const agregarArchivos =
    (
      archivos:
        FileList | null,
    ) => {
      if (
        !archivos ||
        archivos.length ===
          0
      ) {
        return;
      }

      const nuevos =
        Array.from(
          archivos,
        );

      const combinados =
        [
          ...archivosRespuesta,
          ...nuevos,
        ].slice(
          0,
          maximoArchivos,
        );

      const limiteBytes =
        (
          foro?.tamanioMaximoArchivoMb ??
          10
        ) *
        1024 *
        1024;

      const validos =
        combinados.filter(
          (
            archivo,
          ) =>
            archivo.size <=
            limiteBytes,
        );

      setArchivosRespuesta(
        validos,
      );

      if (
        validos.length <
        combinados.length
      ) {
        mostrarToast(
          'advertencia',
          'Archivo demasiado grande',
          `Cada archivo puede pesar como máximo ${foro?.tamanioMaximoArchivoMb ?? 10} MB.`,
        );
      }

      if (
        nuevos.length +
          archivosRespuesta.length >
        maximoArchivos
      ) {
        mostrarToast(
          'advertencia',
          'Límite de archivos',
          `Puedes adjuntar como máximo ${maximoArchivos} archivo(s).`,
        );
      }
    };

  const respuestaValida =
    Boolean(
      tituloRespuesta.trim() &&
        contenidoRespuesta.trim() &&
        (
          !foro?.palabrasMinimasRespuesta ||
          palabrasRespuesta >=
            foro.palabrasMinimasRespuesta
        ) &&
        (
          !foro?.palabrasMaximasRespuesta ||
          palabrasRespuesta <=
            foro.palabrasMaximasRespuesta
        ) &&
        (
          !foro?.exigirAdjuntoRespuesta ||
          archivosRespuesta.length > 0
        ),
    );

  const comentarioValido =
    Boolean(
      comentario.trim() &&
        (
          !foro?.palabrasMinimasComentario ||
          palabrasComentario >=
            foro.palabrasMinimasComentario
        ) &&
        (
          !foro?.palabrasMaximasComentario ||
          palabrasComentario <=
            foro.palabrasMaximasComentario
        ),
    );

  if (
    d.cargando &&
    !foro
  ) {
    return (
      <section className="dfe-loading">
        <AulaSkeleton
          cantidad={4}
          variante="tarjetas"
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  if (
    !foro
  ) {
    const pareceProgramado =
      Boolean(
        d.error &&
          (
            d.error
              .toLowerCase()
              .includes(
                'todavía no está disponible',
              ) ||
            d.error
              .toLowerCase()
              .includes(
                'aún no está disponible',
              )
          ),
      );

    return (
      <section className="dfe-error">
        <AulaEmptyState
          icono={
            pareceProgramado
              ? Clock3
              : AlertCircle
          }
          titulo={
            pareceProgramado
              ? 'Este foro está programado'
              : 'No fue posible abrir el foro'
          }
          descripcion={
            pareceProgramado
              ? 'El foro ya fue publicado, pero su contenido estará disponible cuando llegue la fecha de apertura configurada por el docente.'
              : d.error ||
                'El foro no está disponible.'
          }
          accionTexto="Volver a foros"
          onAccion={() =>
            navigate(
              `/estudiante/cursos/${idCurso}/foro`,
            )
          }
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  const publicar =
    async () => {
      if (
        !disponibleParaParticipar
      ) {
        mostrarToast(
          'advertencia',
          esperandoApertura
            ? 'El foro todavía no abrió'
            : 'El foro ya no admite participaciones',
          esperandoApertura
            ? `Podrás participar desde ${fecha(
                foro.fechaApertura,
              )}.`
            : 'El plazo de participación ya terminó.',
        );

        return;
      }

      if (
        foro.modalidadParticipacion ===
          'GRUPAL' &&
        !miParticipacion
          ?.puedeCrearRespuestaPrincipal
      ) {
        mostrarToast(
          'advertencia',
          'Participación principal restringida',
          'Solo el representante del grupo puede publicar la respuesta principal.',
        );

        return;
      }

      if (
        !respuestaValida
      ) {
        mostrarToast(
          'advertencia',
          'Revisa tu respuesta',
          foro.exigirAdjuntoRespuesta && archivosRespuesta.length === 0
            ? 'Completa el título, el contenido y adjunta al menos un archivo.'
            : 'Completa el título, el contenido y los límites de palabras configurados.',
        );
        return;
      }

      if (
        d.usaAfinidad &&
        !d.equipo
      ) {
        setModalRespuesta(
          false,
        );
        setModalAfinidad(
          true,
        );
        return;
      }

      try {
        const resultado =
          await d.publicarRespuesta(
            tituloRespuesta.trim(),
            contenidoRespuesta.trim(),
            archivosRespuesta,
          );

        setTituloRespuesta(
          '',
        );
        setContenidoRespuesta(
          '',
        );
        setArchivosRespuesta(
          [],
        );
        setModalRespuesta(
          false,
        );

        if (
          resultado.archivosFallidos.length > 0
        ) {
          mostrarToast(
            'advertencia',
            'Respuesta publicada con archivos pendientes',
            `La respuesta se guardó, pero no se pudieron subir: ${resultado.archivosFallidos.join(', ')}.`,
          );
        } else {
          mostrarToast(
            'exito',
            'Respuesta publicada',
            archivosRespuesta.length > 0
              ? 'Tu respuesta y sus archivos fueron registrados correctamente.'
              : 'Tu participación fue registrada correctamente.',
          );
        }
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo publicar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const formarEquipo =
    async (
      integrantesIds:
        number[],
    ) => {
      if (
        !disponibleParaParticipar
      ) {
        mostrarToast(
          'advertencia',
          esperandoApertura ||
          esperandoConfirmacionApertura
            ? 'El foro todavía no está habilitado'
            : 'El foro ya no admite grupos',
          esperandoApertura
            ? `Podrás formar tu grupo desde ${fecha(
                foro.fechaApertura,
              )}.`
            : esperandoConfirmacionApertura
              ? 'La hora de apertura ya llegó. El foro se está habilitando.'
              : 'La actividad ya terminó o se encuentra en calificación.',
        );

        return;
      }

      try {
        await d.crearEquipo(
          integrantesIds,
        );

        setModalAfinidad(
          false,
        );
        setModalRespuesta(
          true,
        );

        mostrarToast(
          'exito',
          'Grupo formado',
          'Tu equipo por afinidad ya está listo para participar.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo formar el grupo',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
        throw causa;
      }
    };

  const enviarComentario =
    async () => {
      if (
        !disponibleParaParticipar
      ) {
        mostrarToast(
          'advertencia',
          'Comentarios no disponibles',
          esperandoApertura ||
          esperandoConfirmacionApertura
            ? 'Podrás comentar cuando el foro esté habilitado.'
            : 'El foro ya no admite nuevas participaciones.',
        );

        return;
      }

      if (
        !respuestaComentando ||
        !comentarioValido
      ) {
        return;
      }

      try {
        await d.crearComentario(
          respuestaComentando,
          comentario.trim(),
        );

        setComentario(
          '',
        );
        setRespuestaComentando(
          null,
        );

        mostrarToast(
          'exito',
          'Comentario publicado',
          'Tu comentario ya forma parte de la conversación.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo comentar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  return (
    <section className="dfe-page">
      <AulaHeader
        icono={
          MessageSquare
        }
        etiqueta="Foro del curso"
        titulo={
          foro.titulo
        }
        descripcion={
          foro.objetivo ||
          'Espacio de análisis, argumentación jurídica y participación.'
        }
        informacion={
          foro.permitirRetrasos
            ? `Cierre normal: ${fecha(
                cierreNormal,
              )} · Cierre con retraso: ${fecha(
                cierreConRetraso,
              )}`
            : `Cierre: ${fecha(
                cierreNormal,
              )}`
        }
        acciones={[
          {
            texto:
              'Volver a foros',
            icono:
              ArrowLeft,
            onClick: () =>
              navigate(
                `/estudiante/cursos/${idCurso}/foro`,
              ),
          },
          {
            texto:
              'Detalles',
            icono:
              Info,
            variante:
              'primaria',
            onClick: () =>
              setModalDetalle(
                true,
              ),
          },
        ]}
      />

      <section
        className={`dfe-state dfe-state--${nivelTemporal} ${
          cerrado
            ? 'is-closed'
            : ''
        }`}
      >
        <div className="dfe-state__main">
          <span className="dfe-state__icon">
            <Clock3
              size={19}
            />
          </span>

          <div className="dfe-state__date">
            <small>
              {esperandoApertura ||
              esperandoConfirmacionApertura
                ? 'Apertura del foro'
                : cerrado
                  ? 'Estado temporal'
                  : 'Foro abierto'}
            </small>

            <strong>
              {esperandoApertura ||
              esperandoConfirmacionApertura
                ? fecha(
                    foro.fechaApertura,
                  )
                : cerrado
                  ? 'Actividad finalizada'
                  : 'Participación habilitada'}
            </strong>
          </div>
        </div>

        <div className="dfe-state__timers">
          {(esperandoApertura ||
            esperandoConfirmacionApertura) && (
            <div className="dfe-timer-card">
              <small>
                Tiempo para abrir
              </small>

              <strong>
                {esperandoConfirmacionApertura
                  ? 'Abriendo foro…'
                  : tiempoParaAbrir?.texto ??
                    'Calculando…'}
              </strong>
            </div>
          )}

          {!esperandoApertura &&
            !esperandoConfirmacionApertura &&
            !cerrado &&
            !cierreNormalVencido && (
              <div className="dfe-timer-card">
                <small>
                  Cierre normal
                </small>

                <strong>
                  {tiempoParaCierreNormal?.texto ??
                    'Sin fecha definida'}
                </strong>

                <span>
                  {fecha(
                    cierreNormal,
                  )}
                </span>
              </div>
            )}

          {!esperandoApertura &&
            !esperandoConfirmacionApertura &&
            !cerrado &&
            cierreNormalVencido &&
            foro.permitirRetrasos &&
            cierreConRetraso &&
            !cierreConRetrasoVencido && (
              <div className="dfe-timer-card dfe-timer-card--late">
                <small>
                  Cierre con retraso
                </small>

                <strong>
                  {tiempoParaCierreConRetraso?.texto ??
                    'Sin fecha definida'}
                </strong>

                <span>
                  {fecha(
                    cierreConRetraso,
                  )}
                </span>

                {penalizacionRetraso && (
                  <em className="dfe-timer-card__penalty">
                    {
                      penalizacionRetraso
                    }
                  </em>
                )}
              </div>
            )}

          {cerrado && (
            <div className="dfe-timer-card">
              <small>
                Estado del foro
              </small>

              <strong>
                Plazo finalizado
              </strong>
            </div>
          )}
        </div>

        <span className="dfe-state__status">
          {textoEstadoTemporal}
        </span>
      </section>

      <section className="dfe-topic">
        <div className="dfe-topic__top">
          <span className={`dfe-badge ${foro.estado.toLowerCase()}`}>
            {etiqueta(
              foro.estado,
            )}
          </span>

          {foro.estaFijado && (
            <span className="dfe-chip">
              <Pin
                size={13}
              />
              Fijado
            </span>
          )}

          {foro.esCalificable && (
            <span className="dfe-chip dfe-chip--grade">
              <Award
                size={13}
              />
              Calificable
            </span>
          )}
        </div>

        <h2>
          Tema principal
        </h2>

        <p>
          {foro.contenido}
        </p>

        {foro.instrucciones && (
          <aside>
            <strong>
              Instrucciones
            </strong>

            <p>
              {
                foro.instrucciones
              }
            </p>
          </aside>
        )}

        {foro.archivos &&
          foro.archivos.length >
            0 && (
            <div className="dfe-files">
              {foro.archivos.map(
                (
                  archivo,
                ) => (
                  <a
                    key={
                      archivo.id
                    }
                    href={
                      urlArchivo(archivo) ??
                      '#'
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText
                      size={14}
                    />

                    {archivo.nombreOriginal ??
                      archivo.nombre ??
                      'Adjunto'}
                  </a>
                ),
              )}
            </div>
          )}
      </section>

      {(d.usaAfinidad ||
        (
          foro.esCalificable &&
          d.nota
        )) && (
        <div
          className={`dfe-overview-row ${
            d.usaAfinidad &&
            foro.esCalificable &&
            d.nota
              ? 'dfe-overview-row--two'
              : ''
          }`}
        >
          {d.usaAfinidad && (
            <section className="dfe-team dfe-overview-card">
              <div className="dfe-team__identity">
                <span>
                  <UsersRound
                    size={20}
                  />
                </span>

                <div>
                  <strong>
                    Grupo por afinidad
                  </strong>

                  <p>
                    {d.equipo
                      ? 'Tu equipo ya está registrado para este foro.'
                      : `Debes formar un equipo de ${d.disponibilidad?.minimoIntegrantes ?? foro.cantidadMinimaIntegrantes ?? 2} estudiante(s) antes de responder.`}
                  </p>
                </div>
              </div>

              {d.equipo ? (
                <div className="dfe-team__actions">
                  <div className="dfe-team__ready">
                    <CheckCircle2
                      size={15}
                    />

                    <span>
                      {
                        d.equipo.nombre
                      }
                      {' · '}
                      {
                        d.equipo.integrantes
                          .length
                      }
                      {' '}
                      integrantes
                    </span>
                  </div>

                  <button
                    type="button"
                    className="dfe-team__detail"
                    onClick={() =>
                      setModalDetalleEquipo(
                        true,
                      )
                    }
                  >
                    <Info
                      size={14}
                    />

                    Detalle
                  </button>
                </div>
              ) : (
                esperandoApertura ||
                esperandoConfirmacionApertura
              ) ? null : disponibleParaParticipar ? (
                <button
                  type="button"
                  onClick={() =>
                    setModalAfinidad(
                      true,
                    )
                  }
                >
                  <UsersRound
                    size={16}
                  />
                  Formar grupo
                </button>
              ) : (
                <span className="dfe-team__closed">
                  <CheckCircle2
                    size={15}
                  />
                  Actividad finalizada
                </span>
              )}
            </section>
          )}

          {foro.esCalificable &&
            d.nota && (
              <section className="dfe-grade dfe-overview-card">
                <div className="dfe-grade__main">
                  <span className="dfe-grade__icon">
                    <Award
                      size={22}
                    />
                  </span>

                  <span className="dfe-grade__text">
                    <small>
                      Calificación publicada
                    </small>

                    <strong>
                      {String(
                        d.nota.notaFinal ??
                          d.nota.notaBase ??
                          '—',
                      )}
                      {d.nota.puntajeMaximo
                        ? ` / ${d.nota.puntajeMaximo}`
                        : ''}
                    </strong>
                  </span>
                </div>

                {(Number(d.nota.descuentoRetraso ?? 0) > 0 ||
                  Number(d.nota.descuentoComentarios ?? 0) > 0) && (
                  <div className="dfe-grade__breakdown">
                    <span>
                      Retraso
                      <strong>-{Number(d.nota.descuentoRetraso ?? 0).toFixed(2)}</strong>
                    </span>
                    <span>
                      Comentarios
                      <strong>-{Number(d.nota.descuentoComentarios ?? 0).toFixed(2)}</strong>
                    </span>
                  </div>
                )}

                {d.nota.retroalimentacion && (
                  <p>
                    {
                      d.nota.retroalimentacion
                    }
                  </p>
                )}
              </section>
            )}
        </div>
      )}

      {(esperandoApertura ||
        esperandoConfirmacionApertura) && (
        <section className="dfe-scheduled">
          <Clock3
            size={20}
          />

          <div>
            <strong>
              Este foro todavía no está abierto
            </strong>

            <p>
              {esperandoConfirmacionApertura
                ? 'La hora de apertura ya llegó. Estamos habilitando la participación…'
                : (
                    <>
                      Podrás formar tu grupo y participar a partir del
                      {' '}
                      {fecha(
                        foro.fechaApertura,
                      )}
                      .
                    </>
                  )}
            </p>
          </div>
        </section>
      )}

      <section className="dfe-conversation-head">
        <div className="dfe-conversation-head__identity">
          <span className="dfe-conversation-head__icon">
            <MessageSquare
              size={21}
            />
          </span>

          <div>
            <small>
              Conversación del foro
            </small>

            <h3>
              Hilo de conversación
            </h3>

            <p>
              Lee las respuestas visibles y participa cuando el foro se encuentre abierto.
            </p>
          </div>
        </div>

        <div className="dfe-conversation-head__actions">
          <div className="dfe-conversation-head__stats">
            <span>
              <strong>
                {d.respuestas.length}
              </strong>
              respuestas
            </span>

            <span>
              <strong>
                {d.respuestas.reduce(
                  (
                    total,
                    respuesta,
                  ) =>
                    total +
                    (
                      respuesta.comentarios
                        ?.length ??
                      0
                    ),
                  0,
                )}
              </strong>
              comentarios
            </span>
          </div>

          {!miRespuesta &&
            disponibleParaParticipar &&
            (
              foro.modalidadParticipacion ===
                'INDIVIDUAL' ||
              miParticipacion
                ?.puedeCrearRespuestaPrincipal ||
              (
                d.usaAfinidad &&
                !d.equipo
              )
            ) && (
              <button
                type="button"
                className="dfe-primary dfe-primary--participar"
                onClick={() => {
                  if (
                    d.usaAfinidad &&
                    !d.equipo
                  ) {
                    setModalAfinidad(
                      true,
                    );
                  } else {
                    setModalRespuesta(
                      true,
                    );
                  }
                }}
              >
                {d.usaAfinidad &&
                !d.equipo ? (
                  <UsersRound
                    size={16}
                  />
                ) : (
                  <Send
                    size={16}
                  />
                )}

                {d.usaAfinidad &&
                !d.equipo
                  ? 'Formar grupo'
                  : 'Publicar respuesta'}
              </button>
            )}

          {!miRespuesta &&
            disponibleParaParticipar &&
            foro.modalidadParticipacion ===
              'GRUPAL' &&
            miParticipacion?.grupo &&
            !miParticipacion
              .puedeCrearRespuestaPrincipal && (
              <button
                type="button"
                className="dfe-conversation-role dfe-conversation-role--button"
                onClick={() =>
                  setModalMiParticipacion(
                    true,
                  )
                }
                title="Ver tu grupo, representante y reglas de participación"
              >
                <UsersRound
                  size={15}
                />

                {miParticipacion
                  .comentarios
                  .puedeComentar
                  ? 'Ver mi participación'
                  : 'Tu representante publicará'}

                <Info
                  size={13}
                />
              </button>
            )}

          {!miRespuesta &&
            cerrado && (
              <span className="dfe-conversation-closed">
                <CheckCircle2
                  size={15}
                />

                {foro.estado ===
                  'CALIFICANDO'
                  ? 'En calificación'
                  : foro.estado ===
                      'CALIFICADO' ||
                    foro.estado ===
                      'NOTAS_PUBLICADAS'
                    ? 'Actividad calificada'
                    : 'Foro finalizado'}
              </span>
            )}
        </div>
      </section>

      {d.error &&
        !foro && (
        <div className="dfe-alert">
          <AlertCircle
            size={17}
          />

          <span>
            {d.error}
          </span>

          <button
            type="button"
            onClick={
              d.limpiarError
            }
          >
            ×
          </button>
        </div>
      )}

      {d.respuestas.length ===
      0 ? (
        <AulaEmptyState
          icono={
            MessageSquare
          }
          titulo="Aún no hay respuestas visibles"
          descripcion="Cuando las reglas del foro permitan mostrar las participaciones, aparecerán aquí."
          compacto
        />
      ) : (
        <div className="dfe-thread">
          {d.respuestas.map(
            (
              respuesta,
              indice,
            ) => {
              const cantidadComentarios =
                respuesta.comentarios
                  ?.length ??
                0;

              const resumenContenido =
                respuesta.contenido
                  .trim();

              return (
                <article
                  className="dfe-answer-card"
                  key={
                    respuesta.id
                  }
                >
                  <header className="dfe-answer-card__header">
                    <div className="dfe-answer-card__identity">
                      <AvatarUsuario
                        fotoPerfilUrl={
                          respuesta.autor.fotoPerfilUrl
                        }
                        nombres={
                          respuesta.autor.nombres
                        }
                        apellidoPaterno={
                          respuesta.autor.apellidoPaterno
                        }
                        size={46}
                      />

                      <div className="dfe-answer-card__meta">
                        <strong>
                          {nombreAutor(
                            respuesta,
                          )}
                        </strong>

                        <span>
                          Respuesta
                          {' '}
                          #
                          {indice +
                            1}
                          {' · '}
                          {fecha(
                            respuesta.publicadoEn,
                          )}
                        </span>
                      </div>
                    </div>

                    {(respuesta.grupoCurso ||
                      respuesta.equipoAfinidad) && (
                      <span className="dfe-answer-card__group">
                        <UsersRound
                          size={13}
                        />

                        {respuesta.grupoCurso
                          ?.nombre ??
                          respuesta.equipoAfinidad
                            ?.nombre}
                      </span>
                    )}
                  </header>

                  <div className="dfe-answer-card__body">
                    <h4>
                      {
                        respuesta.titulo
                      }
                    </h4>

                    <p>
                      {
                        resumenContenido
                      }
                    </p>
                  </div>

                  <footer className="dfe-answer-card__footer">
                    <div className="dfe-answer-card__stats">
                      <span>
                        <MessageCircle
                          size={15}
                        />

                        {
                          cantidadComentarios
                        }
                        {' '}
                        {cantidadComentarios ===
                        1
                          ? 'comentario'
                          : 'comentarios'}
                      </span>

                      {respuesta.archivos &&
                        respuesta.archivos.length >
                          0 && (
                        <span>
                          <Paperclip
                            size={15}
                          />

                          {
                            respuesta.archivos
                              .length
                          }
                          {' '}
                          adjunto(s)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="dfe-answer-card__detail"
                      onClick={() =>
                        setRespuestaSeleccionadaId(
                          respuesta.id,
                        )
                      }
                    >
                      <Info
                        size={15}
                      />

                      Ver detalle
                    </button>
                  </footer>
                </article>
              );
            },
          )}
        </div>
      )}

      <AulaModal
        abierto={
          Boolean(
            archivoPreview,
          )
        }
        ancho="amplio"
        titulo={
          archivoPreview?.nombre ??
          'Vista previa'
        }
        etiqueta="Archivo adjunto"
        descripcion={
          archivoPreview?.tipo ===
            'PDF'
            ? 'Vista previa del documento PDF.'
            : 'Vista previa de la imagen adjunta.'
        }
        icono={
          FileText
        }
        onCerrar={() =>
          setArchivoPreview(
            null,
          )
        }
      >
        {archivoPreview && (
          <div className="dfe-file-preview">
            {archivoPreview.tipo ===
              'IMAGEN' ? (
              <div className="dfe-file-preview__image">
                <img
                  src={
                    archivoPreview.url
                  }
                  alt={
                    archivoPreview.nombre
                  }
                />
              </div>
            ) : (
              <div className="dfe-file-preview__pdf">
                <iframe
                  src={
                    archivoPreview.url
                  }
                  title={
                    archivoPreview.nombre
                  }
                />
              </div>
            )}

            <div className="dfe-file-preview__actions">
              <a
                href={
                  archivoPreview.url
                }
                target="_blank"
                rel="noreferrer"
              >
                <FileText
                  size={15}
                />

                Abrir original
              </a>

              {foro.permitirDescargaAdjuntos && (
                <a
                  href={
                    archivoPreview.url
                  }
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="primary"
                >
                  <Upload
                    size={15}
                    style={{
                      transform:
                        'rotate(180deg)',
                    }}
                  />

                  Descargar
                </a>
              )}
            </div>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={
          Boolean(
            respuestaSeleccionada,
          )
        }
        ancho="amplio"
        titulo={
          respuestaSeleccionada?.titulo ??
          'Detalle de la respuesta'
        }
        etiqueta="Participación del foro"
        descripcion="Revisa la respuesta completa, el grupo, la fecha de publicación, archivos y comentarios."
        icono={
          MessageSquare
        }
        onCerrar={() =>
          setRespuestaSeleccionadaId(
            null,
          )
        }
      >
        {respuestaSeleccionada && (
          <div className="dfe-response-detail">
            <section className="dfe-response-detail__author">
              <div className="dfe-response-detail__identity">
                <AvatarUsuario
                  fotoPerfilUrl={
                    respuestaSeleccionada.autor.fotoPerfilUrl
                  }
                  nombres={
                    respuestaSeleccionada.autor.nombres
                  }
                  apellidoPaterno={
                    respuestaSeleccionada.autor.apellidoPaterno
                  }
                  size={54}
                />

                <div>
                  <strong>
                    {nombreAutor(
                      respuestaSeleccionada,
                    )}
                  </strong>

                  <span>
                    Publicado el
                    {' '}
                    {fecha(
                      respuestaSeleccionada.publicadoEn,
                    )}
                  </span>
                </div>
              </div>

              {(respuestaSeleccionada.grupoCurso ||
                respuestaSeleccionada.equipoAfinidad) && (
                <span className="dfe-response-detail__group">
                  <UsersRound
                    size={14}
                  />

                  {respuestaSeleccionada.grupoCurso
                    ?.nombre ??
                    respuestaSeleccionada.equipoAfinidad
                      ?.nombre}
                </span>
              )}
            </section>

            <section className="dfe-response-detail__content">
              <span className="dfe-response-detail__eyebrow">
                Respuesta completa
              </span>

              <h4>
                {
                  respuestaSeleccionada.titulo
                }
              </h4>

              <p>
                {
                  respuestaSeleccionada.contenido
                }
              </p>
            </section>

            {respuestaSeleccionada.archivos &&
              respuestaSeleccionada.archivos.length >
                0 && (
              <section className="dfe-response-detail__section">
                <div className="dfe-response-detail__section-head">
                  <FileText
                    size={17}
                  />

                  <strong>
                    Archivos adjuntos
                  </strong>

                  <span>
                    {
                      respuestaSeleccionada.archivos
                        .length
                    }
                  </span>
                </div>

                <div className="dfe-attachment-grid">
                  {respuestaSeleccionada.archivos.map(
                    (
                      archivo,
                    ) => {
                      const nombre =
                        nombreArchivo(
                          archivo,
                        );

                      const url =
                        urlArchivo(
                          archivo,
                        );

                      const tipo =
                        clasificarArchivo(
                          nombre,
                        );

                      const extension =
                        obtenerExtensionArchivo(
                          nombre,
                        ).toUpperCase();

                      return (
                        <article
                          className={`dfe-attachment-card dfe-attachment-card--${tipo.toLowerCase()}`}
                          key={
                            archivo.id
                          }
                        >
                          {tipo ===
                            'IMAGEN' &&
                          url ? (
                            <button
                              type="button"
                              className="dfe-attachment-card__preview dfe-attachment-card__preview--image"
                              onClick={() =>
                                setArchivoPreview({
                                  nombre,
                                  url,
                                  tipo:
                                    'IMAGEN',
                                })
                              }
                            >
                              <img
                                src={
                                  url
                                }
                                alt={
                                  nombre
                                }
                                loading="lazy"
                              />
                            </button>
                          ) : (
                            <div className="dfe-attachment-card__preview dfe-attachment-card__preview--document">
                              <span>
                                {extension ||
                                  (
                                    tipo ===
                                      'PDF'
                                      ? 'PDF'
                                      : 'DOC'
                                  )}
                              </span>

                              <FileText
                                size={26}
                              />
                            </div>
                          )}

                          <div className="dfe-attachment-card__body">
                            <div className="dfe-attachment-card__title">
                              <strong
                                title={
                                  nombre
                                }
                              >
                                {
                                  nombre
                                }
                              </strong>

                              <span>
                                {tipo ===
                                'IMAGEN'
                                  ? 'Imagen'
                                  : tipo ===
                                      'PDF'
                                    ? 'Documento PDF'
                                    : tipo ===
                                        'WORD'
                                      ? 'Documento Word'
                                      : tipo ===
                                          'EXCEL'
                                        ? 'Hoja de cálculo'
                                        : 'Archivo adjunto'}
                              </span>
                            </div>

                            <div className="dfe-attachment-card__actions">
                              {url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      tipo ===
                                        'IMAGEN'
                                    ) {
                                      setArchivoPreview({
                                        nombre,
                                        url,
                                        tipo:
                                          'IMAGEN',
                                      });

                                      return;
                                    }

                                    if (
                                      tipo ===
                                        'PDF'
                                    ) {
                                      setArchivoPreview({
                                        nombre,
                                        url,
                                        tipo:
                                          'PDF',
                                      });

                                      return;
                                    }

                                    window.open(
                                      url,
                                      '_blank',
                                      'noopener,noreferrer',
                                    );
                                  }}
                                >
                                  <Info
                                    size={14}
                                  />

                                  {tipo ===
                                  'IMAGEN'
                                    ? 'Ver imagen'
                                    : tipo ===
                                        'PDF'
                                      ? 'Ver PDF'
                                      : 'Abrir'}
                                </button>
                              )}

                              {url &&
                                foro.permitirDescargaAdjuntos && (
                                <a
                                  href={
                                    url
                                  }
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Upload
                                    size={14}
                                    style={{
                                      transform:
                                        'rotate(180deg)',
                                    }}
                                  />

                                  Descargar
                                </a>
                              )}

                              {!foro.permitirDescargaAdjuntos && (
                                <span className="dfe-attachment-card__readonly">
                                  Solo lectura
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            <section className="dfe-response-detail__section">
              <div className="dfe-response-detail__section-head">
                <MessageCircle
                  size={17}
                />

                <strong>
                  Comentarios
                </strong>

                <span>
                  {
                    respuestaSeleccionada.comentarios
                      ?.length ??
                    0
                  }
                </span>
              </div>

              {respuestaSeleccionada.comentarios &&
              respuestaSeleccionada.comentarios.length >
                0 ? (
                <div className="dfe-comments dfe-comments--detail">
                  {respuestaSeleccionada.comentarios.map(
                    (
                      item,
                    ) => (
                      <ComentarioItem
                        key={
                          item.id
                        }
                        comentario={
                          item
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="dfe-response-detail__empty-comments">
                  Todavía no hay comentarios en esta respuesta.
                </div>
              )}

              {puedeComentarSeleccionada && (
                <button
                  type="button"
                  className="dfe-response-detail__comment-button"
                  onClick={() => {
                    setRespuestaComentando(
                      respuestaSeleccionada.id,
                    );
                    setComentario(
                      '',
                    );
                  }}
                >
                  <MessageCircle
                    size={15}
                  />

                  Agregar comentario
                </button>
              )}
            </section>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={
          modalMiParticipacion &&
          Boolean(
            miParticipacion,
          )
        }
        ancho="mediano"
        titulo={
          miParticipacion?.grupo?.nombre ??
          'Mi participación'
        }
        etiqueta="Tu participación"
        descripcion="Consulta tu rol, el componente académico, la dinámica y los integrantes de tu grupo."
        icono={
          UsersRound
        }
        onCerrar={() =>
          setModalMiParticipacion(
            false,
          )
        }
      >
        {miParticipacion && (
          <div className="dfe-my-group">
            <section className="dfe-my-group__summary">
              <div className="dfe-my-group__summary-head">
                <span className="dfe-my-group__summary-icon">
                  <UsersRound
                    size={22}
                  />
                </span>

                <div>
                  <small>
                    Tu grupo en este foro
                  </small>

                  <strong>
                    {miParticipacion.grupo?.nombre ??
                      'Grupo no identificado'}
                  </strong>

                  <span>
                    Revisa cómo debes participar antes de intervenir.
                  </span>
                </div>
              </div>

              <div className="dfe-my-group__context-grid">
                <article className="dfe-my-group__context-card is-role">
                  <small>
                    Tu rol
                  </small>

                  <strong>
                    {miParticipacion.esRepresentante
                      ? 'Representante'
                      : 'Integrante'}
                  </strong>
                </article>

                <article className="dfe-my-group__context-card is-component">
                  <small>
                    Componente
                  </small>

                  <strong>
                    {componenteParticipacion
                      ? componenteParticipacion ===
                          'PROCESUAL'
                        ? 'Procesual'
                        : componenteParticipacion ===
                            'CONTINUA'
                          ? 'Continua'
                          : etiqueta(
                              componenteParticipacion,
                            )
                      : 'No definido'}
                  </strong>
                </article>

                <article className="dfe-my-group__context-card is-dynamic">
                  <small>
                    Dinámica
                  </small>

                  <strong>
                    {etiqueta(
                      miParticipacion.dinamicaGrupal,
                    )}
                  </strong>
                </article>
              </div>

              <div className="dfe-my-group__instruction">
                <Info
                  size={16}
                />

                <p>
                  {textoRolParticipacion}
                </p>
              </div>

              {foro.penalizarIncumplimientoComentarios &&
                !miParticipacion.esRepresentante && (
                <div className="dfe-my-group__penalty">
                  <MessageCircle size={16} />
                  <div>
                    <strong>Participación calificable</strong>
                    <p>
                      Debes completar al menos {foro.minimoComentariosPorEstudiante ?? 0} comentario(s). {
                        miParticipacion.dinamicaGrupal === 'PARTICIPACION_DISTRIBUIDA'
                          ? 'Solo cuentan los aportes en la respuesta de tu propio grupo.'
                          : 'Solo cuentan los comentarios realizados en respuestas de otros grupos.'
                      }
                    </p>
                    {penalizacionComentarios && <small>{penalizacionComentarios}</small>}
                  </div>
                </div>
              )}

              {foro.penalizarIncumplimientoComentarios &&
                miParticipacion.esRepresentante && (
                <div className="dfe-my-group__penalty is-exempt">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Representante exento</strong>
                    <p>Tu obligación calificable es publicar la respuesta principal del equipo; no se te aplica la penalización por comentarios.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="dfe-my-group__members">
              <div className="dfe-my-group__members-head">
                <div>
                  <small>
                    Integrantes
                  </small>

                  <strong>
                    Miembros del grupo
                  </strong>
                </div>

                <span>
                  {
                    miParticipacion.integrantes
                      ?.length ??
                    0
                  }
                </span>
              </div>

              <div className="dfe-my-group__table">
                <div className="dfe-my-group__table-head">
                  <span>
                    Estudiante
                  </span>

                  <span>
                    Función
                  </span>
                </div>

                {(miParticipacion.integrantes ?? []).map(
                  (
                    integrante,
                  ) => (
                    <div
                      className="dfe-my-group__table-row"
                      key={
                        integrante.estudianteId
                      }
                    >
                      <div className="dfe-my-group__student">
                        <AvatarUsuario
                          fotoPerfilUrl={
                            integrante.estudiante
                              .fotoPerfilUrl
                          }
                          nombres={
                            integrante.estudiante
                              .nombres
                          }
                          apellidoPaterno={
                            integrante.estudiante
                              .apellidoPaterno
                          }
                          size={38}
                        />

                        <div>
                          <strong>
                            {
                              integrante.estudiante
                                .nombres
                            }
                            {' '}
                            {
                              integrante.estudiante
                                .apellidoPaterno
                            }
                          </strong>

                          {integrante.estudianteId ===
                            miParticipacion.estudianteId && (
                            <small>
                              Tú
                            </small>
                          )}
                        </div>
                      </div>

                      <span
                        className={`dfe-my-group__member-role ${
                          integrante.esRepresentante
                            ? 'is-representative'
                            : ''
                        }`}
                      >
                        {integrante.esRepresentante
                          ? 'Representante'
                          : 'Integrante'}
                      </span>
                    </div>
                  ),
                )}

                {(
                  miParticipacion.integrantes
                    ?.length ??
                  0
                ) === 0 && (
                  <div className="dfe-my-group__empty">
                    Los integrantes todavía no están disponibles.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={
          modalDetalleEquipo &&
          Boolean(
            d.equipo,
          )
        }
        ancho="mediano"
        titulo={
          d.equipo?.nombre ??
          'Detalle del grupo'
        }
        etiqueta="Grupo por afinidad"
        descripcion="Consulta los integrantes registrados para este foro."
        icono={
          UsersRound
        }
        onCerrar={() =>
          setModalDetalleEquipo(
            false,
          )
        }
      >
        {d.equipo && (
          <div className="dfe-team-detail">
            <section className="dfe-team-detail__summary">
              <span className="dfe-team-detail__summary-icon">
                <UsersRound
                  size={21}
                />
              </span>

              <div>
                <small>
                  Equipo registrado
                </small>

                <strong>
                  {
                    d.equipo.nombre
                  }
                </strong>

                <p>
                  {
                    d.equipo.integrantes
                      .length
                  }
                  {' '}
                  integrante
                  {
                    d.equipo.integrantes
                      .length ===
                    1
                      ? ''
                      : 's'
                  }
                  {' · '}
                  {etiqueta(
                    d.equipo.estado,
                  )}
                </p>
              </div>
            </section>

            <section className="dfe-team-detail__members">
              <div className="dfe-team-detail__heading">
                <div>
                  <small>
                    Integrantes
                  </small>

                  <strong>
                    Miembros del grupo
                  </strong>
                </div>

                <span>
                  {
                    d.equipo.integrantes
                      .length
                  }
                </span>
              </div>

              <div className="dfe-team-detail__list">
                {d.equipo.integrantes.map(
                  (
                    integrante,
                  ) => {
                    const estudiante =
                      integrante.estudiante;

                    const nombreCompletoIntegrante =
                      [
                        estudiante.nombres,
                        estudiante.apellidoPaterno,
                        estudiante.apellidoMaterno,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ' ',
                        );

                    return (
                      <article
                        className="dfe-team-detail__member"
                        key={
                          integrante.id
                        }
                      >
                        <AvatarUsuario
                          fotoPerfilUrl={
                            estudiante.fotoPerfilUrl
                          }
                          nombres={
                            estudiante.nombres
                          }
                          apellidoPaterno={
                            estudiante.apellidoPaterno
                          }
                          size={46}
                        />

                        <div className="dfe-team-detail__member-info">
                          <strong>
                            {
                              nombreCompletoIntegrante
                            }
                          </strong>

                          {estudiante.correo && (
                            <span>
                              {
                                estudiante.correo
                              }
                            </span>
                          )}
                        </div>

                        {integrante.esRepresentante && (
                          <span className="dfe-team-detail__representative">
                            Representante
                          </span>
                        )}
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={
          modalDetalle
        }
        ancho="amplio"
        titulo="Detalles del foro"
        etiqueta="Información importante"
        descripcion="Revisa las fechas, modalidad y reglas principales antes de participar."
        icono={
          ListChecks
        }
        onCerrar={() =>
          setModalDetalle(
            false,
          )
        }
      >
        <div className="dfe-details">
          <section className="dfe-detail-card">
            <span className="dfe-detail-card__icon">
              <CalendarDays
                size={18}
              />
            </span>

            <div>
              <small>
                Inicio
              </small>

              <strong>
                {fecha(
                  foro.fechaApertura,
                )}
              </strong>
            </div>
          </section>

          <section className="dfe-detail-card">
            <span className="dfe-detail-card__icon">
              <Clock3
                size={18}
              />
            </span>

            <div>
              <small>
                Cierre normal
              </small>

              <strong>
                {fecha(
                  cierreNormal,
                )}
              </strong>
            </div>
          </section>

          {foro.permitirRetrasos &&
            cierreConRetraso && (
            <section className="dfe-detail-card">
              <span className="dfe-detail-card__icon">
                <CheckCircle2
                  size={18}
                />
              </span>

              <div>
                <small>
                  Cierre con retraso
                </small>

                <strong>
                  {fecha(
                    cierreConRetraso,
                  )}
                </strong>

                {penalizacionRetraso && (
                  <span className="dfe-detail-card__penalty">
                    {
                      penalizacionRetraso
                    }
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="dfe-detail-card">
            <span className="dfe-detail-card__icon">
              {foro.modalidadParticipacion ===
              'GRUPAL' ? (
                <UsersRound
                  size={18}
                />
              ) : (
                <UserRound
                  size={18}
                />
              )}
            </span>

            <div>
              <small>
                Modalidad
              </small>

              <strong>
                {foro.modalidadParticipacion ===
                'GRUPAL'
                  ? 'Participación grupal'
                  : 'Participación individual'}
              </strong>
            </div>
          </section>

          <section className="dfe-detail-card dfe-detail-card--wide">
            <span className="dfe-detail-card__icon">
              <Info
                size={18}
              />
            </span>

            <div>
              <small>
                Entregas fuera de plazo
              </small>

              <strong>
                {foro.permitirRetrasos
                  ? `Permitidas hasta ${fecha(
                      cierreConRetraso,
                    )}`
                  : 'No permitidas'}
              </strong>
            </div>
          </section>

          {foro.modalidadParticipacion ===
            'GRUPAL' && (
            <section className="dfe-detail-card dfe-detail-card--wide">
              <span className="dfe-detail-card__icon">
                <UsersRound
                  size={18}
                />
              </span>

              <div>
                <small>
                  Organización del grupo
                </small>

                <strong>
                  {foro.origenGrupo ===
                  'AFINIDAD'
                    ? `Por afinidad · ${foro.cantidadMinimaIntegrantes ?? 2} a ${
                        foro.cantidadMaximaIntegrantes ??
                        'sin límite'
                      } integrantes`
                    : etiqueta(
                        foro.origenGrupo,
                      )}
                </strong>
              </div>

              {foro.origenGrupo ===
                'AFINIDAD' &&
                !d.equipo &&
                disponibleParaParticipar && (
                <button
                  type="button"
                  className="dfe-detail-affinity"
                  onClick={() => {
                    setModalDetalle(
                      false,
                    );
                    setModalAfinidad(
                      true,
                    );
                  }}
                >
                  <UsersRound
                    size={15}
                  />
                  Formar grupo por afinidad
                </button>
              )}
            </section>
          )}

          <section className="dfe-detail-card">
            <span className="dfe-detail-card__icon">
              <MessageCircle
                size={18}
              />
            </span>

            <div>
              <small>
                Comentarios
              </small>

              <strong>
                {foro.permitirComentarios
                  ? 'Permitidos'
                  : 'No permitidos'}
              </strong>
            </div>
          </section>

          <section className="dfe-detail-card">
            <span className="dfe-detail-card__icon">
              <Paperclip
                size={18}
              />
            </span>

            <div>
              <small>
                Adjuntos
              </small>

              <strong>
                {foro.permitirAdjuntosRespuesta
                  ? 'Permitidos en respuestas'
                  : 'No permitidos'}
              </strong>
            </div>
          </section>
        </div>
      </AulaModal>

      <AulaModal
        abierto={
          modalRespuesta
        }
        ancho="amplio"
        titulo="Publicar respuesta"
        etiqueta="Participación del foro"
        descripcion="Redacta tu aporte respetando las reglas configuradas por el docente."
        icono={
          Send
        }
        bloqueado={
          d.procesando
        }
        onCerrar={() =>
          setModalRespuesta(
            false,
          )
        }
        footer={
          <>
            <button
              type="button"
              className="dfe-secondary"
              disabled={
                d.procesando
              }
              onClick={() =>
                setModalRespuesta(
                  false,
                )
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="dfe-primary"
              disabled={
                d.procesando ||
                !respuestaValida
              }
              onClick={() =>
                void publicar()
              }
            >
              <Send
                size={16}
              />

              {d.procesando
                ? 'Publicando…'
                : 'Publicar respuesta'}
            </button>
          </>
        }
      >
        <div className="dfe-editor dfe-editor--response">
          {foro.modalidadParticipacion ===
            'GRUPAL' &&
            miParticipacion?.grupo && (
              <div className="dfe-editor__team">
                <UsersRound
                  size={17}
                />

                <span>
                  Responderás como
                  {' '}
                  <strong>
                    {
                      miParticipacion.grupo
                        .nombre
                    }
                  </strong>
                  {' · '}
                  representante
                </span>
              </div>
            )}

          <label>
            <span>
              Título de la respuesta
            </span>

            <input
              value={
                tituloRespuesta
              }
              maxLength={180}
              placeholder="Escribe un título claro..."
              onChange={(
                evento,
              ) =>
                setTituloRespuesta(
                  evento.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Desarrollo
            </span>

            <textarea
              rows={7}
              value={
                contenidoRespuesta
              }
              maxLength={30000}
              placeholder="Escribe tu análisis, argumento o aporte..."
              onChange={(
                evento,
              ) =>
                setContenidoRespuesta(
                  evento.target.value,
                )
              }
            />

            <small>
              {palabrasRespuesta}
              {' '}
              palabras
              {foro.palabrasMinimasRespuesta
                ? ` · mínimo ${foro.palabrasMinimasRespuesta}`
                : ''}
              {foro.palabrasMaximasRespuesta
                ? ` · máximo ${foro.palabrasMaximasRespuesta}`
                : ''}
            </small>
          </label>

          {aceptarAdjuntos && (
            <div className="dfe-upload-box">
              <div className="dfe-upload-box__head">
                <span className="dfe-upload-box__icon">
                  <Paperclip
                    size={18}
                  />
                </span>

                <div>
                  <strong>
                    Adjuntar documentos
                  </strong>

                  <p>
                    Puedes agregar archivos solo porque el docente lo habilitó para este foro.
                  </p>
                </div>
              </div>

              <label className="dfe-upload-button">
                <Upload
                  size={16}
                />

                Seleccionar archivos

                <input
                  type="file"
                  multiple={
                    maximoArchivos >
                    1
                  }
                  accept={
                    extensionesAceptadas
                  }
                  onChange={(
                    evento,
                  ) => {
                    agregarArchivos(
                      evento.target.files,
                    );

                    evento.currentTarget.value =
                      '';
                  }}
                />
              </label>

              <div className="dfe-upload-rules">
                <span>
                  Formatos:
                  {' '}
                  {foro.extensionesPermitidas?.join(
                    ', ',
                  ) ||
                    'permitidos por el curso'}
                </span>

                <span>
                  Máx.
                  {' '}
                  {maximoArchivos}
                  {' '}
                  archivo(s)
                </span>

                <span>
                  Hasta
                  {' '}
                  {foro.tamanioMaximoArchivoMb ??
                    10}
                  {' '}
                  MB c/u
                </span>
              </div>

              {archivosRespuesta.length >
                0 && (
                <div className="dfe-upload-list">
                  {archivosRespuesta.map(
                    (
                      archivo,
                      indice,
                    ) => (
                      <div
                        key={`${archivo.name}-${indice}`}
                      >
                        <FileText
                          size={15}
                        />

                        <span>
                          <strong>
                            {
                              archivo.name
                            }
                          </strong>

                          <small>
                            {(
                              archivo.size /
                              1024 /
                              1024
                            ).toFixed(
                              2,
                            )}
                            {' '}
                            MB
                          </small>
                        </span>

                        <button
                          type="button"
                          aria-label={`Quitar ${archivo.name}`}
                          onClick={() =>
                            setArchivosRespuesta(
                              (
                                actuales,
                              ) =>
                                actuales.filter(
                                  (
                                    _,
                                    posicion,
                                  ) =>
                                    posicion !==
                                    indice,
                                ),
                            )
                          }
                        >
                          <X
                            size={14}
                          />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}

              <small className="dfe-upload-note">
                Los archivos se cargarán y quedarán vinculados a la respuesta cuando pulses Publicar respuesta.
              </small>
            </div>
          )}
        </div>
      </AulaModal>

      <AulaModal
        abierto={
          Boolean(
            respuestaComentando,
          )
        }
        ancho="mediano"
        titulo="Agregar comentario"
        etiqueta="Conversación"
        descripcion={
          miParticipacion?.comentarios
            .soloGrupoPropio
            ? 'Complementa la respuesta principal de tu propio grupo.'
            : 'Aporta a la conversación respetando las reglas del foro.'
        }
        icono={
          MessageCircle
        }
        bloqueado={
          d.procesando
        }
        onCerrar={() =>
          setRespuestaComentando(
            null,
          )
        }
        footer={
          <>
            <button
              type="button"
              className="dfe-secondary"
              disabled={
                d.procesando
              }
              onClick={() =>
                setRespuestaComentando(
                  null,
                )
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="dfe-primary"
              disabled={
                d.procesando ||
                !comentarioValido
              }
              onClick={() =>
                void enviarComentario()
              }
            >
              <MessageCircle
                size={15}
              />

              Publicar comentario
            </button>
          </>
        }
      >
        <div className="dfe-editor dfe-editor--comment">
          <label>
            <span>
              Comentario
            </span>

            <textarea
              rows={6}
              maxLength={12000}
              value={
                comentario
              }
              placeholder="Escribe tu comentario..."
              onChange={(
                evento,
              ) =>
                setComentario(
                  evento.target.value,
                )
              }
            />

            <small>
              {palabrasComentario}
              {' '}
              palabras
              {foro.palabrasMinimasComentario
                ? ` · mínimo ${foro.palabrasMinimasComentario}`
                : ''}
              {foro.palabrasMaximasComentario
                ? ` · máximo ${foro.palabrasMaximasComentario}`
                : ''}
            </small>
          </label>

          {foro.permitirAdjuntosComentario && (
            <div className="dfe-upload-pending">
              <Paperclip
                size={18}
              />

              <div>
                <strong>
                  Este foro permite archivos en comentarios
                </strong>

                <small>
                  Falta enlazar esta vista al endpoint real del módulo de archivos para realizar la carga.
                </small>
              </div>
            </div>
          )}
        </div>
      </AulaModal>

      <FormarEquipoAfinidadModal
        abierto={
          modalAfinidad
        }
        estudiantes={
          d.disponibilidad?.estudiantes ??
          []
        }
        minimoIntegrantes={
          d.disponibilidad?.minimoIntegrantes ??
          foro.cantidadMinimaIntegrantes ??
          2
        }
        maximoIntegrantes={
          d.disponibilidad?.maximoIntegrantes ??
          foro.cantidadMaximaIntegrantes ??
          100
        }
        procesando={
          d.procesando
        }
        onCerrar={() =>
          setModalAfinidad(
            false,
          )
        }
        onConfirmar={
          formarEquipo
        }
      />

      <Toast
        visible={
          toast.visible
        }
        tipo={
          toast.tipo
        }
        titulo={
          toast.titulo
        }
        mensaje={
          toast.mensaje
        }
        onCerrar={() =>
          setToast(
            (
              actual,
            ) => ({
              ...actual,
              visible:
                false,
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
  .dfe-page {
    display: grid;
    gap: 14px;
    min-width: 0;
    padding-bottom: 34px;
    color: var(--app-text);
  }

  .dfe-state {
    display: grid;
    grid-template-columns:
      minmax(
        220px,
        .8fr
      )
      minmax(
        0,
        1.5fr
      )
      auto;
    align-items: stretch;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-state__main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dfe-state__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-state__date {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dfe-state small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 650;
  }

  .dfe-state strong {
    font-size: var(--app-font-body);
    font-weight: 850;
    line-height: 1.2;
    font-variant-numeric:
      tabular-nums;
  }

  .dfe-state__timers {
    min-width: 0;
    display: grid;
    grid-template-columns:
      repeat(
        auto-fit,
        minmax(
          180px,
          1fr
        )
      );
    gap: 8px;
  }

  .dfe-timer-card {
    min-width: 0;
    display: grid;
    align-content: center;
    gap: 4px;
    padding: 10px 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 11px;
    background: var(--app-surface-alt);
  }

  .dfe-timer-card strong {
    color: var(--app-accent-dark);
    font-size: var(--app-font-body);
    font-weight: 900;
    letter-spacing: -.01em;
    white-space: nowrap;
  }

  .dfe-timer-card > span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 650;
  }

  .dfe-timer-card--late {
    border-color:
      color-mix(
        in srgb,
        var(--app-warning) 28%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--app-warning-bg) 65%,
        var(--app-surface)
      );
  }

  .dfe-timer-card--late strong {
    color: var(--app-warning);
  }


  .dfe-timer-card__penalty {
    width: fit-content;
    margin-top: 4px;
    padding: 4px 7px;
    border-radius: 999px;
    color: var(--app-warning);
    background:
      color-mix(
        in srgb,
        var(--app-warning-bg) 82%,
        var(--app-surface)
      );
    font-size: var(--app-font-sm);
    font-style: normal;
    font-weight: 850;
    line-height: 1.2;
    white-space: normal;
  }

  .dfe-state--urgente
  .dfe-timer-card:not(.dfe-timer-card--late)
  strong {
    color: var(--app-warning);
  }

  .dfe-state--critico
  .dfe-timer-card:not(.dfe-timer-card--late)
  strong {
    color: var(--app-danger);
  }

  .dfe-state__status {
    align-self: center;
    justify-self: end;
    padding: 8px 12px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: var(--app-font-sm);
    font-weight: 850;
    white-space: nowrap;
  }

  .dfe-state.is-closed
  .dfe-state__status {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .dfe-state.is-closed
  .dfe-timer-card strong {
    color: var(--app-text-muted);
  }

  .dfe-topic {
    padding: 21px 23px;
    border: 1px solid var(--app-border);
    border-top: 3px solid var(--app-accent);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-topic__top {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dfe-badge,
  .dfe-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-xs);
    font-weight: 850;
  }

  .dfe-badge.cerrado,
  .dfe-badge.anulado {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .dfe-badge.vencido {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .dfe-chip--grade {
    color: #6d28d9;
    background: #ede9fe;
  }

  .dfe-topic h2 {
    margin: 16px 0 8px;
    font-size: var(--app-font-title);
  }

  .dfe-topic > p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-body);
    line-height: 1.72;
    white-space: pre-wrap;
  }

  .dfe-topic aside {
    margin-top: 16px;
    padding: 13px 15px;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 12px;
    background: var(--app-accent-softer);
  }

  .dfe-topic aside strong {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
  }

  .dfe-topic aside p {
    margin: 5px 0 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-md);
    line-height: 1.55;
    white-space: pre-wrap;
  }

  .dfe-files {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }

  .dfe-files a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 9px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    text-decoration: none;
    font-size: var(--app-font-sm);
  }

  .dfe-overview-row {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      );
    gap: 12px;
  }

  .dfe-overview-row--two {
    grid-template-columns:
      minmax(
        0,
        1.15fr
      )
      minmax(
        280px,
        .85fr
      );
  }

  .dfe-overview-card {
    min-width: 0;
  }

  .dfe-team,
  .dfe-grade {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-team__identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dfe-team__identity > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-team strong {
    font-size: var(--app-font-sm);
  }

  .dfe-team p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dfe-team button,
  .dfe-primary,
  .dfe-secondary {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 10px;
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-team button,
  .dfe-primary {
    border: 1px solid var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .dfe-secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .dfe-team button:disabled,
  .dfe-primary:disabled,
  .dfe-secondary:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .dfe-team__closed,
  .dfe-conversation-closed {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dfe-conversation-closed {
    min-height: 36px;
    box-sizing: border-box;
    padding-inline: 12px;
  }

  .dfe-team__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .dfe-team__ready {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }


  .dfe-team__detail {
    min-height: 34px !important;
    padding: 7px 10px !important;
    border: 1px solid var(--app-border-strong) !important;
    color: var(--app-accent-dark) !important;
    background: var(--app-surface) !important;
  }

  .dfe-team__detail:hover {
    border-color: var(--app-accent) !important;
    background: var(--app-accent-soft) !important;
  }

  .dfe-grade {
    align-items: center;
    flex-direction: row;
  }

  .dfe-grade__main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .dfe-grade__icon {
    position: relative;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    overflow: hidden;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-purple) 26%,
        var(--app-border)
      );
    border-radius: 14px;
    color: var(--app-purple);
    background:
      linear-gradient(
        145deg,
        color-mix(
          in srgb,
          var(--app-purple-bg) 86%,
          var(--app-surface)
        ),
        var(--app-surface)
      );
    box-shadow:
      inset 0 1px 0
      rgba(255,255,255,.56),
      0 8px 18px
      color-mix(
        in srgb,
        var(--app-purple) 12%,
        transparent
      );
  }

  .dfe-grade__icon::before,
  .dfe-grade__icon::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background:
      color-mix(
        in srgb,
        var(--app-purple) 18%,
        transparent
      );
  }

  .dfe-grade__icon::before {
    width: 18px;
    height: 18px;
    top: -7px;
    right: -5px;
  }

  .dfe-grade__icon::after {
    width: 10px;
    height: 10px;
    left: -3px;
    bottom: -2px;
  }

  .dfe-grade__icon > svg {
    position: relative;
    z-index: 1;
  }

  .dfe-grade__text {
    display: grid;
    gap: 2px;
  }

  .dfe-grade small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 700;
  }

  .dfe-grade strong {
    color: var(--app-text);
    font-size: var(--app-font-title);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -.02em;
  }

  .dfe-grade p {
    min-width: 0;
    margin: 0 0 0 auto;
    padding: 8px 10px;
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  .dfe-team-detail {
    display: grid;
    gap: 12px;
  }

  .dfe-team-detail__summary {
    display: grid;
    grid-template-columns:
      46px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 11px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .dfe-team-detail__summary-icon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-team-detail__summary small,
  .dfe-team-detail__summary strong {
    display: block;
  }

  .dfe-team-detail__summary small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .dfe-team-detail__summary strong {
    margin-top: 3px;
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .dfe-team-detail__summary p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dfe-team-detail__members {
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface);
  }

  .dfe-team-detail__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .dfe-team-detail__heading small,
  .dfe-team-detail__heading strong {
    display: block;
  }

  .dfe-team-detail__heading small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .dfe-team-detail__heading strong {
    margin-top: 2px;
    color: var(--app-text);
    font-size: var(--app-font-body);
  }

  .dfe-team-detail__heading > span {
    min-width: 30px;
    min-height: 30px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dfe-team-detail__list {
    display: grid;
    gap: 8px;
  }

  .dfe-team-detail__member {
    display: grid;
    grid-template-columns:
      46px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dfe-team-detail__member-info {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .dfe-team-detail__member-info strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: var(--app-font-md);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-team-detail__member-info span {
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-team-detail__representative {
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-warning);
    background: var(--app-warning-bg);
    font-size: var(--app-font-xs);
    font-weight: 800;
    white-space: nowrap;
  }

  .dfe-participation-context {
    display: grid;
    grid-template-columns:
      44px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-participation-context__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-participation-context__body {
    min-width: 0;
  }

  .dfe-participation-context__body > small {
    display: block;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .dfe-participation-context__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 2px;
  }

  .dfe-participation-context__title strong {
    color: var(--app-text);
    font-size: var(--app-font-body);
  }

  .dfe-participation-context__badges {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  .dfe-participation-context__role,
  .dfe-participation-context__component,
  .dfe-participation-context__dynamic {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: var(--app-font-sm);
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }

  .dfe-participation-context__role {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-participation-context__component {
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .dfe-participation-context__dynamic {
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 34%,
        var(--app-border)
      );
    color: var(--app-accent-dark);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 78%,
        var(--app-surface)
      );
  }

  .dfe-participation-context__body > p {
    margin: 5px 0 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  .dfe-participation-context__representative {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 9px;
    padding: 6px 9px 6px 6px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dfe-participation-context__representative > span {
    display: grid;
    gap: 1px;
  }

  .dfe-participation-context__representative small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dfe-participation-context__representative strong {
    color: var(--app-text);
    font-size: var(--app-font-sm);
  }

  .dfe-participation-context__rules {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .dfe-participation-context__rules span {
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-xs);
    font-weight: 800;
    white-space: nowrap;
  }

  .dfe-conversation-role {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-sizing: border-box;
    padding: 7px 10px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    font-weight: 800;
    white-space: nowrap;
  }


  .dfe-conversation-role--button {
    border: 0;
    font-family: inherit;
    cursor: pointer;
    transition:
      transform .15s ease,
      box-shadow .15s ease,
      background .15s ease;
  }

  .dfe-conversation-role--button:hover {
    transform: translateY(-1px);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 72%,
        var(--app-surface)
      );
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-my-group {
    display: grid;
    gap: 14px;
  }

  .dfe-my-group__summary,
  .dfe-my-group__members {
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-surface);
    box-shadow:
      0 8px 22px
      rgba(15, 23, 42, .035);
  }

  .dfe-my-group__summary {
    padding: 16px;
    border-left: 4px solid var(--app-accent);
    background:
      linear-gradient(
        135deg,
        color-mix(
          in srgb,
          var(--app-accent-soft) 52%,
          var(--app-surface)
        ),
        var(--app-surface)
      );
  }

  .dfe-my-group__summary-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dfe-my-group__summary-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex: 0 0 48px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 26%,
        var(--app-border)
      );
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow:
      inset 0 1px 0
      rgba(255, 255, 255, .55);
  }

  .dfe-my-group__summary-head > div {
    min-width: 0;
  }

  .dfe-my-group__summary-head small,
  .dfe-my-group__summary-head strong,
  .dfe-my-group__summary-head span {
    display: block;
  }

  .dfe-my-group__summary-head small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
    font-weight: 900;
    letter-spacing: .075em;
    text-transform: uppercase;
  }

  .dfe-my-group__summary-head strong {
    margin-top: 3px;
    color: var(--app-text);
    font-size: var(--app-font-section);
    font-weight: 900;
    line-height: 1.15;
  }

  .dfe-my-group__summary-head span {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.4;
  }

  .dfe-my-group__context-grid {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
    margin-top: 14px;
  }

  .dfe-my-group__context-card {
    min-width: 0;
    display: grid;
    gap: 4px;
    padding: 10px 11px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .dfe-my-group__context-card small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .045em;
    text-transform: uppercase;
  }

  .dfe-my-group__context-card strong {
    overflow: hidden;
    font-size: var(--app-font-md);
    font-weight: 900;
    line-height: 1.3;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-my-group__context-card.is-role {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 32%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 62%,
        var(--app-surface)
      );
  }

  .dfe-my-group__context-card.is-role strong {
    color: var(--app-accent-dark);
  }

  .dfe-my-group__context-card.is-component {
    border-color:
      color-mix(
        in srgb,
        var(--app-purple) 28%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--app-purple-bg) 58%,
        var(--app-surface)
      );
  }

  .dfe-my-group__context-card.is-component strong {
    color: var(--app-purple);
  }

  .dfe-my-group__context-card.is-dynamic {
    border-color:
      color-mix(
        in srgb,
        var(--app-info) 26%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--app-info-bg) 58%,
        var(--app-surface)
      );
  }

  .dfe-my-group__context-card.is-dynamic strong {
    color: var(--app-info);
  }

  .dfe-my-group__instruction {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 11px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .dfe-my-group__instruction > svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: var(--app-accent-dark);
  }

  .dfe-my-group__instruction p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.55;
  }

  .dfe-my-group__members {
    padding: 15px 16px;
  }

  .dfe-my-group__members-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 11px;
  }

  .dfe-my-group__members-head small,
  .dfe-my-group__members-head strong {
    display: block;
  }

  .dfe-my-group__members-head small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 900;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .dfe-my-group__members-head strong {
    margin-top: 2px;
    color: var(--app-text);
    font-size: var(--app-font-body);
    font-weight: 900;
  }

  .dfe-my-group__members-head > span {
    min-width: 34px;
    min-height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-md);
    font-weight: 900;
  }

  .dfe-my-group__table {
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    background: var(--app-surface);
  }

  .dfe-my-group__table-head,
  .dfe-my-group__table-row {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      132px;
    align-items: center;
    gap: 12px;
  }

  .dfe-my-group__table-head {
    padding: 9px 12px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .055em;
  }

  .dfe-my-group__table-row {
    min-height: 58px;
    padding: 9px 12px;
    border-top: 1px solid var(--app-border-soft);
    background: var(--app-surface);
    transition:
      background .14s ease;
  }

  .dfe-my-group__table-row:hover {
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 20%,
        var(--app-surface)
      );
  }

  .dfe-my-group__student {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dfe-my-group__student > div:last-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dfe-my-group__student strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: var(--app-font-md);
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-my-group__student small {
    width: fit-content;
    padding: 2px 5px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-xs);
    font-weight: 900;
  }

  .dfe-my-group__member-role {
    justify-self: start;
    padding: 6px 9px;
    border: 1px solid var(--app-border-soft);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
    font-weight: 850;
    white-space: nowrap;
  }

  .dfe-my-group__member-role.is-representative {
    border-color:
      color-mix(
        in srgb,
        var(--app-warning) 24%,
        var(--app-border)
      );
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .dfe-my-group__empty {
    padding: 16px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    text-align: center;
  }

  @media (max-width: 640px) {
    .dfe-my-group__context-grid {
      grid-template-columns:
        1fr;
    }

    .dfe-my-group__table-head,
    .dfe-my-group__table-row {
      grid-template-columns:
        minmax(0, 1fr)
        auto;
    }
  }

  .dfe-scheduled {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 14px;
    border: 1px solid var(--app-info-border);
    border-radius: 15px;
    color: var(--app-info);
    background: var(--app-info-bg);
  }

  .dfe-scheduled > svg {
    flex: 0 0 auto;
  }

  .dfe-scheduled strong {
    display: block;
    color: var(--app-text);
    font-size: var(--app-font-md);
  }

  .dfe-scheduled p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: var(--app-font-sm);
  }

  .dfe-conversation-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dfe-conversation-head__identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .dfe-conversation-head__icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex: 0 0 43px;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-conversation-head__identity > div {
    min-width: 0;
  }

  .dfe-conversation-head small {
    display: block;
    margin-bottom: 2px;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .dfe-conversation-head h3,
  .dfe-conversation-head p {
    margin: 0;
  }

  .dfe-conversation-head h3 {
    font-size: var(--app-font-section);
  }

  .dfe-conversation-head p {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.45;
  }

  .dfe-conversation-head__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .dfe-conversation-head__stats {
    display: flex;
    gap: 6px;
  }

  .dfe-conversation-head__stats span {
    min-width: 66px;
    display: grid;
    place-items: center;
    gap: 1px;
    padding: 6px 8px;
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
  }

  .dfe-conversation-head__stats strong {
    color: var(--app-text);
    font-size: var(--app-font-body);
  }

  .dfe-primary--participar {
    min-height: 40px;
    padding-inline: 14px;
  }

  .dfe-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--app-danger-border);
    border-radius: 12px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    font-size: var(--app-font-sm);
  }

  .dfe-alert span {
    flex: 1;
  }

  .dfe-alert button {
    border: 0;
    color: inherit;
    background: transparent;
    font-size: var(--app-font-title);
    cursor: pointer;
  }

  .dfe-thread {
    display: grid;
    gap: 13px;
  }

  .dfe-answer-card {
    padding: 17px 18px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .16s ease,
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .dfe-answer-card:hover {
    transform: translateY(-1px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow);
  }

  .dfe-answer-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .dfe-answer-card__identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .dfe-answer-card__meta {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .dfe-answer-card__meta strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: var(--app-font-body);
    font-weight: 750;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-answer-card__meta span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dfe-answer-card__group {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dfe-answer-card__body {
    margin-top: 14px;
  }

  .dfe-answer-card__body h4 {
    margin: 0 0 7px;
    color: var(--app-text);
    font-size: var(--app-font-section);
    line-height: 1.35;
  }

  .dfe-answer-card__body p {
    margin: 0;
    display: -webkit-box;
    overflow: hidden;
    color: var(--app-text-secondary);
    font-size: var(--app-font-body);
    line-height: 1.65;
    white-space: pre-wrap;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .dfe-answer-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 15px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .dfe-answer-card__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .dfe-answer-card__stats span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dfe-answer-card__detail {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-answer-card__detail:hover {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .dfe-response-detail {
    display: grid;
    gap: 14px;

    /*
     * El detalle puede contener respuestas extensas, varios adjuntos y
     * comentarios. El scroll se queda dentro del contenido del modal
     * para que el encabezado y el cierre del modal sigan accesibles.
     */
    max-height: min(
      66vh,
      690px
    );
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
  }

  .dfe-response-detail::-webkit-scrollbar,
  .dfe-editor--response::-webkit-scrollbar {
    width: 7px;
  }

  .dfe-response-detail::-webkit-scrollbar-thumb,
  .dfe-editor--response::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--app-border-strong);
  }

  .dfe-response-detail__author {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .dfe-response-detail__identity {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .dfe-response-detail__identity > div:last-child {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .dfe-response-detail__identity
  > div:last-child
  > strong {
    color: var(--app-text);
    font-size: var(--app-font-body);
  }

  .dfe-response-detail__identity
  > div:last-child
  > span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dfe-response-detail__group {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dfe-response-detail__content,
  .dfe-response-detail__section {
    padding: 15px 16px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface);
  }

  .dfe-response-detail__eyebrow {
    display: block;
    margin-bottom: 6px;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .dfe-response-detail__content h4 {
    margin: 0 0 9px;
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .dfe-response-detail__content p {
    margin: 0;
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
    color: var(--app-text-secondary);
    font-size: var(--app-font-body);
    line-height: 1.72;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
  }

  .dfe-response-detail__section-head {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-accent-dark);
  }

  .dfe-response-detail__section-head strong {
    color: var(--app-text);
    font-size: var(--app-font-md);
  }

  .dfe-response-detail__section-head > span {
    margin-left: auto;
    padding: 4px 7px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .dfe-attachment-grid {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    align-items: start;
    gap: 9px;
    margin-top: 10px;
  }

  .dfe-attachment-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dfe-attachment-card__preview {
    width: 100%;
    min-height: 82px;
    border: 0;
    padding: 0;
    background: var(--app-surface);
  }

  .dfe-attachment-card__preview--image {
    display: block;
    cursor: pointer;
  }

  .dfe-attachment-card__preview--image
  img {
    width: 100%;
    height: 96px;
    display: block;
    object-fit: contain;
    object-position: center;
    background: var(--app-surface);
  }

  .dfe-attachment-card__preview--document {
    position: relative;
    display: grid;
    place-items: center;
    gap: 5px;
    min-height: 82px;
    color: var(--app-text-muted);
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-surface-alt)
      );
  }

  .dfe-attachment-card__preview--document
  > span {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 7px;
    border-radius: 8px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: var(--app-font-xs);
    font-weight: 900;
    letter-spacing: .05em;
  }

  .dfe-attachment-card--pdf
  .dfe-attachment-card__preview--document {
    color: var(--app-danger);
    background:
      color-mix(
        in srgb,
        var(--app-danger-bg) 55%,
        var(--app-surface)
      );
  }

  .dfe-attachment-card--word
  .dfe-attachment-card__preview--document {
    color: var(--app-info);
    background:
      color-mix(
        in srgb,
        var(--app-info-bg) 58%,
        var(--app-surface)
      );
  }

  .dfe-attachment-card--excel
  .dfe-attachment-card__preview--document {
    color: var(--app-success);
    background:
      color-mix(
        in srgb,
        var(--app-success-bg) 58%,
        var(--app-surface)
      );
  }

  .dfe-attachment-card__body {
    display: grid;
    gap: 7px;
    padding: 9px 10px 10px;
  }

  .dfe-attachment-card__title {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .dfe-attachment-card__title strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: var(--app-font-md);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-attachment-card__title span {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dfe-attachment-card__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
  }

  .dfe-attachment-card__actions
  button,
  .dfe-attachment-card__actions
  a {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid var(--app-border-strong);
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    text-decoration: none;
    font: inherit;
    font-size: var(--app-font-xs);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-attachment-card__actions
  button:hover,
  .dfe-attachment-card__actions
  a:hover {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .dfe-attachment-card__readonly {
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .dfe-file-preview {
    display: grid;
    gap: 12px;
  }

  .dfe-file-preview__image,
  .dfe-file-preview__pdf {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dfe-file-preview__image {
    display: grid;
    place-items: center;
    min-height: 240px;
    max-height: min(
      56vh,
      560px
    );
    padding: 12px;
  }

  .dfe-file-preview__image img {
    max-width: 100%;
    max-height: min(
      52vh,
      520px
    );
    display: block;
    object-fit: contain;
    border-radius: 10px;
  }

  .dfe-file-preview__pdf {
    height: min(
      56vh,
      580px
    );
  }

  .dfe-file-preview__pdf iframe {
    width: 100%;
    height: 100%;
    display: block;
    border: 0;
    background: #fff;
  }

  .dfe-file-preview__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .dfe-file-preview__actions a {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    text-decoration: none;
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dfe-file-preview__actions
  a.primary {
    border-color: var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .dfe-comments--detail {
    max-height: 240px;
    overflow-y: auto;
    overflow-x: hidden;
    margin-top: 11px;
    padding-right: 5px;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
  }

  .dfe-response-detail__empty-comments {
    margin-top: 11px;
    padding: 12px;
    border-radius: 11px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-sm);
    text-align: center;
  }

  .dfe-response-detail__comment-button {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 11px;
    padding: 8px 11px;
    border: 1px solid var(--app-accent);
    border-radius: 10px;
    color: #fff;
    background: var(--app-accent);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-comments {
    display: grid;
    gap: 6px;
    margin-top: 10px;
    padding: 9px;
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dfe-comment {
    display: grid;
    grid-template-columns:
      30px
      minmax(0, 1fr);
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .dfe-comment__body header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dfe-comment__body strong {
    font-size: var(--app-font-sm);
  }

  .dfe-comment__body span {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dfe-comment__body p {
    margin: 4px 0 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  .dfe-editor {
    display: grid;
    gap: 12px;
  }

  /*
   * El formulario de publicación puede crecer por el texto y los adjuntos.
   * El footer del AulaModal queda visible y solo se desplaza el formulario.
   */
  .dfe-editor--response {
    max-height: min(
      64vh,
      650px
    );
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2px 7px 10px 2px;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
  }

  .dfe-editor--comment {
    max-height: min(
      52vh,
      470px
    );
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
  }

  .dfe-editor label {
    display: grid;
    gap: 6px;
  }

  .dfe-editor label > span {
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    font-weight: 750;
  }

  .dfe-editor input,
  .dfe-editor textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid var(--app-input-border);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-input-bg);
    font: inherit;
    font-size: var(--app-font-md);
  }

  .dfe-editor textarea {
    resize: vertical;
    line-height: 1.55;
  }

  .dfe-editor--response textarea {
    min-height: 150px;
    max-height: 240px;
    overflow-y: auto;
  }

  .dfe-editor--comment textarea {
    min-height: 125px;
    max-height: 220px;
    overflow-y: auto;
  }

  .dfe-editor input:focus,
  .dfe-editor textarea:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      var(--app-input-ring);
  }

  .dfe-editor label small {
    justify-self: end;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dfe-editor__team,
  .dfe-upload-pending {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
  }

  .dfe-editor__team {
    align-items: center;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
  }

  .dfe-upload-pending > svg {
    flex: 0 0 auto;
    color: var(--app-accent-dark);
  }

  .dfe-upload-pending strong,
  .dfe-upload-pending p,
  .dfe-upload-pending small {
    display: block;
  }

  .dfe-upload-pending strong {
    font-size: var(--app-font-sm);
  }

  .dfe-upload-pending p {
    margin: 3px 0;
    color: var(--app-text-soft);
    font-size: var(--app-font-xs);
  }

  .dfe-upload-pending small {
    color: var(--app-warning);
    font-size: var(--app-font-xs);
    line-height: 1.4;
  }

  .dfe-details {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .dfe-detail-card {
    min-height: 74px;
    display: grid;
    grid-template-columns:
      42px
      minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    padding: 12px 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dfe-detail-card--wide {
    grid-column: 1 / -1;
  }

  .dfe-detail-card__icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-detail-card > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .dfe-detail-card small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 700;
  }


  .dfe-detail-card__penalty {
    width: fit-content;
    margin-top: 3px;
    padding: 4px 7px;
    border-radius: 999px;
    color: var(--app-warning);
    background: var(--app-warning-bg);
    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .dfe-detail-card strong {
    color: var(--app-text);
    font-size: var(--app-font-md);
    line-height: 1.45;
  }

  .dfe-detail-affinity {
    grid-column: 2;
    justify-self: start;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
    padding: 7px 10px;
    border: 1px solid var(--app-accent);
    border-radius: 9px;
    color: #fff;
    background: var(--app-accent);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-upload-box {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .dfe-upload-box__head {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }

  .dfe-upload-box__icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dfe-upload-box__head strong {
    font-size: var(--app-font-sm);
  }

  .dfe-upload-box__head p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: var(--app-font-sm);
    line-height: 1.45;
  }

  .dfe-upload-button {
    min-height: 39px;
    display: inline-flex !important;
    grid-template-columns: none !important;
    align-items: center;
    justify-content: center;
    gap: 7px !important;
    padding: 8px 12px;
    border: 1px dashed var(--app-accent) !important;
    border-radius: 10px !important;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dfe-upload-button input {
    display: none;
  }

  .dfe-upload-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .dfe-upload-rules span {
    padding: 5px 7px;
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    font-size: var(--app-font-xs);
  }

  .dfe-upload-list {
    display: grid;
    gap: 6px;
  }

  .dfe-upload-list > div {
    display: grid;
    grid-template-columns:
      28px
      minmax(0, 1fr)
      28px;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--app-border-soft);
    border-radius: 9px;
    background: var(--app-surface);
  }

  .dfe-upload-list > div > svg {
    color: var(--app-accent-dark);
  }

  .dfe-upload-list span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dfe-upload-list strong {
    overflow: hidden;
    font-size: var(--app-font-sm);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dfe-upload-list small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dfe-upload-list button {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 8px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    cursor: pointer;
  }

  .dfe-upload-note {
    color: var(--app-warning);
    font-size: var(--app-font-xs);
    line-height: 1.45;
  }

  .dfe-loading,
  .dfe-error {
    display: grid;
    gap: 14px;
    min-width: 0;
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .dfe-state--critico
    .dfe-state__countdown strong {
      animation: none;
    }
  }

  @media (max-width: 1100px) {
    .dfe-attachment-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }
  }

  @media (max-width: 980px) {
    .dfe-overview-row--two {
      grid-template-columns:
        1fr;
    }

    .dfe-grade {
      align-items: flex-start;
      flex-direction: column;
    }

    .dfe-grade p {
      margin-left: 0;
    }
  }

  @media (max-height: 760px) {
    .dfe-editor--response {
      max-height: 58vh;
    }

    .dfe-response-detail {
      max-height: 60vh;
    }

    .dfe-editor--response textarea {
      min-height: 120px;
      max-height: 190px;
    }

    .dfe-file-preview__pdf {
      height: 50vh;
    }
  }

  @media (max-width: 760px) {
    .dfe-attachment-grid {
      grid-template-columns:
        1fr;
    }

    .dfe-file-preview__actions {
      flex-direction: column;
    }

    .dfe-file-preview__actions a {
      width: 100%;
      box-sizing: border-box;
    }

    .dfe-answer-card__header,
    .dfe-answer-card__footer,
    .dfe-response-detail__author {
      align-items: flex-start;
      flex-direction: column;
    }

    .dfe-answer-card__group,
    .dfe-response-detail__group {
      align-self: flex-start;
    }

    .dfe-answer-card__detail {
      width: 100%;
    }
  }

  @media (max-width: 700px) {
    .dfe-participation-context {
      grid-template-columns:
        44px
        minmax(
          0,
          1fr
        );
    }

    .dfe-participation-context__rules {
      grid-column:
        1 / -1;
      align-items: flex-start;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .dfe-details {
      grid-template-columns: 1fr;
    }

    .dfe-detail-card--wide {
      grid-column: auto;
    }

    .dfe-detail-affinity {
      grid-column: 1 / -1;
    }

    .dfe-state {
      grid-template-columns:
        1fr;
    }

    .dfe-state__timers {
      grid-template-columns:
        1fr;
    }

    .dfe-state__status {
      justify-self: stretch;
      text-align: center;
    }

    .dfe-team,
    .dfe-conversation-head {
      align-items: stretch;
      flex-direction: column;
    }

    .dfe-conversation-head__actions {
      align-items: stretch;
      flex-direction: column;
    }

    .dfe-conversation-head__stats {
      width: 100%;
    }

    .dfe-conversation-head__stats span {
      flex: 1;
    }

    .dfe-primary--participar {
      width: 100%;
    }

    .dfe-answer header em {
      display: none;
    }
  }

.dfe-my-group__penalty {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 9px;
  align-items: start;
  margin-top: 9px;
  padding: 10px 11px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 25%, var(--app-border));
  border-radius: 12px;
  color: var(--app-text-secondary);
  background: color-mix(in srgb, var(--app-accent-soft) 28%, var(--app-surface));
}
.dfe-my-group__penalty > svg { color: var(--app-accent-dark); }
.dfe-my-group__penalty strong { color: var(--app-text); font-size: var(--app-font-sm); }
.dfe-my-group__penalty p { margin: 2px 0 0; font-size: var(--app-font-xs); line-height: 1.45; }
.dfe-my-group__penalty small { display: block; margin-top: 4px; color: var(--app-danger); font-size: var(--app-font-xs); font-weight: 800; }
.dfe-my-group__penalty.is-exempt { border-color: var(--app-success-border); background: var(--app-success-bg); }
.dfe-my-group__penalty.is-exempt > svg { color: var(--app-success); }
.dfe-grade__breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}
.dfe-grade__breakdown span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border-radius: 999px;
  color: var(--app-text-muted);
  background: var(--app-surface-alt);
  font-size: var(--app-font-xs);
}
.dfe-grade__breakdown strong { color: var(--app-danger); font-size: var(--app-font-xs); }
`;