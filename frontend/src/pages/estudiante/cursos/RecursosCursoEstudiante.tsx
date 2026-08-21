import {
  BookOpen,
  FolderOpen,
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
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, { type OpcionAulaToolbar } from '../../../components/aula/AulaToolbar';
import ContenidoRecursoModal from '../../../components/recursos/ContenidoRecursoModal';
import RecursoCard from '../../../components/recursos/RecursoCard';
import Toast, { type TipoToast } from '../../../components/shared/Toast';
import { useAulaContext } from '../../../contexts/AulaContext';
import {
  abrirArchivo,
  abrirEnlaceExterno,
  descargarArchivo,
  listarRecursos,
} from '../../../services/recursos/recursos.service';
import type {
  CategoriaRecursoCurso,
  RecursoContenido,
  RecursoCurso,
} from '../../../types/recursos/recursos.types';
import {
  CATEGORIAS_RECURSO,
  obtenerVersionVigente,
} from '../../../types/recursos/recursos.types';

type FiltroAlcance = 'TODOS' | 'GENERALES' | 'HITO_ACTUAL';
type EstadoToast = { visible: boolean; tipo: TipoToast; titulo: string; mensaje?: string };

export default function RecursosCursoEstudiante() {
  const { accessToken } = useAuth();
  const { curso, hitoSeleccionado } = useAulaContext();

  const [recursos, setRecursos] = useState<RecursoCurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroAlcance>('TODOS');
  const [categoria, setCategoria] = useState<CategoriaRecursoCurso | 'TODAS'>('TODAS');
  const [recursoAbiertoId, setRecursoAbiertoId] = useState<number | null>(null);
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

  const filtros: OpcionAulaToolbar<FiltroAlcance>[] = [
    { id: 'TODOS', texto: 'Todos', contador: recursos.length },
    { id: 'GENERALES', texto: 'Generales', contador: recursos.filter((r) => r.alcance === 'CURSO').length },
    { id: 'HITO_ACTUAL', texto: hitoSeleccionado?.codigo ?? 'Hito actual', contador: recursos.filter((r) => r.hitoId === hitoSeleccionado?.id).length },
  ];

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return recursos.filter((recurso) => {
      if (filtro === 'GENERALES' && recurso.alcance !== 'CURSO') return false;
      if (filtro === 'HITO_ACTUAL' && recurso.hitoId !== hitoSeleccionado?.id) return false;
      if (categoria !== 'TODAS' && recurso.categoria !== categoria) return false;
      if (!q) return true;
      return `${recurso.titulo} ${recurso.descripcion ?? ''}`.toLowerCase().includes(q);
    });
  }, [recursos, filtro, categoria, busqueda, hitoSeleccionado?.id]);

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

  if (cargando && recursos.length === 0) {
    return <AulaSkeleton variante="lista" cantidad={4} />;
  }

  return (
    <section className="recursos-estudiante">
      <AulaHeader
        icono={BookOpen}
        etiqueta="Material académico"
        titulo="Recursos"
        descripcion="Consulta los documentos, enlaces y materiales compartidos por tu docente."
        acciones={[{ texto: 'Actualizar', icono: RefreshCw, onClick: () => void cargar() }]}
      />

      <AulaToolbar opciones={filtros} opcionActiva={filtro} onCambiar={setFiltro} />

      <div className="recursos-estudiante__filtros">
        <label>
          <Search size={16} />
          <input value={busqueda} placeholder="Buscar recurso..." onChange={(e) => setBusqueda(e.target.value)} />
        </label>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaRecursoCurso | 'TODAS')}>
          <option value="TODAS">Todas las categorías</option>
          {CATEGORIAS_RECURSO.map((item) => <option key={item.id} value={item.id}>{item.etiqueta}</option>)}
        </select>
      </div>

      <div className="recursos-estudiante__lista">
        {filtrados.length === 0 ? (
          <AulaEmptyState
            icono={FolderOpen}
            titulo="No hay recursos disponibles"
            descripcion="Cuando el docente publique material para esta sección aparecerá aquí."
          />
        ) : (
          filtrados.map((recurso) => (
            <RecursoCard
              key={recurso.id}
              recurso={recurso}
              esDocente={false}
              onAbrirMateriales={() => setRecursoAbiertoId(recurso.id)}
              onAbrirArchivo={(contenido) => void abrirContenidoArchivo(contenido)}
              onDescargarArchivo={(contenido) => void abrirContenidoArchivo(contenido, true)}
              onAbrirEnlace={(contenido) => contenido.urlExterna && abrirEnlaceExterno(contenido.urlExterna)}
            />
          ))
        )}
      </div>

      <ContenidoRecursoModal
        abierto={Boolean(recursoAbierto)}
        recurso={recursoAbierto}
        esDocente={false}
        onCerrar={() => setRecursoAbiertoId(null)}
        onAbrirArchivo={(contenido) => void abrirContenidoArchivo(contenido)}
        onDescargarArchivo={(contenido) => void abrirContenidoArchivo(contenido, true)}
        onAbrirEnlace={(contenido) => contenido.urlExterna && abrirEnlaceExterno(contenido.urlExterna)}
      />

      <Toast visible={toast.visible} tipo={toast.tipo} titulo={toast.titulo} mensaje={toast.mensaje} onCerrar={() => setToast((actual) => ({ ...actual, visible: false }))} />

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .recursos-estudiante { display:grid; gap:14px; }
  .recursos-estudiante__filtros { display:grid; grid-template-columns:minmax(0,1fr) 220px; gap:9px; }
  .recursos-estudiante__filtros label { min-height:42px; display:flex; align-items:center; gap:8px; padding:0 11px; border:1px solid var(--app-border); border-radius:12px; color:var(--app-text-muted); background:var(--app-surface); }
  .recursos-estudiante__filtros input { min-width:0; flex:1; border:none; outline:none; color:var(--app-text); background:transparent; font:inherit; font-size:11px; }
  .recursos-estudiante__filtros select { padding:0 10px; border:1px solid var(--app-border); border-radius:12px; color:var(--app-text); background:var(--app-surface); font:inherit; font-size:10px; }
  .recursos-estudiante__lista { display:grid; gap:9px; }
  @media(max-width:700px){ .recursos-estudiante__filtros{grid-template-columns:1fr}.recursos-estudiante__filtros select{min-height:42px;} }
`;
