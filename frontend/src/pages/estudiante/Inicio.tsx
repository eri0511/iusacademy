import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  KeyRound,
  Library,
  Sparkles,
} from 'lucide-react';

import {
  useAuth,
} from '../../auth/AuthContext';

export default function EstudianteInicio() {
  const {
    sesion,
  } = useAuth();

  const primerNombre =
    (
      sesion?.usuario.nombres ??
      'Estudiante'
    )
      .trim()
      .split(/\s+/)[0];

  return (
    <section className="student-home">
      <header className="student-hero">
        <div className="student-hero__content">
          <span className="student-eyebrow">
            Panel del estudiante
          </span>

          <h1>
            Hola, {primerNombre}
          </h1>

          <p>
            Bienvenido a tu espacio académico en IusAcademy.
            Desde aquí podrás inscribirte a tus cursos y acceder
            a todas sus actividades.
          </p>

          <div className="student-hero__badges">
            <span>
              <Sparkles size={13} />
              Cuenta activa
            </span>

            <span>
              <GraduationCap size={13} />
              Rol estudiante
            </span>
          </div>
        </div>

        <div className="student-hero__icon">
          <GraduationCap size={36} />
        </div>
      </header>

      <section className="student-grid">
        <article className="student-card student-card--primary">
          <div className="student-card__icon">
            <KeyRound size={25} />
          </div>

          <span className="student-card__eyebrow">
            Próximo paso
          </span>

          <h2>
            Inscribirte a un curso
          </h2>

          <p>
            El docente te proporcionará un código de inscripción.
            En el siguiente paso conectaremos este formulario con
            el backend para que puedas unirte al curso.
          </p>

          <button
            type="button"
            disabled
          >
            Ingresar código
            <ArrowRight size={17} />
          </button>
        </article>

        <article className="student-card">
          <div className="student-card__icon student-card__icon--purple">
            <BookOpen size={25} />
          </div>

          <span className="student-card__eyebrow">
            Mis cursos
          </span>

          <h2>
            Cursos inscritos
          </h2>

          <p>
            Después de inscribirte, tus cursos aparecerán aquí
            y podrás ingresar a sus aulas virtuales.
          </p>

          <div className="student-empty-count">
            <strong>
              0
            </strong>

            <span>
              cursos inscritos
            </span>
          </div>
        </article>

        <article className="student-card">
          <div className="student-card__icon student-card__icon--green">
            <Library size={25} />
          </div>

          <span className="student-card__eyebrow">
            Recursos
          </span>

          <h2>
            Biblioteca jurídica
          </h2>

          <p>
            Próximamente podrás consultar materiales, modelos
            y documentos jurídicos desde este espacio.
          </p>

          <span className="student-status">
            En preparación
          </span>
        </article>
      </section>

      <section className="student-info">
        <div>
          <span className="student-eyebrow">
            Cómo funcionará
          </span>

          <h2>
            Inscripción mediante código
          </h2>
        </div>

        <div className="student-steps">
          <article>
            <span>
              1
            </span>

            <div>
              <strong>
                Recibe el código
              </strong>

              <p>
                El docente genera y comparte el código de su curso.
              </p>
            </div>
          </article>

          <article>
            <span>
              2
            </span>

            <div>
              <strong>
                Ingresa el código
              </strong>

              <p>
                El sistema valida que esté activo y vigente.
              </p>
            </div>
          </article>

          <article>
            <span>
              3
            </span>

            <div>
              <strong>
                Accede al aula
              </strong>

              <p>
                El curso aparece automáticamente en tu panel.
              </p>
            </div>
          </article>
        </div>
      </section>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .student-home {
    width: 100%;
    min-width: 0;
    padding: 0 34px 42px;
    color: var(--app-text);
  }

  .student-hero {
    position: relative;
    min-height: 210px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    padding: 30px 32px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 28px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        var(--app-accent-softer)
      );
    box-shadow: var(--app-shadow);
  }

  .student-hero::after {
    content: "";
    position: absolute;
    top: -110px;
    right: -70px;
    width: 330px;
    height: 330px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        var(--app-warning-bg),
        transparent 70%
      );
  }

  .student-hero__content,
  .student-hero__icon {
    position: relative;
    z-index: 1;
  }

  .student-eyebrow,
  .student-card__eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .student-hero h1 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: clamp(30px, 4vw, 42px);
    font-weight: 900;
    letter-spacing: -.04em;
  }

  .student-hero p {
    max-width: 700px;
    margin: 10px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.65;
  }

  .student-hero__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .student-hero__badges span {
    min-height: 29px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: 9px;
    font-weight: 650;
  }

  .student-hero__icon {
    width: 92px;
    height: 92px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 28px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .student-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 18px;
  }

  .student-card {
    min-width: 0;
    min-height: 255px;
    display: flex;
    flex-direction: column;
    padding: 21px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .student-card--primary {
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-accent-softer)
      );
  }

  .student-card__icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    margin-bottom: 15px;
    border-radius: 16px;
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .student-card__icon--purple {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .student-card__icon--green {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .student-card h2 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 800;
  }

  .student-card p {
    margin: 8px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.6;
  }

  .student-card button {
    min-height: 41px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: auto;
    padding: 9px 14px;
    border: none;
    border-radius: 12px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    font-family: inherit;
    font-size: 10px;
    font-weight: 650;
  }

  .student-card button:disabled {
    opacity: .55;
    cursor: default;
  }

  .student-empty-count {
    display: flex;
    align-items: baseline;
    gap: 7px;
    margin-top: auto;
    padding-top: 16px;
  }

  .student-empty-count strong {
    color: var(--app-purple);
    font-size: 28px;
    font-weight: 850;
  }

  .student-empty-count span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .student-status {
    align-self: flex-start;
    margin-top: auto;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-warning);
    background: var(--app-warning-bg);
    font-size: 8px;
    font-weight: 650;
  }

  .student-info {
    margin-top: 18px;
    padding: 23px 24px;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .student-info h2 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size: 20px;
    font-weight: 850;
  }

  .student-steps {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .student-steps article {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 15px;
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    background: var(--app-surface-alt);
  }

  .student-steps article > span {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 10px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    font-size: 10px;
    font-weight: 800;
  }

  .student-steps strong {
    display: block;
    color: var(--app-text);
    font-size: 11px;
    font-weight: 700;
  }

  .student-steps p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 9px;
    line-height: 1.5;
  }

  @media (max-width: 1050px) {
    .student-grid,
    .student-steps {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .student-home {
      padding: 0 18px 34px;
    }

    .student-hero {
      align-items: flex-start;
      padding: 24px 21px;
    }

    .student-hero__icon {
      width: 66px;
      height: 66px;
      border-radius: 21px;
    }
  }

  @media (max-width: 520px) {
    .student-home {
      padding: 0 12px 28px;
    }

    .student-hero__icon {
      display: none;
    }

    .student-card,
    .student-info {
      padding: 18px;
    }
  }
`;