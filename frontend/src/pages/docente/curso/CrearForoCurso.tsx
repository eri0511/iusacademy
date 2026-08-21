import {
  ArrowLeft, BookOpenCheck, CalendarDays, Check, ChevronDown, ChevronUp,
  FileUp, GraduationCap, Info, MessageSquareText, Save, Settings2, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import { useAulaContext } from '../../../contexts/AulaContext';
import useCrearForo, { type CrearForoDatos } from '../../../hooks/foro/useCrearForo';

type Seccion = 'informacion' | 'participacion' | 'fechas' | 'evaluacion' | 'archivos' | 'permisos';
type EstadoFormulario = Omit<CrearForoDatos, 'hitoId' | 'fechaApertura' | 'fechaLimite' | 'fechaCierre'> & {
  fechaApertura: string; fechaLimite: string; fechaCierre: string; fechaMaximaRetraso?: string;
};

const ahoraLocal = () => {
  const fecha = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return fecha.toISOString().slice(0, 16);
};
const sumarDias = (dias: number) => {
  const fecha = new Date(Date.now() + dias * 86400000 - new Date().getTimezoneOffset() * 60000);
  return fecha.toISOString().slice(0, 16);
};
const inicial: EstadoFormulario = {
  titulo: '', contenido: '', instrucciones: '', objetivo: '', esCalificable: false,
  modalidadParticipacion: 'INDIVIDUAL', origenGrupo: 'NINGUNO', dinamicaGrupal: 'NINGUNA',
  permitirComentarios: true, permitirEditarRespuestas: true, permitirEliminarRespuestas: false,
  permitirEditarComentarios: true, permitirEliminarComentarios: false,
  minimoComentariosPorEstudiante: 0, tipoEvaluacion: 'MANUAL', modalidadNota: 'INDIVIDUAL',
  calificacionAutomaticaAlCumplir: false, fechaApertura: ahoraLocal(), fechaLimite: sumarDias(7),
  fechaCierre: sumarDias(7), permitirRetrasos: false, tipoDescuentoRetraso: 'NINGUNO',
  visibilidadRespuestas: 'DESPUES_DE_RESPONDER', permitirAdjuntosTema: true,
  permitirAdjuntosRespuesta: true, permitirAdjuntosComentario: false, exigirAdjuntoRespuesta: false,
  permitirDescargaAdjuntos: true, maximoArchivosTema: 5, maximoArchivosRespuesta: 5,
  maximoArchivosComentario: 2, tamanioMaximoArchivoMb: 10,
  extensionesPermitidas: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'], participaEnPromedio: true,
};

const numeroOpcional = (valor: string) => valor === '' ? undefined : Number(valor);
const iso = (valor: string) => new Date(valor).toISOString();

function Interruptor({ activo, onChange, titulo, descripcion }: { activo: boolean; onChange: (v: boolean) => void; titulo: string; descripcion?: string }) {
  return <label className="crear-foro-switch"><span><strong>{titulo}</strong>{descripcion && <small>{descripcion}</small>}</span><input type="checkbox" checked={activo} onChange={(e) => onChange(e.target.checked)} /><i aria-hidden="true"><b /></i></label>;
}

function SeccionFormulario({ id, titulo, descripcion, icono: Icono, abierta, onToggle, children }: {
  id: Seccion; titulo: string; descripcion: string; icono: LucideIcon; abierta: boolean; onToggle: (id: Seccion) => void; children: ReactNode;
}) {
  return <section className={`crear-foro-seccion ${abierta ? 'abierta' : ''}`}>
    <button type="button" className="crear-foro-seccion__cabecera" onClick={() => onToggle(id)}>
      <span className="crear-foro-seccion__icono"><Icono size={19} /></span><span><strong>{titulo}</strong><small>{descripcion}</small></span>
      {abierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>{abierta && <div className="crear-foro-seccion__contenido">{children}</div>}
  </section>;
}

export default function CrearForoCurso() {
  const formularioRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const { curso, hitoSeleccionado } = useAulaContext();
  const { crear, guardando, error, limpiarError } = useCrearForo(curso.id);
  const [datos, setDatos] = useState<EstadoFormulario>(inicial);
  const [abiertas, setAbiertas] = useState<Seccion[]>(['informacion']);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const actualizar = <K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]) => setDatos((actual) => ({ ...actual, [campo]: valor }));
  const alternar = (id: Seccion) => setAbiertas((actual) => actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]);
  const grupal = datos.modalidadParticipacion === 'GRUPAL';
  const afinidad = grupal && datos.origenGrupo === 'AFINIDAD';

  const resumen = useMemo(() => [
    datos.modalidadParticipacion === 'INDIVIDUAL' ? 'Individual' : 'Grupal',
    datos.esCalificable ? `Calificable · ${datos.componente === 'PROCESUAL' ? 'Procesual' : 'Continua'}` : 'No calificable',
    datos.permitirComentarios ? 'Con comentarios' : 'Sin comentarios',
  ], [datos]);

  const validar = () => {
    if (!hitoSeleccionado) return 'Selecciona un hito antes de crear el foro.';
    if (!datos.titulo.trim() || !datos.contenido.trim()) return 'Completa el título y la descripción del foro.';
    const apertura = new Date(datos.fechaApertura), limite = new Date(datos.fechaLimite), cierre = new Date(datos.fechaCierre);
    if (limite <= apertura) return 'La fecha límite debe ser posterior a la apertura.';
    if (cierre < limite) return 'La fecha de cierre no puede ser anterior a la fecha límite.';
    if (datos.permitirRetrasos && (!datos.fechaMaximaRetraso || new Date(datos.fechaMaximaRetraso) < limite)) return 'Indica una fecha máxima de retraso igual o posterior a la fecha límite.';
    if (datos.permitirRetrasos && datos.fechaMaximaRetraso && cierre < new Date(datos.fechaMaximaRetraso)) return 'El cierre debe ser igual o posterior a la fecha máxima de retraso.';
    if (grupal && datos.origenGrupo === 'PLATAFORMA' && !datos.conjuntoGrupoId) return 'Indica el ID del conjunto de grupos de plataforma.';
    if (datos.esCalificable && !datos.componente) return 'Selecciona Continua o Procesual para el foro calificable.';
    if (datos.modalidadNota === 'GRUPAL_E_INDIVIDUAL' && (Number(datos.porcentajeNotaGrupal || 0) + Number(datos.porcentajeNotaIndividual || 0) !== 100)) return 'Los porcentajes grupal e individual deben sumar 100.';
    return null;
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault(); limpiarError(); setErrorLocal(null);
    const problema = validar();
    if (problema) { setErrorLocal(problema); return; }
    const payload: CrearForoDatos = {
      ...datos, hitoId: hitoSeleccionado!.id, titulo: datos.titulo.trim(), contenido: datos.contenido.trim(),
      instrucciones: datos.instrucciones?.trim() || undefined, objetivo: datos.objetivo?.trim() || undefined,
      fechaApertura: iso(datos.fechaApertura), fechaLimite: iso(datos.fechaLimite), fechaCierre: iso(datos.fechaCierre),
      componente: datos.esCalificable ? datos.componente : undefined,
      tipoEvaluacion: datos.esCalificable ? datos.tipoEvaluacion : undefined,
      modalidadNota: datos.esCalificable ? datos.modalidadNota : undefined,
      origenGrupo: grupal ? datos.origenGrupo : 'NINGUNO', dinamicaGrupal: grupal ? datos.dinamicaGrupal : 'NINGUNA',
      conjuntoGrupoId: grupal && datos.origenGrupo === 'PLATAFORMA' ? datos.conjuntoGrupoId : undefined,
      cantidadMinimaIntegrantes: afinidad ? datos.cantidadMinimaIntegrantes : undefined,
      cantidadMaximaIntegrantes: afinidad ? datos.cantidadMaximaIntegrantes : undefined,
      fechaMaximaRetraso: datos.permitirRetrasos && datos.fechaMaximaRetraso ? iso(datos.fechaMaximaRetraso) : undefined,
      tipoDescuentoRetraso: datos.permitirRetrasos ? datos.tipoDescuentoRetraso : 'NINGUNO',
      valorDescuentoRetraso: datos.permitirRetrasos && datos.tipoDescuentoRetraso !== 'NINGUNO' ? datos.valorDescuentoRetraso : undefined,
    };
    try { await crear(payload); setExito(true); window.setTimeout(() => navigate('..'), 800); } catch { /* el hook muestra el error */ }
  };

  if (!hitoSeleccionado) return <section className="crear-foro"><AulaHeader icono={MessageSquareText} etiqueta="Foros" titulo="Crear foro" descripcion="Selecciona primero un hito académico desde el encabezado del aula." acciones={[{ texto: 'Volver', icono: ArrowLeft, variante: 'secundaria', onClick: () => navigate('..') }]} /><div className="crear-foro-aviso"><Info size={20} /> Debes seleccionar un hito para asociar correctamente el foro y su evaluación.</div><style>{styles}</style></section>;

  return <form ref={formularioRef} className="crear-foro" onSubmit={enviar}>
    <AulaLoadingOverlay visible={guardando} texto="Creando foro…" />
    <AulaHeader icono={MessageSquareText} etiqueta={`Foros · ${hitoSeleccionado.codigo}`} titulo="Crear nuevo foro" descripcion="Configura el debate, la participación, los plazos, la evaluación y los permisos." acciones={[{ texto: 'Cancelar', icono: ArrowLeft, variante: 'secundaria', onClick: () => navigate('..') }, { texto: 'Crear foro', icono: Save, variante: 'primaria', deshabilitada: guardando, onClick: () => formularioRef.current?.requestSubmit() }]} />
    {(errorLocal || error) && <div className="crear-foro-error" role="alert"><Info size={18} /><span>{errorLocal || error}</span><button type="button" onClick={() => { setErrorLocal(null); limpiarError(); }}><X size={15} /></button></div>}
    {exito && <div className="crear-foro-exito"><Check size={18} /> Foro creado correctamente. Regresando al listado…</div>}
    <div className="crear-foro-layout"><main className="crear-foro-secciones">
      <SeccionFormulario id="informacion" titulo="Información del foro" descripcion="Tema, descripción, objetivo e instrucciones" icono={BookOpenCheck} abierta={abiertas.includes('informacion')} onToggle={alternar}>
        <div className="crear-foro-grid"><label className="ancho-completo">Título <input maxLength={180} value={datos.titulo} onChange={(e) => actualizar('titulo', e.target.value)} placeholder="Ej. Debate sobre la nulidad contractual" required /><small>{datos.titulo.length}/180</small></label>
        <label className="ancho-completo">Descripción o planteamiento <textarea rows={6} maxLength={15000} value={datos.contenido} onChange={(e) => actualizar('contenido', e.target.value)} placeholder="Presenta el caso, problema jurídico o pregunta de debate…" required /></label>
        <label className="ancho-completo">Objetivo <textarea rows={3} maxLength={4000} value={datos.objetivo} onChange={(e) => actualizar('objetivo', e.target.value)} placeholder="¿Qué competencia o aprendizaje busca desarrollar?" /></label>
        <label className="ancho-completo">Instrucciones <textarea rows={4} maxLength={8000} value={datos.instrucciones} onChange={(e) => actualizar('instrucciones', e.target.value)} placeholder="Explica cómo responder, qué normativa citar y qué evidencias presentar…" /></label></div>
      </SeccionFormulario>

      <SeccionFormulario id="participacion" titulo="Modalidad y participación" descripcion="Individual, grupal y reglas de interacción" icono={Users} abierta={abiertas.includes('participacion')} onToggle={alternar}>
        <div className="crear-foro-opciones"><button type="button" className={datos.modalidadParticipacion === 'INDIVIDUAL' ? 'activo' : ''} onClick={() => { actualizar('modalidadParticipacion', 'INDIVIDUAL'); actualizar('origenGrupo', 'NINGUNO'); actualizar('dinamicaGrupal', 'NINGUNA'); }}><Users size={19} /><strong>Individual</strong><small>Cada estudiante publica su respuesta.</small></button><button type="button" className={grupal ? 'activo' : ''} onClick={() => { actualizar('modalidadParticipacion', 'GRUPAL'); actualizar('origenGrupo', 'PLATAFORMA'); actualizar('dinamicaGrupal', 'REPRESENTANTE_UNICO'); }}><Users size={19} /><strong>Grupal</strong><small>La participación se organiza por equipos.</small></button></div>
        {grupal && <div className="crear-foro-grid bloque-interno"><label>Origen de los grupos<select value={datos.origenGrupo} onChange={(e) => actualizar('origenGrupo', e.target.value as EstadoFormulario['origenGrupo'])}><option value="PLATAFORMA">Grupos de plataforma</option><option value="AFINIDAD">Equipos de afinidad</option></select></label><label>Dinámica<select value={datos.dinamicaGrupal} onChange={(e) => actualizar('dinamicaGrupal', e.target.value as EstadoFormulario['dinamicaGrupal'])}><option value="REPRESENTANTE_UNICO">Solo responde el representante</option><option value="PARTICIPACION_DISTRIBUIDA">Cada integrante responde y comenta</option><option value="COLABORACION_ABIERTA">Colaboración abierta</option></select></label>
        {datos.origenGrupo === 'PLATAFORMA' && <label className="ancho-completo">ID del conjunto de grupos<input type="number" min={1} value={datos.conjuntoGrupoId ?? ''} onChange={(e) => actualizar('conjuntoGrupoId', numeroOpcional(e.target.value))} placeholder="Ej. 3" /><small>Es el conjunto que ya creaste en la pestaña Grupos para este hito.</small></label>}
        {afinidad && <><label>Mínimo de integrantes<input type="number" min={2} max={100} value={datos.cantidadMinimaIntegrantes ?? ''} onChange={(e) => actualizar('cantidadMinimaIntegrantes', numeroOpcional(e.target.value))} /></label><label>Máximo de integrantes<input type="number" min={2} max={100} value={datos.cantidadMaximaIntegrantes ?? ''} onChange={(e) => actualizar('cantidadMaximaIntegrantes', numeroOpcional(e.target.value))} /></label><Interruptor activo={!!datos.requiereAprobacionEquipos} onChange={(v) => actualizar('requiereAprobacionEquipos', v)} titulo="Aprobar equipos" descripcion="El docente debe aprobar cada equipo de afinidad." /><Interruptor activo={!!datos.bloquearEquipoAlResponder} onChange={(v) => actualizar('bloquearEquipoAlResponder', v)} titulo="Bloquear equipo al responder" descripcion="Impide cambiar integrantes después de participar." /></>}</div>}
        <div className="crear-foro-grid bloque-interno"><label>Comentarios mínimos por estudiante<input type="number" min={0} max={100} value={datos.minimoComentariosPorEstudiante ?? ''} onChange={(e) => actualizar('minimoComentariosPorEstudiante', numeroOpcional(e.target.value))} /></label><label>Comentarios máximos<input type="number" min={0} max={100} value={datos.maximoComentariosPorEstudiante ?? ''} onChange={(e) => actualizar('maximoComentariosPorEstudiante', numeroOpcional(e.target.value))} /></label><label>Palabras mínimas por respuesta<input type="number" min={1} value={datos.palabrasMinimasRespuesta ?? ''} onChange={(e) => actualizar('palabrasMinimasRespuesta', numeroOpcional(e.target.value))} /></label><label>Palabras máximas por respuesta<input type="number" min={1} value={datos.palabrasMaximasRespuesta ?? ''} onChange={(e) => actualizar('palabrasMaximasRespuesta', numeroOpcional(e.target.value))} /></label><label>Visibilidad de respuestas<select value={datos.visibilidadRespuestas} onChange={(e) => actualizar('visibilidadRespuestas', e.target.value as EstadoFormulario['visibilidadRespuestas'])}><option value="DESDE_EL_INICIO">Desde el inicio</option><option value="DESPUES_DE_RESPONDER">Después de responder</option><option value="AL_CERRAR">Cuando cierre el foro</option></select></label></div>
      </SeccionFormulario>

      <SeccionFormulario id="fechas" titulo="Fechas y retrasos" descripcion="Apertura, límite, cierre y descuentos" icono={CalendarDays} abierta={abiertas.includes('fechas')} onToggle={alternar}>
        <div className="crear-foro-grid"><label>Fecha de apertura<input type="datetime-local" value={datos.fechaApertura} onChange={(e) => actualizar('fechaApertura', e.target.value)} required /></label><label>Fecha límite<input type="datetime-local" value={datos.fechaLimite} onChange={(e) => actualizar('fechaLimite', e.target.value)} required /></label><label>Fecha de cierre<input type="datetime-local" value={datos.fechaCierre} onChange={(e) => actualizar('fechaCierre', e.target.value)} required /></label><Interruptor activo={datos.permitirRetrasos} onChange={(v) => actualizar('permitirRetrasos', v)} titulo="Aceptar entregas atrasadas" descripcion="Permite participar después de la fecha límite y antes del cierre." /></div>
        {datos.permitirRetrasos && <div className="crear-foro-grid bloque-interno"><label>Fecha máxima de retraso<input type="datetime-local" value={datos.fechaMaximaRetraso ?? ''} onChange={(e) => actualizar('fechaMaximaRetraso', e.target.value)} required /></label><label>Tipo de descuento<select value={datos.tipoDescuentoRetraso} onChange={(e) => actualizar('tipoDescuentoRetraso', e.target.value as EstadoFormulario['tipoDescuentoRetraso'])}><option value="NINGUNO">Sin descuento</option><option value="PUNTOS_FIJOS">Puntos fijos</option><option value="PORCENTAJE">Porcentaje</option><option value="POR_HORA">Por hora</option><option value="POR_DIA">Por día</option><option value="NOTA_MAXIMA">Nota máxima</option></select></label>{datos.tipoDescuentoRetraso !== 'NINGUNO' && <label>Valor del descuento<input type="number" min={0} max={100} step="0.01" value={datos.valorDescuentoRetraso ?? ''} onChange={(e) => actualizar('valorDescuentoRetraso', numeroOpcional(e.target.value))} required /></label>}</div>}
      </SeccionFormulario>

      <SeccionFormulario id="evaluacion" titulo="Calificación y evaluación" descripcion="Continua, procesual, automática, manual o rúbrica" icono={GraduationCap} abierta={abiertas.includes('evaluacion')} onToggle={alternar}>
        <Interruptor activo={datos.esCalificable} onChange={(v) => actualizar('esCalificable', v)} titulo="Actividad calificable" descripcion="Siempre se registra sobre 100 y luego se convierte en el libro de calificaciones." />
        {datos.esCalificable && <div className="crear-foro-grid bloque-interno"><label>Componente<select value={datos.componente ?? ''} onChange={(e) => actualizar('componente', e.target.value as EstadoFormulario['componente'])} required><option value="">Seleccionar…</option><option value="CONTINUA">Continua</option><option value="PROCESUAL">Procesual</option></select></label><label>Evaluación<select value={datos.tipoEvaluacion} onChange={(e) => actualizar('tipoEvaluacion', e.target.value as EstadoFormulario['tipoEvaluacion'])}><option value="MANUAL">Manual</option><option value="AUTOMATICA">Automática al cumplir</option><option value="RUBRICA">Mediante rúbrica</option></select></label><label>Modalidad de nota<select value={datos.modalidadNota} onChange={(e) => actualizar('modalidadNota', e.target.value as EstadoFormulario['modalidadNota'])}><option value="INDIVIDUAL">Individual</option><option value="GRUPAL">Grupal</option><option value="GRUPAL_E_INDIVIDUAL">Grupal e individual</option></select></label>
        {datos.modalidadNota === 'GRUPAL_E_INDIVIDUAL' && <><label>% grupal<input type="number" min={0} max={100} value={datos.porcentajeNotaGrupal ?? ''} onChange={(e) => actualizar('porcentajeNotaGrupal', numeroOpcional(e.target.value))} /></label><label>% individual<input type="number" min={0} max={100} value={datos.porcentajeNotaIndividual ?? ''} onChange={(e) => actualizar('porcentajeNotaIndividual', numeroOpcional(e.target.value))} /></label></>}
        <Interruptor activo={datos.participaEnPromedio} onChange={(v) => actualizar('participaEnPromedio', v)} titulo="Incluir en el promedio" descripcion="Aporta al componente Continua o Procesual del hito." /></div>}
        {datos.tipoEvaluacion === 'RUBRICA' && datos.esCalificable && <div className="crear-foro-nota"><Info size={17} /> Los criterios de la rúbrica se agregan después de crear el foro, desde su vista de administración. El backend exige que sumen 100 puntos.</div>}
      </SeccionFormulario>

      <SeccionFormulario id="archivos" titulo="Archivos adjuntos" descripcion="Ubicación, cantidad, tamaño y formatos" icono={FileUp} abierta={abiertas.includes('archivos')} onToggle={alternar}>
        <div className="crear-foro-grid"><Interruptor activo={datos.permitirAdjuntosTema} onChange={(v) => actualizar('permitirAdjuntosTema', v)} titulo="Archivos del docente" /><Interruptor activo={datos.permitirAdjuntosRespuesta} onChange={(v) => actualizar('permitirAdjuntosRespuesta', v)} titulo="Archivos en respuestas" /><Interruptor activo={datos.permitirAdjuntosComentario} onChange={(v) => actualizar('permitirAdjuntosComentario', v)} titulo="Archivos en comentarios" /><Interruptor activo={datos.exigirAdjuntoRespuesta} onChange={(v) => actualizar('exigirAdjuntoRespuesta', v)} titulo="Exigir adjunto en la respuesta" /><Interruptor activo={datos.permitirDescargaAdjuntos} onChange={(v) => actualizar('permitirDescargaAdjuntos', v)} titulo="Permitir descargas" /><label>Tamaño máximo por archivo (MB)<input type="number" min={1} max={100} value={datos.tamanioMaximoArchivoMb} onChange={(e) => actualizar('tamanioMaximoArchivoMb', Number(e.target.value))} /></label><label>Máximo en el tema<input type="number" min={0} max={20} value={datos.maximoArchivosTema} onChange={(e) => actualizar('maximoArchivosTema', Number(e.target.value))} /></label><label>Máximo por respuesta<input type="number" min={0} max={20} value={datos.maximoArchivosRespuesta} onChange={(e) => actualizar('maximoArchivosRespuesta', Number(e.target.value))} /></label><label>Máximo por comentario<input type="number" min={0} max={10} value={datos.maximoArchivosComentario} onChange={(e) => actualizar('maximoArchivosComentario', Number(e.target.value))} /></label><fieldset className="ancho-completo"><legend>Formatos permitidos</legend><div className="crear-foro-formatos">{['pdf','doc','docx','jpg','jpeg','png','webp'].map((ext) => <label key={ext}><input type="checkbox" checked={datos.extensionesPermitidas.includes(ext)} onChange={(e) => actualizar('extensionesPermitidas', e.target.checked ? [...datos.extensionesPermitidas, ext] : datos.extensionesPermitidas.filter((x) => x !== ext))} /> {ext.toUpperCase()}</label>)}</div></fieldset></div>
      </SeccionFormulario>

      <SeccionFormulario id="permisos" titulo="Comentarios, edición y eliminación" descripcion="Acciones permitidas mientras el foro está abierto" icono={Settings2} abierta={abiertas.includes('permisos')} onToggle={alternar}>
        <div className="crear-foro-grid"><Interruptor activo={datos.permitirComentarios} onChange={(v) => actualizar('permitirComentarios', v)} titulo="Permitir comentarios" /><Interruptor activo={datos.permitirEditarRespuestas} onChange={(v) => actualizar('permitirEditarRespuestas', v)} titulo="Editar respuestas" /><Interruptor activo={datos.permitirEliminarRespuestas} onChange={(v) => actualizar('permitirEliminarRespuestas', v)} titulo="Eliminar respuestas" /><Interruptor activo={datos.permitirEditarComentarios} onChange={(v) => actualizar('permitirEditarComentarios', v)} titulo="Editar comentarios" /><Interruptor activo={datos.permitirEliminarComentarios} onChange={(v) => actualizar('permitirEliminarComentarios', v)} titulo="Eliminar comentarios" /></div><div className="crear-foro-nota"><Info size={17} /> Al cerrar el foro, el backend bloquea la edición y eliminación aunque estas opciones estén habilitadas. Solo una reapertura docente vuelve a permitirlas.</div>
      </SeccionFormulario>
    </main><aside className="crear-foro-resumen"><span className="crear-foro-resumen__icono"><MessageSquareText size={23} /></span><small>Vista previa</small><h3>{datos.titulo.trim() || 'Nuevo foro jurídico'}</h3><p>{datos.contenido.trim() || 'La descripción del foro aparecerá aquí.'}</p><div>{resumen.map((item) => <span key={item}><Check size={13} /> {item}</span>)}</div><hr /><strong>{hitoSeleccionado.codigo}</strong><small>{hitoSeleccionado.nombre}</small><button type="submit" disabled={guardando}><Save size={16} /> Crear foro</button></aside></div>
    <style>{styles}</style>
  </form>;
}

const styles = `
.crear-foro{display:grid;gap:14px;min-width:0;color:var(--app-text);position:relative}.crear-foro-layout{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;align-items:start}.crear-foro-secciones{display:grid;gap:11px}.crear-foro-seccion{border:1px solid var(--app-border);border-radius:17px;background:var(--app-surface);box-shadow:var(--app-shadow-sm);overflow:hidden}.crear-foro-seccion.abierta{border-color:color-mix(in srgb,var(--app-accent) 35%,var(--app-border))}.crear-foro-seccion__cabecera{width:100%;display:grid;grid-template-columns:38px 1fr auto;gap:11px;align-items:center;padding:15px;border:0;background:transparent;color:var(--app-text);text-align:left;cursor:pointer}.crear-foro-seccion__cabecera>span:nth-child(2){display:grid;gap:3px}.crear-foro-seccion__cabecera strong{font-size:13px}.crear-foro-seccion__cabecera small{color:var(--app-text-muted);font-size:10px}.crear-foro-seccion__icono{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;color:var(--app-accent-dark);background:var(--app-accent-soft)}.crear-foro-seccion__contenido{padding:3px 15px 17px;border-top:1px solid var(--app-border)}.crear-foro-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:14px}.crear-foro-grid>label{display:grid;gap:6px;color:var(--app-text-secondary);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.045em}.crear-foro-grid label small{font-size:9px;font-weight:500;text-transform:none;letter-spacing:0;color:var(--app-text-muted)}.crear-foro-grid input,.crear-foro-grid textarea,.crear-foro-grid select{width:100%;box-sizing:border-box;border:1px solid var(--app-border-strong);border-radius:11px;padding:10px 11px;color:var(--app-text);background:var(--app-surface);outline:0;font:inherit;font-size:11px;resize:vertical}.crear-foro-grid input:focus,.crear-foro-grid textarea:focus,.crear-foro-grid select:focus{border-color:var(--app-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--app-accent) 12%,transparent)}.ancho-completo{grid-column:1/-1}.bloque-interno{padding:13px;border-radius:14px;background:var(--app-surface-alt);border:1px solid var(--app-border)}.crear-foro-opciones{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.crear-foro-opciones button{display:grid;grid-template-columns:auto 1fr;gap:3px 9px;padding:13px;border:1px solid var(--app-border);border-radius:13px;color:var(--app-text);background:var(--app-surface-alt);text-align:left;cursor:pointer}.crear-foro-opciones button svg{grid-row:1/3;color:var(--app-text-muted)}.crear-foro-opciones button strong{font-size:11px}.crear-foro-opciones button small{font-size:9px;color:var(--app-text-muted)}.crear-foro-opciones button.activo{border-color:var(--app-accent);background:var(--app-accent-soft)}.crear-foro-opciones button.activo svg{color:var(--app-accent-dark)}.crear-foro-switch{min-height:49px;display:flex!important;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;border:1px solid var(--app-border);border-radius:12px;background:var(--app-surface-alt);text-transform:none!important;letter-spacing:0!important}.crear-foro-switch>span{display:grid;gap:2px}.crear-foro-switch strong{font-size:10px}.crear-foro-switch input{position:absolute;opacity:0;pointer-events:none}.crear-foro-switch i{width:38px;height:21px;flex:0 0 auto;padding:2px;border-radius:20px;background:var(--app-border-strong);transition:.2s}.crear-foro-switch i b{display:block;width:17px;height:17px;border-radius:50%;background:white;box-shadow:0 1px 4px #0002;transition:.2s}.crear-foro-switch input:checked+i{background:var(--app-accent)}.crear-foro-switch input:checked+i b{transform:translateX(17px)}.crear-foro-nota,.crear-foro-aviso,.crear-foro-error,.crear-foro-exito{display:flex;align-items:center;gap:9px;padding:12px 14px;border-radius:13px;font-size:10px}.crear-foro-nota{margin-top:13px;color:var(--app-text-secondary);background:var(--app-accent-soft)}.crear-foro-aviso{color:#8a5b13;background:#fff8df;border:1px solid #f1d992}.crear-foro-error{color:#9c2f2f;background:#fff0f0;border:1px solid #f1c1c1}.crear-foro-error span{flex:1}.crear-foro-error button{border:0;background:transparent;color:inherit;cursor:pointer}.crear-foro-exito{color:#246a43;background:#eaf8ef;border:1px solid #b9e2c8}.crear-foro-resumen{position:sticky;top:16px;display:grid;gap:8px;padding:18px;border:1px solid var(--app-border);border-radius:18px;background:var(--app-surface);box-shadow:var(--app-shadow-sm)}.crear-foro-resumen__icono{width:45px;height:45px;display:grid;place-items:center;border-radius:14px;color:var(--app-accent-dark);background:var(--app-accent-soft)}.crear-foro-resumen>small{font-size:9px;color:var(--app-text-muted)}.crear-foro-resumen h3{margin:2px 0;font-size:15px;overflow-wrap:anywhere}.crear-foro-resumen p{margin:0;color:var(--app-text-muted);font-size:10px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}.crear-foro-resumen>div{display:grid;gap:6px;margin-top:5px}.crear-foro-resumen>div span{display:flex;align-items:center;gap:6px;font-size:9px;color:var(--app-text-secondary)}.crear-foro-resumen hr{width:100%;border:0;border-top:1px solid var(--app-border)}.crear-foro-resumen button{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:5px;padding:11px;border:0;border-radius:11px;color:white;background:var(--app-accent);font:inherit;font-size:10px;cursor:pointer}.crear-foro-resumen button:disabled{opacity:.6;cursor:not-allowed}.crear-foro-formatos{display:flex;flex-wrap:wrap;gap:8px}.crear-foro-formatos label{padding:7px 9px;border:1px solid var(--app-border);border-radius:9px;font-size:9px}.crear-foro-grid fieldset{border:1px solid var(--app-border);border-radius:12px;padding:11px}.crear-foro-grid legend{padding:0 5px;color:var(--app-text-muted);font-size:9px;font-weight:800;text-transform:uppercase}@media(max-width:980px){.crear-foro-layout{grid-template-columns:1fr}.crear-foro-resumen{position:static}}@media(max-width:640px){.crear-foro-grid,.crear-foro-opciones{grid-template-columns:1fr}.ancho-completo{grid-column:auto}.crear-foro-seccion__cabecera{grid-template-columns:34px 1fr auto;padding:12px}.crear-foro-resumen{display:none}}
`;
