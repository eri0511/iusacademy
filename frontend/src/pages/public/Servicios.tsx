import {
  Link,
} from 'react-router-dom';

import {
  ArrowRight,
  BarChart3,
  Bot,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  Gavel,
  GraduationCap,
  ListChecks,
  Scale,
  Target,
} from 'lucide-react';

const modulos = [
  {
    icono: Gavel,
    titulo: 'Simulación de procesos',
    descripcion:
      'Recorre las etapas del proceso civil mediante casos académicos guiados.',
    etiquetas: [
      'Casos',
      'Flujo procesal',
    ],
    retraso: '80ms',
  },
  {
    icono: FileText,
    titulo: 'Redacción de memoriales',
    descripcion:
      'Practica estructura, coherencia y presentación de documentos jurídicos.',
    etiquetas: [
      'Plantillas',
      'Checklist',
    ],
    retraso: '120ms',
  },
  {
    icono: FolderOpen,
    titulo: 'Documentos civiles',
    descripcion:
      'Consulta modelos orientativos, requisitos y estructuras documentales.',
    etiquetas: [
      'Guías',
      'Modelos',
    ],
    retraso: '160ms',
  },
  {
    icono: ClipboardCheck,
    titulo: 'Evaluación académica',
    descripcion:
      'Recibe retroalimentación sobre claridad, orden y cumplimiento de requisitos.',
    etiquetas: [
      'Rúbrica',
      'Progreso',
    ],
    retraso: '200ms',
  },
  {
    icono: BookOpenCheck,
    titulo: 'Asistente de estudio',
    descripcion:
      'Repasa conceptos jurídicos y organiza tu práctica de manera guiada.',
    etiquetas: [
      'Conceptos',
      'Orientación',
    ],
    retraso: '240ms',
  },
  {
    icono: Target,
    titulo: 'Seguimiento',
    descripcion:
      'Visualiza indicadores de avance y fortalece tus objetivos académicos.',
    etiquetas: [
      'Metas',
      'Dashboard',
    ],
    retraso: '280ms',
  },
];

const beneficios = [
  {
    icono: GraduationCap,
    titulo: 'Aprendizaje guiado',
    descripcion:
      'Recomendaciones concretas para comprender cada etapa.',
  },
  {
    icono: ListChecks,
    titulo: 'Redacción y práctica',
    descripcion:
      'Ejercicios y guías para fortalecer tu escritura jurídica.',
  },
  {
    icono: BarChart3,
    titulo: 'Progreso académico',
    descripcion:
      'Indicadores simples para observar tu mejora.',
  },
];

export default function Servicios() {
  return (
    <main
      className="services-page"
      id="servicios"
    >
      <header className="services-hero">
        <span className="services-hero__eyebrow">
          SERVICIOS Y MÓDULOS
        </span>

        <h1 className="services-hero__title">
          Todo lo que necesitas para aprender{' '}
          <span>
            Derecho Civil
          </span>
        </h1>

        <p className="services-hero__subtitle">
          Un entorno académico profesional para comprender,
          practicar y mejorar tu redacción jurídica mediante
          herramientas orientadas al contexto boliviano.
        </p>

        <div className="services-hero__actions">
          <Link
            to="/login"
            className="services-button services-button--primary"
          >
            Empezar ahora
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/contacto"
            className="services-button services-button--secondary"
          >
            Conocer más
          </Link>
        </div>
      </header>

      <section className="services-feature">
        <article className="services-feature__main">
          <div className="services-feature__badges">
            <span className="services-pill">
              <Bot size={16} />
              Asistente académico
            </span>

            <span className="services-pill services-pill--soft">
              <Scale size={16} />
              Contexto boliviano
            </span>
          </div>

          <div className="services-feature__heading">
            <div className="services-feature__icon">
              <Bot size={30} />
            </div>

            <div>
              <span className="services-section-eyebrow">
                ACOMPAÑAMIENTO VIRTUAL
              </span>

              <h2>
                Dr. Franz, tu guía académica
              </h2>
            </div>
          </div>

          <p className="services-feature__description">
            Te acompaña paso a paso en la comprensión de
            conceptos, elaboración de memoriales y práctica
            de procesos civiles, con orientación académica
            clara y organizada.
          </p>

          <ul className="services-check-list">
            <li>
              <CheckCircle2 size={18} />
              Estructuras sugeridas para cada sección del documento.
            </li>

            <li>
              <CheckCircle2 size={18} />
              Listas de verificación para no olvidar requisitos.
            </li>

            <li>
              <CheckCircle2 size={18} />
              Retroalimentación para mejorar claridad, orden y forma.
            </li>
          </ul>

          <div className="services-feature__actions">
            <Link
              to="/login"
              className="services-button services-button--primary services-button--small"
            >
              Probar Dr. Franz
            </Link>

            <a
              href="#catalogo"
              className="services-button services-button--secondary services-button--small"
            >
              Ver módulos
            </a>
          </div>
        </article>

        <aside className="services-benefits">
          {beneficios.map(
            ({
              icono: Icono,
              titulo,
              descripcion,
            }) => (
              <article
                key={titulo}
                className="services-benefit-card"
              >
                <span className="services-benefit-card__icon">
                  <Icono size={21} />
                </span>

                <div>
                  <h3>{titulo}</h3>
                  <p>{descripcion}</p>
                </div>
              </article>
            ),
          )}
        </aside>
      </section>

      <section
        className="services-catalog"
        id="catalogo"
      >
        <div className="services-catalog__heading">
          <span className="services-section-eyebrow">
            MÓDULOS DISPONIBLES
          </span>

          <h2>
            Aprende, practica y fortalece tus competencias
          </h2>

          <p>
            Cada módulo está diseñado para apoyar la
            comprensión y aplicación práctica de contenidos
            del área civil.
          </p>
        </div>

        <div className="services-catalog__grid">
          {modulos.map(
            ({
              icono: Icono,
              titulo,
              descripcion,
              etiquetas,
              retraso,
            }) => (
              <article
                key={titulo}
                className="services-module-card"
                style={{
                  animationDelay:
                    retraso,
                }}
              >
                <div className="services-module-card__top">
                  <span className="services-module-card__icon">
                    <Icono size={23} />
                  </span>

                  <CheckCircle2
                    size={18}
                    className="services-module-card__check"
                  />
                </div>

                <h3>{titulo}</h3>

                <p>{descripcion}</p>

                <div className="services-module-card__tags">
                  {etiquetas.map(
                    (
                      etiqueta,
                      index,
                    ) => (
                      <span
                        key={etiqueta}
                        className={
                          index === 1
                            ? 'services-chip services-chip--soft'
                            : 'services-chip'
                        }
                      >
                        {etiqueta}
                      </span>
                    ),
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="services-cta">
        <div>
          <span className="services-section-eyebrow">
            EMPIEZA TU PRÁCTICA
          </span>

          <h2>
            ¿Lista para comenzar?
          </h2>

          <p>
            Ingresa a la plataforma y continúa tu aprendizaje
            en un entorno académico profesional.
          </p>
        </div>

        <Link
          to="/login"
          className="services-button services-button--primary"
        >
          Iniciar sesión
          <ArrowRight size={18} />
        </Link>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
  .services-page {
    width:
      min(
        1120px,
        calc(100% - 40px)
      );

    min-height: 100vh;

    position: relative;

    margin:
      0
      auto
      -105px;

    padding:
      128px
      0
      0;

    color: #0f172a;
  }

  .services-hero {
    max-width: 860px;

    margin: 0 auto;

    text-align: center;

    animation:
      servicesFadeUp
      0.7s
      ease-out
      both;
  }

  .services-hero__eyebrow,
  .services-section-eyebrow {
    display: block;

    color: #9ca3af;

    font-size: 0.76rem;
    font-weight: 850;

    letter-spacing: 0.18em;

    text-transform: uppercase;
  }

  .services-hero__title {
    margin:
      18px
      0
      0;

    color: #0f172a;

    font-size:
      clamp(
        2.45rem,
        5vw,
        3.9rem
      );

    font-weight: 900;

    line-height: 1.1;

    letter-spacing: -0.035em;
  }

  .services-hero__title span {
    display: inline;

    padding:
      0
      0.3rem
      0.08rem;

    border-radius: 0.8rem;

    color: #312e2a;

    background:
      linear-gradient(
        120deg,
        #facc6b 0%,
        #fbbf74 42%,
        #f2a36a 100%
      );

    box-decoration-break: clone;

    -webkit-box-decoration-break:
      clone;
  }

  .services-hero__subtitle {
    max-width: 740px;

    margin:
      20px
      auto
      0;

    color: #6b6b6b;

    font-size: 1rem;

    line-height: 1.75;
  }

  .services-hero__actions {
    display: flex;

    justify-content: center;

    flex-wrap: wrap;

    gap: 11px;

    margin-top: 25px;
  }

  .services-button {
    min-height: 48px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    padding:
      12px
      21px;

    border:
      1px solid
      transparent;

    border-radius: 999px;

    color: inherit;

    font: inherit;

    font-size: 0.94rem;
    font-weight: 800;

    text-decoration: none;

    cursor: pointer;

    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;
  }

  .services-button--small {
    min-height: 43px;

    padding:
      10px
      17px;

    font-size: 0.86rem;
  }

  .services-button--primary {
    color: white;

    background:
      linear-gradient(
        135deg,
        #f18b4b,
        #f39a5c
      );

    box-shadow:
      0 16px 40px
      rgba(217, 119, 6, 0.23);
  }

  .services-button--primary:hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 22px 52px
      rgba(180, 83, 9, 0.29);
  }

  .services-button--secondary {
    border-color:
      rgba(200, 154, 85, 0.85);

    color: #c46a2c;

    background:
      rgba(255, 255, 255, 0.45);

    backdrop-filter:
      blur(10px);

    -webkit-backdrop-filter:
      blur(10px);
  }

  .services-button--secondary:hover {
    transform:
      translateY(-2px);

    border-color:
      rgba(200, 154, 85, 1);

    background:
      rgba(255, 255, 255, 0.86);

    box-shadow:
      0 12px 30px
      rgba(148, 163, 184, 0.17);
  }

  .services-feature {
    display: grid;

    grid-template-columns:
      minmax(0, 1.12fr)
      minmax(300px, 0.88fr);

    align-items: start;

    gap: 20px;

    margin-top: 34px;
  }

  .services-feature__main {
    position: relative;

    overflow: hidden;

    padding: 27px;

    border:
      1px solid
      rgba(241, 139, 75, 0.18);

    border-radius: 25px;

    background:
      rgba(255, 253, 249, 0.8);

    box-shadow:
      0 20px 48px
      rgba(15, 23, 42, 0.09);

    backdrop-filter:
      blur(13px);

    -webkit-backdrop-filter:
      blur(13px);
  }

  .services-feature__main::after {
    content: "";

    position: absolute;

    top: -40%;
    left: -65%;

    width: 58%;
    height: 180%;

    pointer-events: none;

    opacity: 0.35;

    background:
      linear-gradient(
        120deg,
        transparent 35%,
        rgba(255, 255, 255, 0.45) 50%,
        transparent 65%
      );

    transform:
      rotate(10deg);

    animation:
      servicesShine
      7.5s
      ease-in-out
      infinite;
  }

  .services-feature__badges {
    display: flex;

    flex-wrap: wrap;

    gap: 8px;
  }

  .services-pill {
    display: inline-flex;

    align-items: center;

    gap: 6px;

    padding:
      6px
      11px;

    border:
      1px solid
      rgba(234, 179, 8, 0.32);

    border-radius: 999px;

    color: #7c2d12;

    background:
      rgba(254, 243, 199, 0.82);

    font-size: 0.78rem;
    font-weight: 750;
  }

  .services-pill--soft {
    border-color:
      rgba(241, 139, 75, 0.2);

    color: #9a3412;

    background:
      rgba(255, 237, 213, 0.78);
  }

  .services-feature__heading {
    display: flex;

    align-items: center;

    gap: 14px;

    margin-top: 21px;
  }

  .services-feature__icon {
    width: 58px;
    height: 58px;

    display: grid;

    place-items: center;

    flex-shrink: 0;

    border-radius: 18px;

    color: #c46a2c;

    background:
      linear-gradient(
        135deg,
        #fff0df,
        #ffe2c6
      );

    box-shadow:
      0 13px 30px
      rgba(196, 106, 44, 0.13);
  }

  .services-feature__heading h2 {
    margin:
      7px
      0
      0;

    color: #0f172a;

    font-size:
      clamp(
        1.55rem,
        3vw,
        2.1rem
      );

    line-height: 1.15;
  }

  .services-feature__description {
    margin:
      18px
      0
      0;

    color: #6b6b6b;

    line-height: 1.72;
  }

  .services-check-list {
    display: grid;

    gap: 10px;

    margin:
      18px
      0
      0;

    padding: 0;

    list-style: none;
  }

  .services-check-list li {
    display: flex;

    align-items: flex-start;

    gap: 9px;

    color: #5f6368;

    line-height: 1.5;
  }

  .services-check-list svg {
    flex-shrink: 0;

    margin-top: 2px;

    color: #22c55e;
  }

  .services-feature__actions {
    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 21px;
  }

  .services-benefits {
    display: grid;

    gap: 13px;
  }

  .services-benefit-card {
    display: flex;

    align-items: center;

    gap: 13px;

    padding: 18px;

    border:
      1px solid
      rgba(148, 163, 184, 0.17);

    border-radius: 19px;

    background:
      rgba(255, 255, 255, 0.62);

    box-shadow:
      0 14px 32px
      rgba(15, 23, 42, 0.08);

    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }

  .services-benefit-card:hover {
    transform:
      translateY(-3px);

    border-color:
      rgba(241, 139, 75, 0.22);

    box-shadow:
      0 18px 40px
      rgba(15, 23, 42, 0.1);
  }

  .services-benefit-card__icon {
    width: 46px;
    height: 46px;

    display: grid;

    place-items: center;

    align-self: center;

    flex-shrink: 0;

    border:
      1px solid
      rgba(241, 139, 75, 0.2);

    border-radius: 15px;

    color: #c46a2c;

    background:
      rgba(255, 237, 213, 0.82);

    line-height: 0;
  }

  .services-benefit-card__icon svg {
    display: block;
  }

  .services-benefit-card h3 {
    margin: 0;

    color: #0f172a;

    font-size: 0.98rem;
  }

  .services-benefit-card p {
    margin:
      5px
      0
      0;

    color: #6b6b6b;

    font-size: 0.88rem;

    line-height: 1.5;
  }

  .services-catalog {
    margin-top: 42px;
  }

  .services-catalog__heading {
    max-width: 720px;

    margin: 0 auto;

    text-align: center;
  }

  .services-catalog__heading h2 {
    margin:
      11px
      0
      0;

    color: #0f172a;

    font-size:
      clamp(
        1.75rem,
        3.5vw,
        2.5rem
      );

    line-height: 1.18;
  }

  .services-catalog__heading p {
    margin:
      13px
      0
      0;

    color: #6b6b6b;

    line-height: 1.68;
  }

  .services-catalog__grid {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );

    gap: 17px;

    margin-top: 25px;
  }

  .services-module-card {
    position: relative;

    overflow: hidden;

    min-height: 235px;

    padding: 23px;

    border:
      1px solid
      rgba(241, 139, 75, 0.16);

    border-radius: 22px;

    background:
      rgba(255, 253, 249, 0.8);

    box-shadow:
      0 16px 38px
      rgba(15, 23, 42, 0.08);

    backdrop-filter:
      blur(12px);

    -webkit-backdrop-filter:
      blur(12px);

    animation:
      servicesCardIn
      0.65s
      ease-out
      both;

    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .services-module-card::after {
    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    opacity: 0;

    background:
      radial-gradient(
        circle at 15% 20%,
        rgba(241, 139, 75, 0.1),
        transparent 45%
      );

    transition:
      opacity 0.2s ease;
  }

  .services-module-card:hover {
    transform:
      translateY(-5px);

    border-color:
      rgba(241, 139, 75, 0.24);

    box-shadow:
      0 24px 48px
      rgba(15, 23, 42, 0.12);
  }

  .services-module-card:hover::after {
    opacity: 1;
  }

  .services-module-card__top {
    display: flex;

    align-items: center;

    justify-content: space-between;
  }

  .services-module-card__icon {
    width: 50px;
    height: 50px;

    display: grid;

    place-items: center;

    border-radius: 16px;

    color: #c46a2c;

    background:
      linear-gradient(
        135deg,
        #fff0df,
        #ffe2c6
      );
  }

  .services-module-card__check {
    color: #22c55e;
  }

  .services-module-card h3 {
    margin:
      19px
      0
      0;

    color: #0f172a;

    font-size: 1.04rem;
  }

  .services-module-card p {
    margin:
      10px
      0
      0;

    color: #6b6b6b;

    font-size: 0.9rem;

    line-height: 1.65;
  }

  .services-module-card__tags {
    display: flex;

    flex-wrap: wrap;

    gap: 7px;

    margin-top: 17px;
  }

  .services-chip {
    padding:
      5px
      9px;

    border:
      1px solid
      rgba(241, 139, 75, 0.18);

    border-radius: 999px;

    color: #7c2d12;

    background:
      rgba(255, 237, 213, 0.72);

    font-size: 0.75rem;
    font-weight: 700;
  }

  .services-chip--soft {
    border-color:
      rgba(234, 179, 8, 0.25);

    color: #92400e;

    background:
      rgba(254, 243, 199, 0.66);
  }

  .services-cta {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 24px;

    margin-top: 33px;

    padding: 29px;

    border:
      1px solid
      rgba(241, 139, 75, 0.18);

    border-radius: 27px;

    background:
      linear-gradient(
        135deg,
        rgba(255, 253, 249, 0.88),
        rgba(255, 240, 223, 0.82)
      );

    box-shadow:
      0 20px 48px
      rgba(15, 23, 42, 0.09);
  }

  .services-cta > div {
    max-width: 720px;
  }

  .services-cta h2 {
    margin:
      10px
      0
      0;

    color: #0f172a;
  }

  .services-cta p {
    margin:
      9px
      0
      0;

    color: #6b6b6b;

    line-height: 1.7;
  }

  @keyframes servicesFadeUp {
    from {
      opacity: 0;

      transform:
        translateY(16px);
    }

    to {
      opacity: 1;

      transform:
        translateY(0);
    }
  }

  @keyframes servicesCardIn {
    from {
      opacity: 0;

      transform:
        translateY(14px)
        scale(0.985);
    }

    to {
      opacity: 1;

      transform:
        translateY(0)
        scale(1);
    }
  }

  @keyframes servicesShine {
    0% {
      transform:
        translateX(0)
        rotate(10deg);

      opacity: 0;
    }

    12% {
      opacity: 0.35;
    }

    28%,
    100% {
      transform:
        translateX(210%)
        rotate(10deg);

      opacity: 0;
    }
  }

  @media (
    max-width: 920px
  ) {
    .services-feature {
      grid-template-columns:
        1fr;
    }

    .services-catalog__grid {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }
  }

  @media (
    max-width: 650px
  ) {
    .services-page {
      width:
        min(
          100% - 28px,
          1120px
        );

      margin-bottom: -72px;

      padding-top: 116px;
    }

    .services-feature__main {
      padding: 20px;
    }

    .services-feature__heading {
      align-items: flex-start;
    }

    .services-catalog__grid {
      grid-template-columns:
        1fr;
    }

    .services-cta {
      flex-direction: column;

      align-items: stretch;

      text-align: center;
    }

    .services-cta
    .services-button {
      width: 100%;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .services-page *,
    .services-page *::before,
    .services-page *::after {
      animation: none !important;

      transition: none !important;
    }
  }
`;