import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileUp,
  GraduationCap,
  Info,
  Lightbulb,
  MessageSquareText,
  Minus,
  Plus,
  Save,
  Settings2,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AulaLoadingOverlay from "../aula/AulaLoadingOverlay";
import AulaModal from "../aula/AulaModal";
import Toast from "../shared/Toast";
import { useAulaContext } from "../../contexts/AulaContext";
import useCrearForo, {
  type CrearForoDatos,
} from "../../hooks/foro/useCrearForo";
import useGruposCurso from "../../hooks/useGruposCurso";

import ConfigSwitchForo from "./ConfigSwitchForo";
import SelectorTipoForo, {
  type ModalidadParticipacionForo,
} from "./SelectorTipoForo";

type Seccion =
  | "informacion"
  | "participacion"
  | "fechas"
  | "evaluacion"
  | "archivos"
  | "permisos";
type PasoFormulario = 1 | 2 | 3 | 4;
type TemaAyuda =
  | "modalidad"
  | "origenGrupos"
  | "dinamica"
  | "tipoGrupo"
  | "limites"
  | "visibilidad"
  | "visibilidadForo"
  | "retrasos"
  | "componente"
  | "evaluacion"
  | "modalidadNota"
  | "penalizacionComentarios"
  | "adjuntos"
  | "permisos";
type TipoPenalizacionComentarios =
  | "NINGUNA"
  | "PUNTOS_FIJOS"
  | "PORCENTAJE";

type EstadoFormulario = Omit<
  CrearForoDatos,
  "hitoId" | "fechaApertura" | "fechaLimite" | "fechaCierre"
> & {
  fechaApertura: string;
  fechaLimite: string;
  fechaCierre: string;
  fechaMaximaRetraso?: string;

  /**
   * Penalización individual por incumplir los comentarios mínimos.
   * Se aplica únicamente a integrantes NO representantes.
   */
  penalizarIncumplimientoComentarios?: boolean;
  tipoPenalizacionComentarios?: TipoPenalizacionComentarios;
  valorPenalizacionComentarios?: number;
};

const ahoraLocal = () => {
  const fecha = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return fecha.toISOString().slice(0, 16);
};
const sumarDias = (dias: number) => {
  const fecha = new Date(
    Date.now() + dias * 86400000 - new Date().getTimezoneOffset() * 60000,
  );
  return fecha.toISOString().slice(0, 16);
};

const esFechaPasada = (valor: string) => {
  if (!valor) return false;

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return false;
  }

  return fecha.getTime() < Date.now();
};

const minimoFechaLocal = () => ahoraLocal();
const inicial: EstadoFormulario = {
  titulo: "",
  contenido: "",
  instrucciones: "",
  objetivo: "",
  esCalificable: false,
  modalidadParticipacion: "INDIVIDUAL",
  origenGrupo: "NINGUNO",
  dinamicaGrupal: "NINGUNA",
  cantidadMinimaIntegrantes: 2,
  cantidadMaximaIntegrantes: 5,
  requiereAprobacionEquipos: false,
  requiereRepresentante: true,
  bloquearEquipoAlResponder: true,
  permitirComentarios: true,
  permitirEditarRespuestas: true,
  permitirEliminarRespuestas: false,
  permitirEditarComentarios: true,
  permitirEliminarComentarios: false,
  minimoComentariosPorEstudiante: 0,
  penalizarIncumplimientoComentarios: false,
  tipoPenalizacionComentarios: "NINGUNA",
  valorPenalizacionComentarios: undefined,
  tipoEvaluacion: "MANUAL",
  modalidadNota: "INDIVIDUAL",
  calificacionAutomaticaAlCumplir: false,
  fechaApertura: ahoraLocal(),
  fechaLimite: sumarDias(7),
  fechaCierre: sumarDias(7),
  visibleAntesDeApertura: true,
  permitirRetrasos: false,
  tipoDescuentoRetraso: "NINGUNO",
  visibilidadRespuestas: "DESPUES_DE_RESPONDER",
  permitirAdjuntosTema: true,
  permitirAdjuntosRespuesta: true,
  permitirAdjuntosComentario: false,
  exigirAdjuntoRespuesta: false,
  permitirDescargaAdjuntos: true,
  maximoArchivosTema: 5,
  maximoArchivosRespuesta: 5,
  maximoArchivosComentario: 2,
  tamanioMaximoArchivoMb: 10,
  extensionesPermitidas: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  participaEnPromedio: true,
};

const CAMPOS_EDITABLES: readonly (keyof EstadoFormulario)[] = [
  "titulo",
  "contenido",
  "instrucciones",
  "objetivo",
  "esCalificable",
  "componente",
  "modalidadParticipacion",
  "origenGrupo",
  "dinamicaGrupal",
  "conjuntoGrupoId",
  "cantidadMinimaIntegrantes",
  "cantidadMaximaIntegrantes",
  "requiereAprobacionEquipos",
  "requiereRepresentante",
  "bloquearEquipoAlResponder",
  "permitirComentarios",
  "permitirEditarRespuestas",
  "permitirEliminarRespuestas",
  "permitirEditarComentarios",
  "permitirEliminarComentarios",
  "minimoComentariosPorEstudiante",
  "maximoComentariosPorEstudiante",
  "penalizarIncumplimientoComentarios",
  "tipoPenalizacionComentarios",
  "valorPenalizacionComentarios",
  "palabrasMinimasRespuesta",
  "palabrasMaximasRespuesta",
  "palabrasMinimasComentario",
  "palabrasMaximasComentario",
  "tipoEvaluacion",
  "modalidadNota",
  "porcentajeNotaGrupal",
  "porcentajeNotaIndividual",
  "calificacionAutomaticaAlCumplir",
  "fechaApertura",
  "fechaLimite",
  "fechaCierre",
  "visibleAntesDeApertura",
  "permitirRetrasos",
  "fechaMaximaRetraso",
  "tipoDescuentoRetraso",
  "valorDescuentoRetraso",
  "visibilidadRespuestas",
  "permitirAdjuntosTema",
  "permitirAdjuntosRespuesta",
  "permitirAdjuntosComentario",
  "exigirAdjuntoRespuesta",
  "permitirDescargaAdjuntos",
  "maximoArchivosTema",
  "maximoArchivosRespuesta",
  "maximoArchivosComentario",
  "tamanioMaximoArchivoMb",
  "extensionesPermitidas",
  "participaEnPromedio",
];

const iso = (valor: string) => new Date(valor).toISOString();

function ContadorNumero({
  etiqueta,
  valor,
  minimo = 0,
  maximo = 100,
  paso = 1,
  onChange,
}: {
  etiqueta: string;
  valor?: number;
  minimo?: number;
  maximo?: number;
  paso?: number;
  onChange: (valor: number) => void;
}) {
  const actual = Number(valor ?? minimo);
  const cambiar = (direccion: -1 | 1) =>
    onChange(Math.min(maximo, Math.max(minimo, actual + direccion * paso)));

  return (
    <div className="crear-foro-contador">
      <span>{etiqueta}</span>
      <div>
        <button
          type="button"
          onClick={() => cambiar(-1)}
          disabled={actual <= minimo}
          aria-label={`Disminuir ${etiqueta}`}
        >
          <Minus size={16} />
        </button>
        <strong>{actual}</strong>
        <button
          type="button"
          onClick={() => cambiar(1)}
          disabled={actual >= maximo}
          aria-label={`Aumentar ${etiqueta}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function SeccionFormulario({
  id,
  titulo,
  descripcion,
  icono: Icono,
  abierta,
  onToggle,
  plegable = true,
  children,
}: {
  id: Seccion;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  abierta: boolean;
  onToggle: (id: Seccion) => void;
  plegable?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`crear-foro-seccion ${abierta ? "abierta" : ""}`}>
      <button
        type="button"
        className="crear-foro-seccion__cabecera"
        onClick={() => onToggle(id)}
        disabled={!plegable}
      >
        <span className="crear-foro-seccion__icono">
          <Icono size={19} />
        </span>
        <span>
          <strong>{titulo}</strong>
          <small>{descripcion}</small>
        </span>
      </button>
      {abierta && (
        <div className="crear-foro-seccion__contenido">{children}</div>
      )}
    </section>
  );
}

function BotonAyuda({
  tema,
  etiqueta,
  onAbrir,
}: {
  tema: TemaAyuda;
  etiqueta: string;
  onAbrir: (tema: TemaAyuda) => void;
}) {
  return (
    <button
      type="button"
      className="crear-foro-ayuda-boton"
      aria-label={`Ayuda sobre ${etiqueta}`}
      title={`¿Qué significa ${etiqueta}?`}
      onClick={(evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        onAbrir(tema);
      }}
    >
      ?
    </button>
  );
}

type FormularioForoInteligenteProps = {
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  foroId?: number;
};

export default function FormularioForoInteligente({
  onClose,
  onSuccess,
  foroId,
}: FormularioForoInteligenteProps) {
  const formularioRef = useRef<HTMLFormElement>(null);
  const contenidoRef = useRef<HTMLElement>(null);
  const { curso, hitoSeleccionado } = useAulaContext();
  const {
    crear,
    obtener,
    actualizar: actualizarForo,
    guardando,
    error,
    limpiarError,
  } = useCrearForo(curso.id);
  const [datos, setDatos] = useState<EstadoFormulario>(inicial);
  const [paso, setPaso] = useState<PasoFormulario>(1);
  const [abiertas, setAbiertas] = useState<Seccion[]>(["informacion"]);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [tipoGrupoPlataforma, setTipoGrupoPlataforma] = useState<
    "CONTINUA" | "PROCESUAL"
  >("CONTINUA");
  const [limitarRespuesta, setLimitarRespuesta] = useState(false);
  const [limitarComentarios, setLimitarComentarios] = useState(false);
  const [temaAyuda, setTemaAyuda] = useState<TemaAyuda | null>(null);
  const modoEdicion = Number.isInteger(foroId);

  useEffect(() => {
    if (!foroId) return;
    let activo = true;
    void obtener(foroId)
      .then((valor) => {
        if (!activo || !valor || typeof valor !== "object") return;
        const foro = valor as Partial<EstadoFormulario> &
          Record<string, unknown>;
        const fechaLocal = (fecha: unknown) => {
          if (typeof fecha !== "string") return undefined;
          const valorFecha = new Date(fecha);
          if (Number.isNaN(valorFecha.getTime())) return undefined;
          return new Date(
            valorFecha.getTime() - valorFecha.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);
        };
        const valoresEditables = Object.fromEntries(
          CAMPOS_EDITABLES.filter((campo) =>
            Object.prototype.hasOwnProperty.call(foro, campo),
          ).map((campo) => [campo, foro[campo]]),
        ) as Partial<EstadoFormulario>;
        setDatos((actual) => {
          const fechaApertura =
            fechaLocal(foro.fechaApertura) ?? actual.fechaApertura;

          const fechaLimite =
            fechaLocal(foro.fechaLimite) ?? actual.fechaLimite;
          const permiteRetrasos = Boolean(foro.permitirRetrasos);
          const fechaMaximaRetraso = fechaLocal(foro.fechaMaximaRetraso);
          const fechaCierreGuardada = fechaLocal(foro.fechaCierre);

          return {
            ...actual,
            ...valoresEditables,
            fechaApertura,
            fechaLimite,
            // Sin retrasos, el límite también es el cierre definitivo.
            // Esto corrige registros antiguos que conservaron el +7 días inicial.
            fechaCierre: permiteRetrasos
              ? fechaCierreGuardada ?? fechaMaximaRetraso ?? fechaLimite
              : fechaLimite,
            fechaMaximaRetraso: permiteRetrasos
              ? fechaMaximaRetraso ?? fechaCierreGuardada ?? fechaLimite
              : undefined,
            extensionesPermitidas: Array.isArray(foro.extensionesPermitidas)
              ? (foro.extensionesPermitidas as string[])
              : actual.extensionesPermitidas,
          };
        });
        setLimitarRespuesta(
          Boolean(
            foro.palabrasMinimasRespuesta || foro.palabrasMaximasRespuesta,
          ),
        );
        setLimitarComentarios(
          Boolean(
            foro.minimoComentariosPorEstudiante ||
              foro.maximoComentariosPorEstudiante,
          ),
        );
      })
      .catch((causa) =>
        setErrorLocal(
          causa instanceof Error
            ? causa.message
            : "No fue posible cargar el foro.",
        ),
      );
    return () => {
      activo = false;
    };
  }, [foroId, obtener]);

  const usaGruposPlataforma =
    datos.modalidadParticipacion === "GRUPAL" &&
    datos.origenGrupo === "PLATAFORMA";
  const {
    conjuntos,
    cargando: cargandoConjuntos,
    error: errorConjuntos,
  } = useGruposCurso({
    cursoId: curso.id,
    hitoId: hitoSeleccionado?.id,
    cargarAutomaticamente: usaGruposPlataforma,
  });
  const conjuntosDisponibles = useMemo(
    () =>
      conjuntos.filter(
        (conjunto) =>
          conjunto.tipoEvaluacion === tipoGrupoPlataforma &&
          conjunto.cursoId === curso.id &&
          (tipoGrupoPlataforma === "CONTINUA"
            ? conjunto.alcance === "HITO" &&
              conjunto.hitoId === hitoSeleccionado?.id
            : conjunto.alcance === "CURSO" && conjunto.hitoId === null),
      ),
    [conjuntos, curso.id, hitoSeleccionado?.id, tipoGrupoPlataforma],
  );

  const cerrarToast = () => {
    setErrorLocal(null);
    limpiarError();
  };

  const actualizar = <K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K],
  ) => setDatos((actual) => ({ ...actual, [campo]: valor }));
  const alternar = (id: Seccion) =>
    setAbiertas((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id],
    );
  const grupal = datos.modalidadParticipacion === "GRUPAL";
  const afinidad = grupal && datos.origenGrupo === "AFINIDAD";

  const dinamicaUsaComentarios =
    grupal &&
    (datos.dinamicaGrupal === "PARTICIPACION_DISTRIBUIDA" ||
      datos.dinamicaGrupal === "COLABORACION_ABIERTA");

  const puedePenalizarComentarios =
    dinamicaUsaComentarios &&
    datos.esCalificable;

  useEffect(() => {
    if (!afinidad) return;

    setDatos((actual) => {
      if (
        actual.requiereAprobacionEquipos ===
        false
      ) {
        return actual;
      }

      return {
        ...actual,
        requiereAprobacionEquipos:
          false,
      };
    });
  }, [afinidad]);

  useEffect(() => {
    if (!usaGruposPlataforma) return;

    setDatos((actual) => {
      const seleccionActualValida = conjuntosDisponibles.some(
        (conjunto) => conjunto.id === actual.conjuntoGrupoId,
      );

      if (seleccionActualValida) return actual;

      return {
        ...actual,
        conjuntoGrupoId:
          conjuntosDisponibles.length === 1
            ? conjuntosDisponibles[0].id
            : undefined,
      };
    });
  }, [usaGruposPlataforma, conjuntosDisponibles]);

  useEffect(() => {
    const seccionesPorPaso: Record<PasoFormulario, Seccion[]> = {
      1: ["informacion"],
      2: ["participacion"],
      3: ["fechas", "evaluacion"],
      4: ["archivos", "permisos"],
    };
    setAbiertas(seccionesPorPaso[paso]);
    contenidoRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTemaAyuda(null);
  }, [paso]);

  useEffect(() => {
    if (paso !== 3) return;

    /*
     * En el paso 3 aparecen y desaparecen bloques dinámicos
     * (retrasos, modalidad mixta y valor del descuento).
     * El navegador conserva el scrollTop anterior aunque cambie
     * la altura del contenido, por eso la parte superior puede
     * parecer cortada. Al cambiar estas opciones volvemos al inicio.
     */
    const frame = window.requestAnimationFrame(() => {
      contenidoRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    paso,
    datos.permitirRetrasos,
    datos.modalidadNota,
    datos.tipoDescuentoRetraso,
    datos.esCalificable,
    datos.tipoEvaluacion,
  ]);

  useEffect(() => {
    if (!temaAyuda) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setTemaAyuda(null);
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [temaAyuda]);

  const validarPaso = (pasoAValidar: PasoFormulario) => {
    if (!hitoSeleccionado) return "Selecciona un hito antes de crear el foro.";
    if (pasoAValidar === 1) {
      if (!datos.titulo.trim())
        return "Escribe el título del foro para continuar.";
      if (!datos.contenido.trim())
        return "Completa la descripción o planteamiento del foro.";
      if (!datos.objetivo?.trim())
        return "Escribe el objetivo del foro para continuar.";
      if (!datos.instrucciones?.trim())
        return "Completa las instrucciones del foro para continuar.";
    }
    if (pasoAValidar === 2) {
      if (
        grupal &&
        datos.origenGrupo === "PLATAFORMA" &&
        !datos.conjuntoGrupoId
      )
        return conjuntosDisponibles.length > 1
          ? "Selecciona el conjunto de grupos que utilizará el foro."
          : tipoGrupoPlataforma === "CONTINUA"
            ? "No hay grupos disponibles para este hito. El docente todavía no registró los grupos de evaluación continua correspondientes."
            : "No hay grupos procesuales disponibles. El docente todavía no registró los grupos procesuales del curso.";
      if (
        usaGruposPlataforma &&
        !conjuntosDisponibles.some(
          (conjunto) => conjunto.id === datos.conjuntoGrupoId,
        )
      )
        return "El conjunto seleccionado ya no está disponible para este curso o hito.";
      if (afinidad && !datos.cantidadMinimaIntegrantes)
        return "Indica el mínimo de integrantes por equipo.";
      if (afinidad && !datos.cantidadMaximaIntegrantes)
        return "Indica el máximo de integrantes por equipo.";
      if (
        afinidad &&
        Number(datos.cantidadMaximaIntegrantes) <
          Number(datos.cantidadMinimaIntegrantes)
      )
        return "El máximo de integrantes debe ser igual o mayor al mínimo.";
      if (
        afinidad &&
        Number(datos.cantidadMaximaIntegrantes) >
          curso.estudiantesInscritos
      )
        return `El máximo de integrantes no puede superar los ${curso.estudiantesInscritos} estudiantes inscritos.`;
      if (
        datos.permitirComentarios &&
        limitarComentarios &&
        Number(datos.maximoComentariosPorEstudiante || 0) > 0 &&
        Number(datos.maximoComentariosPorEstudiante) <
          Number(datos.minimoComentariosPorEstudiante || 0)
      )
        return "El máximo de comentarios debe ser igual o mayor al mínimo.";
      if (
        limitarRespuesta &&
        Number(datos.palabrasMaximasRespuesta || 0) > 0 &&
        Number(datos.palabrasMaximasRespuesta) <
          Number(datos.palabrasMinimasRespuesta || 0)
      )
        return "El máximo de palabras de la respuesta debe ser igual o mayor al mínimo.";
    }
    if (pasoAValidar === 4) {
      const permiteAdjuntos =
        datos.permitirAdjuntosTema ||
        datos.permitirAdjuntosRespuesta ||
        datos.permitirAdjuntosComentario;
      if (permiteAdjuntos && datos.extensionesPermitidas.length === 0)
        return "Selecciona al menos un formato de archivo permitido.";
      if (datos.exigirAdjuntoRespuesta && !datos.permitirAdjuntosRespuesta)
        return "Para exigir un adjunto primero debes permitir archivos en respuestas.";
      return null;
    }
    if (pasoAValidar !== 3) return null;
    const apertura = new Date(datos.fechaApertura),
      limite = new Date(datos.fechaLimite),
      cierre = new Date(datos.fechaCierre);

    const ahora = new Date();

    if (!modoEdicion && apertura.getTime() < ahora.getTime())
      return "La apertura del foro no puede estar en una fecha u hora pasada.";

    if (!modoEdicion && limite.getTime() <= ahora.getTime())
      return "El cierre del foro debe programarse para una fecha y hora futura.";

    if (
      !modoEdicion &&
      datos.permitirRetrasos &&
      datos.fechaMaximaRetraso &&
      new Date(datos.fechaMaximaRetraso).getTime() <= ahora.getTime()
    )
      return "El cierre con retraso debe programarse para una fecha y hora futura.";

    if (
      !modoEdicion &&
      datos.esCalificable &&
      datos.tipoEvaluacion === "AUTOMATICA" &&
      limite.getTime() <= ahora.getTime()
    )
      return "Un foro con evaluación automática no puede crearse con una fecha de cierre vencida.";

    if (limite <= apertura)
      return "La fecha límite debe ser posterior a la apertura.";
    if (cierre < limite)
      return "La fecha de cierre no puede ser anterior a la fecha límite.";
    if (
      datos.permitirRetrasos &&
      (!datos.fechaMaximaRetraso || new Date(datos.fechaMaximaRetraso) < limite)
    )
      return "Indica una fecha máxima de retraso igual o posterior a la fecha límite.";
    if (
      datos.permitirRetrasos &&
      datos.fechaMaximaRetraso &&
      cierre < new Date(datos.fechaMaximaRetraso)
    )
      return "El cierre debe ser igual o posterior a la fecha máxima de retraso.";
    if (
      datos.permitirRetrasos &&
      datos.tipoDescuentoRetraso !== "NINGUNO" &&
      Number(datos.valorDescuentoRetraso || 0) <= 0
    )
      return "Indica un valor mayor a cero para la regla de descuento.";
    if (datos.esCalificable && !datos.componente)
      return "Selecciona Continua o Procesual para el foro calificable.";

    if (
      datos.penalizarIncumplimientoComentarios &&
      !puedePenalizarComentarios
    )
      return "La penalización por participación incompleta requiere un foro grupal calificable y una dinámica con aportes.";

    if (
      datos.penalizarIncumplimientoComentarios &&
      (!datos.tipoPenalizacionComentarios ||
        datos.tipoPenalizacionComentarios === "NINGUNA")
    )
      return "Selecciona si la penalización por comentarios será por puntos fijos o por porcentaje.";

    if (
      datos.penalizarIncumplimientoComentarios &&
      Number(datos.valorPenalizacionComentarios || 0) <= 0
    )
      return "Indica un valor mayor a cero para la penalización por comentarios.";

    if (
      datos.penalizarIncumplimientoComentarios &&
      Number(datos.valorPenalizacionComentarios || 0) > 100
    )
      return "La penalización por comentarios no puede superar 100.";

    if (
      datos.tipoEvaluacion === "MANUAL" &&
      datos.modalidadNota === "GRUPAL_E_INDIVIDUAL" &&
      Number(datos.porcentajeNotaGrupal || 0) +
        Number(datos.porcentajeNotaIndividual || 0) !==
        100
    )
      return "Los porcentajes grupal e individual deben sumar 100.";
    return null;
  };

  const validarHasta = (destino: PasoFormulario) => {
    for (let numero = 1; numero < destino; numero += 1) {
      const problema = validarPaso(numero as PasoFormulario);
      if (problema) return { problema, pasoConError: numero as PasoFormulario };
    }
    return null;
  };

  const irAPaso = (destino: PasoFormulario) => {
    limpiarError();
    setErrorLocal(null);
    if (destino <= paso) {
      setPaso(destino);
      return;
    }
    const resultado = validarHasta(destino);
    if (resultado) {
      setPaso(resultado.pasoConError);
      setErrorLocal(resultado.problema);
      return;
    }
    setPaso(destino);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    limpiarError();
    setErrorLocal(null);
    let resultado: { problema: string; pasoConError: PasoFormulario } | null =
      null;
    for (let numero = 1; numero <= 4; numero += 1) {
      const problema = validarPaso(numero as PasoFormulario);
      if (problema) {
        resultado = { problema, pasoConError: numero as PasoFormulario };
        break;
      }
    }
    if (resultado) {
      setPaso(resultado.pasoConError);
      setErrorLocal(resultado.problema);
      return;
    }
    const payload: CrearForoDatos = {
      ...datos,
      hitoId: hitoSeleccionado!.id,
      titulo: datos.titulo.trim(),
      contenido: datos.contenido.trim(),
      instrucciones: datos.instrucciones?.trim() || undefined,
      objetivo: datos.objetivo?.trim() || undefined,
      fechaApertura: iso(datos.fechaApertura),
      fechaLimite: iso(datos.fechaLimite),
      fechaCierre: iso(datos.fechaCierre),
      visibleAntesDeApertura:
        datos.visibleAntesDeApertura,
      componente: datos.esCalificable ? datos.componente : undefined,
      tipoEvaluacion: datos.esCalificable ? datos.tipoEvaluacion : undefined,
      calificacionAutomaticaAlCumplir:
        datos.esCalificable && datos.tipoEvaluacion === "AUTOMATICA",

      porcentajeNotaGrupal:
        datos.esCalificable &&
        datos.tipoEvaluacion === "MANUAL" &&
        datos.modalidadNota === "GRUPAL_E_INDIVIDUAL"
          ? datos.porcentajeNotaGrupal
          : undefined,

      porcentajeNotaIndividual:
        datos.esCalificable &&
        datos.tipoEvaluacion === "MANUAL" &&
        datos.modalidadNota === "GRUPAL_E_INDIVIDUAL"
          ? datos.porcentajeNotaIndividual
          : undefined,
      modalidadNota:
        datos.esCalificable
          ? datos.tipoEvaluacion === "AUTOMATICA"
            ? "INDIVIDUAL"
            : datos.modalidadNota
          : undefined,
      origenGrupo: grupal ? datos.origenGrupo : "NINGUNO",
      dinamicaGrupal: grupal ? datos.dinamicaGrupal : "NINGUNA",
      conjuntoGrupoId:
        grupal && datos.origenGrupo === "PLATAFORMA"
          ? datos.conjuntoGrupoId
          : undefined,
      cantidadMinimaIntegrantes: afinidad
        ? datos.cantidadMinimaIntegrantes
        : undefined,
      cantidadMaximaIntegrantes: afinidad
        ? datos.cantidadMaximaIntegrantes
        : undefined,
      requiereAprobacionEquipos:
        afinidad
          ? false
          : undefined,
      requiereRepresentante: grupal ? true : undefined,
      bloquearEquipoAlResponder: afinidad ? true : undefined,
      minimoComentariosPorEstudiante:
        datos.permitirComentarios &&
        datos.penalizarIncumplimientoComentarios
          ? 1
          : undefined,
      maximoComentariosPorEstudiante:
        undefined,
      penalizarIncumplimientoComentarios:
        puedePenalizarComentarios
          ? Boolean(datos.penalizarIncumplimientoComentarios)
          : false,
      tipoPenalizacionComentarios:
        puedePenalizarComentarios &&
        datos.penalizarIncumplimientoComentarios
          ? datos.tipoPenalizacionComentarios
          : "NINGUNA",
      valorPenalizacionComentarios:
        puedePenalizarComentarios &&
        datos.penalizarIncumplimientoComentarios &&
        datos.tipoPenalizacionComentarios !== "NINGUNA"
          ? datos.valorPenalizacionComentarios
          : undefined,
      palabrasMinimasRespuesta: limitarRespuesta
        ? datos.palabrasMinimasRespuesta
        : undefined,
      palabrasMaximasRespuesta: limitarRespuesta
        ? datos.palabrasMaximasRespuesta
        : undefined,
      palabrasMinimasComentario: undefined,
      palabrasMaximasComentario: undefined,
      fechaMaximaRetraso:
        datos.permitirRetrasos && datos.fechaMaximaRetraso
          ? iso(datos.fechaMaximaRetraso)
          : undefined,
      tipoDescuentoRetraso: datos.permitirRetrasos
        ? datos.tipoDescuentoRetraso
        : "NINGUNO",
      valorDescuentoRetraso:
        datos.permitirRetrasos && datos.tipoDescuentoRetraso !== "NINGUNO"
          ? datos.valorDescuentoRetraso
          : undefined,
    };
    try {
      if (foroId) {
        const { hitoId: _hitoId, ...cambios } = payload;
        await actualizarForo(foroId, cambios);
      } else {
        await crear(payload);
      }
      setExito(true);
      window.setTimeout(() => {
        void onSuccess();
      }, 800);
    } catch {
      /* el hook muestra el error */
    }
  };

  const detalleDescuento = {
    PUNTOS_FIJOS: {
      etiqueta: "Puntos que se descuentan una sola vez",
      ayuda: "Ejemplo: 10 resta diez puntos a cualquier entrega atrasada.",
      paso: 1,
    },
    PORCENTAJE: {
      etiqueta: "Porcentaje que se descuenta",
      ayuda: "Ejemplo: 10 descuenta el 10 % de la nota.",
      paso: 1,
    },
    POR_HORA: {
      etiqueta: "Puntos descontados por cada hora",
      ayuda: "Se resta el valor indicado por cada hora de retraso iniciada.",
      paso: 0.5,
    },
    POR_DIA: {
      etiqueta: "Puntos descontados por cada día",
      ayuda: "Se resta el valor indicado por cada día de retraso iniciado.",
      paso: 0.5,
    },
    NOTA_MAXIMA: {
      etiqueta: "Nota máxima permitida si entrega tarde",
      ayuda:
        "Ejemplo: 70 significa que una entrega tardía no podrá superar 70/100.",
      paso: 1,
    },
  } as const;
  const reglaDescuento =
    datos.tipoDescuentoRetraso && datos.tipoDescuentoRetraso !== "NINGUNO"
      ? detalleDescuento[datos.tipoDescuentoRetraso]
      : null;

  const unidadDescuentoRetraso =
    datos.tipoDescuentoRetraso === "PORCENTAJE"
      ? "%"
      : datos.tipoDescuentoRetraso === "POR_HORA"
        ? "pts/h"
        : datos.tipoDescuentoRetraso === "POR_DIA"
          ? "pts/día"
          : datos.tipoDescuentoRetraso === "NOTA_MAXIMA"
            ? "/100"
            : "pts";

  const unidadPenalizacionComentarios =
    datos.tipoPenalizacionComentarios === "PORCENTAJE"
      ? "%"
      : "pts";

  const ayudas: Record<
    TemaAyuda,
    { titulo: string; introduccion: string; opciones: string[] }
  > = {
    modalidad: {
      titulo: "Modalidad de participación",
      introduccion:
        "Define si cada estudiante participa por su cuenta o como parte de un equipo.",
      opciones: [
        "Individual: cada estudiante publica y recibe su propia valoración.",
        "Grupal: la participación se organiza con equipos registrados o creados por afinidad.",
      ],
    },
    origenGrupos: {
      titulo: "Origen de los grupos",
      introduccion:
        "Indica de dónde saldrán los equipos que participarán en el foro.",
      opciones: [
        "Grupos de plataforma: utiliza los equipos ya registrados en el curso.",
        "Equipos de afinidad: los estudiantes forman sus propios equipos para este foro.",
      ],
    },
    dinamica: {
      titulo: "Dinámica del trabajo grupal",
      introduccion: "Determina cómo participa cada equipo dentro del foro.",
      opciones: [
        "Solo representante: únicamente el representante publica la respuesta principal del equipo; los demás integrantes no crean respuestas ni comentarios de participación.",
        "Aportes dentro del equipo: el representante publica la respuesta principal y los demás integrantes complementan mediante comentarios únicamente en la respuesta de su propio equipo.",
        "Colaboración entre equipos: el representante publica la respuesta principal y los integrantes pueden comentar las respuestas principales de otros equipos.",
      ],
    },
    tipoGrupo: {
      titulo: "Tipo de grupo",
      introduccion:
        "El foro usa automáticamente el único grupo registrado que corresponda.",
      opciones: [
        "Continua: usa los grupos del hito que está abierto actualmente.",
        "Procesual: usa el equipo procesual registrado para todo el semestre.",
      ],
    },
    limites: {
      titulo: "Límites de participación",
      introduccion:
        "Estas reglas son opcionales y sirven para orientar la extensión y la interacción.",
      opciones: [
        "Extensión de respuesta: establece un mínimo y máximo de palabras.",
        "La cantidad mínima de comentarios se configura directamente dentro de la penalización por participación incompleta.",
        "El representante queda exento porque su responsabilidad es publicar la respuesta principal.",
        "Si no necesitas limitar la extensión de la respuesta, deja esa opción desactivada.",
      ],
    },
    visibilidad: {
      titulo: "Visibilidad de respuestas",
      introduccion:
        "Define cuándo podrá un estudiante leer las respuestas de sus compañeros.",
      opciones: [
        "Desde el inicio: las respuestas son visibles inmediatamente.",
        "Después de responder: primero debe publicar su propia respuesta.",
        "Cuando cierre el foro: las respuestas se muestran al finalizar la actividad.",
      ],
    },
    visibilidadForo: {
      titulo: "Visibilidad antes de la apertura",
      introduccion:
        "Define si los estudiantes podrán ver el foro antes de que llegue la hora de participación.",
      opciones: [
        "Mostrar desde la publicación: el estudiante puede leer el tema y ver el cronómetro, pero no puede responder antes de la apertura.",
        "Mostrar desde la apertura: el foro permanece oculto hasta que llegue la fecha y hora programadas.",
        "Esta opción controla la visibilidad; no cambia cuándo se habilita la participación.",
      ],
    },
    retrasos: {
      titulo: "Descuentos por retraso",
      introduccion:
        "Define qué ocurre con la nota cuando una respuesta se entrega después de la fecha límite.",
      opciones: [
        "Sin descuento: conserva la nota obtenida.",
        "Puntos fijos: resta una cantidad una sola vez.",
        "Porcentaje: resta un porcentaje de la nota obtenida.",
        "Por hora o por día: acumula el descuento según el tiempo de retraso.",
        "Nota máxima: limita la mayor nota posible de una entrega tardía.",
      ],
    },
    componente: {
      titulo: "Componente de evaluación",
      introduccion:
        "Indica en qué parte de la calificación del hito se contabilizará el foro.",
      opciones: [
        "Continua: actividades desarrolladas durante el avance del hito.",
        "Procesual: valoración del trabajo o producto procesual correspondiente.",
      ],
    },
    evaluacion: {
      titulo: "Forma de evaluación",
      introduccion: "Define cómo se asignará la calificación del foro.",
      opciones: [
        "Manual: el docente revisa la participación y coloca la nota.",
        "Automática al cumplir: el sistema asigna la nota cuando se cumplen los requisitos configurados.",
      ],
    },
    modalidadNota: {
      titulo: "Modalidad de nota",
      introduccion:
        "Define si la calificación corresponde al estudiante, al equipo o a ambos.",
      opciones: [
        "Individual: cada estudiante obtiene su propia nota.",
        "Grupal: todos los integrantes reciben la nota del equipo.",
        "Grupal e individual: combina ambos resultados con los porcentajes indicados.",
      ],
    },
    penalizacionComentarios: {
      titulo: "Penalización por participación incompleta",
      introduccion:
        "Permite descontar nota cuando un integrante no realiza al menos 1 comentario válido según la dinámica del foro.",
      opciones: [
        "Aportes dentro del equipo: se cuentan los comentarios que cada integrante realiza en la respuesta principal de su propio equipo.",
        "Colaboración entre equipos: se cuentan los comentarios que cada integrante realiza en respuestas principales de otros equipos.",
        "Cada integrante debe realizar al menos 1 comentario válido. El representante queda exento porque su obligación es publicar la respuesta principal.",
        "Puntos fijos: resta directamente la cantidad indicada.",
        "Porcentaje: descuenta el porcentaje configurado sobre la nota obtenida.",
      ],
    },
    adjuntos: {
      titulo: "Archivos adjuntos",
      introduccion:
        "Decide quién puede subir archivos y qué podrá hacerse con ellos.",
      opciones: [
        "Archivos del docente: material inicial del tema.",
        "Archivos en respuestas o comentarios: evidencias enviadas por estudiantes.",
        "Exigir archivo: impide responder sin adjuntar al menos uno.",
        "Permitir descargas: autoriza a descargar los archivos visibles.",
      ],
    },
    permisos: {
      titulo: "Comentarios, edición y eliminación",
      introduccion:
        "Controla las acciones disponibles mientras el foro permanece abierto.",
      opciones: [
        "Comentarios: permite responder a las publicaciones de compañeros.",
        "Editar: permite corregir contenido ya publicado.",
        "Eliminar: permite retirar una respuesta o comentario.",
        "Al cerrar el foro, la edición y eliminación dejan de estar disponibles.",
      ],
    },
  };

  const pasosFormulario = (
    <div className="crear-foro-pasos" aria-label="Progreso del formulario">
      {(
        [
          [1, "Información", Lightbulb],
          [2, "Participación", UsersRound],
          [3, "Evaluación", ClipboardCheck],
          [4, "Confirmación", BadgeCheck],
        ] as const
      ).map(([numero, etiqueta, IconoPaso]) => {
        const completo = paso > numero;
        return (
          <button
            key={numero}
            type="button"
            className={`${paso === numero ? "activo" : ""} ${completo ? "completo" : ""}`}
            onClick={() => irAPaso(numero)}
            aria-current={paso === numero ? "step" : undefined}
          >
            <span className="crear-foro-paso__estado">
              {completo ? <Check size={17} strokeWidth={2.7} /> : numero}
            </span>
            <span className="crear-foro-paso__texto">
              <IconoPaso size={15} strokeWidth={2.25} />
              <small>{etiqueta}</small>
            </span>
          </button>
        );
      })}
    </div>
  );

  const pieFormulario = (
    <>
      <button
        type="button"
        className="crear-foro-btn secundario"
        disabled={guardando}
        onClick={() =>
          paso === 1 ? onClose() : setPaso((paso - 1) as PasoFormulario)
        }
      >
        {paso > 1 && <ArrowLeft size={16} />}
        {paso === 1 ? "Cancelar" : "Anterior"}
      </button>
      {paso < 4 ? (
        <button
          type="button"
          className="crear-foro-btn primario"
          disabled={guardando}
          onClick={() => irAPaso((paso + 1) as PasoFormulario)}
        >
          Siguiente <ArrowRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="crear-foro-btn primario"
          disabled={guardando}
          onClick={() => formularioRef.current?.requestSubmit()}
        >
          <Save size={16} />{" "}
          {guardando
            ? "Guardando…"
            : modoEdicion
              ? "Guardar cambios"
              : "Crear foro"}
        </button>
      )}
    </>
  );

  if (!hitoSeleccionado)
    return (
      <AulaModal
        abierto
        ancho="amplio"
        icono={MessageSquareText}
        etiqueta="Foros"
        titulo={modoEdicion ? "Editar foro" : "Crear nuevo foro"}
        descripcion="Selecciona primero un hito académico desde el encabezado del aula."
        onCerrar={onClose}
        footer={
          <button
            type="button"
            className="crear-foro-btn secundario"
            onClick={onClose}
          >
            Cerrar
          </button>
        }
      >
        <div className="crear-foro-aviso">
          <Info size={20} /> Debes seleccionar un hito para asociar
          correctamente el foro y su evaluación.
        </div>
        <style>{styles}</style>
      </AulaModal>
    );

  return (
    <>
      <AulaModal
        abierto
        ancho="amplio"
        icono={MessageSquareText}
        etiqueta={`Foros · ${hitoSeleccionado.codigo}`}
        titulo={modoEdicion ? "Editar foro" : "Crear nuevo foro"}
        descripcion={
          modoEdicion
            ? "Actualiza la configuración antes de que existan respuestas."
            : "Configura el debate, la participación y su evaluación."
        }
        bloqueado={guardando}
        ariaLabelledBy="crear-foro-title"
        onCerrar={onClose}
        pasos={pasosFormulario}
        footer={pieFormulario}
      >
        <form
          ref={formularioRef}
          className={`crear-foro ${
            paso === 2 && (grupal || limitarRespuesta || limitarComentarios)
              ? "participacion-expandida"
              : ""
          }`}
          onSubmit={enviar}
        >
          <AulaLoadingOverlay
            visible={guardando}
            texto={modoEdicion ? "Guardando cambios…" : "Creando foro…"}
          />
          <div className={`crear-foro-layout paso-${paso}`}>
            <main ref={contenidoRef} className="crear-foro-secciones">
              <SeccionFormulario
                id="informacion"
                titulo="Información del foro"
                descripcion="Tema, descripción, objetivo e instrucciones"
                icono={BookOpenCheck}
                abierta={abiertas.includes("informacion")}
                onToggle={alternar}
              >
                <div className="crear-foro-grid">
                  <label>
                    Título{" "}
                    <input
                      maxLength={180}
                      value={datos.titulo}
                      onChange={(e) => actualizar("titulo", e.target.value)}
                      placeholder="Ej. Debate sobre la nulidad contractual"
                      required
                    />
                    <small>{datos.titulo.length}/180</small>
                  </label>
                  <label>
                    Descripción o planteamiento{" "}
                    <textarea
                      rows={6}
                      maxLength={15000}
                      value={datos.contenido}
                      onChange={(e) => actualizar("contenido", e.target.value)}
                      placeholder="Presenta el caso, problema jurídico o pregunta de debate…"
                      required
                    />
                  </label>
                  <label className="ancho-completo">
                    Objetivo{" "}
                    <textarea
                      rows={3}
                      maxLength={4000}
                      value={datos.objetivo}
                      onChange={(e) => actualizar("objetivo", e.target.value)}
                      placeholder="¿Qué competencia o aprendizaje busca desarrollar?"
                    />
                  </label>
                  <label className="ancho-completo">
                    Instrucciones{" "}
                    <textarea
                      rows={4}
                      maxLength={8000}
                      value={datos.instrucciones}
                      onChange={(e) =>
                        actualizar("instrucciones", e.target.value)
                      }
                      placeholder="Explica cómo responder, qué normativa citar y qué evidencias presentar…"
                    />
                  </label>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                id="participacion"
                titulo="Modalidad y participación"
                descripcion="Individual, grupal y reglas de interacción"
                icono={Users}
                abierta={abiertas.includes("participacion")}
                onToggle={alternar}
                plegable={false}
              >
                <div className="crear-foro-subtitulo-ayuda">
                  <span>Elige cómo participarán los estudiantes</span>
                  <BotonAyuda
                    tema="modalidad"
                    etiqueta="la modalidad de participación"
                    onAbrir={setTemaAyuda}
                  />
                </div>
                <SelectorTipoForo
                  valor={
                    datos.modalidadParticipacion as ModalidadParticipacionForo
                  }
                  onChange={(modalidad) => {
                    actualizar("modalidadParticipacion", modalidad);

                    if (modalidad === "INDIVIDUAL") {
                      setDatos((actual) => ({
                        ...actual,
                        modalidadParticipacion: "INDIVIDUAL",
                        origenGrupo: "NINGUNO",
                        dinamicaGrupal: "NINGUNA",
                        conjuntoGrupoId: undefined,
                        cantidadMinimaIntegrantes: undefined,
                        cantidadMaximaIntegrantes: undefined,
                        requiereAprobacionEquipos: undefined,
                        requiereRepresentante: undefined,
                        bloquearEquipoAlResponder: undefined,
                        modalidadNota:
                          actual.modalidadNota === "INDIVIDUAL"
                            ? actual.modalidadNota
                            : "INDIVIDUAL",
                        porcentajeNotaGrupal: undefined,
                        porcentajeNotaIndividual: undefined,
                        penalizarIncumplimientoComentarios: false,
                        tipoPenalizacionComentarios: "NINGUNA",
                        valorPenalizacionComentarios: undefined,
                      }));
                      return;
                    }

                    setDatos((actual) => {
                      const dinamica =
                        actual.dinamicaGrupal === "NINGUNA"
                          ? "REPRESENTANTE_UNICO"
                          : actual.dinamicaGrupal;

                      return {
                        ...actual,
                        modalidadParticipacion: "GRUPAL",
                        origenGrupo:
                          actual.origenGrupo === "AFINIDAD"
                            ? "AFINIDAD"
                            : "PLATAFORMA",
                        dinamicaGrupal: dinamica,
                        requiereRepresentante: true,
                        permitirComentarios:
                          dinamica !== "REPRESENTANTE_UNICO",
                      };
                    });
                  }}
                />
                {grupal && (
                  <div
                    className={`crear-foro-grid bloque-interno ${
                      afinidad
                        ? "crear-foro-grid--afinidad"
                        : ""
                    }`}
                  >
                    <label>
                      <span className="crear-foro-etiqueta-con-ayuda">
                        Origen de los grupos
                        <BotonAyuda
                          tema="origenGrupos"
                          etiqueta="el origen de los grupos"
                          onAbrir={setTemaAyuda}
                        />
                      </span>
                      <select
                        value={datos.origenGrupo}
                        onChange={(e) => {
                          const origen = e.target
                            .value as EstadoFormulario["origenGrupo"];

                          setDatos((actual) => ({
                            ...actual,
                            origenGrupo: origen,
                            conjuntoGrupoId:
                              origen === "PLATAFORMA"
                                ? actual.conjuntoGrupoId
                                : undefined,
                            cantidadMinimaIntegrantes:
                              origen === "AFINIDAD"
                                ? actual.cantidadMinimaIntegrantes ?? 2
                                : undefined,
                            cantidadMaximaIntegrantes:
                              origen === "AFINIDAD"
                                ? actual.cantidadMaximaIntegrantes ?? 5
                                : undefined,
                            requiereAprobacionEquipos:
                              origen === "AFINIDAD"
                                ? false
                                : undefined,
                            // Toda modalidad grupal requiere representante.
                            requiereRepresentante: true,
                            // Los equipos por afinidad quedan congelados al participar
                            // para conservar la composición usada en respuestas y notas.
                            bloquearEquipoAlResponder:
                              origen === "AFINIDAD"
                                ? true
                                : undefined,
                          }));
                        }}
                      >
                        <option value="PLATAFORMA">Grupos de plataforma</option>
                        <option value="AFINIDAD">Equipos de afinidad</option>
                      </select>
                    </label>
                    <label>
                      <span className="crear-foro-etiqueta-con-ayuda">
                        Dinámica
                        <BotonAyuda
                          tema="dinamica"
                          etiqueta="la dinámica grupal"
                          onAbrir={setTemaAyuda}
                        />
                      </span>
                      <select
                        value={datos.dinamicaGrupal}
                        onChange={(e) => {
                          const dinamica =
                            e.target.value as EstadoFormulario["dinamicaGrupal"];

                          setDatos((actual) => ({
                            ...actual,
                            dinamicaGrupal: dinamica,
                            // Las tres dinámicas grupales necesitan representante.
                            requiereRepresentante: true,
                            // En "solo representante" no existen comentarios de participación.
                            // En las otras dos dinámicas los comentarios forman parte del flujo.
                            permitirComentarios:
                              dinamica !== "REPRESENTANTE_UNICO",
                            permitirAdjuntosComentario:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? false
                                : actual.permitirAdjuntosComentario,
                            permitirEditarComentarios:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? false
                                : actual.permitirEditarComentarios,
                            permitirEliminarComentarios:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? false
                                : actual.permitirEliminarComentarios,
                            minimoComentariosPorEstudiante:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? undefined
                                : actual.minimoComentariosPorEstudiante,
                            maximoComentariosPorEstudiante:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? undefined
                                : actual.maximoComentariosPorEstudiante,
                            penalizarIncumplimientoComentarios:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? false
                                : actual.penalizarIncumplimientoComentarios,
                            tipoPenalizacionComentarios:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? "NINGUNA"
                                : actual.tipoPenalizacionComentarios,
                            valorPenalizacionComentarios:
                              dinamica === "REPRESENTANTE_UNICO"
                                ? undefined
                                : actual.valorPenalizacionComentarios,
                          }));

                          if (dinamica === "REPRESENTANTE_UNICO") {
                            setLimitarComentarios(false);
                          }
                        }}
                      >
                        <option value="REPRESENTANTE_UNICO">
                          Solo representante
                        </option>
                        <option value="PARTICIPACION_DISTRIBUIDA">
                          Aportes dentro del equipo
                        </option>
                        <option value="COLABORACION_ABIERTA">
                          Colaboración entre equipos
                        </option>
                      </select>
                    </label>
                    {datos.origenGrupo === "PLATAFORMA" && (
                      <div className="ancho-completo crear-foro-grupos-plataforma">
                        <div className="crear-foro-subtitulo-ayuda">
                          <span>Grupo que participará</span>
                          <BotonAyuda
                            tema="tipoGrupo"
                            etiqueta="los grupos de Continua y Procesual"
                            onAbrir={setTemaAyuda}
                          />
                        </div>
                        <div
                          className="crear-foro-tipo-grupo"
                          role="group"
                          aria-label="Tipo de grupo"
                        >
                          {(["CONTINUA", "PROCESUAL"] as const).map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              className={
                                tipoGrupoPlataforma === tipo ? "activo" : ""
                              }
                              onClick={() => setTipoGrupoPlataforma(tipo)}
                            >
                              {tipo === "CONTINUA"
                                ? "Grupos del hito"
                                : "Equipo procesual del semestre"}
                            </button>
                          ))}
                        </div>
                        {cargandoConjuntos ? (
                          <div className="crear-foro-nota">
                            <Info size={17} /> Cargando grupos registrados…
                          </div>
                        ) : errorConjuntos ? (
                          <div className="crear-foro-aviso">
                            <Info size={17} /> {errorConjuntos}
                          </div>
                        ) : conjuntosDisponibles.length === 0 ? (
                          <div className="crear-foro-aviso">
                            <Info size={17} />
                            <span>
                              <strong>
                                {tipoGrupoPlataforma === "CONTINUA"
                                  ? "No hay grupos disponibles para este hito."
                                  : "No hay grupos procesuales disponibles."}
                              </strong>
                              <small>
                                {tipoGrupoPlataforma === "CONTINUA"
                                  ? "El docente todavía no registró los grupos de evaluación continua correspondientes."
                                  : "El docente todavía no registró los grupos procesuales del curso."}
                              </small>
                            </span>
                          </div>
                        ) : conjuntosDisponibles.length > 1 ? (
                          <label className="crear-foro-selector-conjunto">
                            Selecciona el conjunto de grupos
                            <select
                              value={datos.conjuntoGrupoId ?? ""}
                              onChange={(e) =>
                                actualizar(
                                  "conjuntoGrupoId",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                )
                              }
                            >
                              <option value="">Seleccionar…</option>
                              {conjuntosDisponibles.map((conjunto) => (
                                <option key={conjunto.id} value={conjunto.id}>
                                  {conjunto.nombre} · {conjunto.totalGrupos} equipos
                                </option>
                              ))}
                            </select>
                            <small>
                              El foro utilizará exactamente este conjunto.
                            </small>
                          </label>
                        ) : (
                          <div className="crear-foro-grupo-confirmado">
                            <Check size={18} />
                            <div>
                              <strong>{conjuntosDisponibles[0].nombre}</strong>
                              <small>
                                {conjuntosDisponibles[0].alcance === "CURSO"
                                  ? "Todo el semestre"
                                  : (conjuntosDisponibles[0].hito?.nombre ??
                                    "Hito actual")}
                                {" · "}
                                {conjuntosDisponibles[0].totalGrupos} equipos
                                {" · "}
                                {conjuntosDisponibles[0].totalIntegrantes}{" "}
                                estudiantes
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {afinidad && (
                      <>
                        <div className="crear-foro-total-alumnos">
                          <span>
                            Total alumnos
                          </span>

                          <div>
                            <UsersRound
                              size={20}
                            />

                            <strong>
                              {
                                curso.estudiantesInscritos
                              }
                            </strong>
                          </div>

                          <small>
                            Estudiantes inscritos en el curso
                          </small>
                        </div>

                        <ContadorNumero
                          etiqueta="Mínimo de integrantes"
                          minimo={2}
                          maximo={Math.max(
                            2,
                            curso.estudiantesInscritos,
                          )}
                          valor={datos.cantidadMinimaIntegrantes}
                          onChange={(v) => {
                            actualizar(
                              "cantidadMinimaIntegrantes",
                              v,
                            );

                            if (
                              Number(
                                datos.cantidadMaximaIntegrantes ??
                                  0,
                              ) <
                              v
                            ) {
                              actualizar(
                                "cantidadMaximaIntegrantes",
                                v,
                              );
                            }
                          }}
                        />

                        <ContadorNumero
                          etiqueta="Máximo de integrantes"
                          minimo={Math.max(
                            2,
                            Number(
                              datos.cantidadMinimaIntegrantes ??
                                2,
                            ),
                          )}
                          maximo={Math.max(
                            2,
                            curso.estudiantesInscritos,
                          )}
                          valor={datos.cantidadMaximaIntegrantes}
                          onChange={(v) =>
                            actualizar(
                              "cantidadMaximaIntegrantes",
                              v,
                            )
                          }
                        />

                        <div className="crear-foro-reglas-afinidad">
                          <div>
                            <Check size={16} />
                            <span>
                              <strong>Representante obligatorio</strong>
                              <small>
                                El creador del equipo será su representante inicial.
                              </small>
                            </span>
                          </div>
                          <div>
                            <Check size={16} />
                            <span>
                              <strong>Registro automático</strong>
                              <small>
                                El equipo queda creado sin aprobación del docente.
                              </small>
                            </span>
                          </div>
                          <div>
                            <Check size={16} />
                            <span>
                              <strong>Bloqueo al participar</strong>
                              <small>
                                Después de la primera participación ya no podrán cambiarse los integrantes.
                              </small>
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="crear-foro-subtitulo-ayuda crear-foro-subtitulo-ayuda--separado">
                  <span>Reglas de participación</span>
                  <BotonAyuda
                    tema="limites"
                    etiqueta="los límites de participación"
                    onAbrir={setTemaAyuda}
                  />
                </div>
                <div className="crear-foro-grid bloque-interno">
                  <ConfigSwitchForo
                    activo={limitarRespuesta}
                    onChange={setLimitarRespuesta}
                    titulo="Definir extensión de la respuesta"
                    descripcion="Opcional. Déjalo apagado para un tema libre sin límite de palabras."
                  />

                  {limitarRespuesta && (
                    <>
                      <ContadorNumero
                        etiqueta="Mínimo de palabras en la respuesta"
                        minimo={1}
                        maximo={5000}
                        paso={10}
                        valor={datos.palabrasMinimasRespuesta}
                        onChange={(v) =>
                          actualizar("palabrasMinimasRespuesta", v)
                        }
                      />
                      <ContadorNumero
                        etiqueta="Máximo de palabras en la respuesta"
                        minimo={1}
                        maximo={10000}
                        paso={10}
                        valor={datos.palabrasMaximasRespuesta}
                        onChange={(v) =>
                          actualizar("palabrasMaximasRespuesta", v)
                        }
                      />
                    </>
                  )}

                  <label>
                    <span className="crear-foro-etiqueta-con-ayuda">
                      Visibilidad de respuestas
                      <BotonAyuda
                        tema="visibilidad"
                        etiqueta="la visibilidad de respuestas"
                        onAbrir={setTemaAyuda}
                      />
                    </span>
                    <select
                      value={datos.visibilidadRespuestas}
                      onChange={(e) =>
                        actualizar(
                          "visibilidadRespuestas",
                          e.target
                            .value as EstadoFormulario["visibilidadRespuestas"],
                        )
                      }
                    >
                      <option value="DESDE_EL_INICIO">Desde el inicio</option>
                      <option value="DESPUES_DE_RESPONDER">
                        Después de responder
                      </option>
                      <option value="AL_CERRAR">Cuando cierre el foro</option>
                    </select>
                  </label>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                id="fechas"
                titulo="Fechas y retrasos"
                descripcion="Define cuándo inicia, hasta cuándo se responde y si existe tolerancia."
                icono={CalendarDays}
                abierta={abiertas.includes("fechas")}
                onToggle={alternar}
              >
                <div className="crear-foro-fechas-grid">
                  <label className="crear-foro-fecha-card">
                    <span className="crear-foro-fecha-card__titulo">
                      Apertura del foro
                    </span>

                    <input
                      type="datetime-local"
                      min={modoEdicion ? undefined : minimoFechaLocal()}
                      value={datos.fechaApertura}
                      onChange={(e) =>
                        actualizar(
                          "fechaApertura",
                          e.target.value,
                        )
                      }
                      required
                    />

                    <small>
                      {modoEdicion
                        ? "Define desde qué momento se habilitará la participación."
                        : esFechaPasada(datos.fechaApertura)
                          ? "Selecciona una fecha y hora actual o futura."
                          : "No puedes crear el foro con una apertura en el pasado."}
                    </small>
                  </label>

                  <label className="crear-foro-fecha-card">
                    <span className="crear-foro-fecha-card__titulo">
                      Cierre del foro
                    </span>

                    <input
                      type="datetime-local"
                      min={
                        datos.fechaApertura
                          ? datos.fechaApertura
                          : modoEdicion
                            ? undefined
                            : minimoFechaLocal()
                      }
                      value={datos.fechaLimite}
                      onChange={(e) => {
                        const nuevaFecha =
                          e.target.value;

                        setDatos((actual) => ({
                          ...actual,
                          fechaLimite:
                            nuevaFecha,
                          fechaCierre:
                            actual.permitirRetrasos
                              ? actual.fechaCierre
                              : nuevaFecha,
                        }));
                      }}
                      required
                    />

                    <small>
                      {modoEdicion
                        ? "Hasta esta fecha las participaciones se consideran dentro de plazo."
                        : esFechaPasada(datos.fechaLimite)
                          ? "Selecciona una fecha y hora futura."
                          : "El cierre debe quedar programado para una fecha futura."}
                    </small>
                  </label>
                </div>

                <div className="crear-foro-retraso-card">
                  <ConfigSwitchForo
                    activo={datos.permitirRetrasos}
                    onChange={(v) =>
                      setDatos((actual) => ({
                        ...actual,
                        permitirRetrasos:
                          v,
                        fechaMaximaRetraso:
                          v
                            ? actual.fechaMaximaRetraso ??
                              actual.fechaCierre ??
                              actual.fechaLimite
                            : undefined,
                        fechaCierre:
                          v
                            ? actual.fechaMaximaRetraso ??
                              actual.fechaCierre ??
                              actual.fechaLimite
                            : actual.fechaLimite,
                        tipoDescuentoRetraso:
                          v
                            ? actual.tipoDescuentoRetraso
                            : "NINGUNO",
                        valorDescuentoRetraso:
                          v
                            ? actual.valorDescuentoRetraso
                            : undefined,
                      }))
                    }
                    titulo="Aceptar participaciones con retraso"
                    descripcion="Añade un segundo cierre para aceptar respuestas tardías después del cierre normal."
                  />
                </div>

                {datos.permitirRetrasos && (
                  <div className="crear-foro-retraso-panel">
                    <div className="crear-foro-retraso-panel__titulo">
                      <span>
                        Configuración del retraso
                      </span>

                      <small>
                        Define hasta cuándo se aceptará y si tendrá penalización.
                      </small>
                    </div>

                    <div className="crear-foro-retraso-panel__grid">
                      <label className="crear-foro-fecha-card crear-foro-fecha-card--compacta">
                        <span className="crear-foro-fecha-card__titulo">
                          Cierre con retraso
                        </span>

                        <input
                          type="datetime-local"
                          min={datos.fechaLimite || minimoFechaLocal()}
                          value={
                            datos.fechaMaximaRetraso ??
                            datos.fechaCierre
                          }
                          onChange={(e) => {
                            const nuevaFecha =
                              e.target.value;

                            setDatos((actual) => ({
                              ...actual,
                              fechaMaximaRetraso:
                                nuevaFecha,
                              fechaCierre:
                                nuevaFecha,
                            }));
                          }}
                          required
                        />

                        <small>
                          Último momento para aceptar respuestas tardías.
                        </small>
                      </label>

                      <label className="crear-foro-retraso-panel__campo">
                        <span className="crear-foro-etiqueta-con-ayuda">
                          Tipo de descuento

                          <BotonAyuda
                            tema="retrasos"
                            etiqueta="los descuentos por retraso"
                            onAbrir={setTemaAyuda}
                          />
                        </span>

                        <select
                          value={datos.tipoDescuentoRetraso}
                          onChange={(e) =>
                            setDatos((actual) => ({
                              ...actual,
                              tipoDescuentoRetraso:
                                e.target.value as EstadoFormulario["tipoDescuentoRetraso"],
                              valorDescuentoRetraso:
                                undefined,
                            }))
                          }
                        >
                          <option value="NINGUNO">
                            Sin descuento
                          </option>
                          <option value="PUNTOS_FIJOS">
                            Puntos fijos
                          </option>
                          <option value="PORCENTAJE">
                            Porcentaje
                          </option>
                          <option value="POR_HORA">
                            Por hora
                          </option>
                          <option value="POR_DIA">
                            Por día
                          </option>
                          <option value="NOTA_MAXIMA">
                            Nota máxima
                          </option>
                        </select>

                        <small>
                          Elige si las respuestas tardías tendrán penalización.
                        </small>
                      </label>

                      {reglaDescuento && (
                        <label className="crear-foro-retraso-panel__campo crear-foro-retraso-panel__valor">
                          <span>
                            {reglaDescuento.etiqueta}
                          </span>

                          <div className="crear-foro-valor-compacto">
                            <input
                              type="text"
                              inputMode="decimal"
                              min={reglaDescuento.paso}
                              max={100}
                              step={reglaDescuento.paso}
                              value={datos.valorDescuentoRetraso ?? ""}
                              onChange={(e) => {
                                const limpio =
                                  e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );

                                actualizar(
                                  "valorDescuentoRetraso",
                                  limpio === ""
                                    ? undefined
                                    : Math.min(
                                        100,
                                        Number(limpio),
                                      ),
                                );
                              }}
                              placeholder="0"
                              required
                            />

                            <span>
                              {unidadDescuentoRetraso}
                            </span>
                          </div>

                          <small>
                            {reglaDescuento.ayuda}
                          </small>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="crear-foro-visibilidad-compacta">
                  <div className="crear-foro-visibilidad-compacta__texto">
                    <div className="crear-foro-subtitulo-ayuda">
                      <span>
                        Visibilidad antes de la apertura
                      </span>

                      <BotonAyuda
                        tema="visibilidadForo"
                        etiqueta="la visibilidad del foro antes de abrir"
                        onAbrir={setTemaAyuda}
                      />
                    </div>

                    <small>
                      Decide si el estudiante podrá conocer el foro antes de que comience la participación.
                    </small>
                  </div>

                  <select
                    value={
                      datos.visibleAntesDeApertura
                        ? "PUBLICACION"
                        : "APERTURA"
                    }
                    onChange={(e) =>
                      actualizar(
                        "visibleAntesDeApertura",
                        e.target.value ===
                          "PUBLICACION",
                      )
                    }
                    aria-label="Visibilidad antes de la apertura"
                  >
                    <option value="PUBLICACION">
                      Mostrar desde la publicación
                    </option>

                    <option value="APERTURA">
                      Mostrar desde la apertura
                    </option>
                  </select>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                id="evaluacion"
                titulo="Calificación y evaluación"
                descripcion="Continua, procesual, automática o manual"
                icono={GraduationCap}
                abierta={abiertas.includes("evaluacion")}
                onToggle={alternar}
              >
                <ConfigSwitchForo
                  activo={datos.esCalificable}
                  onChange={(v) => {
                    setDatos((actual) => ({
                      ...actual,
                      esCalificable: v,
                      penalizarIncumplimientoComentarios:
                        v
                          ? actual.penalizarIncumplimientoComentarios
                          : false,
                      tipoPenalizacionComentarios:
                        v
                          ? actual.tipoPenalizacionComentarios
                          : "NINGUNA",
                      valorPenalizacionComentarios:
                        v
                          ? actual.valorPenalizacionComentarios
                          : undefined,
                      minimoComentariosPorEstudiante:
                        v
                          ? actual.minimoComentariosPorEstudiante
                          : undefined,
                      maximoComentariosPorEstudiante:
                        undefined,
                    }));

                    if (!v) {
                      setLimitarComentarios(false);
                    }
                  }}
                  titulo="Actividad calificable"
                  descripcion="Siempre se registra sobre 100 y luego se convierte en el libro de calificaciones."
                />
                {datos.esCalificable && (
                  <div className="crear-foro-grid bloque-interno">
                    <label>
                      <span className="crear-foro-etiqueta-con-ayuda">
                        Componente
                        <BotonAyuda
                          tema="componente"
                          etiqueta="el componente de evaluación"
                          onAbrir={setTemaAyuda}
                        />
                      </span>
                      <select
                        value={datos.componente ?? ""}
                        onChange={(e) =>
                          actualizar(
                            "componente",
                            e.target.value as EstadoFormulario["componente"],
                          )
                        }
                        required
                      >
                        <option value="">Seleccionar…</option>
                        <option value="CONTINUA">
                          Evaluación continua
                        </option>
                        <option value="PROCESUAL">
                          Evaluación procesual
                        </option>
                      </select>
                    </label>
                    <label>
                      <span className="crear-foro-etiqueta-con-ayuda">
                        Evaluación
                        <BotonAyuda
                          tema="evaluacion"
                          etiqueta="la forma de evaluación"
                          onAbrir={setTemaAyuda}
                        />
                      </span>
                      <select
                        value={datos.tipoEvaluacion}
                        onChange={(e) => {
                          const tipo =
                            e.target.value as EstadoFormulario["tipoEvaluacion"];

                          setDatos((actual) => ({
                            ...actual,
                            tipoEvaluacion:
                              tipo,

                            calificacionAutomaticaAlCumplir:
                              tipo === "AUTOMATICA",

                            /*
                             * En evaluación automática la modalidad de nota
                             * no se configura desde la interfaz.
                             * Se conserva INDIVIDUAL como valor técnico
                             * compatible con el contrato actual del backend.
                             */
                            modalidadNota:
                              tipo === "AUTOMATICA"
                                ? "INDIVIDUAL"
                                : actual.modalidadNota,

                            porcentajeNotaGrupal:
                              tipo === "AUTOMATICA"
                                ? undefined
                                : actual.porcentajeNotaGrupal,

                            porcentajeNotaIndividual:
                              tipo === "AUTOMATICA"
                                ? undefined
                                : actual.porcentajeNotaIndividual,
                          }));
                        }}
                      >
                        <option value="MANUAL">Manual</option>
                        <option value="AUTOMATICA">
                          Automática al cumplir
                        </option>
                      </select>
                    </label>
                    {datos.tipoEvaluacion === "MANUAL" && (
                      <>
                        <label>
                          <span className="crear-foro-etiqueta-con-ayuda">
                            Modalidad de nota
                            <BotonAyuda
                              tema="modalidadNota"
                              etiqueta="la modalidad de nota"
                              onAbrir={setTemaAyuda}
                            />
                          </span>

                          <select
                            value={datos.modalidadNota}
                            onChange={(e) =>
                              actualizar(
                                "modalidadNota",
                                e.target
                                  .value as EstadoFormulario["modalidadNota"],
                              )
                            }
                          >
                            <option value="INDIVIDUAL">
                              Individual
                            </option>

                            {grupal && (
                              <option value="GRUPAL">
                                Grupal
                              </option>
                            )}

                            {grupal && (
                              <option value="GRUPAL_E_INDIVIDUAL">
                                Grupal e individual
                              </option>
                            )}
                          </select>
                        </label>

                        {datos.modalidadNota ===
                          "GRUPAL_E_INDIVIDUAL" && (
                          <>
                            <ContadorNumero
                              etiqueta="Porcentaje grupal"
                              paso={5}
                              valor={datos.porcentajeNotaGrupal}
                              onChange={(v) =>
                                actualizar(
                                  "porcentajeNotaGrupal",
                                  v,
                                )
                              }
                            />

                            <ContadorNumero
                              etiqueta="Porcentaje individual"
                              paso={5}
                              valor={datos.porcentajeNotaIndividual}
                              onChange={(v) =>
                                actualizar(
                                  "porcentajeNotaIndividual",
                                  v,
                                )
                              }
                            />
                          </>
                        )}
                      </>
                    )}

                    {datos.tipoEvaluacion === "AUTOMATICA" && (
                      <div className="ancho-completo crear-foro-evaluacion-automatica">
                        <BadgeCheck size={18} />

                        <span>
                          <strong>
                            Calificación automática
                          </strong>

                          <small>
                            El sistema asignará la nota al comprobar que se
                            cumplieron las reglas de participación configuradas.
                            No es necesario elegir una modalidad de nota.
                          </small>
                        </span>
                      </div>
                    )}
                    {dinamicaUsaComentarios && (
                      <div className="ancho-completo crear-foro-penalizacion-comentarios">
                        <div className="crear-foro-penalizacion-comentarios__titulo">
                          <span className="crear-foro-penalizacion-comentarios__icono">
                            <MessageSquareText size={18} />
                          </span>

                          <div>
                            <span className="crear-foro-etiqueta-con-ayuda">
                              <strong>
                                Penalización por participación incompleta
                              </strong>

                              <BotonAyuda
                                tema="penalizacionComentarios"
                                etiqueta="la penalización por participación incompleta"
                                onAbrir={setTemaAyuda}
                              />
                            </span>

                            <small>
                              Solo afecta a integrantes. El representante queda exento.
                            </small>
                          </div>
                        </div>

                        <ConfigSwitchForo
                          activo={
                            Boolean(datos.penalizarIncumplimientoComentarios)
                          }
                          onChange={(activo) => {
                            setLimitarComentarios(activo);

                            setDatos((actual) => ({
                              ...actual,
                              penalizarIncumplimientoComentarios:
                                activo,
                              minimoComentariosPorEstudiante:
                                activo
                                  ? 1
                                  : undefined,
                              maximoComentariosPorEstudiante:
                                undefined,
                              tipoPenalizacionComentarios:
                                activo
                                  ? actual.tipoPenalizacionComentarios ===
                                    "NINGUNA"
                                    ? "PUNTOS_FIJOS"
                                    : actual.tipoPenalizacionComentarios
                                  : "NINGUNA",
                              valorPenalizacionComentarios:
                                activo
                                  ? actual.valorPenalizacionComentarios
                                  : undefined,
                            }));
                          }}
                          titulo="Penalizar si no cumple"
                          descripcion={
                            datos.dinamicaGrupal ===
                            "PARTICIPACION_DISTRIBUIDA"
                              ? "Cada integrante debe realizar al menos 1 aporte en la respuesta de su propio equipo."
                              : "Cada integrante debe realizar al menos 1 comentario en respuestas de otros equipos."
                          }
                        />

                        {datos.penalizarIncumplimientoComentarios && (
                          <>
                            <div className="crear-foro-penalizacion-comentarios__grid crear-foro-penalizacion-comentarios__grid--compacta">
                              <label>
                                Tipo de penalización

                                <select
                                  value={
                                    datos.tipoPenalizacionComentarios ??
                                    "PUNTOS_FIJOS"
                                  }
                                  onChange={(e) =>
                                    setDatos((actual) => ({
                                      ...actual,
                                      tipoPenalizacionComentarios:
                                        e.target
                                          .value as TipoPenalizacionComentarios,
                                      valorPenalizacionComentarios:
                                        undefined,
                                    }))
                                  }
                                >
                                  <option value="PUNTOS_FIJOS">
                                    Puntos fijos
                                  </option>

                                  <option value="PORCENTAJE">
                                    Porcentaje
                                  </option>
                                </select>

                                <small>
                                  {datos.tipoPenalizacionComentarios ===
                                  "PORCENTAJE"
                                    ? "Descuenta un porcentaje de la nota obtenida."
                                    : "Resta directamente puntos de la nota."}
                                </small>
                              </label>

                              <label>
                                {datos.tipoPenalizacionComentarios ===
                                "PORCENTAJE"
                                  ? "Porcentaje que se descuenta"
                                  : "Puntos que se descuentan"}

                                <div className="crear-foro-valor-compacto crear-foro-valor-compacto--comentarios">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      datos.valorPenalizacionComentarios ?? ""
                                    }
                                    onChange={(e) => {
                                      const limpio =
                                        e.target.value.replace(
                                          /[^0-9.]/g,
                                          "",
                                        );

                                      const numero =
                                        limpio === ""
                                          ? undefined
                                          : Math.min(
                                              100,
                                              Number(limpio),
                                            );

                                      actualizar(
                                        "valorPenalizacionComentarios",
                                        numero,
                                      );
                                    }}
                                    placeholder="0"
                                  />

                                  <span>
                                    {unidadPenalizacionComentarios}
                                  </span>
                                </div>

                                <small>
                                  {datos.tipoPenalizacionComentarios ===
                                  "PORCENTAJE"
                                    ? "Ejemplo: nota 80 y 30 % de penalización → 56."
                                    : "Ejemplo: nota 80 y 30 puntos de penalización → 50."}
                                </small>
                              </label>
                            </div>

                            <div className="crear-foro-penalizacion-comentarios__regla">
                              <span>
                                <Check size={15} />
                                1 comentario mínimo por integrante
                              </span>

                              <span>
                                <Check size={15} />
                                Representante exento
                              </span>

                              <span>
                                <Check size={15} />
                                Penalización individual
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <ConfigSwitchForo
                      activo={datos.participaEnPromedio}
                      onChange={(v) => actualizar("participaEnPromedio", v)}
                      titulo="Incluir en el promedio"
                      descripcion="Aporta al componente Continua o Procesual del hito."
                    />
                  </div>
                )}
              </SeccionFormulario>

              <SeccionFormulario
                id="archivos"
                titulo="Archivos adjuntos"
                descripcion="Ubicación, cantidad, tamaño y formatos"
                icono={FileUp}
                abierta={abiertas.includes("archivos")}
                onToggle={alternar}
              >
                <div className="crear-foro-subtitulo-ayuda">
                  <span>Configura los archivos permitidos</span>
                  <BotonAyuda
                    tema="adjuntos"
                    etiqueta="los archivos adjuntos"
                    onAbrir={setTemaAyuda}
                  />
                </div>
                <div className="crear-foro-grid">
                  <ConfigSwitchForo
                    activo={datos.permitirAdjuntosTema}
                    onChange={(v) => actualizar("permitirAdjuntosTema", v)}
                    titulo="Archivos del docente"
                  />
                  <ConfigSwitchForo
                    activo={datos.permitirAdjuntosRespuesta}
                    onChange={(v) =>
                      setDatos((actual) => ({
                        ...actual,
                        permitirAdjuntosRespuesta: v,
                        exigirAdjuntoRespuesta: v
                          ? actual.exigirAdjuntoRespuesta
                          : false,
                      }))
                    }
                    titulo="Archivos en respuestas"
                  />
                  {datos.permitirComentarios && (
                    <ConfigSwitchForo
                      activo={datos.permitirAdjuntosComentario}
                      onChange={(v) =>
                        actualizar("permitirAdjuntosComentario", v)
                      }
                      titulo="Archivos en comentarios"
                    />
                  )}
                  {datos.permitirAdjuntosRespuesta && (
                    <ConfigSwitchForo
                      activo={datos.exigirAdjuntoRespuesta}
                      onChange={(v) => actualizar("exigirAdjuntoRespuesta", v)}
                      titulo="Exigir archivo en la respuesta"
                      descripcion="La respuesta no podrá enviarse sin al menos un archivo."
                    />
                  )}
                  {(datos.permitirAdjuntosTema ||
                    datos.permitirAdjuntosRespuesta ||
                    datos.permitirAdjuntosComentario) && (
                    <ConfigSwitchForo
                      activo={datos.permitirDescargaAdjuntos}
                      onChange={(v) =>
                        actualizar("permitirDescargaAdjuntos", v)
                      }
                      titulo="Permitir descargas"
                    />
                  )}
                  {(datos.permitirAdjuntosTema ||
                    datos.permitirAdjuntosRespuesta ||
                    datos.permitirAdjuntosComentario) && (
                    <>
                      <div className="crear-foro-nota ancho-completo">
                        <Info size={17} /> Límites predeterminados: 10 MB por
                        archivo, 5 archivos del docente, 5 por respuesta y 2 por
                        comentario. El docente no necesita configurarlos.
                      </div>
                      <fieldset className="ancho-completo">
                        <legend>Formatos permitidos</legend>
                        <div className="crear-foro-formatos">
                          {[
                            "pdf",
                            "doc",
                            "docx",
                            "jpg",
                            "jpeg",
                            "png",
                            "webp",
                          ].map((ext) => (
                            <label key={ext}>
                              <input
                                type="checkbox"
                                checked={datos.extensionesPermitidas.includes(
                                  ext,
                                )}
                                onChange={(e) =>
                                  actualizar(
                                    "extensionesPermitidas",
                                    e.target.checked
                                      ? [...datos.extensionesPermitidas, ext]
                                      : datos.extensionesPermitidas.filter(
                                          (x) => x !== ext,
                                        ),
                                  )
                                }
                              />
                              <span className="crear-foro-formato-check">
                                {datos.extensionesPermitidas.includes(ext) && (
                                  <Check size={16} />
                                )}
                              </span>
                              <span>{ext.toUpperCase()}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                id="permisos"
                titulo="Comentarios, edición y eliminación"
                descripcion="Acciones permitidas mientras el foro está abierto"
                icono={Settings2}
                abierta={abiertas.includes("permisos")}
                onToggle={alternar}
              >
                <div className="crear-foro-subtitulo-ayuda">
                  <span>Configura las acciones disponibles</span>
                  <BotonAyuda
                    tema="permisos"
                    etiqueta="los permisos del foro"
                    onAbrir={setTemaAyuda}
                  />
                </div>
                <div className="crear-foro-grid">
                  {!grupal ? (
                    <ConfigSwitchForo
                      activo={datos.permitirComentarios}
                      onChange={(v) => {
                        setLimitarComentarios(v ? limitarComentarios : false);
                        setDatos((actual) => ({
                          ...actual,
                          permitirComentarios: v,
                          permitirAdjuntosComentario: v
                            ? actual.permitirAdjuntosComentario
                            : false,
                          permitirEditarComentarios: v
                            ? actual.permitirEditarComentarios
                            : false,
                          permitirEliminarComentarios: v
                            ? actual.permitirEliminarComentarios
                            : false,
                        }));
                      }}
                      titulo="Permitir comentarios"
                    />
                  ) : (
                    <div className="crear-foro-regla-dinamica ancho-completo">
                      <Info size={17} />
                      <span>
                        <strong>
                          {datos.dinamicaGrupal === "REPRESENTANTE_UNICO"
                            ? "Comentarios desactivados por la dinámica"
                            : "Comentarios habilitados por la dinámica"}
                        </strong>
                        <small>
                          {datos.dinamicaGrupal === "REPRESENTANTE_UNICO"
                            ? "Solo el representante participa mediante la respuesta principal."
                            : datos.dinamicaGrupal === "PARTICIPACION_DISTRIBUIDA"
                              ? "Los integrantes comentan únicamente la respuesta principal de su propio equipo."
                              : "Los integrantes pueden comentar las respuestas principales de otros equipos."}
                        </small>
                      </span>
                    </div>
                  )}
                  <ConfigSwitchForo
                    activo={datos.permitirEditarRespuestas}
                    onChange={(v) => actualizar("permitirEditarRespuestas", v)}
                    titulo="Editar respuestas"
                  />
                  <ConfigSwitchForo
                    activo={datos.permitirEliminarRespuestas}
                    onChange={(v) =>
                      actualizar("permitirEliminarRespuestas", v)
                    }
                    titulo="Eliminar respuestas"
                  />
                  {datos.permitirComentarios && (
                    <ConfigSwitchForo
                      activo={datos.permitirEditarComentarios}
                      onChange={(v) =>
                        actualizar("permitirEditarComentarios", v)
                      }
                      titulo="Editar comentarios"
                    />
                  )}
                  {datos.permitirComentarios && (
                    <ConfigSwitchForo
                      activo={datos.permitirEliminarComentarios}
                      onChange={(v) =>
                        actualizar("permitirEliminarComentarios", v)
                      }
                      titulo="Eliminar comentarios"
                    />
                  )}
                </div>
                <div className="crear-foro-nota">
                  <Info size={17} /> Al cerrar el foro ya no podrán editarse ni
                  eliminarse respuestas o comentarios. Si el docente reabre el
                  foro, estas opciones volverán a estar disponibles.
                </div>
              </SeccionFormulario>
            </main>
          </div>
          <style>{styles}</style>
        </form>
      </AulaModal>
      {temaAyuda && (
        <div
          className="crear-foro-ayuda-modal__fondo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setTemaAyuda(null);
          }}
        >
          <section
            className="crear-foro-ayuda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crear-foro-ayuda-titulo"
          >
            <header>
              <span>
                <Info size={20} />
              </span>
              <div>
                <small>Ayuda</small>
                <h3 id="crear-foro-ayuda-titulo">{ayudas[temaAyuda].titulo}</h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar ayuda"
                onClick={() => setTemaAyuda(null)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="crear-foro-ayuda-modal__contenido">
              <p>{ayudas[temaAyuda].introduccion}</p>
              <ul>
                {ayudas[temaAyuda].opciones.map((opcion) => (
                  <li key={opcion}>
                    <Check size={16} />
                    <span>{opcion}</span>
                  </li>
                ))}
              </ul>
            </div>
            <footer>
              <button type="button" onClick={() => setTemaAyuda(null)}>
                Entendido
              </button>
            </footer>
          </section>
        </div>
      )}
      <Toast
        visible={Boolean(exito || errorLocal || error)}
        tipo={exito ? "exito" : error ? "error" : "advertencia"}
        titulo={
          exito
            ? modoEdicion
              ? "Foro actualizado"
              : "Foro creado"
            : error
              ? modoEdicion
                ? "No se pudo actualizar"
                : "No se pudo crear"
              : "Revisa los datos"
        }
        mensaje={
          exito
            ? modoEdicion
              ? "La configuración del foro se actualizó correctamente."
              : "El foro se creó correctamente."
            : errorLocal || error || ""
        }
        onCerrar={cerrarToast}
      />
    </>
  );
}

const styles = `

  .crear-foro select,
  .crear-foro option,
  .crear-foro input[type="datetime-local"] {
    background-color: #fff;
    color: #0f172a;
  }

  .crear-foro select {
    -webkit-appearance: auto;
    appearance: auto;
  }

  .crear-foro input[type="datetime-local"] {
    color-scheme: light;
    -webkit-appearance: none;
    appearance: none;
  }


  .crear-foro input[type="number"]::-webkit-inner-spin-button,
  .crear-foro input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .crear-foro input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /*
   * Mantiene selects y calendarios nativos en esquema claro.
   * Evita el destello negro de Chrome/Edge al abrirlos.
   */
  .crear-foro,
  .crear-foro input,
  .crear-foro textarea,
  .crear-foro select,
  .crear-foro option {
    color-scheme: light;
  }

  .crear-foro select,
  .crear-foro option {
    color: var(--app-text);
    background-color: var(--app-surface);
  }

  .crear-foro input[type="datetime-local"],
  .crear-foro input[type="date"],
  .crear-foro input[type="time"] {
    color-scheme: light;
    background-color: var(--app-surface);
  }

  .crear-foro {
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    min-width: 0;
    color: var(--app-text);
    position: relative;
    overflow: hidden;
    background: var(--app-surface);
    font-size: 12px;
  }
  .crear-foro-header {
    min-height: 100px;
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) 46px;
    align-items: center;
    gap: 16px;
    padding: 14px 22px;
    border-bottom: 1px solid var(--app-border);
    background: var(--app-surface);
  }
  .crear-foro-header__icono {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
    border-radius: 16px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }
  .crear-foro-header > div { min-width: 0; }
  .crear-foro-header small {
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .07em;
  }
  .crear-foro-header h2 {
    margin: 5px 0 3px;
    color: var(--app-text);
    font-size: 24px;
    line-height: 1.1;
  }
  .crear-foro-header p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: 12px;
  }
  .crear-foro-header > button {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    cursor: pointer;
  }
  .crear-foro-pasos {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 8px 18px;
    border-bottom: 1px solid var(--app-border-soft, #efe7df);
    background: var(--app-surface-alt, #fffaf4);
  }
  .crear-foro-pasos button {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-height: 30px;
    padding: 2px 0;
    border: 0;
    border-radius: 0;
    color: var(--app-text-muted, #94a3b8);
    background: transparent;
    font: inherit;
    cursor: pointer;
    transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease;
  }
  .crear-foro-pasos button:hover {
    color: var(--app-accent-dark);
    background: transparent;
  }
  .crear-foro-paso__estado {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 50%;
    background: var(--app-card, #fffdf9);
    font-size: 10px;
    font-weight: 900;
    transition: all .18s ease;
  }
  .crear-foro-paso__texto {
    width: auto;
    height: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .crear-foro-pasos small { font-size: 10px; font-weight: 850; }
  .crear-foro-pasos button.activo {
    color: var(--app-accent-dark);
    background: transparent;
  }
  .crear-foro-pasos button.activo .crear-foro-paso__estado,
  .crear-foro-pasos button.completo .crear-foro-paso__estado {
    border-color: var(--app-accent);
    color: white;
    background: var(--app-accent);
    box-shadow: 0 5px 12px color-mix(in srgb, var(--app-accent) 24%, transparent);
  }
  .crear-foro-pasos button.completo { color: var(--app-accent-dark); }
  .crear-foro-pasos button.completo .crear-foro-paso__texto svg {
    color: var(--app-accent);
  }
  .crear-foro-layout {
    min-height: 0;
    height: 100%;
    display: block;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    padding: 16px 16px 88px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
    scroll-padding-top: 16px;
  }
  .crear-foro-secciones {
    min-height: 0;
    display: grid;
    align-content: start;
    gap: 8px;
    overflow: visible;
    padding-right: 2px;
  }
  .crear-foro-layout.paso-3 .crear-foro-secciones {
    grid-template-columns:
      minmax(
        0,
        1.04fr
      )
      minmax(
        0,
        .96fr
      );
    align-items: start;
    gap: 24px;
    padding-top: 2px;
    padding-bottom: 18px;
  }

  .crear-foro-layout.paso-3 .crear-foro-seccion {
    min-width: 0;
    align-self: start;
    scroll-margin-top: 16px;
  }

  .crear-foro-layout.paso-3
  .crear-foro-seccion:nth-child(4) {
    padding-left: 2px;
  }

  .crear-foro-layout.paso-4 .crear-foro-secciones {
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 14px;
  }
  .crear-foro-layout .crear-foro-seccion { display: none; }
  .crear-foro-layout.paso-1 .crear-foro-seccion:nth-child(1),
  .crear-foro-layout.paso-2 .crear-foro-seccion:nth-child(2),
  .crear-foro-layout.paso-3 .crear-foro-seccion:nth-child(3),
  .crear-foro-layout.paso-3 .crear-foro-seccion:nth-child(4),
  .crear-foro-layout.paso-4 .crear-foro-seccion:nth-child(5),
  .crear-foro-layout.paso-4 .crear-foro-seccion:nth-child(6) { display: block; }
  .crear-foro-seccion {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
  .crear-foro-seccion.abierta {
    border-color: transparent;
  }
  .crear-foro-seccion__cabecera {
    width: 100%;
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 0 0 10px;
    border: 0;
    background: transparent;
    color: var(--app-text);
    text-align: left;
    cursor: pointer;
  }
  .crear-foro-seccion__cabecera:disabled {
    opacity: 1;
    cursor: default;
  }
  .crear-foro-seccion__cabecera > span:nth-child(2) {
    display: grid;
    gap: 3px;
  }
  .crear-foro-seccion__cabecera strong {
    font-size: 16px;
    line-height: 1.2;
  }
  .crear-foro-seccion__cabecera small {
    color: var(--app-text-muted);
    font-size: 11px;
  }
  .crear-foro-seccion__icono {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 18%, transparent);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: none;
  }
  .crear-foro-seccion__contenido {
    padding: 0;
    border-top: 0;
  }
  .crear-foro-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    margin-top: 8px;
  }
  .crear-foro-grid--afinidad {
    grid-template-columns:
      repeat(
        6,
        minmax(
          0,
          1fr
        )
      );
  }

  .crear-foro-grid--afinidad
  > label {
    grid-column:
      span 3;
  }

  .crear-foro-grid--afinidad
  > .crear-foro-total-alumnos,
  .crear-foro-grid--afinidad
  > .crear-foro-contador {
    grid-column:
      span 2;
  }

  .crear-foro-grid--afinidad
  > .crear-foro-switch {
    grid-column:
      span 3;
  }

  .crear-foro-grid > label {
    display: grid;
    gap: 4px;
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.045em;
  }
  .crear-foro-grid label small {
    font-size: 9px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: var(--app-text-muted);
  }
  .crear-foro-grid input,
  .crear-foro-grid textarea,
  .crear-foro-grid select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--app-border-strong);
    min-height: 40px;
    border-radius: 11px;
    padding: 8px 12px;
    color: var(--app-text);
    background: var(--app-surface);
    outline: 0;
    font: inherit;
    font-size: 12px;
    font-weight: 400;
    resize: none;
  }
  .crear-foro-layout.paso-3 .crear-foro-grid {
    gap: 14px 16px;
  }

  .crear-foro-layout.paso-3
  .crear-foro-seccion:nth-child(4)
  .bloque-interno {
    padding: 14px;
  }
  .crear-foro-layout.paso-3 .bloque-interno {
    padding: 12px;
  }
  .crear-foro-grid textarea {
    min-height: 55px;
    max-height: 70px;
  }
  .crear-foro-total-alumnos {
    min-height: 64px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 4px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .crear-foro-total-alumnos > span {
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }

  .crear-foro-total-alumnos > div {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--app-accent-dark);
  }

  .crear-foro-total-alumnos strong {
    color: var(--app-text);
    font-size: 20px;
  }

  .crear-foro-total-alumnos small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .crear-foro-fechas-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
    margin-top: 8px;
  }

  .crear-foro-fechas-grid.con-retraso
  .crear-foro-fecha-card--retraso {
    grid-column:
      1 / -1;
  }

  .crear-foro-fecha-card {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 7px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface-alt);
  }

  .crear-foro-fecha-card__titulo {
    color: var(--app-text-secondary);
    font-size: 10.5px;
    font-weight: 850;
    line-height: 1.25;
    text-transform: none;
    letter-spacing: 0;
  }

  .crear-foro-fecha-card input {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    box-sizing: border-box;
    padding: 8px 9px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font-family: inherit;
    font-size: 10.5px;
    font-weight: 600;
    line-height: 1;
    color-scheme: light;
  }

  .crear-foro-fecha-card
  input::-webkit-datetime-edit {
    padding: 0;
  }

  .crear-foro-fecha-card
  input::-webkit-calendar-picker-indicator {
    margin-left: 4px;
    cursor: pointer;
  }

  .crear-foro-fecha-card input:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 13%,
        transparent
      );
  }

  .crear-foro-fecha-card input:disabled {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .crear-foro-fecha-card small {
    min-height: 25px;
    color: var(--app-text-muted);
    font-size: 8.3px;
    font-weight: 500;
    line-height: 1.4;
    text-transform: none;
    letter-spacing: 0;
  }

  .crear-foro-fechas-grid
  .crear-foro-fecha-card:nth-child(3)
  small {
    min-height: 0;
  }

  .crear-foro-visibilidad-compacta {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      minmax(
        210px,
        .72fr
      );
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .crear-foro-visibilidad-compacta__texto {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .crear-foro-visibilidad-compacta
  .crear-foro-subtitulo-ayuda {
    justify-content: flex-start;
    margin: 0;
  }

  .crear-foro-visibilidad-compacta__texto
  > small {
    color: var(--app-text-muted);
    font-size: 8.4px;
    line-height: 1.4;
  }

  .crear-foro-visibilidad-compacta
  > select {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10px;
    font-weight: 700;
  }

  .crear-foro-visibilidad-compacta
  > select:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .crear-foro-retraso-card {
    margin-top: 10px;
    padding: 0;
  }

  .crear-foro-retraso-card
  .crear-foro-switch {
    min-height: 50px;
  }


  .crear-foro-retraso-panel {
    display: grid;
    gap: 9px;
    margin-top: 10px;
    padding: 11px 12px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    border-radius: 14px;
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 40%,
        var(--app-surface)
      );
  }

  .crear-foro-retraso-panel__titulo {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .crear-foro-retraso-panel__titulo
  > span {
    color: var(--app-accent-dark);
    font-size: 10.5px;
    font-weight: 850;
  }

  .crear-foro-retraso-panel__titulo
  > small {
    color: var(--app-text-muted);
    font-size: 8.3px;
  }

  .crear-foro-retraso-panel__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .crear-foro-fecha-card--compacta {
    padding: 10px 11px;
    background: var(--app-surface);
  }

  .crear-foro-retraso-panel__campo {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 7px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 10.5px;
    font-weight: 800;
  }

  .crear-foro-retraso-panel__campo
  > select,
  .crear-foro-retraso-panel__campo
  > input {
    width: 100%;
    min-width: 0;
    min-height: 42px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
    font-weight: 600;
  }

  .crear-foro-retraso-panel__campo
  > select:focus,
  .crear-foro-retraso-panel__campo
  > input:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .crear-foro-retraso-panel__campo
  > small {
    color: var(--app-text-muted);
    font-size: 8.2px;
    font-weight: 500;
    line-height: 1.4;
  }

  .crear-foro-retraso-panel__valor {
    grid-column:
      1 / -1;
  }

  .crear-foro-valor-compacto {
    width: fit-content;
    display: grid;
    grid-template-columns: 112px auto;
    align-items: center;
    gap: 8px;
  }

  .crear-foro-valor-compacto > input {
    width: 112px !important;
    min-width: 112px !important;
    min-height: 42px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 650;
  }

  .crear-foro-valor-compacto > input:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .crear-foro-valor-compacto > span {
    min-width: 42px;
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    text-transform: none;
    letter-spacing: 0;
  }

  .crear-foro-valor-compacto--comentarios {
    margin-top: 1px;
  }



  .crear-foro-contador {
    min-height: 64px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 5px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }
  .crear-foro-contador > span {
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
    text-transform: none;
    letter-spacing: 0;
  }
  .crear-foro-contador > div {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .crear-foro-contador button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }
  .crear-foro-contador button:disabled { opacity: .4; cursor: not-allowed; }
  .crear-foro-contador strong { min-width: 28px; text-align: center; font-size: 20px; }
  .crear-foro-grid input:focus,
  .crear-foro-grid textarea:focus,
  .crear-foro-grid select:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 12%, transparent);
  }
  .ancho-completo {
    grid-column: 1/-1;
  }
  .bloque-interno {
    padding: 8px 10px;
    border-radius: 14px;
    background: var(--app-surface-alt);
    border: 1px solid var(--app-border);
  }
  .crear-foro-opciones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }
  .crear-foro-opciones button {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3px 9px;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    text-align: left;
    cursor: pointer;
  }
  .crear-foro-opciones button svg {
    grid-row: 1/3;
    color: var(--app-text-muted);
  }
  .crear-foro-opciones button strong {
    font-size: 11px;
  }
  .crear-foro-opciones button small {
    font-size: 9px;
    color: var(--app-text-muted);
  }
  .crear-foro-opciones button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }
  .crear-foro-opciones button.activo svg {
    color: var(--app-accent-dark);
  }
  .crear-foro-switch {
    min-height: 42px;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 9px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
    text-transform: none !important;
    letter-spacing: 0 !important;
  }
  .crear-foro-switch > span {
    display: grid;
    gap: 2px;
  }
  .crear-foro-switch strong {
    font-size: 10px;
  }
  .crear-foro-switch input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .crear-foro-switch i {
    width: 38px;
    height: 21px;
    flex: 0 0 auto;
    padding: 2px;
    border-radius: 20px;
    background: var(--app-border-strong);
    transition: 0.2s;
  }
  .crear-foro-switch i b {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px #0002;
    transition: 0.2s;
  }
  .crear-foro-switch input:checked + i {
    background: var(--app-accent);
  }
  .crear-foro-switch input:checked + i b {
    transform: translateX(17px);
  }
  .crear-foro-nota,
  .crear-foro-aviso,
  .crear-foro-error,
  .crear-foro-exito {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 11px;
    border-radius: 13px;
    font-size: 10px;
  }
  .crear-foro-nota {
    margin-top: 8px;
    color: var(--app-text-secondary);
    background: var(--app-accent-soft);
  }
  .crear-foro-aviso {
    color: #8a5b13;
    background: #fff8df;
    border: 1px solid #f1d992;
  }
  .crear-foro-error {
    color: #9c2f2f;
    background: #fff0f0;
    border: 1px solid #f1c1c1;
  }
  .crear-foro-error span {
    flex: 1;
  }
  .crear-foro-error button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .crear-foro-exito {
    color: #246a43;
    background: #eaf8ef;
    border: 1px solid #b9e2c8;
  }
  .crear-foro-resumen {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 8px;
    padding: 18px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }
  .crear-foro-resumen__icono {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }
  .crear-foro-resumen > small {
    font-size: 9px;
    color: var(--app-text-muted);
  }
  .crear-foro-resumen h3 {
    margin: 2px 0;
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .crear-foro-resumen p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .crear-foro-resumen > div {
    display: grid;
    gap: 6px;
    margin-top: 5px;
  }
  .crear-foro-resumen > div span {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    color: var(--app-text-secondary);
  }
  .crear-foro-resumen hr {
    width: 100%;
    border: 0;
    border-top: 1px solid var(--app-border);
  }
  .crear-foro-resumen button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 5px;
    padding: 11px;
    border: 0;
    border-radius: 11px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: 10px;
    cursor: pointer;
  }
  .crear-foro-resumen button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .crear-foro-resumen > button { display: none; }
  .crear-foro-acciones {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 20px;
    border-top: 1px solid var(--app-border);
    background: var(--app-surface);
  }
  .crear-foro-btn {
    min-width: 118px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 15px;
    border-radius: 12px;
    font: inherit;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }
  .crear-foro-btn.secundario {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }
  .crear-foro-btn.primario {
    border: 0;
    color: white;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
  }
  .crear-foro-btn:disabled { opacity: .6; cursor: not-allowed; }
  .crear-foro-formatos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .crear-foro-formatos label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 82px;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    font-size: 9px;
    cursor: pointer;
    background: var(--app-surface);
  }
  .crear-foro-formatos input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .crear-foro-formato-check {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 6px;
    color: white;
    background: var(--app-surface);
  }
  .crear-foro-formatos input:checked + .crear-foro-formato-check {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }
  .crear-foro-regla-descuento {
    display: grid;
    gap: 5px;
  }
  .crear-foro-regla-descuento > label {
    display: grid;
    gap: 4px;
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .045em;
  }
  .crear-foro-valor-descuento {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }
  .crear-foro-valor-descuento span {
    min-width: 58px;
    color: var(--app-text-muted);
    font-size: 11px;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0;
  }
  .crear-foro-regla-descuento small {
    color: var(--app-text-muted);
    font-size: 9px;
    line-height: 1.4;
  }
  .crear-foro-etiqueta-con-ayuda {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .crear-foro-subtitulo-ayuda {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 2px 0 7px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }
  .crear-foro-subtitulo-ayuda--separado { margin-top: 10px; }
  .crear-foro-ayuda-boton {
    width: 21px;
    height: 21px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--app-accent) 55%, var(--app-border));
    border-radius: 50%;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
  }
  .crear-foro-ayuda-boton:hover,
  .crear-foro-ayuda-boton:focus-visible {
    border-color: var(--app-accent);
    outline: 3px solid color-mix(in srgb, var(--app-accent) 14%, transparent);
  }
  .crear-foro-aviso > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .crear-foro-aviso > span strong { font-size: 10px; }
  .crear-foro-aviso > span small { font-size: 9px; line-height: 1.4; }
  .crear-foro-ayuda-modal__fondo {
    position: fixed;
    inset: 0;
    z-index: 96000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(15, 23, 42, .64);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  .crear-foro-ayuda-modal {
    width: min(520px, calc(100vw - 32px));
    max-height: min(650px, calc(100vh - 40px));
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: 0 28px 80px rgba(15, 23, 42, .34);
    animation: crearForoAyudaEntrada .18s ease-out;
  }
  .crear-foro-ayuda-modal header {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 34px;
    align-items: center;
    gap: 11px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--app-border-soft);
    background: linear-gradient(135deg, var(--app-surface), var(--app-accent-soft));
  }
  .crear-foro-ayuda-modal header > span {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: color-mix(in srgb, var(--app-accent-soft) 75%, var(--app-surface));
  }
  .crear-foro-ayuda-modal header small {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .crear-foro-ayuda-modal h3 { margin: 2px 0 0; font-size: 17px; }
  .crear-foro-ayuda-modal header button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    cursor: pointer;
  }
  .crear-foro-ayuda-modal__contenido {
    overflow-y: auto;
    padding: 16px;
  }
  .crear-foro-ayuda-modal__contenido p {
    margin: 0 0 12px;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.55;
  }
  .crear-foro-ayuda-modal__contenido ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .crear-foro-ayuda-modal__contenido li {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 9px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 11px;
    line-height: 1.45;
  }
  .crear-foro-ayuda-modal__contenido li svg {
    margin-top: 1px;
    color: var(--app-accent-dark);
  }
  .crear-foro-ayuda-modal footer {
    display: flex;
    justify-content: flex-end;
    padding: 11px 16px;
    border-top: 1px solid var(--app-border-soft);
  }
  .crear-foro-ayuda-modal footer button {
    min-width: 110px;
    padding: 9px 15px;
    border: 0;
    border-radius: 10px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
  }
  @keyframes crearForoAyudaEntrada {
    from { opacity: 0; transform: translateY(7px) scale(.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .crear-foro-selector-conjunto {
    display: grid;
    gap: 6px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }
  .crear-foro-selector-conjunto select {
    width: 100%;
    min-height: 40px;
    padding: 8px 11px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-weight: 500;
  }
  .crear-foro-selector-conjunto select:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 12%, transparent);
  }
  .crear-foro-selector-conjunto small {
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 500;
  }
  .crear-foro-grupo-confirmado {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border: 1px solid #b9e2c8;
    border-radius: 11px;
    color: #246a43;
    background: #eaf8ef;
  }
  .crear-foro-grupo-confirmado > div {
    display: grid;
    gap: 2px;
  }
  .crear-foro-grupo-confirmado strong {
    font-size: 11px;
  }
  .crear-foro-grupo-confirmado small {
    color: #41775a;
  }
  .crear-foro-grupos-plataforma {
    display: grid;
    gap: 9px;
    padding: 10px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-background-subtle);
  }
  .crear-foro-grupos-plataforma > label {
    display: grid;
    gap: 4px;
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .045em;
  }
  .crear-foro-grupos-plataforma small {
    font-size: 9px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: var(--app-text-muted);
  }
  .crear-foro-tipo-grupo {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .crear-foro-tipo-grupo button {
    min-height: 38px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
  }
  .crear-foro-tipo-grupo button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px var(--app-accent);
  }
  .crear-foro-grid fieldset {
    border: 1px solid var(--app-border);
    border-radius: 12px;
    padding: 7px 9px;
  }
  .crear-foro-grid legend {
    padding: 0 5px;
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
  }


  .crear-foro-evaluacion-automatica {
    display: grid;
    grid-template-columns:
      32px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border: 1px solid
      color-mix(
        in srgb,
        #22c55e 22%,
        var(--app-border)
      );
    border-radius: 12px;
    color: #246a43;
    background:
      color-mix(
        in srgb,
        #eaf8ef 70%,
        var(--app-surface)
      );
  }

  .crear-foro-evaluacion-automatica > svg {
    color: #16a34a;
  }

  .crear-foro-evaluacion-automatica > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .crear-foro-evaluacion-automatica strong {
    font-size: 10px;
  }

  .crear-foro-evaluacion-automatica small {
    color: #41775a;
    font-size: 8.4px;
    line-height: 1.4;
  }


  .crear-foro-penalizacion-comentarios {
    display: grid;
    gap: 8px;
    padding: 10px 11px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 26%,
        var(--app-border)
      );
    border-radius: 14px;
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 34%,
        var(--app-surface)
      );
  }

  .crear-foro-penalizacion-comentarios__titulo {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
  }

  .crear-foro-penalizacion-comentarios__titulo > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .crear-foro-penalizacion-comentarios__titulo strong {
    color: var(--app-text);
    font-size: 10.5px;
  }

  .crear-foro-penalizacion-comentarios__titulo small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.4;
  }

  .crear-foro-penalizacion-comentarios__cabecera {
    display: grid;
    gap: 9px;
  }

  .crear-foro-penalizacion-comentarios__cabecera > div:first-child {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
  }

  .crear-foro-penalizacion-comentarios__icono {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .crear-foro-penalizacion-comentarios__cabecera
  > div:first-child
  > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .crear-foro-penalizacion-comentarios__cabecera strong {
    color: var(--app-text);
    font-size: 10.5px;
  }

  .crear-foro-penalizacion-comentarios__cabecera small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.4;
  }

  .crear-foro-penalizacion-comentarios__aviso {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 9px;
    border-radius: 10px;
    color: #8a5b13;
    background: #fff8df;
    font-size: 8.8px;
  }

  .crear-foro-penalizacion-comentarios__regla {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .crear-foro-penalizacion-comentarios__regla span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    color: #246a43;
    background: #eaf8ef;
    font-size: 8px;
    font-weight: 750;
  }

  .crear-foro-penalizacion-comentarios__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .crear-foro-penalizacion-comentarios__grid--compacta {
    grid-template-columns:
      minmax(0, 1.15fr)
      minmax(0, .85fr);
  }

  .crear-foro-penalizacion-comentarios__grid label {
    min-width: 0;
    display: grid;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 9.5px;
    font-weight: 800;
  }

  .crear-foro-penalizacion-comentarios__grid select,
  .crear-foro-penalizacion-comentarios__grid input {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 10.5px;
    font-weight: 500;
  }

  .crear-foro-penalizacion-comentarios__grid select:focus,
  .crear-foro-penalizacion-comentarios__grid input:focus {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .crear-foro-penalizacion-comentarios__grid small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 500;
    line-height: 1.35;
  }


  .crear-foro-penalizacion-comentarios__grid
  .crear-foro-valor-compacto > input {
    width: 112px;
    min-width: 112px;
  }

  .crear-foro-reglas-afinidad {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 9px;
    border: 1px solid #b9e2c8;
    border-radius: 13px;
    background: #f2fbf5;
  }
  .crear-foro-reglas-afinidad > div {
    min-width: 0;
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    align-items: start;
    gap: 7px;
    padding: 8px;
    border-radius: 10px;
    color: #246a43;
    background: rgba(255,255,255,.72);
  }
  .crear-foro-reglas-afinidad > div > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .crear-foro-reglas-afinidad strong {
    font-size: 10px;
  }
  .crear-foro-reglas-afinidad small {
    color: #41775a;
    font-size: 8.5px;
    line-height: 1.35;
  }
  .crear-foro-regla-dinamica {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
  }
  .crear-foro-regla-dinamica > svg {
    color: var(--app-accent-dark);
  }
  .crear-foro-regla-dinamica > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .crear-foro-regla-dinamica strong {
    font-size: 10px;
  }
  .crear-foro-regla-dinamica small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    line-height: 1.4;
  }

  @media (max-width: 1120px) {

    .crear-foro-fechas-grid
    .crear-foro-fecha-card--retraso {
      grid-column:
        auto;
    }
  }

  @media (max-width: 900px) {
    .crear-foro-penalizacion-comentarios__grid,
    .crear-foro-penalizacion-comentarios__grid--compacta {
      grid-template-columns: 1fr;
    }

    .crear-foro-reglas-afinidad {
      grid-template-columns: 1fr;
    }

    .crear-foro-retraso-panel__grid {
      grid-template-columns:
        1fr;
    }

    .crear-foro-retraso-panel__valor {
      grid-column:
        auto;
    }

    .crear-foro-visibilidad-compacta {
      grid-template-columns:
        1fr;
    }

    .crear-foro-grid--afinidad {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .crear-foro-grid--afinidad
    > label,
    .crear-foro-grid--afinidad
    > .crear-foro-total-alumnos,
    .crear-foro-grid--afinidad
    > .crear-foro-contador,
    .crear-foro-grid--afinidad
    > .crear-foro-switch {
      grid-column:
        span 1;
    }

    .crear-foro-fechas-grid {
      grid-template-columns:
        1fr;
    }
  }

  @media (max-width: 1040px) {
    .crear-foro-layout {
      grid-template-columns: 1fr;
    }
    .crear-foro-resumen {
      position: static;
    }
    .crear-foro-layout.paso-3 .crear-foro-secciones,
    .crear-foro-layout.paso-4 .crear-foro-secciones { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .crear-foro-pasos small { display: none; }
    .crear-foro-grid,
    .crear-foro-grid--afinidad,
    .crear-foro-opciones {
      grid-template-columns: 1fr;
    }
    .ancho-completo {
      grid-column: auto;
    }
    .crear-foro-seccion__cabecera {
      grid-template-columns: 34px 1fr auto;
      padding: 12px;
    }
    .crear-foro-resumen {
      display: none;
    }
  }
`;