import {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  FileDown,
  History,
  Clock,
  User,
} from 'lucide-react';

import VistaDocumentoColaborativo from './VistaDocumentoColaborativo';

import {
  parsearDocumentoColaborativo,
  restaurarVersion,
} from '../../utils/tareas/documentoColaborativo';

import {
  exportarDocumentoColaborativoPdf,
} from '../../utils/tareas/exportarDocumentoPdf';

import {
  obtenerSesionesEntrega,
} from '../../services/tareas/tareas-sesiones.service';

import type {
  SesionEdicionAutor,
} from '../../services/tareas/tareas-sesiones.service';

import type {
  DocumentoColaborativoEstado,
} from '../../utils/tareas/documentoColaborativo';

type Props = {
  contenido: string;
  cursoId: number;
  tareaId: number;
  entregaId: number;
  token: string;
};

export default function RevisionDocumentoColaborativo(
  {
    contenido,
    cursoId,
    tareaId,
    entregaId,
    token,
  }:
    Props,
) {
  const [estadoColaborativo, setEstadoColaborativo] =
    useState<
      DocumentoColaborativoEstado | null
    >(() =>
      parsearDocumentoColaborativo(
        contenido,
      ),
    );

  const [versionActiva, setVersionActiva] = useState<
    string | null
  >(null);

  const [sesiones, setSesiones] = useState<
    SesionEdicionAutor[]
  >([]);

  useEffect(
    () => {
      let activo = true;

      if (
        !cursoId ||
        !tareaId ||
        !entregaId ||
        !token
      ) {
        return undefined;
      }

      obtenerSesionesEntrega(
        cursoId,
        tareaId,
        entregaId,
        token,
      )
        .then(
          (
            datos,
          ) => {
            if (
              activo
            ) {
              setSesiones(
                datos,
              );
            }
          },
        )
        .catch(
          () => {
            if (
              activo
            ) {
              setSesiones(
                [],
              );
            }
          },
        );

      return () => {
        activo = false;
      };
    },
    [
      cursoId,
      tareaId,
      entregaId,
      token,
    ],
  );

  const convertirAString =
    (
      estado:
        DocumentoColaborativoEstado,
    ): string =>
      JSON.stringify(
        estado,
      );

  if (
    !estadoColaborativo
  ) {
    return (
      <p>
        No hay contenido colaborativo válido para esta entrega.
      </p>
    );
  }

  const versiones =
    estadoColaborativo.versiones;

  const aplicarVersion =
    (
      id:
        string,
    ) => {
      const restaurado =
        restaurarVersion(
          estadoColaborativo,
          id,
        );

      if (
        restaurado
      ) {
        setEstadoColaborativo(
          restaurado,
        );

        setVersionActiva(
          id,
        );
      }
    };

  const restablecerActual =
    () => {
      const base =
        parsearDocumentoColaborativo(
          contenido,
        );

      if (
        base
      ) {
        setEstadoColaborativo(
          base,
        );

        setVersionActiva(
          null,
        );
      }
    };

  const formatearFecha =
    (
      iso:
        string,
    ) =>
      new Date(
        iso,
      ).toLocaleString(
        'es-BO',
        {
          dateStyle:
            'medium',
          timeStyle:
            'short',
        },
      );

  const formatearDuracion =
    (
      segundos:
        number,
    ): string => {
      const total =
        Math.max(
          0,
          Math.round(
            segundos,
          ),
        );

      const horas =
        Math.floor(
          total /
            3600,
        );

      const minutos =
        Math.floor(
          (total %
            3600) /
            60,
        );

      if (
        horas >
        0
      ) {
        return `${horas}h ${minutos}m`;
      }

      if (
        minutos >
        0
      ) {
        return `${minutos}m ${total % 60}s`;
      }

      return `${total}s`;
    };

  return (
    <div className="rdc">
      <div className="rdc__acciones">
        <button
          type="button"
          className="rdc__btn rdc__btn--pdf"
          onClick={() =>
            exportarDocumentoColaborativoPdf(
              convertirAString(
                estadoColaborativo,
              ),
              true,
              `${estadoColaborativo.titulo || 'documento'}-revision.pdf`,
              sesiones,
            )
          }
        >
          <FileDown
            size={13}
          />
          Exportar PDF (con autoría)
        </button>

        {versionActiva && (
          <button
            type="button"
            className="rdc__btn"
            onClick={
              restablecerActual
            }
          >
            <Clock
              size={13}
            />
            Ver versión actual
          </button>
        )}
      </div>

      {versiones.length > 0 && (
        <section className="rdc__versiones">
          <header className="rdc__versiones-titulo">
            <History
              size={14}
            />
            Historial de versiones (
            {
              versiones.length
            }
            )
          </header>

          <ul className="rdc__lista">
            <li
              className={
                versionActiva ===
                null
                  ? 'rdc__item rdc__item--activo'
                  : 'rdc__item'
              }
            >
              <button
                type="button"
                onClick={
                  restablecerActual
                }
              >
                <span className="rdc__item-nombre">
                  Versión actual
                </span>

                <span className="rdc__item-meta">
                  Entrega del estudiante
                </span>
              </button>
            </li>

            {versiones
              .slice()
              .reverse()
              .map(
                (
                  version,
                ) => (
                  <li
                    key={
                      version.id
                    }
                    className={
                      versionActiva ===
                      version.id
                        ? 'rdc__item rdc__item--activo'
                        : 'rdc__item'
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        aplicarVersion(
                          version.id,
                        )
                      }
                    >
                      <span className="rdc__item-nombre">
                        {
                          version.nombre
                        }
                      </span>

                      <span className="rdc__item-meta">
                        <User
                          size={11}
                        />
                        {
                          version.autorNombre
                        }
                        {' '}
                        ·
                        {' '}
                        {
                          formatearFecha(
                            version.guardadoEn,
                          )
                        }
                        {' '}
                        ·{' '}
                        {
                          version.snapshot.length
                        }{' '}
                        bloques
                      </span>
                    </button>
                  </li>
                ),
              )}
          </ul>
        </section>
      )}

      {sesiones.length > 0 && (
        <section className="rdc__actividad">
          <header className="rdc__actividad-titulo">
            <Activity
              size={14}
            />
            Actividad de edición (
            {
              sesiones.length
            }
            )
          </header>

          <p className="rdc__actividad-nota">
            Tiempo con el editor abierto y en foco, y cantidad de
            textos pegados detectados por integrante.
          </p>

          <ul className="rdc__actividad-lista">
            {sesiones.map(
              (
                sesion,
              ) => (
                <li
                  key={
                    sesion.autorId
                  }
                  className="rdc__actividad-item"
                >
                  <span className="rdc__actividad-nombre">
                    {
                      sesion.autorNombre
                    }
                  </span>

                  <span className="rdc__actividad-datos">
                    <span>
                      <Clock
                        size={11}
                      />
                      {
                        formatearDuracion(
                          sesion.segundosActivos,
                        )
                      }
                    </span>

                    <span
                      className={
                        sesion.cantidadPegados >
                          0
                          ? 'rdc__actividad-pega'
                          : ''
                      }
                    >
                      {
                        sesion.cantidadPegados
                      }{' '}
                      pegado(s)
                    </span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      <VistaDocumentoColaborativo
        contenido={
          convertirAString(
            estadoColaborativo,
          )
        }
        sesiones={
          sesiones
        }
      />

      <style>{`
        .rdc {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .rdc__acciones {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rdc__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 8px;
          background: var(--app-surface, #fff);
          color: var(--app-text, #374151);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .rdc__btn--pdf {
          color: var(--app-danger-dark, #b91c1c);
          background: var(--app-danger-bg, #fef2f2);
          border-color: transparent;
        }

        .rdc__versiones {
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 10px;
          padding: 12px;
          background: var(--app-surface-soft, #fafafa);
        }

        .rdc__versiones-titulo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--app-text-strong, #111827);
          margin-bottom: 8px;
        }

        .rdc__lista {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
        }

        .rdc__item button {
          width: 100%;
          text-align: left;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 8px;
          background: var(--app-surface, #fff);
          padding: 8px 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .rdc__item--activo button {
          border-color: var(--app-accent, #2563eb);
          box-shadow: 0 0 0 1px var(--app-accent-soft, #dbeafe);
        }

        .rdc__item-nombre {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--app-text-strong, #111827);
        }

        .rdc__item-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--app-text-muted, #6b7280);
        }

        .rdc__actividad {
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 10px;
          padding: 12px;
          background: var(--app-surface-soft, #fafafa);
        }

        .rdc__actividad-titulo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--app-text-strong, #111827);
          margin-bottom: 4px;
        }

        .rdc__actividad-nota {
          margin: 0 0 8px;
          font-size: 11px;
          color: var(--app-text-muted, #6b7280);
        }

        .rdc__actividad-lista {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rdc__actividad-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 8px;
          background: var(--app-surface, #fff);
          padding: 7px 10px;
        }

        .rdc__actividad-nombre {
          font-size: 12px;
          font-weight: 700;
          color: var(--app-text-strong, #111827);
        }

        .rdc__actividad-datos {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: var(--app-text-muted, #6b7280);
        }

        .rdc__actividad-datos > span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .rdc__actividad-pega {
          color: var(--app-danger, #b91c1c);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
