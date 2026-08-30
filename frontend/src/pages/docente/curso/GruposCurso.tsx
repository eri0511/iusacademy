import {
  AlertCircle,
  FolderKanban,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import ConjuntoGrupoCard from '../../../components/curso/ConjuntoGrupoCard';
import FormularioConjuntoGrupo from '../../../components/curso/FormularioConjuntoGrupo';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useGruposCurso from '../../../hooks/grupos/useGruposCurso';

import type {
  ConjuntoGrupoResumen,
} from '../../../types/grupos/grupos.types';

export default function GruposCurso() {
  const navigate =
    useNavigate();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const {
    conjuntos,
    cargando,
    actualizando,
    procesando,
    error,
    cargarConjuntos,
    cambiarBloqueo,
    retirarConjunto,
    previsualizar,
    crearConjunto,
    previsualizacion,
    validaciones,
    cargarValidaciones,
    limpiarPrevisualizacion,
    limpiarError,
  } =
    useGruposCurso({
      cursoId:
        curso.id,
      hitoId:
        hitoSeleccionado?.id,
    });

  const [
    modalCrearAbierto,
    setModalCrearAbierto,
  ] =
    useState(
      false,
    );

  const [
    conjuntoEliminar,
    setConjuntoEliminar,
  ] =
    useState<ConjuntoGrupoResumen | null>(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<{
      visible:
        boolean;

      tipo:
        TipoToast;

      titulo:
        string;

      mensaje:
        string;
    }>({
      visible:
        false,

      tipo:
        'exito',

      titulo:
        '',

      mensaje:
        '',
    });

  const conjuntosDisponibles =
    useMemo(
      () =>
        [...conjuntos].sort(
          (
            conjuntoA,
            conjuntoB,
          ) => {
            if (
              conjuntoA.alcance !==
              conjuntoB.alcance
            ) {
              return conjuntoA.alcance ===
                'CURSO'
                ? -1
                : 1;
            }

            return new Date(
              conjuntoB.actualizadoEn,
            ).getTime() -
              new Date(
                conjuntoA.actualizadoEn,
              ).getTime();
          },
        ),
      [
        conjuntos,
      ],
    );

  const mostrarMensaje =
    (
      tipo:
        TipoToast,
      titulo:
        string,
      mensaje:
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

  const cerrarToast =
    () => {
      setToast(
        (
          actual,
        ) => ({
          ...actual,

          visible:
            false,
        }),
      );
    };

  const abrirDetalle =
    async (
      conjunto:
        ConjuntoGrupoResumen,
    ) => {
      navigate(
        String(
          conjunto.id,
        ),
      );
    };

  const editarConjunto =
    (
      conjunto:
        ConjuntoGrupoResumen,
    ) => {
      navigate(
        `${conjunto.id}?editar=1`,
      );
    };

  const alternarBloqueo =
    async (
      conjunto:
        ConjuntoGrupoResumen,
    ) => {
      try {
        await cambiarBloqueo(
          conjunto.id,
          !conjunto.estaBloqueado,
        );

        mostrarMensaje(
          'exito',
          conjunto.estaBloqueado
            ? 'Conjunto desbloqueado'
            : 'Conjunto bloqueado',
          conjunto.estaBloqueado
            ? 'La distribución vuelve a permitir modificaciones.'
            : 'La distribución quedó protegida contra cambios accidentales.',
        );
      } catch {
        // El hook conserva el error.
      }
    };

  const confirmarEliminacion =
    async () => {
      if (!conjuntoEliminar) {
        return;
      }

      try {
        await retirarConjunto(
          conjuntoEliminar.id,
        );

        setConjuntoEliminar(
          null,
        );

        mostrarMensaje(
          'exito',
          'Conjunto eliminado',
          'El conjunto dejó de mostrarse y sus grupos asociados quedaron desactivados.',
        );
      } catch {
        // El hook conserva el error.
      }
    };

  const abrirCrear =
    async () => {
      try {
        limpiarPrevisualizacion();

        const estado =
          await cargarValidaciones(
            true,
          );

        const procesualDisponible =
          estado.procesual.disponible;

        const continuaSemestralDisponible =
          estado.continua.puedeCrearSemestral;

        const hitoValidacion =
          hitoSeleccionado
            ? estado.continua.hitos.find(
                (
                  hito,
                ) =>
                  hito.id ===
                  hitoSeleccionado.id,
              ) ??
              null
            : null;

        const continuaHitoDisponible =
          Boolean(
            hitoSeleccionado,
          ) &&
          estado.continua.puedeCrearPorHito &&
          !hitoValidacion?.ocupado;

        const existeConfiguracionPendiente =
          procesualDisponible ||
          continuaSemestralDisponible ||
          continuaHitoDisponible;

        if (
          !existeConfiguracionPendiente
        ) {
          let texto =
            'Los grupos del curso ya están completamente configurados.';

          if (
            estado.continua.semestralExiste
          ) {
            texto =
              'Los grupos del semestre ya están configurados: existe el conjunto procesual y el conjunto continuo semestral.';
          } else if (
            hitoSeleccionado &&
            hitoValidacion?.ocupado
          ) {
            texto =
              `Los grupos para ${hitoSeleccionado.codigo} ya están configurados. Ya existe el conjunto procesual y el conjunto continuo correspondiente a este hito.`;
          } else if (
            !hitoSeleccionado &&
            estado.continua.modalidad ===
              'POR_HITOS'
          ) {
            texto =
              'Selecciona un hito que todavía no tenga grupos continuos para crear un nuevo conjunto.';
          }

          mostrarMensaje(
            'informacion',
            'Grupos ya configurados',
            texto,
          );

          return;
        }

        setModalCrearAbierto(
          true,
        );
      } catch (
        problema
      ) {
        mostrarMensaje(
          'error',
          'No se pudo abrir el formulario',
          problema instanceof Error
            ? problema.message
            : 'No fue posible preparar el formulario.',
        );
      }
    };

  const guardarConjunto =
    async (
      datos:
        Parameters<
          typeof crearConjunto
        >[0],
    ) => {
      await crearConjunto(
        datos,
      );

      setModalCrearAbierto(
        false,
      );

      mostrarMensaje(
        'exito',
        'Conjunto creado',
        'Los grupos fueron creados y ya están disponibles para el curso.',
      );
    };

  if (
    cargando &&
    conjuntos.length ===
      0
  ) {
    return (
      <section className="grupos-curso">
        <AulaSkeleton
          cantidad={
            6
          }
          variante="lista"
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  return (
    <section className="grupos-curso">
      <AulaLoadingOverlay
        visible={
          actualizando
        }
        texto="Actualizando grupos…"
      />

      <AulaHeader
        icono={Users}
        etiqueta="Organización colaborativa"
        titulo="Grupos del curso"
        descripcion="Organiza equipos permanentes o exclusivos de cada hito para reutilizarlos en foros y tareas."
        informacion={
          <>
            {curso.materia.nombre}
            {' · '}
            {conjuntos.length}
            {' '}
            {conjuntos.length === 1 ? 'conjunto activo' : 'conjuntos activos'}
          </>
        }
        acciones={[
          {
            texto: 'Nuevo conjunto',
            icono: Plus,
            variante: 'primaria' as const,
            onClick: () => { void abrirCrear(); },
          },
          {
            texto: 'Actualizar',
            icono: RefreshCw,
            variante: 'secundaria' as const,
            deshabilitada: actualizando,
            onClick: () => { void cargarConjuntos(false); },
          },
        ]}
      />

      {error && (
        <div className="grupos-error">
          <AlertCircle
            size={17}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            aria-label="Cerrar error"
            onClick={
              limpiarError
            }
          >
            <X
              size={15}
            />
          </button>
        </div>
      )}

      {conjuntosDisponibles.length ===
      0 ? (
        <AulaEmptyState
          titulo="Todavía no existen grupos"
          descripcion="Crea el primer conjunto para organizar a los estudiantes del curso."
          icono={
            FolderKanban
          }
          accionTexto="Crear conjunto"
          onAccion={() =>
            void abrirCrear()
          }
        />
      ) : (
        <section className="grupos-disponibles">
          <div className="grupos-grid">
            {conjuntosDisponibles.map(
              (
                conjunto,
              ) => (
                <ConjuntoGrupoCard
                  key={
                    conjunto.id
                  }
                  conjunto={
                    conjunto
                  }
                  procesando={
                    procesando
                  }
                  onAbrir={() =>
                    void abrirDetalle(
                      conjunto,
                    )
                  }
                  onEditar={() =>
                    editarConjunto(
                      conjunto,
                    )
                  }
                  onCambiarBloqueo={() =>
                    void alternarBloqueo(
                      conjunto,
                    )
                  }
                  onEliminar={() =>
                    setConjuntoEliminar(
                      conjunto,
                    )
                  }
                />
              ),
            )}
          </div>
        </section>
      )}

      <FormularioConjuntoGrupo
        abierto={
          modalCrearAbierto
        }
        hitoActual={
          hitoSeleccionado
            ? {
                id:
                  hitoSeleccionado.id,
                codigo:
                  hitoSeleccionado.codigo,
                nombre:
                  hitoSeleccionado.nombre,
              }
            : null
        }
        procesando={
          procesando
        }
        previsualizacion={
          previsualizacion
        }
        validaciones={
          validaciones
        }
        onCerrar={() => {
          if (
            procesando
          ) {
            return;
          }

          setModalCrearAbierto(
            false,
          );

          limpiarPrevisualizacion();
        }}
        onPrevisualizar={
          previsualizar
        }
        onGuardar={
          guardarConjunto
        }
        onLimpiarPrevisualizacion={
          limpiarPrevisualizacion
        }
      />

      {conjuntoEliminar && (
        <div className="confirmacion-backdrop">
          <section className="confirmacion-card">
            <span>
              <Trash2
                size={25}
              />
            </span>

            <h3>
              Eliminar conjunto
            </h3>

            <p>
              “{conjuntoEliminar.nombre}” dejará de mostrarse. Los grupos asociados quedarán desactivados.
            </p>

            <div>
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setConjuntoEliminar(
                    null,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button danger"
                disabled={
                  procesando
                }
                onClick={() =>
                  void confirmarEliminacion()
                }
              >
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}

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
        duracion={
          6000
        }
        onCerrar={
          cerrarToast
        }
      />

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .grupos-curso {
    position: relative;
    display: grid;
    gap: 14px;
    min-width: 0;
  }

  .button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 14px;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }
  .button.secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }
  .button.danger { color: #fff; background: var(--app-danger); }
  .button:disabled { opacity: .55; cursor: not-allowed; }

  .grupos-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 13px;
    border: 1px solid var(--app-danger-border);
    border-radius: 13px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    font-size: 9px;
  }

  .grupos-error span {
    flex: 1;
  }

  .grupos-error button {
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .grupos-disponibles {
    min-width: 0;
  }

  .grupos-grid {
    display: grid;
    grid-template-columns:
      repeat(
        auto-fill,
        minmax(
          430px,
          510px
        )
      );
    gap: 14px;
    align-items: stretch;
    justify-content: start;
  }

  .confirmacion-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70000;
    display: grid;
    place-items: center;
    padding: 20px;
    background:
      rgba(
        15,
        23,
        42,
        .5
      );
    backdrop-filter:
      blur(
        6px
      );
  }

  .confirmacion-card {
    width:
      min(
        420px,
        100%
      );
    padding: 27px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow:
      0
      30px
      90px
      rgba(
        15,
        23,
        42,
        .28
      );
    text-align: center;
  }

  .confirmacion-card > span {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    margin: 0 auto;
    border-radius: 18px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .confirmacion-card h3 {
    margin: 14px 0 0;
    font-size: 19px;
  }

  .confirmacion-card p {
    margin: 8px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.6;
  }

  .confirmacion-card > div {
    display: flex;
    justify-content: center;
    gap: 9px;
    margin-top: 18px;
  }

  @media (
    max-width:
      980px
  ) {
    .grupos-grid {
      grid-template-columns: minmax(0, 510px);
    }
  }

  @media (
    max-width:
      760px
  ) {
    .grupos-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (
    max-width:
      520px
  ) {
    .confirmacion-card > div {
      flex-direction: column-reverse;
    }

    .confirmacion-card .button {
      width: 100%;
    }
  }
`;