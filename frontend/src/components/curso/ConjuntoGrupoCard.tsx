import {
  CalendarDays,
  Crown,
  Lock,
  Scale,
  Sparkles,
  Unlock,
  UsersRound,
} from 'lucide-react';

import type {
  CSSProperties,
} from 'react';

import AulaDropdown from '../aula/AulaDropdown';

import type {
  ConjuntoGrupoResumen,
} from '../../types/grupos/grupos.types';

type ConjuntoGrupoCardProps = {
  conjunto:
    ConjuntoGrupoResumen;

  procesando:
    boolean;

  onAbrir:
    () => void;

  onEditar:
    () => void;

  onCambiarBloqueo:
    () => void;

  onEliminar:
    () => void;
};

function formatearFecha(
  valor:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
    },
  ).format(
    new Date(
      valor,
    ),
  );
}

function obtenerEtiquetaAlcance(
  conjunto:
    ConjuntoGrupoResumen,
): string {
  if (
    conjunto.alcance ===
    'CURSO'
  ) {
    return 'Todo el semestre';
  }

  if (
    conjunto.alcance ===
    'HITO'
  ) {
    return conjunto.hito
      ? `${conjunto.hito.codigo} · ${conjunto.hito.nombre}`
      : 'Hito académico';
  }

  return 'Actividad específica';
}

export default function ConjuntoGrupoCard({
  conjunto,
  procesando,
  onAbrir,
  onEditar,
  onCambiarBloqueo,
  onEliminar,
}: ConjuntoGrupoCardProps) {
  const esProcesual =
    conjunto.tipoEvaluacion ===
    'PROCESUAL';

  const colorPrincipal =
    esProcesual
      ? '#f97316'
      : '#7c3aed';

  return (
    <article
      className={`grupo-resumen-card ${
        esProcesual
          ? 'procesual'
          : 'continua'
      }`}
      style={{
        '--grupo-acento':
          colorPrincipal,
      } as CSSProperties}
    >
      <button
        type="button"
        className="grupo-resumen-card__contenido"
        onClick={
          onAbrir
        }
      >
        <div className="grupo-resumen-card__superior">
          <span className="grupo-resumen-card__icono">
            {esProcesual ? (
              <Scale
                size={21}
              />
            ) : (
              <Sparkles
                size={21}
              />
            )}
          </span>

          <div className="grupo-resumen-card__identidad">
            <span className="grupo-resumen-card__alcance">
              {obtenerEtiquetaAlcance(
                conjunto,
              )}
            </span>

            <h3>
              {conjunto.nombre}
            </h3>
          </div>
        </div>

        <div className="grupo-resumen-card__etiquetas">
          <span
            className={`grupo-etiqueta evaluacion ${
              esProcesual
                ? 'procesual'
                : 'continua'
            }`}
          >
            {esProcesual
              ? 'Procesual'
              : 'Continua'}
          </span>

          <span
            className={`grupo-etiqueta estado ${
              conjunto.estaBloqueado
                ? 'bloqueado'
                : 'editable'
            }`}
          >
            {conjunto.estaBloqueado ? (
              <Lock
                size={11}
              />
            ) : (
              <Unlock
                size={11}
              />
            )}

            {conjunto.estaBloqueado
              ? 'Bloqueado'
              : 'Editable'}
          </span>
        </div>

        <div className="grupo-resumen-card__metricas">
          <div>
            <span className="grupo-resumen-card__metrica-icono">
              <UsersRound
                size={16}
              />
            </span>

            <div>
              <strong>
                {conjunto.totalGrupos}
              </strong>

              <small>
                {conjunto.totalGrupos ===
                1
                  ? 'grupo'
                  : 'grupos'}
              </small>
            </div>
          </div>

          <div>
            <span className="grupo-resumen-card__metrica-icono">
              <UsersRound
                size={16}
              />
            </span>

            <div>
              <strong>
                {conjunto.totalIntegrantes}
              </strong>

              <small>
                integrantes
              </small>
            </div>
          </div>
        </div>

        <div className="grupo-resumen-card__equipos">
          <div className="grupo-resumen-card__burbujas">
            {conjunto.grupos
              .slice(
                0,
                5,
              )
              .map(
                (
                  grupo,
                ) => (
                  <span
                    key={
                      grupo.id
                    }
                    style={{
                      '--burbuja-color':
                        grupo.color ??
                        '#64748b',
                    } as CSSProperties}
                    title={`${grupo.nombre}: ${grupo.totalIntegrantes} integrantes`}
                  >
                    {grupo.nombre
                      .replace(
                        /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/g,
                        '',
                      )
                      .slice(
                        0,
                        2,
                      )
                      .toUpperCase()}
                  </span>
                ),
              )}

            {conjunto.grupos.length >
              5 && (
              <small>
                +
                {conjunto.grupos.length -
                5}
              </small>
            )}
          </div>

          {conjunto.requiereRepresentante && (
            <span className="grupo-resumen-card__representante">
              <Crown
                size={12}
              />

              Representante
            </span>
          )}
        </div>

        <footer className="grupo-resumen-card__pie">
          <span>
            <CalendarDays
              size={13}
            />

            Actualizado
            {' '}
            {formatearFecha(
              conjunto.actualizadoEn,
            )}
          </span>

          <strong>
            Ver detalle
          </strong>
        </footer>
      </button>

      <AulaDropdown
        triggerClassName="grupo-resumen-card__menu"
        ariaLabel="Opciones del conjunto"
        deshabilitado={
          procesando
        }
        opciones={[
          {
            texto:
              'Editar conjunto',
            onClick:
              onEditar,
          },
          {
            texto:
              conjunto.estaBloqueado
                ? 'Desbloquear conjunto'
                : 'Bloquear conjunto',
            deshabilitada:
              procesando,
            onClick:
              onCambiarBloqueo,
          },
          {
            texto:
              'Eliminar conjunto',
            peligro:
              true,
            separadorAntes:
              true,
            deshabilitada:
              procesando,
            onClick:
              onEliminar,
          },
        ]}
      />

      <style>
        {styles}
      </style>
    </article>
  );
}

const styles = `
  .grupo-resumen-card {
    position: relative;
    min-width: 0;
    overflow: visible;
    border:
      1px solid
      var(
        --app-border,
        #eadfd4
      );
    border-radius: 22px;
    background:
      var(
        --app-card,
        #fffdf9
      );
    box-shadow:
      0
      14px
      34px
      rgba(
        80,
        43,
        18,
        .075
      );
    transition:
      transform
      .18s
      ease,
      box-shadow
      .18s
      ease,
      border-color
      .18s
      ease;
  }

  .grupo-resumen-card::before {
    content: "";
    position: absolute;
    top: -1px;
    right: 22px;
    left: 22px;
    height: 5px;
    border-radius:
      999px
      999px
      0
      0;
    background:
      var(
        --grupo-acento
      );
  }

  .grupo-resumen-card:hover {
    transform:
      translateY(
        -4px
      );
    border-color:
      color-mix(
        in srgb,
        var(
          --grupo-acento
        ) 42%,
        var(
          --app-border,
          #eadfd4
        )
      );
    box-shadow:
      0
      22px
      48px
      rgba(
        80,
        43,
        18,
        .12
      );
  }

  .grupo-resumen-card__contenido {
    width: 100%;
    min-height: 270px;
    display: flex;
    flex-direction: column;
    padding: 21px;
    border: none;
    color:
      var(
        --app-text,
        #0f172a
      );
    background: transparent;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .grupo-resumen-card__superior {
    display: grid;
    grid-template-columns:
      48px
      minmax(
        0,
        1fr
      );
    gap: 13px;
    align-items: center;
    padding-right: 34px;
  }

  .grupo-resumen-card__icono {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color:
      var(
        --grupo-acento
      );
    background:
      color-mix(
        in srgb,
        var(
          --grupo-acento
        ) 12%,
        var(
          --app-card,
          #fffdf9
        )
      );
  }

  .grupo-resumen-card__identidad {
    min-width: 0;
  }

  .grupo-resumen-card__alcance {
    display: block;
    overflow: hidden;
    color:
      var(
        --grupo-acento
      );
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .grupo-resumen-card h3 {
    margin:
      6px
      0
      0;
    overflow: hidden;
    color:
      var(
        --app-text,
        #0f172a
      );
    font-size: 21px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -.025em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }


  .grupo-resumen-card__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 18px;
  }

  .grupo-etiqueta {
    min-height: 26px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding:
      6px
      9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .grupo-etiqueta.evaluacion.procesual {
    color: #c2410c;
    background: #fff0e7;
  }

  .grupo-etiqueta.evaluacion.continua {
    color: #6d28d9;
    background: #f2eaff;
  }

  .grupo-etiqueta.estado.editable {
    color:
      var(
        --app-success,
        #15803d
      );
    background:
      var(
        --app-success-bg,
        #ecfdf3
      );
  }

  .grupo-etiqueta.estado.bloqueado {
    color:
      var(
        --app-danger,
        #dc2626
      );
    background:
      var(
        --app-danger-bg,
        #fef2f2
      );
  }

  .grupo-resumen-card__metricas {
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
    margin-top: 18px;
  }

  .grupo-resumen-card__metricas > div {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
    padding: 13px;
    border:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
    border-radius: 15px;
    background:
      var(
        --app-surface-alt,
        #fffaf4
      );
  }

  .grupo-resumen-card__metrica-icono {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 11px;
    color:
      var(
        --grupo-acento
      );
    background:
      color-mix(
        in srgb,
        var(
          --grupo-acento
        ) 10%,
        transparent
      );
  }

  .grupo-resumen-card__metricas strong,
  .grupo-resumen-card__metricas small {
    display: block;
  }

  .grupo-resumen-card__metricas strong {
    color:
      var(
        --app-text,
        #0f172a
      );
    font-size: 20px;
    line-height: 1;
  }

  .grupo-resumen-card__metricas small {
    margin-top: 4px;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 10px;
  }

  .grupo-resumen-card__equipos {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    margin-top: 17px;
  }

  .grupo-resumen-card__burbujas {
    display: flex;
    align-items: center;
    padding-left: 7px;
  }

  .grupo-resumen-card__burbujas > span {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    margin-left: -7px;
    border:
      3px solid
      var(
        --app-card,
        #fffdf9
      );
    border-radius: 50%;
    color: #fff;
    background:
      var(
        --burbuja-color
      );
    font-size: 10px;
    font-weight: 850;
    box-shadow:
      0
      4px
      9px
      rgba(
        15,
        23,
        42,
        .13
      );
  }

  .grupo-resumen-card__burbujas > small {
    margin-left: 7px;
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 8px;
    font-weight: 850;
  }

  .grupo-resumen-card__representante {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #a16207;
    font-size: 8px;
    font-weight: 850;
  }

  .grupo-resumen-card__pie {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 17px;
    border-top:
      1px solid
      var(
        --app-border-soft,
        #efe7df
      );
  }

  .grupo-resumen-card__pie span,
  .grupo-resumen-card__pie strong {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .grupo-resumen-card__pie span {
    color:
      var(
        --app-text-muted,
        #94a3b8
      );
    font-size: 10px;
  }

  .grupo-resumen-card__pie strong {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    color:
      var(
        --grupo-acento
      );
    background:
      color-mix(
        in srgb,
        var(
          --grupo-acento
        ) 9%,
        transparent
      );
    font-size: 10px;
  }

  .grupo-resumen-card__menu {
    position: absolute;
    top: 17px;
    right: 17px;
    z-index: 20;
  }

  @media (
    max-width:
      560px
  ) {
    .grupo-resumen-card__contenido {
      min-height: 280px;
      padding: 19px;
    }

    .grupo-resumen-card h3 {
      font-size: 18px;
    }
  }

  .grupo-resumen-card__contenido {
    font-size: 12px;
  }

  .grupo-resumen-card__alcance {
    font-size: 10px;
  }

  .grupo-etiqueta {
    font-size: 10px;
  }

  .grupo-resumen-card__metricas small,
  .grupo-resumen-card__representante,
  .grupo-resumen-card__pie span,
  .grupo-resumen-card__pie strong {
    font-size: 10px;
  }

`;