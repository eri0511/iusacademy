import {
  BookOpen,
  GraduationCap,
  Users,
} from 'lucide-react';

import type {
  CursoAula,
  RolAula,
} from '../../types/aula/aulaCurso.types';

type EncabezadoCursoProps = {
  curso:
    CursoAula;

  rol:
    RolAula;
};

export default function EncabezadoCurso({
  curso,
  rol,
}: EncabezadoCursoProps) {
  const nombreDocente = [
    curso.docente.nombres,
    curso.docente.apellidoPaterno,
    curso.docente.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );

  return (
    <header className="encabezado-curso">
      <div className="encabezado-curso__icono">
        <BookOpen
          size={
            30
          }
          strokeWidth={
            2
          }
        />
      </div>

      <div className="encabezado-curso__contenido">
        <span className="encabezado-curso__eyebrow">
          Aula virtual
        </span>

        <h1>
          {curso.materia.nombre}
        </h1>

        <p>
          {curso.materia.codigo}
          {' · '}
          Paralelo
          {' '}
          {curso.paralelo}
          {' · '}
          Gestión
          {' '}
          {curso.gestion}
        </p>

        <div className="encabezado-curso__meta">
          <span>
            <GraduationCap
              size={
                17
              }
            />

            {nombreDocente}
          </span>

          <span>
            <Users
              size={
                17
              }
            />

            {curso.estudiantesInscritos}
            {' '}
            estudiantes
          </span>

          <span
            className={`encabezado-curso__estado ${curso.estado.toLowerCase()}`}
          >
            {curso.estado}
          </span>
        </div>
      </div>

      <div className="encabezado-curso__rol">
        {rol ===
        'DOCENTE'
          ? 'Vista docente'
          : 'Vista estudiante'}
      </div>

      <style>
        {styles}
      </style>
    </header>
  );
}

const styles = `
  .encabezado-curso {
    position: relative;
    display: grid;
    grid-template-columns:
      66px
      minmax(0, 1fr)
      auto;
    gap: 19px;
    align-items: center;
    padding: 26px 28px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 26px;
    color: var(--app-text);
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--app-accent-soft) 15%,
          var(--app-surface)
        )
      );
    box-shadow: var(--app-shadow);
  }

  .encabezado-curso::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--app-accent);
  }

  .encabezado-curso__icono {
    width: 66px;
    height: 66px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 20px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .encabezado-curso__contenido {
    min-width: 0;
  }

  .encabezado-curso__eyebrow {
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .encabezado-curso h1 {
    margin: 6px 0 0;
    overflow: hidden;
    color: var(--app-text);
    font-size: clamp(27px, 2.2vw, 34px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -.025em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .encabezado-curso p {
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
    line-height: 1.45;
  }

  .encabezado-curso__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 14px;
  }

  .encabezado-curso__meta > span {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 11px;
    border: 1px solid var(--app-border-soft);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 12px;
    font-weight: 700;
  }

  .encabezado-curso__meta
  .encabezado-curso__estado.activo {
    color: var(--app-success);
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .encabezado-curso__meta
  .encabezado-curso__estado.inactivo {
    color: var(--app-warning-strong);
    border-color: var(--app-warning-border);
    background: var(--app-warning-bg);
  }

  .encabezado-curso__meta
  .encabezado-curso__estado.finalizado {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .encabezado-curso__rol {
    align-self: start;
    padding: 8px 12px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 11px;
    font-weight: 850;
  }

  @media (max-width: 700px) {
    .encabezado-curso {
      grid-template-columns:
        56px
        minmax(0, 1fr);
      padding: 21px;
    }

    .encabezado-curso__icono {
      width: 56px;
      height: 56px;
    }

    .encabezado-curso__rol {
      grid-column: 1 / -1;
      width: fit-content;
    }

    .encabezado-curso h1 {
      font-size: 24px;
      white-space: normal;
    }

    .encabezado-curso p {
      font-size: 13px;
    }
  }
`;
