import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Loader2,
  Save,
  UsersRound,
  Crown,
  ClipboardCheck,
} from 'lucide-react';

import {
  useAuth,
} from '../../../auth/AuthContext';

import Toast, {
  type TipoToast,
} from '../../shared/Toast';

import {
  obtenerRosterPresencial,
  registrarPresencial,
} from '../../../services/tareas/tareas-presencial.service';

import type {
  RosterPresencial,
} from '../../../services/tareas/tareas-presencial.service';

type Props = {
  cursoId: number;
  tareaId: number;
  puntajeMaximo: number | null;
};

type FilaNota = {
  nota: string;
  observacion: string;
};

export default function RegistroEvidenciaPresencial(
  {
    cursoId,
    tareaId,
    puntajeMaximo,
  }:
    Props,
) {
  const {
    accessToken,
  } =
    useAuth();

  const [roster, setRoster] = useState<RosterPresencial | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [notas, setNotas] = useState<Record<number, FilaNota>>({});
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  } | null>(null);

  const inicializarNotas =
    useCallback(
      (
        datos:
          RosterPresencial,
      ) => {
        const mapa:
          Record<number, FilaNota> =
          {};

        for (
          const grupo
          of datos.grupos
        ) {
          for (
            const estudiante
            of grupo.estudiantes
          ) {
            mapa[
              estudiante.estudianteId
            ] = {
              nota:
                estudiante.calificacion
                  ? String(
                      estudiante.calificacion.notaBase,
                    )
                  : '',
              observacion:
                estudiante.calificacion
                  ?.retroalimentacion ??
                '',
            };
          }
        }

        setNotas(
          mapa,
        );
      },
      [],
    );

  useEffect(
    () => {
      let activo =
        true;

      setCargando(
        true,
      );

      setError(
        null,
      );

      if (
        !accessToken
      ) {
        setCargando(
          false,
        );

        return;
      }

      obtenerRosterPresencial(
        cursoId,
        tareaId,
        accessToken,
      )
        .then(
          (
            datos,
          ) => {
            if (
              !activo
            ) {
              return;
            }

            setRoster(
              datos,
            );

            inicializarNotas(
              datos,
            );
          },
        )
        .catch(
          (
            causa,
          ) => {
            if (
              !activo
            ) {
              return;
            }

            setError(
              causa instanceof Error
                ? causa.message
                : 'No fue posible cargar el registro.',
            );
          },
        )
        .finally(
          () => {
            if (
              activo
            ) {
              setCargando(
                false,
              );
            }
          },
        );

      return () => {
        activo =
          false;
      };
    },
    [
      accessToken,
      cursoId,
      tareaId,
      inicializarNotas,
    ],
  );

  const totalEstudiantes =
    useMemo(
      () =>
        (roster?.grupos ?? []).reduce(
          (
            suma,
            grupo,
          ) =>
            suma +
            grupo.estudiantes.length,
          0,
        ),
      [
        roster,
      ],
    );

  const publicadas =
    roster?.actividadCalificable?.estado ===
    'PUBLICADA';

  const actualizarNota =
    (
      estudianteId:
        number,
      campo:
        'nota' | 'observacion',
      valor:
        string,
    ) => {
      setNotas(
        (
          anterior,
        ) => ({
          ...anterior,
          [estudianteId]: {
            nota:
              anterior[
                estudianteId
              ]?.nota ??
              '',
            observacion:
              anterior[
                estudianteId
              ]?.observacion ??
              '',
            [campo]:
              valor,
          },
        }),
      );
    };

  const validar =
    (): boolean => {
      if (
        !roster ||
        publicadas
      ) {
        return !publicadas;
      }

      for (
        const grupo
        of roster.grupos
      ) {
        for (
          const estudiante
          of grupo.estudiantes
        ) {
          const fila =
            notas[
              estudiante.estudianteId
            ];

          const nota =
            fila?.nota?.trim();

          if (
            !nota
          ) {
            setToast({
              tipo: 'advertencia',
              titulo: 'Nota pendiente',
              mensaje: `Registra la nota de ${estudiante.nombres} ${estudiante.apellidoPaterno}.`,
            });

            return false;
          }

          const valor =
            Number(
              nota,
            );

          if (
            !Number.isFinite(
              valor,
            ) ||
            valor <
              0 ||
            valor >
              100
          ) {
            setToast({
              tipo: 'advertencia',
              titulo: 'Nota inválida',
              mensaje: `La nota de ${estudiante.nombres} ${estudiante.apellidoPaterno} debe estar entre 0 y 100.`,
            });

            return false;
          }
        }
      }

      return true;
    };

  const guardar =
    async () => {
      if (
        !roster ||
        !accessToken
      ) {
        return;
      }

      if (
        !validar()
      ) {
        return;
      }

      setGuardando(
        true,
      );

      try {
        const estudiantes =
          roster.grupos.flatMap(
            (
              grupo,
            ) =>
              grupo.estudiantes.map(
                (
                  estudiante,
                ) => ({
                  estudianteId:
                    estudiante.estudianteId,
                  notaBase:
                    Number(
                      notas[
                        estudiante.estudianteId
                      ]?.nota ?? 0,
                    ),
                  observacion:
                    notas[
                      estudiante.estudianteId
                    ]?.observacion?.trim() ||
                    undefined,
                }),
              ),
          );

        const resultado =
          await registrarPresencial(
            cursoId,
            tareaId,
            estudiantes,
            accessToken,
          );

        const actualizado =
          await obtenerRosterPresencial(
            cursoId,
            tareaId,
            accessToken,
          );

        setRoster(
          actualizado,
        );

        inicializarNotas(
          actualizado,
        );

        setToast({
          tipo: 'exito',
          titulo: 'Evidencia registrada',
          mensaje: `Se registraron ${resultado.actualizados} notas.`,
        });
      } catch (
        causa
      ) {
        setToast({
          tipo: 'error',
          titulo: 'No se pudo guardar',
          mensaje:
            causa instanceof Error
              ? causa.message
              : undefined,
        });
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const nombreCompleto =
    (
      e:
        { nombres: string; apellidoPaterno: string; apellidoMaterno: string | null },
    ) =>
      [e.apellidoPaterno, e.apellidoMaterno, e.nombres]
        .filter(
          Boolean,
        )
        .join(
          ' ',
        );

  if (
    cargando
  ) {
    return (
      <div className="rep__estado">
        <Loader2
          className="rep__spin"
          size={18}
        />
        Cargando registro presencial...
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="rep__error">
        {error}
      </div>
    );
  }

  if (
    !roster
  ) {
    return (
      <div className="rep__error">
        No hay datos disponibles.
      </div>
    );
  }

  return (
    <div className="rep">
      <section className="rep__resumen">
        <div className="rep__resumen-item">
          <UsersRound
            size={16}
          />

          <span>
            Estudiantes
          </span>

          <strong>
            {
              totalEstudiantes
            }
          </strong>
        </div>

        <div className="rep__resumen-item">
          <ClipboardCheck
            size={16}
          />

          <span>
            Puntaje máximo
          </span>

          <strong>
            {
              puntajeMaximo ??
                100
            }
          </strong>
        </div>
      </section>

      {publicadas ? (
        <p className="rep__publicada">
          Las notas ya están publicadas. Reabre la publicación para poder modificarlas.
        </p>
      ) : (
        <p className="rep__intro">
          Registra la nota (0 a 100) y una observación opcional por estudiante, según la actividad realizada en aula.
        </p>
      )}

      <div className="rep__grupos">
        {roster.grupos.map(
          (
            grupo,
          ) => (
            <section
              key={
                grupo.id
              }
              className="rep__grupo"
            >
              <header className="rep__grupo-header">
                <strong>
                  {
                    grupo.nombre
                  }
                </strong>

                <span>
                  {
                    grupo.estudiantes.length
                  }{' '}
                  estudiante(s)
                </span>
              </header>

              <div className="rep__tabla-wrap">
                <table className="rep__tabla">
                  <thead>
                    <tr>
                      <th>
                        Estudiante
                      </th>
                      <th>
                        Nota /100
                      </th>
                      <th>
                        Observación
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {grupo.estudiantes.map(
                      (
                        estudiante,
                      ) => {
                        const fila =
                          notas[
                            estudiante.estudianteId
                          ];

                        return (
                          <tr
                            key={
                              estudiante.estudianteId
                            }
                          >
                            <td className="rep__celda-est">
                              <div className="rep__avatar">
                                {estudiante.fotoPerfilUrl
                                  ? (
                                    <img
                                      src={
                                        estudiante.fotoPerfilUrl
                                      }
                                      alt=""
                                    />
                                  )
                                  : (
                                    nombreCompleto(
                                      estudiante,
                                    )
                                      .charAt(0)
                                      .toUpperCase()
                                  )}
                              </div>

                              <div className="rep__identidad">
                                <strong>
                                  {
                                    nombreCompleto(
                                      estudiante,
                                    )
                                  }

                                  {estudiante.representante && (
                                    <span className="rep__representante">
                                      <Crown
                                        size={11}
                                      />
                                      Rep.
                                    </span>
                                  )}
                                </strong>

                                {estudiante.calificacion?.estado &&
                                  estudiante.calificacion.estado !==
                                    'PENDIENTE' && (
                                  <small>
                                    Nota final: {
                                      estudiante.calificacion.notaFinal.toFixed(
                                        2,
                                      )
                                    }
                                  </small>
                                )}
                              </div>
                            </td>

                            <td>
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={
                                  publicadas
                                }
                                className="rep__nota-input"
                                value={
                                  fila?.nota ??
                                  ''
                                }
                                placeholder="0"
                                onChange={(
                                  evento,
                                ) =>
                                  actualizarNota(
                                    estudiante.estudianteId,
                                    'nota',
                                    evento.target.value,
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="text"
                                disabled={
                                  publicadas
                                }
                                className="rep__obs-input"
                                value={
                                  fila?.observacion ??
                                  ''
                                }
                                placeholder="Observación"
                                onChange={(
                                  evento,
                                ) =>
                                  actualizarNota(
                                    estudiante.estudianteId,
                                    'observacion',
                                    evento.target.value,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ),
        )}
      </div>

      {!publicadas && (
        <div className="rep__acciones">
          <button
            type="button"
            className="rep__guardar"
            onClick={
              guardar
            }
            disabled={
              guardando
            }
          >
            {guardando
              ? (
                <Loader2
                  className="rep__spin"
                  size={14}
                />
              )
              : (
                <Save
                  size={14}
                />
              )}
            {guardando
              ? 'Guardando...'
              : 'Guardar evidencia'}
          </button>
        </div>
      )}

      {toast && (
        <Toast
          visible={true}
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
              null,
            )
          }
        />
      )}

      <style>{`
        .rep {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rep__estado,
        .rep__error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 24px;
          color: var(--app-text-muted, #6b7280);
          font-size: 13px;
        }

        .rep__error {
          color: var(--app-danger, #dc2626);
        }

        .rep__spin {
          animation: rep-giro 0.9s linear infinite;
        }

        @keyframes rep-giro {
          to { transform: rotate(360deg); }
        }

        .rep__resumen {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rep__resumen-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 10px;
          background: var(--app-surface, #fff);
          color: var(--app-text-muted, #6b7280);
          font-size: 12.5px;
        }

        .rep__resumen-item strong {
          color: var(--app-text-strong, #111827);
          font-size: 15px;
        }

        .rep__publicada {
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--app-warning-bg, #fefce8);
          color: var(--app-warning-dark, #a16207);
          font-size: 12.5px;
        }

        .rep__intro {
          font-size: 12.5px;
          color: var(--app-text-muted, #6b7280);
          line-height: 1.5;
        }

        .rep__grupos {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rep__grupo {
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
          background: var(--app-surface, #fff);
        }

        .rep__grupo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--app-surface-soft, #fafafa);
          border-bottom: 1px solid var(--app-border, #e5e7eb);
        }

        .rep__grupo-header strong {
          font-size: 13px;
          color: var(--app-text-strong, #111827);
        }

        .rep__grupo-header span {
          font-size: 11.5px;
          color: var(--app-text-muted, #6b7280);
        }

        .rep__tabla-wrap {
          overflow-x: auto;
        }

        .rep__tabla {
          width: 100%;
          border-collapse: collapse;
        }

        .rep__tabla th {
          text-align: left;
          padding: 8px 14px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--app-text-muted, #6b7280);
          background: var(--app-surface, #fff);
          border-bottom: 1px solid var(--app-border, #e5e7eb);
        }

        .rep__tabla td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--app-border-soft, #f3f4f6);
          vertical-align: middle;
        }

        .rep__tabla tbody tr:last-child td {
          border-bottom: none;
        }

        .rep__celda-est {
          min-width: 220px;
        }

        .rep__avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--app-accent-soft, #dbeafe);
          color: var(--app-accent-dark, #1d4ed8);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .rep__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rep__est {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rep__identidad {
          display: flex;
          flex-direction: column;
          margin-left: 8px;
        }

        .rep__identidad strong {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--app-text-strong, #111827);
          font-weight: 600;
        }

        .rep__identidad small {
          font-size: 11px;
          color: var(--app-text-muted, #6b7280);
          margin-top: 2px;
        }

        .rep__representante {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 999px;
          background: var(--app-warning-bg, #fefce8);
          color: var(--app-warning-dark, #a16207);
          font-weight: 600;
        }

        .rep__nota-input {
          width: 72px;
          padding: 7px 8px;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--app-text-strong, #111827);
          background: var(--app-surface, #fff);
          text-align: center;
        }

        .rep__nota-input:focus {
          outline: none;
          border-color: var(--app-accent, #2563eb);
          box-shadow: 0 0 0 2px var(--app-accent-soft, #dbeafe);
        }

        .rep__obs-input {
          width: 100%;
          min-width: 180px;
          padding: 7px 10px;
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 8px;
          font-size: 12.5px;
          color: var(--app-text, #374151);
          background: var(--app-surface, #fff);
        }

        .rep__obs-input:focus {
          outline: none;
          border-color: var(--app-accent, #2563eb);
        }

        .rep__acciones {
          display: flex;
          justify-content: flex-end;
        }

        .rep__guardar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 10px;
          background: var(--app-accent, #2563eb);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .rep__guardar:hover:not(:disabled) {
          background: var(--app-accent-dark, #1d4ed8);
        }

        .rep__guardar:disabled {
          opacity: 0.7;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
