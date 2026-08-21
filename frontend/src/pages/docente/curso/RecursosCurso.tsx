import {
  Archive,
  BookOpen,
  FilePlus2,
  FolderOpen,
  Link2,
  Layers3,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../../../auth/AuthContext';
import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, { type OpcionAulaToolbar } from '../../../components/aula/AulaToolbar';
import ContenidoRecursoModal from '../../../components/recursos/ContenidoRecursoModal';
import FormularioRecurso, { type FormularioRecursoValor } from '../../../components/recursos/FormularioRecurso';
import HistorialVersionesRecurso from '../../../components/recursos/HistorialVersionesRecurso';
import RecursoCard from '../../../components/recursos/RecursoCard';
import ReemplazarContenidoModal from '../../../components/recursos/ReemplazarContenidoModal';
import SelectorCategoriaRecurso from '../../../components/recursos/SelectorCategoriaRecurso';
import Toast, { type TipoToast } from '../../../components/shared/Toast';
import { useAulaContext } from '../../../contexts/AulaContext';
import {
  abrirArchivo,
  abrirEnlaceExterno,
  actualizarContenidoRecurso,
  actualizarRecurso,
  agregarArchivoRecurso,
  agregarEnlaceRecurso,
  archivarRecurso,
  cambiarVisibilidadRecurso,
  crearRecurso,
  descargarArchivo,
  eliminarContenidoRecurso,
  listarRecursos,
  reemplazarContenidoRecurso,
} from '../../../services/recursos/recursos.service';
import type {
  CategoriaRecursoCurso,
  RecursoContenido,
  RecursoCurso,
  ReemplazarContenidoDatos,
} from '../../../types/recursos/recursos.types';
import { CATEGORIAS_RECURSO, obtenerVersionVigente } from '../../../types/recursos/recursos.types';

type FiltroAlcance = 'TODOS' | 'GENERALES' | 'HITO_ACTUAL';
type EstadoToast = { visible: boolean; tipo: TipoToast; titulo: string; mensaje?: string };
type ModalAgregar = 'ARCHIVO' | 'ENLACE' | null;

const inicial: FormularioRecursoValor = {
  titulo: '',
  descripcion: '',
  categoria: 'MATERIAL_COMPLEMENTARIO',
  alcance: 'HITO',
  hitoId: null,
  visibleParaEstudiantes: true,
  archivos: [],
  enlaces: [],
};

export default function RecursosCurso() {
  const { accessToken } = useAuth();
  const { curso, hitoSeleccionado, aula } = useAulaContext();

  const [recursos, setRecursos] = useState<RecursoCurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAlcance, setFiltroAlcance] = useState<FiltroAlcance>('TODOS');
  const [categoria, setCategoria] = useState<CategoriaRecursoCurso | 'TODAS'>('TODAS');
  const [selectorCategoriaAbierto, setSelectorCategoriaAbierto] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [recursoEditado, setRecursoEditado] = useState<RecursoCurso | null>(null);
  const [formulario, setFormulario] = useState<FormularioRecursoValor>(inicial);
  const [recursoAbiertoId, setRecursoAbiertoId] = useState<number | null>(null);
  const [selectorMaterialAbierto, setSelectorMaterialAbierto] = useState(false);
  const [modalAgregar, setModalAgregar] = useState<ModalAgregar>(null);
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [archivoTitulo, setArchivoTitulo] = useState('');
  const [archivoQuiz, setArchivoQuiz] = useState(false);
  const [enlaceTitulo, setEnlaceTitulo] = useState('');
  const [enlaceUrl, setEnlaceUrl] = useState('');
  const [contenidoReemplazar, setContenidoReemplazar] = useState<RecursoContenido | null>(null);
  const [contenidoHistorial, setContenidoHistorial] = useState<RecursoContenido | null>(null);
  const [recursoArchivar, setRecursoArchivar] = useState<RecursoCurso | null>(null);
  const [contenidoEliminar, setContenidoEliminar] = useState<RecursoContenido | null>(null);
  const [toast, setToast] = useState<EstadoToast>({ visible: false, tipo: 'informacion', titulo: '' });

  const mostrarToast = useCallback((tipo: TipoToast, titulo: string, mensaje?: string) => {
    setToast({ visible: true, tipo, titulo, mensaje });
  }, []);

  const cargar = useCallback(async () => {
    if (!accessToken || !curso?.id) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setRecursos(await listarRecursos(curso.id, accessToken));
    } catch (error) {
      mostrarToast('error', 'No se pudieron cargar los recursos', error instanceof Error ? error.message : undefined);
    } finally {
      setCargando(false);
    }
  }, [accessToken, curso?.id, mostrarToast]);

  useEffect(() => { void cargar(); }, [cargar]);

  const recursoAbierto = useMemo(
    () => recursos.find((item) => item.id === recursoAbiertoId) ?? null,
    [recursos, recursoAbiertoId],
  );

  const hitos = aula.planificacion.hitos.map((hito) => ({ id: hito.id, codigo: hito.codigo, nombre: hito.nombre }));

  const abrirCrear = () => {
    setRecursoEditado(null);
    setFormulario({
      ...inicial,
      alcance: hitoSeleccionado ? 'HITO' : 'CURSO',
      hitoId: hitoSeleccionado?.id ?? null,
    });
    setSelectorCategoriaAbierto(true);
  };

  const abrirEditar = (recurso: RecursoCurso) => {
    setRecursoEditado(recurso);
    setFormulario({
      titulo: recurso.titulo,
      descripcion: recurso.descripcion ?? '',
      categoria: recurso.categoria,
      alcance: recurso.alcance,
      hitoId: recurso.hitoId,
      visibleParaEstudiantes: recurso.visibleParaEstudiantes,
      archivos: [],
      enlaces: [],
    });
    setFormularioAbierto(true);
  };

  const validarFormulario = () => {
    if (!formulario.titulo.trim()) {
      mostrarToast('advertencia', 'Falta el título', 'Escribe un nombre para el recurso.');
      return false;
    }
    if (formulario.alcance === 'HITO' && !formulario.hitoId) {
      mostrarToast('advertencia', 'Selecciona un hito', 'El recurso debe estar asociado a H1-H5.');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!accessToken || !curso?.id || !validarFormulario()) return;

    try {
      setProcesando(true);

      if (recursoEditado) {
        await actualizarRecurso(curso.id, recursoEditado.id, accessToken, {
          titulo: formulario.titulo.trim(),
          descripcion: formulario.descripcion.trim(),
          categoria: formulario.categoria,
          alcance: formulario.alcance,
          hitoId: formulario.hitoId,
          visibleParaEstudiantes: formulario.visibleParaEstudiantes,
        });
        mostrarToast('exito', 'Recurso actualizado');
      } else {
        const creado = await crearRecurso(curso.id, accessToken, {
          titulo: formulario.titulo.trim(),
          descripcion: formulario.descripcion.trim(),
          categoria: formulario.categoria,
          alcance: formulario.alcance,
          hitoId: formulario.hitoId,
          visibleParaEstudiantes: formulario.visibleParaEstudiantes,
        });

        mostrarToast('exito', 'Recurso creado', 'Ahora puedes agregar uno o varios archivos o enlaces.');
        await cargar();
        setRecursoAbiertoId(creado.id);
        setSelectorMaterialAbierto(true);
      }

      setFormularioAbierto(false);
      setRecursoEditado(null);
      await cargar();
    } catch (error) {
      mostrarToast('error', 'No fue posible guardar', error instanceof Error ? error.message : undefined);
    } finally {
      setProcesando(false);
    }
  };

  const agregarContenido = async () => {
    if (!accessToken || !curso?.id || !recursoAbierto) return;

    try {
      setProcesando(true);

      if (modalAgregar === 'ARCHIVO') {
        if (!archivoNuevo) {
          mostrarToast('advertencia', 'Selecciona un archivo');
          return;
        }
        await agregarArchivoRecurso(curso.id, recursoAbierto.id, accessToken, {
          archivo: archivoNuevo,
          titulo: archivoTitulo.trim() || archivoNuevo.name.replace(/\.[^/.]+$/, ''),
          descripcion: '',
          disponibleParaQuiz: archivoQuiz,
        });
      } else if (modalAgregar === 'ENLACE') {
        if (!enlaceTitulo.trim() || !enlaceUrl.trim()) {
          mostrarToast('advertencia', 'Completa el enlace', 'Escribe título y URL.');
          return;
        }
        await agregarEnlaceRecurso(curso.id, recursoAbierto.id, accessToken, {
          titulo: enlaceTitulo.trim(),
          descripcion: '',
          urlExterna: enlaceUrl.trim(),
        });
      }

      setModalAgregar(null);
      setArchivoNuevo(null);
      setArchivoTitulo('');
      setArchivoQuiz(false);
      setEnlaceTitulo('');
      setEnlaceUrl('');
      await cargar();
      mostrarToast('exito', 'Contenido agregado');
    } catch (error) {
      mostrarToast('error', 'No fue posible agregar el contenido', error instanceof Error ? error.message : undefined);
    } finally {
      setProcesando(false);
    }
  };

  const abrirContenidoArchivo = async (contenido: RecursoContenido, descargar = false) => {
    if (!accessToken) return;
    const vigente = obtenerVersionVigente(contenido);
    if (!vigente) return;

    try {
      if (descargar) {
        await descargarArchivo(vigente.archivo.id, vigente.archivo.nombreOriginal, accessToken);
      } else {
        await abrirArchivo(vigente.archivo.id, accessToken);
      }
    } catch (error) {
      mostrarToast('error', 'No fue posible abrir el archivo', error instanceof Error ? error.message : undefined);
    }
  };

  const alternarQuiz = async (contenido: RecursoContenido) => {
    if (!accessToken || !curso?.id || !recursoAbierto) return;
    try {
      setProcesando(true);
      await actualizarContenidoRecurso(curso.id, recursoAbierto.id, contenido.id, accessToken, {
        disponibleParaQuiz: !contenido.disponibleParaQuiz,
      });
      await cargar();
      mostrarToast('exito', contenido.disponibleParaQuiz ? 'PDF retirado de Quizzes' : 'PDF disponible para Quizzes');
    } catch (error) {
      mostrarToast('error', 'No fue posible cambiar la configuración', error instanceof Error ? error.message : undefined);
    } finally {
      setProcesando(false);
    }
  };

  const reemplazar = async (datos: ReemplazarContenidoDatos) => {
    if (!accessToken || !curso?.id || !recursoAbierto || !contenidoReemplazar) return;
    try {
      setProcesando(true);
      await reemplazarContenidoRecurso(curso.id, recursoAbierto.id, contenidoReemplazar.id, accessToken, datos);
      setContenidoReemplazar(null);
      await cargar();
      mostrarToast('exito', 'Nueva versión guardada', 'La versión anterior permanece en el historial.');
    } catch (error) {
      mostrarToast('error', 'No fue posible reemplazar el archivo', error instanceof Error ? error.message : undefined);
    } finally {
      setProcesando(false);
    }
  };

  const filtros: OpcionAulaToolbar<FiltroAlcance>[] = [
    { id: 'TODOS', texto: 'Todos', contador: recursos.length },
    { id: 'GENERALES', texto: 'Generales', contador: recursos.filter((r) => r.alcance === 'CURSO').length },
    { id: 'HITO_ACTUAL', texto: hitoSeleccionado?.codigo ?? 'Hito actual', contador: recursos.filter((r) => r.hitoId === hitoSeleccionado?.id).length },
  ];

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return recursos.filter((recurso) => {
      if (filtroAlcance === 'GENERALES' && recurso.alcance !== 'CURSO') return false;
      if (filtroAlcance === 'HITO_ACTUAL' && recurso.hitoId !== hitoSeleccionado?.id) return false;
      if (categoria !== 'TODAS' && recurso.categoria !== categoria) return false;
      if (!q) return true;
      return `${recurso.titulo} ${recurso.descripcion ?? ''}`.toLowerCase().includes(q);
    });
  }, [recursos, filtroAlcance, categoria, busqueda, hitoSeleccionado?.id]);

  if (cargando && recursos.length === 0) {
    return <AulaSkeleton variante="lista" cantidad={4} />;
  }

  return (
    <section className="recursos-page">
      <AulaHeader
        icono={BookOpen}
        etiqueta="Aula virtual"
        titulo="Recursos"
        descripcion="Organiza material jurídico y académico por categorías. Cada recurso puede contener varios archivos y enlaces."
        acciones={[
          { texto: 'Nuevo recurso', icono: Plus, variante: 'primaria', onClick: abrirCrear },
          { texto: 'Actualizar', icono: RefreshCw, onClick: () => void cargar() },
        ]}
      />

      <AulaToolbar opciones={filtros} opcionActiva={filtroAlcance} onCambiar={setFiltroAlcance} />

      <div className="recursos-filtros">
        <label className="recursos-busqueda">
          <Search size={16} />
          <input value={busqueda} placeholder="Buscar recurso..." onChange={(e) => setBusqueda(e.target.value)} />
        </label>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaRecursoCurso | 'TODAS')}>
          <option value="TODAS">Todas las categorías</option>
          {CATEGORIAS_RECURSO.map((item) => <option key={item.id} value={item.id}>{item.etiqueta}</option>)}
        </select>
      </div>

      <div className="recursos-categorias-leyenda">
        {CATEGORIAS_RECURSO.map((item) => (
          <span key={item.id}><i style={{ background: item.color }} />{item.etiqueta}</span>
        ))}
      </div>

      <div className="recursos-lista">
        {filtrados.length === 0 ? (
          <AulaEmptyState
            icono={FolderOpen}
            titulo="No hay recursos en esta vista"
            descripcion="Crea un recurso y agrupa dentro todos los archivos y enlaces relacionados con el mismo tema."
            accionTexto="Crear recurso"
            onAccion={abrirCrear}
          />
        ) : (
          filtrados.map((recurso) => (
            <RecursoCard
              key={recurso.id}
              recurso={recurso}
              esDocente
              procesando={procesando}
              onAbrirMateriales={() => setRecursoAbiertoId(recurso.id)}
              onAbrirArchivo={(contenido) => void abrirContenidoArchivo(contenido)}
              onDescargarArchivo={(contenido) => void abrirContenidoArchivo(contenido, true)}
              onAbrirEnlace={(contenido) => contenido.urlExterna && abrirEnlaceExterno(contenido.urlExterna)}
              onEditar={() => abrirEditar(recurso)}
              onVisibilidad={() => {
                if (!accessToken || !curso?.id) return;
                void (async () => {
                  try {
                    setProcesando(true);
                    await cambiarVisibilidadRecurso(curso.id, recurso.id, accessToken, !recurso.visibleParaEstudiantes);
                    await cargar();
                  } catch (error) {
                    mostrarToast('error', 'No fue posible cambiar la visibilidad', error instanceof Error ? error.message : undefined);
                  } finally { setProcesando(false); }
                })();
              }}
              onArchivar={() => setRecursoArchivar(recurso)}
            />
          ))
        )}
      </div>

      <AulaLoadingOverlay visible={procesando} texto="Guardando cambios…" />

      <AulaModal
        abierto={selectorCategoriaAbierto}
        titulo="Seleccionar tipo de recurso"
        etiqueta="Recursos"
        descripcion="Elige la clasificación antes de continuar."
        icono={BookOpen}
        ancho="amplio"
        bloqueado={procesando}
        onCerrar={() => {
          setSelectorCategoriaAbierto(false);
              }}
      >
        <SelectorCategoriaRecurso
          valor={formulario.categoria}
          modo="catalogo"
          deshabilitado={procesando}
          onCambiar={(categoriaSeleccionada) => {
            setFormulario((actual) => ({ ...actual, categoria: categoriaSeleccionada }));
            setSelectorCategoriaAbierto(false);
            setFormularioAbierto(true);
                  }}
        />
      </AulaModal>

      <AulaModal
        abierto={formularioAbierto}
        titulo={recursoEditado ? 'Editar recurso' : 'Nuevo recurso'}
        etiqueta="Recursos"
        descripcion={recursoEditado ? 'Actualiza la clasificación y alcance del contenedor.' : 'Crea un tema y agrega todos los materiales relacionados.'}
        icono={FolderOpen}
        ancho="amplio"
        bloqueado={procesando}
        onCerrar={() => setFormularioAbierto(false)}
        footer={
          <div className="modal-actions">
            <button className="secondary" type="button" disabled={procesando} onClick={() => setFormularioAbierto(false)}>Cancelar</button>
            <button type="button" disabled={procesando} onClick={() => void guardar()}>{recursoEditado ? 'Guardar cambios' : 'Crear recurso'}</button>
          </div>
        }
      >
        <FormularioRecurso
          valor={formulario}
          hitos={hitos}
          editando={Boolean(recursoEditado)}
          deshabilitado={procesando}
          onChange={setFormulario}
          onAbrirCatalogoCategoria={() => {
            setFormularioAbierto(false);
            setSelectorCategoriaAbierto(true);
          }}
        />
      </AulaModal>

      <ContenidoRecursoModal
        abierto={Boolean(recursoAbierto)}
        recurso={recursoAbierto}
        esDocente
        bloqueado={procesando}
        onCerrar={() => setRecursoAbiertoId(null)}
        onAbrirArchivo={(contenido) => void abrirContenidoArchivo(contenido)}
        onDescargarArchivo={(contenido) => void abrirContenidoArchivo(contenido, true)}
        onAbrirEnlace={(contenido) => contenido.urlExterna && abrirEnlaceExterno(contenido.urlExterna)}
        onAgregarMaterial={() => setSelectorMaterialAbierto(true)}
        onReemplazar={setContenidoReemplazar}
        onHistorial={setContenidoHistorial}
        onAlternarQuiz={(contenido) => void alternarQuiz(contenido)}
        onEliminar={setContenidoEliminar}
      />

      <AulaModal
        abierto={selectorMaterialAbierto}
        titulo="Agregar material"
        etiqueta={recursoAbierto?.titulo}
        descripcion="Selecciona qué tipo de material quieres agregar al recurso."
        icono={Layers3}
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() => setSelectorMaterialAbierto(false)}
      >
        <div className="selector-material">
          <button
            type="button"
            onClick={() => {
              setSelectorMaterialAbierto(false);
              setModalAgregar('ARCHIVO');
              setArchivoNuevo(null);
              setArchivoTitulo('');
              setArchivoQuiz(false);
            }}
          >
            <span><FilePlus2 size={22} /></span>
            <div><strong>Archivo</strong><small>PDF, Word, PowerPoint, imagen u otro documento permitido.</small></div>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectorMaterialAbierto(false);
              setModalAgregar('ENLACE');
              setEnlaceTitulo('');
              setEnlaceUrl('');
            }}
          >
            <span><Link2 size={22} /></span>
            <div><strong>Enlace</strong><small>Video, página oficial, Drive, jurisprudencia u otro recurso web.</small></div>
          </button>
        </div>
      </AulaModal>

      <AulaModal
        abierto={modalAgregar !== null}
        titulo={modalAgregar === 'ARCHIVO' ? 'Agregar archivo' : 'Agregar enlace'}
        etiqueta={recursoAbierto?.titulo}
        descripcion="El nuevo material quedará dentro de este mismo recurso."
        icono={modalAgregar === 'ARCHIVO' ? FilePlus2 : Link2}
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() => setModalAgregar(null)}
        footer={<div className="modal-actions"><button className="secondary" type="button" onClick={() => setModalAgregar(null)}>Cancelar</button><button type="button" onClick={() => void agregarContenido()}>Agregar</button></div>}
      >
        {modalAgregar === 'ARCHIVO' ? (
          <div className="mini-form">
            <label><span>Archivo</span><input type="file" onChange={(e) => { const f=e.target.files?.[0] ?? null; setArchivoNuevo(f); if(f) setArchivoTitulo(f.name.replace(/\.[^/.]+$/, '')); }} /></label>
            <label><span>Título visible</span><input value={archivoTitulo} onChange={(e) => setArchivoTitulo(e.target.value)} /></label>
            {archivoNuevo?.name.toLowerCase().endsWith('.pdf') && <label className="check-inline"><input type="checkbox" checked={archivoQuiz} onChange={(e) => setArchivoQuiz(e.target.checked)} /> Disponible como fuente para Quizzes</label>}
          </div>
        ) : (
          <div className="mini-form">
            <label><span>Título</span><input value={enlaceTitulo} onChange={(e) => setEnlaceTitulo(e.target.value)} /></label>
            <label><span>URL</span><input value={enlaceUrl} placeholder="https://..." onChange={(e) => setEnlaceUrl(e.target.value)} /></label>
          </div>
        )}
      </AulaModal>

      <ReemplazarContenidoModal abierto={Boolean(contenidoReemplazar)} contenido={contenidoReemplazar} bloqueado={procesando} onCerrar={() => setContenidoReemplazar(null)} onGuardar={(datos) => void reemplazar(datos)} />
      <HistorialVersionesRecurso abierto={Boolean(contenidoHistorial)} contenido={contenidoHistorial} onCerrar={() => setContenidoHistorial(null)} />

      <AulaModal
        abierto={Boolean(recursoArchivar)}
        titulo="Archivar recurso"
        etiqueta="Confirmación"
        descripcion={recursoArchivar ? `Se ocultará “${recursoArchivar.titulo}” del aula, conservando su historial.` : undefined}
        icono={Archive}
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() => setRecursoArchivar(null)}
        footer={<div className="modal-actions"><button className="secondary" type="button" onClick={() => setRecursoArchivar(null)}>Cancelar</button><button className="danger" type="button" onClick={() => void (async()=>{if(!accessToken||!curso?.id||!recursoArchivar)return;try{setProcesando(true);await archivarRecurso(curso.id,recursoArchivar.id,accessToken);setRecursoArchivar(null);setRecursoAbiertoId(null);await cargar();mostrarToast('exito','Recurso archivado');}catch(e){mostrarToast('error','No fue posible archivar',e instanceof Error?e.message:undefined);}finally{setProcesando(false);}})()}>Archivar</button></div>}
      >
        <p className="confirm-text">Los archivos no se eliminan físicamente. El recurso queda conservado para trazabilidad.</p>
      </AulaModal>

      <AulaModal
        abierto={Boolean(contenidoEliminar)}
        titulo="Retirar contenido"
        etiqueta="Confirmación"
        descripcion={contenidoEliminar?.titulo}
        icono={Archive}
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() => setContenidoEliminar(null)}
        footer={<div className="modal-actions"><button className="secondary" type="button" onClick={() => setContenidoEliminar(null)}>Cancelar</button><button className="danger" type="button" onClick={() => void (async()=>{if(!accessToken||!curso?.id||!recursoAbierto||!contenidoEliminar)return;try{setProcesando(true);await eliminarContenidoRecurso(curso.id,recursoAbierto.id,contenidoEliminar.id,accessToken);setContenidoEliminar(null);await cargar();mostrarToast('exito','Contenido retirado');}catch(e){mostrarToast('error','No fue posible retirar el contenido',e instanceof Error?e.message:undefined);}finally{setProcesando(false);}})()}>Retirar</button></div>}
      >
        <p className="confirm-text">Este material dejará de mostrarse dentro del recurso.</p>
      </AulaModal>

      <Toast visible={toast.visible} tipo={toast.tipo} titulo={toast.titulo} mensaje={toast.mensaje} onCerrar={() => setToast((actual) => ({ ...actual, visible: false }))} />

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .recursos-page { position:relative; display:grid; gap:14px; }
  .recursos-filtros { display:grid; grid-template-columns:minmax(0,1fr) 220px; gap:9px; }
  .recursos-busqueda { min-height:42px; display:flex; align-items:center; gap:8px; padding:0 11px; border:1px solid var(--app-border); border-radius:12px; background:var(--app-surface); color:var(--app-text-muted); }
  .recursos-busqueda input { min-width:0; flex:1; border:none; outline:none; color:var(--app-text); background:transparent; font:inherit; font-size:11px; }
  .recursos-filtros select { padding:0 10px; border:1px solid var(--app-border); border-radius:12px; color:var(--app-text); background:var(--app-surface); font:inherit; font-size:10px; }
  .recursos-categorias-leyenda { display:flex; flex-wrap:wrap; gap:6px 11px; padding:0 3px; }
  .recursos-categorias-leyenda span { display:inline-flex; align-items:center; gap:5px; color:var(--app-text-muted); font-size:8px; }
  .recursos-categorias-leyenda i { width:7px; height:7px; border-radius:50%; }
  .recursos-lista { display:grid; gap:9px; }
  .modal-actions { width:100%; display:flex; justify-content:flex-end; gap:7px; }
  .modal-actions button { min-height:38px; padding:8px 12px; border:none; border-radius:10px; color:#fff; background:linear-gradient(135deg,var(--app-accent),var(--app-accent-hover)); font:inherit; font-size:9px; font-weight:850; cursor:pointer; }
  .modal-actions button.secondary { border:1px solid var(--app-border-strong); color:var(--app-accent-dark); background:var(--app-surface); }
  .modal-actions button.danger { background:var(--app-danger); }
  .mini-form { display:grid; gap:11px; }
  .mini-form label { display:grid; gap:6px; }
  .mini-form span { font-size:9px; font-weight:850; color:var(--app-text-secondary); }
  .mini-form input { width:100%; box-sizing:border-box; padding:10px 11px; border:1px solid var(--app-border-strong); border-radius:11px; color:var(--app-text); background:var(--app-surface); font:inherit; font-size:11px; }
  .mini-form .check-inline { display:flex; grid-template-columns:auto 1fr; align-items:center; gap:7px; color:var(--app-text-secondary); font-size:9px; }
  .mini-form .check-inline input { width:auto; }
  .confirm-text { margin:0; color:var(--app-text-soft); font-size:10px; line-height:1.5; }
  .selector-material { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .selector-material button { min-height:120px; display:grid; align-content:start; gap:10px; padding:14px; border:1px solid var(--app-border); border-radius:15px; color:var(--app-text); background:var(--app-surface-alt); text-align:left; font:inherit; cursor:pointer; }
  .selector-material button:hover { border-color:var(--app-accent); background:var(--app-accent-soft); }
  .selector-material button > span { width:44px; height:44px; display:grid; place-items:center; border-radius:12px; color:var(--app-accent-dark); background:var(--app-surface); }
  .selector-material button div { display:grid; gap:4px; }
  .selector-material button strong { font-size:12px; }
  .selector-material button small { color:var(--app-text-muted); font-size:9.5px; line-height:1.4; }
  @media(max-width:700px){ .selector-material{grid-template-columns:1fr;} .recursos-filtros{grid-template-columns:1fr}.recursos-filtros select{min-height:42px;} }
`;
