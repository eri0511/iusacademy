import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CircleX,
  Layers3,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

type EstadoMateria = 'ACTIVA' | 'INACTIVA';
type FiltroEstado = 'TODAS' | 'ACTIVAS' | 'INACTIVAS';
type TipoToast = 'exito' | 'error';

type Materia = {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  descripcion?: string | null;
  estado: EstadoMateria;
  creadoEn: string;
  actualizadoEn: string;
};

type FormularioMateria = {
  nombre: string;
  codigo: string;
  semestre: string;
  descripcion: string;
};

type RespuestaError = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

type ToastEstado = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const semestres = Array.from({ length: 9 }, (_, indice) => indice + 1);
const formularioInicial: FormularioMateria = {
  nombre: '',
  codigo: '',
  semestre: '',
  descripcion: '',
};

function obtenerMensajeError(datos: RespuestaError, predeterminado: string): string {
  if (Array.isArray(datos.message)) return datos.message.join('. ');
  return datos.message || datos.mensaje || datos.error || predeterminado;
}

function headersAutorizados(token: string, json = false): HeadersInit {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export default function Materias() {
  const { accessToken, cerrarSesion } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [materiaEditandoId, setMateriaEditandoId] = useState<number | null>(null);
  const [materiaEstado, setMateriaEstado] = useState<Materia | null>(null);
  const [formulario, setFormulario] = useState<FormularioMateria>(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('ACTIVAS');
  const [filtroSemestre, setFiltroSemestre] = useState('TODOS');
  const [toast, setToast] = useState<ToastEstado>({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });

  const mostrarToast = useCallback((tipo: TipoToast, titulo: string, mensaje: string) => {
    setToast({ visible: true, tipo, titulo, mensaje });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast((anterior) => ({ ...anterior, visible: false }));
  }, []);

  const verificarSesion = useCallback((respuesta: Response) => {
    if (respuesta.status === 401) {
      cerrarSesion();
      throw new Error('Tu sesión venció. Inicia sesión nuevamente.');
    }
  }, [cerrarSesion]);

  const obtenerMaterias = useCallback(async () => {
    if (!accessToken) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch(`${API_URL}/materias`, {
        headers: headersAutorizados(accessToken),
      });

      verificarSesion(respuesta);
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(obtenerMensajeError(datos as RespuestaError, 'No fue posible obtener las materias.'));
      }

      if (!Array.isArray(datos)) {
        throw new Error('El servidor devolvió una respuesta no válida.');
      }

      setMaterias(datos as Materia[]);
    } catch (error) {
      console.error(error);
      mostrarToast(
        'error',
        'Error al cargar',
        error instanceof Error ? error.message : 'No fue posible obtener las materias.',
      );
    } finally {
      setCargando(false);
    }
  }, [accessToken, mostrarToast, verificarSesion]);

  useEffect(() => {
    void obtenerMaterias();
  }, [obtenerMaterias]);

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setMateriaEditandoId(null);
  };

  const abrirNuevaMateria = () => {
    limpiarFormulario();
    setPanelAbierto(true);
  };

  const abrirEdicion = (materia: Materia) => {
    setFormulario({
      nombre: materia.nombre,
      codigo: materia.codigo,
      semestre: String(materia.semestre),
      descripcion: materia.descripcion ?? '',
    });
    setMateriaEditandoId(materia.id);
    setPanelAbierto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setPanelAbierto(false);
  };

  const manejarCambio = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const validarFormulario = () => {
    const semestre = Number(formulario.semestre);

    if (!formulario.nombre.trim() || !formulario.codigo.trim() || !formulario.semestre) {
      mostrarToast('error', 'Datos incompletos', 'Completa el nombre, código y semestre.');
      return false;
    }

    if (!Number.isInteger(semestre) || semestre < 1 || semestre > 9) {
      mostrarToast('error', 'Semestre no válido', 'El semestre debe estar entre 1 y 9.');
      return false;
    }

    return true;
  };

  const guardarMateria = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (guardando || !accessToken || !validarFormulario()) return;

    const editando = materiaEditandoId !== null;

    try {
      setGuardando(true);
      const respuesta = await fetch(
        editando ? `${API_URL}/materias/${materiaEditandoId}` : `${API_URL}/materias`,
        {
          method: editando ? 'PUT' : 'POST',
          headers: headersAutorizados(accessToken, true),
          body: JSON.stringify({
            nombre: formulario.nombre.trim(),
            codigo: formulario.codigo.trim().toUpperCase(),
            semestre: Number(formulario.semestre),
            descripcion: formulario.descripcion.trim() || undefined,
          }),
        },
      );

      verificarSesion(respuesta);
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          obtenerMensajeError(
            datos as RespuestaError,
            editando ? 'No fue posible actualizar la materia.' : 'No fue posible crear la materia.',
          ),
        );
      }

      cerrarFormulario();
      await obtenerMaterias();
      mostrarToast(
        'exito',
        editando ? 'Materia actualizada' : 'Materia creada',
        (datos as { mensaje?: string }).mensaje ||
          (editando
            ? 'La materia fue actualizada correctamente.'
            : 'La materia fue registrada correctamente.'),
      );
    } catch (error) {
      console.error(error);
      mostrarToast(
        'error',
        editando ? 'No se pudo actualizar' : 'No se pudo crear',
        error instanceof Error ? error.message : 'No fue posible guardar la materia.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoMateria = async () => {
    if (!materiaEstado || !accessToken || actualizandoEstado) return;

    try {
      setActualizandoEstado(true);
      const nuevoEstado: EstadoMateria = materiaEstado.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
      const respuesta = await fetch(`${API_URL}/materias/${materiaEstado.id}/estado`, {
        method: 'PATCH',
        headers: headersAutorizados(accessToken, true),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      verificarSesion(respuesta);
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          obtenerMensajeError(datos as RespuestaError, 'No fue posible cambiar el estado de la materia.'),
        );
      }

      setMaterias((anteriores) =>
        anteriores.map((materia) =>
          materia.id === materiaEstado.id ? { ...materia, estado: nuevoEstado } : materia,
        ),
      );

      setMateriaEstado(null);
      mostrarToast(
        'exito',
        nuevoEstado === 'ACTIVA' ? 'Materia reactivada' : 'Materia desactivada',
        (datos as { mensaje?: string }).mensaje ||
          (nuevoEstado === 'ACTIVA'
            ? 'La materia volvió a estar disponible.'
            : 'La materia quedó inactiva.'),
      );
    } catch (error) {
      console.error(error);
      mostrarToast(
        'error',
        'No se pudo actualizar',
        error instanceof Error ? error.message : 'No fue posible cambiar el estado de la materia.',
      );
    } finally {
      setActualizandoEstado(false);
    }
  };

  const resumen = useMemo(() => ({
    total: materias.length,
    activas: materias.filter((materia) => materia.estado === 'ACTIVA').length,
    inactivas: materias.filter((materia) => materia.estado === 'INACTIVA').length,
    semestres: new Set(materias.map((materia) => materia.semestre)).size,
  }), [materias]);

  const materiasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return materias.filter((materia) => {
      const coincideEstado =
        filtroEstado === 'TODAS' ||
        (filtroEstado === 'ACTIVAS' && materia.estado === 'ACTIVA') ||
        (filtroEstado === 'INACTIVAS' && materia.estado === 'INACTIVA');

      const coincideSemestre =
        filtroSemestre === 'TODOS' || materia.semestre === Number(filtroSemestre);

      const coincideBusqueda =
        !texto ||
        materia.nombre.toLowerCase().includes(texto) ||
        materia.codigo.toLowerCase().includes(texto) ||
        (materia.descripcion ?? '').toLowerCase().includes(texto);

      return coincideEstado && coincideSemestre && coincideBusqueda;
    });
  }, [materias, busqueda, filtroEstado, filtroSemestre]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('ACTIVAS');
    setFiltroSemestre('TODOS');
  };

  return (
    <main className="materias-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <header className="materias-header">
        <div className="materias-header__content">
          <div className="materias-header__icon" aria-hidden="true">
            <BookOpen size={25} />
          </div>

          <div>
            <span className="materias-eyebrow">Administración académica</span>
            <h1>Materias</h1>
            <p>Administra las asignaturas académicas disponibles en IusAcademy.</p>

            <div className="materias-header__meta">
              <span>9 semestres</span>
              <span>Área civil</span>
              <span>Gestión académica</span>
            </div>
          </div>
        </div>

        <button type="button" className="btn-agregar" onClick={abrirNuevaMateria}>
          <Plus size={18} />
          Agregar materia
        </button>
      </header>

      <section className="summary-grid">
        <Resumen icono={<BookOpen size={21} />} cantidad={resumen.total} titulo="Total de materias" clase="total" />
        <Resumen icono={<ToggleRight size={21} />} cantidad={resumen.activas} titulo="Materias activas" clase="activas" />
        <Resumen icono={<ToggleLeft size={21} />} cantidad={resumen.inactivas} titulo="Materias inactivas" clase="inactivas" />
        <Resumen icono={<Layers3 size={21} />} cantidad={resumen.semestres} titulo="Semestres cubiertos" clase="semestres" />
      </section>

      {panelAbierto && (
        <section className="form-card">
          <div className="form-card-header">
            <div>
              <span className="section-eyebrow">{materiaEditandoId ? 'Editar materia' : 'Nueva materia'}</span>
              <h2>{materiaEditandoId ? 'Actualizar materia' : 'Registrar materia'}</h2>
              <p>Completa la información académica de la asignatura.</p>
            </div>

            <button type="button" className="btn-cerrar-form" onClick={cerrarFormulario} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>

          <form className="materias-form" onSubmit={guardarMateria}>
            <div className="form-grid">
              <Campo titulo="Nombre de la materia" nombre="nombre" valor={formulario.nombre} placeholder="Ej. Derecho Procesal Civil" onChange={manejarCambio} disabled={guardando} />
              <Campo titulo="Código" nombre="codigo" valor={formulario.codigo} placeholder="Ej. DPC-701" onChange={manejarCambio} disabled={guardando} />

              <label>
                <span>Semestre</span>
                <select name="semestre" value={formulario.semestre} onChange={manejarCambio} disabled={guardando}>
                  <option value="">Selecciona un semestre</option>
                  {semestres.map((semestre) => (
                    <option key={semestre} value={semestre}>{semestre}.º semestre</option>
                  ))}
                </select>
              </label>

              <label className="descripcion-field">
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={manejarCambio}
                  placeholder="Describe brevemente el contenido de la materia..."
                  maxLength={500}
                  disabled={guardando}
                />
                <small>{formulario.descripcion.length}/500</small>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : materiaEditandoId ? 'Guardar cambios' : 'Crear materia'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="materias-card">
        <div className="materias-card-top">
          <div>
            <h2>Materias registradas</h2>
            <p>Consulta, filtra y administra las asignaturas.</p>
          </div>
          <div className="materias-count-wrap">
            <span className="materias-count">
              {materiasFiltradas.length} de {materias.length}
            </span>
            <small>resultados visibles</small>
          </div>
        </div>

        <div className="filters-row">
          <div className="state-filters">
            <button type="button" className={filtroEstado === 'ACTIVAS' ? 'active' : ''} onClick={() => setFiltroEstado('ACTIVAS')}>Activas <span>{resumen.activas}</span></button>
            <button type="button" className={filtroEstado === 'INACTIVAS' ? 'active' : ''} onClick={() => setFiltroEstado('INACTIVAS')}>Inactivas <span>{resumen.inactivas}</span></button>
            <button type="button" className={filtroEstado === 'TODAS' ? 'active' : ''} onClick={() => setFiltroEstado('TODAS')}>Todas <span>{resumen.total}</span></button>
          </div>

          <div className="semester-filter">
            <SlidersHorizontal size={16} />
            <select value={filtroSemestre} onChange={(event) => setFiltroSemestre(event.target.value)}>
              <option value="TODOS">Todos los semestres</option>
              {semestres.map((semestre) => (
                <option key={semestre} value={semestre}>{semestre}.º semestre</option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-box">
          <Search size={17} />
          <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, código o descripción..." />
          {(busqueda || filtroSemestre !== 'TODOS' || filtroEstado !== 'ACTIVAS') && (
            <button type="button" onClick={limpiarFiltros} title="Limpiar filtros">
              <RefreshCcw size={15} />
            </button>
          )}
        </div>
      </section>

      <section className="table-section">
        {cargando ? (
          <div className="state-card state-card--loading"><span className="spinner" />Cargando materias...</div>
        ) : materiasFiltradas.length === 0 ? (
          <div className="state-card state-card--empty">
            <BookOpen size={28} />
            <strong>No se encontraron materias</strong>
            <p>Ajusta los filtros o registra una nueva materia.</p>
            <div>
              <button type="button" className="btn-secondary" onClick={limpiarFiltros}>Limpiar filtros</button>
              <button type="button" className="btn-primary" onClick={abrirNuevaMateria}>Agregar materia</button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="materias-table">
              <thead>
                <tr>
                  <th>Materia</th><th>Código</th><th>Semestre</th><th>Descripción</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materiasFiltradas.map((materia) => (
                  <tr key={materia.id}>
                    <td><div className="materia-cell"><div className="materia-icon"><BookOpen size={18} /></div><strong>{materia.nombre}</strong></div></td>
                    <td><span className="code-badge">{materia.codigo}</span></td>
                    <td><span className="semester-badge">{materia.semestre}.º</span></td>
                    <td className="description-cell">{materia.descripcion || 'Sin descripción'}</td>
                    <td><span className={`status-badge ${materia.estado === 'ACTIVA' ? 'active' : 'inactive'}`}><span className="status-dot" />{materia.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button type="button" className="action-button edit" onClick={() => abrirEdicion(materia)}><Pencil size={15} />Editar</button>
                        <button type="button" className={`action-button ${materia.estado === 'ACTIVA' ? 'disable' : 'enable'}`} onClick={() => setMateriaEstado(materia)}>
                          {materia.estado === 'ACTIVA' ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                          {materia.estado === 'ACTIVA' ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {materiaEstado && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div className={`confirm-icon ${materiaEstado.estado === 'ACTIVA' ? 'warning' : 'success'}`}>
              {materiaEstado.estado === 'ACTIVA' ? <ToggleLeft size={25} /> : <ToggleRight size={25} />}
            </div>
            <span className="modal-eyebrow">Confirmar acción</span>
            <h3>{materiaEstado.estado === 'ACTIVA' ? '¿Desactivar materia?' : '¿Reactivar materia?'}</h3>
            <p>
              {materiaEstado.estado === 'ACTIVA'
                ? `${materiaEstado.nombre} dejará de estar disponible para nuevos cursos, pero conservará toda su información.`
                : `${materiaEstado.nombre} volverá a estar disponible para crear nuevos cursos.`}
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setMateriaEstado(null)} disabled={actualizandoEstado}>Cancelar</button>
              <button type="button" className={`modal-confirm ${materiaEstado.estado === 'ACTIVA' ? 'disable' : 'enable'}`} onClick={cambiarEstadoMateria} disabled={actualizandoEstado}>
                {actualizandoEstado ? 'Procesando...' : materiaEstado.estado === 'ACTIVA' ? 'Desactivar' : 'Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{styles}</style>
    </main>
  );
}

function Campo({ titulo, nombre, valor, placeholder, onChange, disabled }: {
  titulo: string;
  nombre: string;
  valor: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      <span>{titulo}</span>
      <input type="text" name={nombre} value={valor} onChange={onChange} placeholder={placeholder} disabled={disabled} />
    </label>
  );
}

function Resumen({ icono, cantidad, titulo, clase }: {
  icono: ReactNode;
  cantidad: number;
  titulo: string;
  clase: string;
}) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${clase}`}>{icono}</div>
      <div><strong>{cantidad}</strong><span>{titulo}</span></div>
    </article>
  );
}

function Toast({ tipo, titulo, mensaje, onCerrar }: {
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
}) {
  useEffect(() => {
    const temporizador = window.setTimeout(onCerrar, 5000);
    return () => window.clearTimeout(temporizador);
  }, [onCerrar]);

  return (
    <div className={`toast ${tipo}`}>
      <div className="toast-icon">{tipo === 'exito' ? <CheckCircle2 size={22} /> : <CircleX size={22} />}</div>
      <div className="toast-content"><strong>{titulo}</strong><p>{mensaje}</p></div>
      <button type="button" onClick={onCerrar} aria-label="Cerrar notificación"><X size={16} /></button>
      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .materias-page {
    width: 100%;
    min-width: 0;
    min-height: 100%;

    padding:
      0
      34px
      50px;

    color:
      var(--app-text);

    background:
      transparent;
  }

  .materias-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 22px;
    padding: 27px 30px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 26px;
    background: var(--app-surface);
    box-shadow:
      var(--app-shadow),
      inset 0 1px 0
      color-mix(
        in srgb,
        var(--app-surface-raised)
        72%,
        transparent
      );
  }

  .materias-header::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--app-accent);
  }

  .materias-header::after {
    content: none;
  }

  .materias-header__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 17px;
  }

  .materias-header__icon {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 18px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .materias-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .materias-header h1 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 31px;
    font-weight: 900;
    letter-spacing: -0.025em;
  }

  .materias-header p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
  }

  .materias-header__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }

  .materias-header__meta span {
    padding: 5px 9px;
    border: 1px solid var(--app-warning-border);
    border-radius: 999px;
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
    font-size: 10px;
    font-weight: 750;
  }

  .btn-agregar,
  .btn-primary {
    border: none;
    color: white;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    box-shadow:
      0 14px 32px
      color-mix(
        in srgb,
        var(--app-accent)
        28%,
        transparent
      );
  }

  .btn-agregar {
    position: relative;
    z-index: 1;
    min-height: 45px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 999px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .btn-agregar:hover {
    transform: translateY(-2px);
    box-shadow:
      0 19px 40px
      color-mix(
        in srgb,
        var(--app-accent)
        34%,
        transparent
      );
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }

  .summary-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 88px;
    padding: 18px 20px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .summary-card::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 76px;
    height: 76px;
    border-radius: 0 0 0 100%;
    background: rgba(241, 139, 75, 0.035);
  }

  .summary-card:hover {
    transform: translateY(-3px);
    border-color: rgba(241, 139, 75, 0.29);
    box-shadow: var(--app-shadow-lg);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  }

  .summary-icon.total { background: var(--app-accent-soft); color: var(--app-accent); }
  .summary-icon.activas { background: var(--app-success-bg); color: var(--app-success); }
  .summary-icon.inactivas { background: var(--app-surface-disabled); color: var(--app-text-muted); }
  .summary-icon.semestres { background: var(--app-warning-bg); color: var(--app-warning); }

  .summary-card strong {
    display: block;
    color: var(--app-text);
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
  }

  .summary-card span {
    display: block;
    margin-top: 6px;
    color: var(--app-text-soft);
    font-size: 12px;
    font-weight: 650;
  }

  .form-card,
  .materias-card {
    margin-bottom: 22px;
    padding: 24px;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .form-card {
    position: relative;
    overflow: hidden;
    animation: revealCard 0.28s ease both;
  }

  .form-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background:
      linear-gradient(
        90deg,
        var(--app-accent),
        var(--app-warning),
        transparent 80%
      );
  }

  .form-card-header,
  .materias-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  .form-card-header h2,
  .materias-card-top h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 19px;
    font-weight: 850;
  }

  .form-card-header p,
  .materias-card-top p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
  }

  .btn-cerrar-form {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
    transition: transform 0.16s ease, background 0.16s ease;
  }

  .btn-cerrar-form:hover {
    transform: rotate(4deg) scale(1.04);
    background: #ffe6d1;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 22px;
  }

  .materias-form label {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .materias-form label span {
    color: var(--app-text-secondary);
    font-size: 13px;
    font-weight: 700;
  }

  .materias-form input,
  .materias-form select,
  .materias-form textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    outline: none;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }

  .materias-form textarea {
    min-height: 110px;
    resize: vertical;
  }

  .materias-form input:focus,
  .materias-form select:focus,
  .materias-form textarea:focus {
    transform: translateY(-1px);
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px var(--app-input-ring);
  }

  .materias-form input:disabled,
  .materias-form select:disabled,
  .materias-form textarea:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .descripcion-field { grid-column: 1 / -1; }

  .descripcion-field small {
    align-self: flex-end;
    color: var(--app-text-muted);
    font-size: 11px;
  }

  .form-actions,
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  .btn-primary,
  .btn-secondary,
  .modal-cancel,
  .modal-confirm {
    min-height: 42px;
    padding: 10px 18px;
    border-radius: 999px;
    font-weight: 750;
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
  }

  .btn-secondary,
  .modal-cancel {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: transparent;
  }

  .btn-primary:hover:not(:disabled),
  .btn-secondary:hover:not(:disabled),
  .modal-cancel:hover:not(:disabled),
  .modal-confirm:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled,
  .modal-cancel:disabled,
  .modal-confirm:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .materias-count-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .materias-count {
    padding: 6px 11px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 12px;
    font-weight: 800;
  }

  .materias-count-wrap small {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .filters-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
  }

  .state-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .state-filters button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: transform 0.16s ease, color 0.16s ease, background 0.16s ease;
  }

  .state-filters button:hover {
    transform: translateY(-1px);
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .state-filters button.active {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-accent-softer)
      );
    box-shadow: 0 8px 20px rgba(217, 119, 6, 0.1);
  }

  .state-filters button span {
    min-width: 21px;
    height: 21px;
    display: grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--app-accent-softer);
    font-size: 10px;
  }

  .semester-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .semester-filter select {
    border: none;
    outline: none;
    color: var(--app-text-secondary);
    background: transparent;
    cursor: pointer;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 18px;
    padding: 11px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .search-box:focus-within {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px var(--app-input-ring);
  }

  .search-box input {
    width: 100%;
    border: none;
    outline: none;
    color: var(--app-text-secondary);
    background: transparent;
  }

  .search-box button {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
    transition: transform 0.16s ease;
  }

  .search-box button:hover { transform: rotate(-12deg); }

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .materias-table {
    width: 100%;
    min-width: 980px;
    border-collapse: separate;
    border-spacing: 0;
  }

  .materias-table thead {
    background: var(--app-accent-soft);
  }

  .materias-table th,
  .materias-table td {
    padding: 15px 13px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid rgba(241, 139, 75, 0.12);
  }

  .materias-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: var(--app-text-soft);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.055em;
    text-transform: uppercase;
  }

  .materias-table td {
    color: var(--app-text-secondary);
    font-size: 13px;
  }

  .materias-table tbody tr {
    transition: background 0.18s ease, box-shadow 0.18s ease;
  }

  .materias-table tbody tr:hover {
    background: var(--app-accent-softer);
    box-shadow: inset 4px 0 0 var(--app-accent);
  }

  .materias-table tbody tr:last-child td { border-bottom: none; }

  .materia-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 210px;
  }

  .materia-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
    box-shadow: var(--app-shadow-sm);
  }

  .materia-cell strong {
    color: var(--app-text);
    font-size: 13px;
    line-height: 1.35;
  }

  .code-badge,
  .semester-badge,
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .code-badge { color: var(--app-accent-dark); background: var(--app-accent-soft); }
  .semester-badge { color: var(--app-warning-strong); background: var(--app-warning-bg); }
  .status-badge.active { color: var(--app-success); background: var(--app-success-bg); }
  .status-badge.inactive { color: var(--app-text-muted); background: var(--app-surface-disabled); }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .description-cell {
    max-width: 340px;
    color: #64748b !important;
    line-height: 1.52;
  }

  .actions-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 34px;
    padding: 7px 10px;
    border-radius: 11px;
    background: transparent;
    font-size: 10px;
    font-weight: 780;
    cursor: pointer;
    transition: transform 0.16s ease, background 0.16s ease;
  }

  .action-button:hover { transform: translateY(-1px); }
  .action-button.edit { border: 1px solid var(--app-border-strong); color: var(--app-accent-dark); }
  .action-button.edit:hover { background: var(--app-accent-soft); }
  .action-button.disable { border: 1px solid var(--app-danger-border); color: var(--app-danger); }
  .action-button.disable:hover { background: var(--app-danger-bg); }
  .action-button.enable { border: 1px solid var(--app-success-border); color: var(--app-success); }
  .action-button.enable:hover { background: var(--app-success-bg); }

  .state-card {
    padding: 25px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    color: var(--app-text-soft);
    background: var(--app-surface);
  }

  .state-card--loading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .state-card--empty {
    display: grid;
    place-items: center;
    min-height: 220px;
    text-align: center;
    gap: 8px;
  }

  .state-card--empty svg { color: var(--app-accent); }
  .state-card--empty strong { color: var(--app-text); font-size: 16px; }
  .state-card--empty p { margin: 0; }
  .state-card--empty > div { display: flex; gap: 10px; margin-top: 8px; }

  .spinner {
    width: 21px;
    height: 21px;
    border: 3px solid var(--app-border);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: var(--app-overlay);
    backdrop-filter: blur(6px);
  }

  .confirm-modal {
    width: min(430px, 100%);
    padding: 28px;
    border: 1px solid var(--app-border);
    border-radius: 25px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-modal);
    animation: revealCard 0.22s ease both;
  }

  .confirm-icon {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 17px;
  }

  .confirm-icon.warning { color: var(--app-danger); background: var(--app-danger-bg); }
  .confirm-icon.success { color: var(--app-success); background: var(--app-success-bg); }

  .confirm-modal h3 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 21px;
  }

  .confirm-modal p {
    margin: 10px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
    line-height: 1.6;
  }

  .modal-confirm { border: none; color: white; }
  .modal-confirm.disable { background: #dc2626; }
  .modal-confirm.enable { background: #16a34a; }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 9999;
    width: min(390px, calc(100vw - 40px));
    display: grid;
    grid-template-columns: 42px 1fr 28px;
    gap: 11px;
    align-items: flex-start;
    padding: 15px 15px 18px;
    overflow: hidden;
    border-radius: 18px;
    box-shadow: var(--app-shadow-lg);
    animation: toastIn 0.3s ease;
  }

  .toast.exito { border: 1px solid var(--app-success-border); color: var(--app-success); background: var(--app-success-bg); }
  .toast.error { border: 1px solid var(--app-danger-border); color: var(--app-danger-strong); background: var(--app-danger-bg); }

  .toast-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .toast.exito .toast-icon { background: var(--app-success-bg); }
  .toast.error .toast-icon { background: var(--app-danger-bg); }
  .toast-content strong { display: block; font-size: 14px; }
  .toast-content p { margin: 4px 0 0; color: var(--app-text-soft); font-size: 12px; }
  .toast button { border: none; color: var(--app-text-muted); background: transparent; cursor: pointer; }

  .toast-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;
    transform-origin: left center;
    animation: toastProgress 5s linear forwards;
  }

  .toast.exito .toast-progress { background: #22c55e; }
  .toast.error .toast-progress { background: #ef4444; }

  html[data-theme='oscuro']
  .materias-header,
  html[data-theme='oscuro']
  .summary-card,
  html[data-theme='oscuro']
  .form-card,
  html[data-theme='oscuro']
  .materias-card,
  html[data-theme='oscuro']
  .table-wrapper,
  html[data-theme='oscuro']
  .state-card,
  html[data-theme='oscuro']
  .confirm-modal {
    background:
      var(--app-surface);

    border-color:
      var(--app-border-soft);

    box-shadow:
      var(--app-shadow);
  }

  html[data-theme='oscuro']
  .materias-table thead,
  html[data-theme='oscuro']
  .materias-table th {
    background:
      var(--app-surface-raised);
  }

  html[data-theme='oscuro']
  .materias-table th,
  html[data-theme='oscuro']
  .materias-table td {
    border-bottom-color:
      var(--app-border-soft);
  }

  html[data-theme='oscuro']
  .materias-table tbody tr:hover {
    background:
      var(--app-accent-softer);
  }

  html[data-theme='oscuro']
  .state-filters button,
  html[data-theme='oscuro']
  .semester-filter,
  html[data-theme='oscuro']
  .search-box {
    background:
      var(--app-surface-alt);
  }

  html[data-theme='oscuro']
  .materias-form input,
  html[data-theme='oscuro']
  .materias-form select,
  html[data-theme='oscuro']
  .materias-form textarea {
    color:
      var(--app-text);

    background:
      var(--app-input-bg);
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes revealCard {
    from { opacity: 0; transform: translateY(10px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes toastProgress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  @media (max-width: 1100px) {
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .filters-row { align-items: stretch; flex-direction: column; }
    .semester-filter { width: fit-content; }
  }

  @media (max-width: 850px) {
    .materias-page { padding: 18px; }
    .materias-header { flex-direction: column; align-items: stretch; }
    .materias-header__content { align-items: flex-start; }
    .btn-agregar { width: 100%; }
    .summary-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .descripcion-field { grid-column: auto; }
    .materias-card-top { align-items: flex-start; }
  }

  @media (max-width: 560px) {
    .materias-page { padding: 12px 12px 36px; }
    .materias-header { padding: 22px 18px; }
    .materias-header__icon { width: 50px; height: 50px; }
    .materias-header h1 { font-size: 27px; }
    .materias-header__meta { gap: 5px; }
    .form-card, .materias-card { padding: 18px; }
    .state-filters { display: grid; grid-template-columns: 1fr; }
    .state-filters button { justify-content: space-between; }
    .semester-filter { width: 100%; }
    .semester-filter select { width: 100%; }
    .materias-count-wrap { align-items: flex-start; }
    .materias-card-top { flex-direction: column; }
    .state-card--empty > div { width: 100%; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .materias-page *,
    .materias-page *::before,
    .materias-page *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;