import type { FormEvent } from 'react';

import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  ArrowUp,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';

import universidadImg from '../../assets/universidades.jpg';
import derechoImg from '../../assets/derecho.jpg';

type EstadoFormulario =
  | 'inicial'
  | 'enviando'
  | 'enviado';

export default function Contacto() {
  const [
    estadoFormulario,
    setEstadoFormulario,
  ] = useState<EstadoFormulario>(
    'inicial',
  );

  const manejarEnvio = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setEstadoFormulario('enviando');

    const formulario =
      event.currentTarget;

    window.setTimeout(() => {
      setEstadoFormulario('enviado');
      formulario.reset();
    }, 900);
  };

  const enviando =
    estadoFormulario === 'enviando';

  return (
    <main
      className="contact-page"
      id="contacto"
    >
      <header className="contact-hero">
        <span className="contact-hero__eyebrow">
          INFORMACIÓN Y CONTACTO
        </span>

        <h1 className="contact-hero__title">
          Conoce la{' '}
          <span className="contact-highlight">
            universidad
          </span>{' '}
          y la carrera de{' '}
          <span className="contact-highlight">
            Derecho
          </span>
        </h1>

        <p className="contact-hero__subtitle">
          IusAcademy está orientado a fortalecer la
          formación práctica de los estudiantes de
          Derecho de UNIFRANZ Cochabamba. Aquí encontrarás
          información institucional y nuestros canales de
          contacto.
        </p>

        <div className="contact-hero__nav">
          <a
            className="contact-button contact-button--secondary contact-button--small"
            href="#unifranz"
          >
            Universidad
          </a>

          <a
            className="contact-button contact-button--secondary contact-button--small"
            href="#derecho"
          >
            Carrera
          </a>

          <a
            className="contact-button contact-button--primary contact-button--small"
            href="#formulario"
          >
            Contactar
          </a>
        </div>
      </header>

      <section
        className="contact-education-section"
        id="unifranz"
      >
        <article className="contact-education-card">
          <div className="contact-education-card__content">
            <div className="contact-section-icon">
              <Building2 size={25} />
            </div>

            <span className="contact-section-eyebrow">
              UNIVERSIDAD
            </span>

            <h2 className="contact-section-title">
              Universidad{' '}
              <span>
                Franz Tamayo
              </span>
            </h2>

            <p className="contact-section-description">
              UNIFRANZ impulsa un modelo educativo
              transformador, centrado en el estudiante, con
              un ecosistema digital que fortalece
              competencias del siglo XXI y fomenta una
              formación práctica y pertinente.
            </p>

            <ul className="contact-check-list">
              <li>
                <CheckCircle2 size={18} />
                Modelo educativo centrado en el estudiante.
              </li>

              <li>
                <CheckCircle2 size={18} />
                Innovación y ecosistema digital.
              </li>

              <li>
                <CheckCircle2 size={18} />
                Formación con enfoque práctico y pertinente.
              </li>
            </ul>

            <div className="contact-card-actions">
              <a
                className="contact-button contact-button--primary contact-button--small"
                href="https://sm-portal-unf.thesiscloud.com/es/"
                target="_blank"
                rel="noreferrer"
              >
                Ver portal
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div className="contact-education-card__media">
            <img
              src={universidadImg}
              alt="Universidad Franz Tamayo"
              loading="lazy"
            />
          </div>
        </article>
      </section>

      <section
        className="contact-education-section"
        id="derecho"
      >
        <article className="contact-education-card contact-education-card--reverse">
          <div className="contact-education-card__media">
            <img
              src={derechoImg}
              alt="Carrera de Derecho"
              loading="lazy"
            />
          </div>

          <div className="contact-education-card__content">
            <div className="contact-section-icon">
              <GraduationCap size={25} />
            </div>

            <span className="contact-section-eyebrow">
              CARRERA
            </span>

            <h2 className="contact-section-title">
              Carrera de{' '}
              <span>
                Derecho
              </span>
            </h2>

            <p className="contact-section-description">
              La carrera forma profesionales competentes y
              éticos, preparados para los desafíos del
              entorno legal moderno. El aprendizaje se
              fortalece con práctica, análisis de casos y
              herramientas tecnológicas orientadas al
              desarrollo del criterio jurídico.
            </p>

            <ul className="contact-check-list">
              <li>
                <CheckCircle2 size={18} />
                Integración de teoría y práctica aplicada.
              </li>

              <li>
                <CheckCircle2 size={18} />
                Formación ética y profesional.
              </li>

              <li>
                <CheckCircle2 size={18} />
                Desarrollo del criterio jurídico.
              </li>
            </ul>

            <div className="contact-card-actions">
              <a
                className="contact-button contact-button--primary contact-button--small"
                href="https://ux.unifranz.edu.bo/derecho"
                target="_blank"
                rel="noreferrer"
              >
                Ver información
                <ExternalLink size={16} />
              </a>

              <Link
                to="/login"
                className="contact-button contact-button--secondary contact-button--small"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section
        className="contact-main-grid"
        id="formulario"
      >
        <aside className="contact-info-card">
          <div className="contact-info-card__badges">
            <span className="contact-pill">
              <Mail size={15} />
              Soporte
            </span>

            <span className="contact-pill contact-pill--soft">
              <Clock3 size={15} />
              Respuesta 24–48 h
            </span>
          </div>

          <h2 className="contact-info-card__title">
            Canales oficiales
          </h2>

          <p className="contact-info-card__description">
            Para reportar un problema, indica tu rol, el
            módulo y el paso donde ocurrió. Adjunta una
            captura cuando sea necesario.
          </p>

          <ul className="contact-info-list">
            <li>
              <span className="contact-info-list__icon">
                <Mail size={20} />
              </span>

              <div>
                <strong>Correo</strong>
                <span>
                  iusacademy.demo@gmail.com
                </span>
              </div>
            </li>

            <li>
              <span className="contact-info-list__icon">
                <MessageCircle size={20} />
              </span>

              <div>
                <strong>WhatsApp</strong>
                <span>
                  +591 700 000 00
                </span>
              </div>
            </li>

            <li>
              <span className="contact-info-list__icon">
                <MapPin size={20} />
              </span>

              <div>
                <strong>Ubicación</strong>
                <span>
                  Cochabamba, Bolivia
                </span>
              </div>
            </li>
          </ul>

          <div className="contact-info-card__actions">
            <Link
              to="/login"
              className="contact-button contact-button--primary contact-button--small"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/servicios"
              className="contact-button contact-button--secondary contact-button--small"
            >
              Ver servicios
            </Link>
          </div>

          <div className="contact-tip">
            <ShieldCheck size={20} />

            <div>
              <strong>
                Recomendación
              </strong>

              <p>
                No compartas tu contraseña ni tu token de
                sesión mediante el formulario.
              </p>
            </div>
          </div>
        </aside>

        <form
          className="contact-form-card"
          onSubmit={manejarEnvio}
        >
          <div className="contact-form-card__header">
            <span className="contact-section-eyebrow">
              ESCRÍBENOS
            </span>

            <h2>
              Envíanos un mensaje
            </h2>

            <p>
              Completa el formulario y nos pondremos en
              contacto contigo.
            </p>
          </div>

          <div className="contact-form-grid">
            <label className="contact-field">
              <span>
                Nombre
              </span>

              <input
                name="nombre"
                placeholder="Tu nombre"
                autoComplete="name"
                disabled={enviando}
                required
              />
            </label>

            <label className="contact-field">
              <span>
                Correo
              </span>

              <input
                type="email"
                name="correo"
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                disabled={enviando}
                required
              />
            </label>

            <label className="contact-field contact-field--full">
              <span>
                Asunto
              </span>

              <input
                name="asunto"
                placeholder="Ej.: Problema al iniciar sesión"
                disabled={enviando}
                required
              />
            </label>

            <label className="contact-field contact-field--full">
              <span>
                Mensaje
              </span>

              <textarea
                name="mensaje"
                placeholder="Cuéntanos el detalle: módulo, paso y mensaje de error."
                rows={6}
                disabled={enviando}
                required
              />
            </label>
          </div>

          {estadoFormulario === 'enviado' && (
            <div
              className="contact-form-success"
              role="status"
            >
              <CheckCircle2 size={19} />
              Mensaje enviado en modo demostración.
            </div>
          )}

          <div className="contact-form-actions">
            <button
              className="contact-button contact-button--primary"
              type="submit"
              disabled={enviando}
            >
              <Send size={17} />

              {enviando
                ? 'Enviando...'
                : 'Enviar mensaje'}
            </button>

            <button
              className="contact-button contact-button--secondary"
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                })
              }
            >
              <ArrowUp size={17} />
              Volver arriba
            </button>
          </div>
        </form>
      </section>

      <section className="contact-cta">
        <div>
          <span className="contact-section-eyebrow">
            CONTINÚA APRENDIENDO
          </span>

          <h2>
            ¿Quieres practicar ahora?
          </h2>

          <p>
            Ingresa a la plataforma y continúa tu
            aprendizaje en un entorno académico
            profesional.
          </p>
        </div>

        <Link
          to="/login"
          className="contact-button contact-button--primary"
        >
          Empezar
        </Link>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
  .contact-page {
    width:
      min(
        1120px,
        calc(100% - 40px)
      );

    min-height: 100vh;

    position: relative;

    margin: 0 auto;

    padding:
      128px
      0
      0;

    margin-bottom: -105px;

    color: #0f172a;
  }

  .contact-hero {
    max-width: 840px;

    margin: 0 auto;

    text-align: center;

    animation:
      contactFadeUp
      0.7s
      ease-out
      both;
  }

  .contact-hero__eyebrow,
  .contact-section-eyebrow {
    display: block;

    color: #9ca3af;

    font-size: 0.76rem;
    font-weight: 850;

    letter-spacing: 0.18em;

    text-transform: uppercase;
  }

  .contact-hero__title {
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

  .contact-highlight,
  .contact-section-title span {
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

  .contact-hero__subtitle {
    max-width: 760px;

    margin:
      20px
      auto
      0;

    color: #6b6b6b;

    font-size: 1rem;

    line-height: 1.75;
  }

  .contact-hero__nav {
    display: flex;

    justify-content: center;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 24px;
  }

  .contact-button {
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

  .contact-button--small {
    min-height: 43px;

    padding:
      10px
      17px;

    font-size: 0.86rem;
  }

  .contact-button--primary {
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

  .contact-button--primary:hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 22px 52px
      rgba(180, 83, 9, 0.28);
  }

  .contact-button--secondary {
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

  .contact-button--secondary:hover {
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

  .contact-button:disabled {
    opacity: 0.62;

    cursor: not-allowed;

    transform: none;

    box-shadow: none;
  }

  .contact-education-section {
    margin-top: 30px;
  }

  .contact-education-card {
    display: grid;

    grid-template-columns:
      minmax(0, 1.04fr)
      minmax(320px, 0.96fr);

    align-items: stretch;

    gap: 22px;

    padding: 22px;

    border:
      1px solid
      rgba(241, 139, 75, 0.18);

    border-radius: 26px;

    background:
      rgba(255, 253, 249, 0.78);

    box-shadow:
      0 20px 48px
      rgba(15, 23, 42, 0.09);

    backdrop-filter:
      blur(13px);

    -webkit-backdrop-filter:
      blur(13px);
  }

  .contact-education-card__content {
    display: flex;

    flex-direction: column;

    justify-content: center;

    padding: 10px;
  }

  .contact-section-icon {
    width: 50px;
    height: 50px;

    display: grid;

    place-items: center;

    margin-bottom: 15px;

    border-radius: 16px;

    color: #c46a2c;

    background:
      linear-gradient(
        135deg,
        #fff0df,
        #ffe2c6
      );

    box-shadow:
      0 12px 28px
      rgba(196, 106, 44, 0.12);
  }

  .contact-section-title {
    margin:
      10px
      0
      0;

    color: #0f172a;

    font-size:
      clamp(
        1.65rem,
        3vw,
        2.25rem
      );

    line-height: 1.15;
  }

  .contact-section-description {
    margin:
      15px
      0
      0;

    color: #6b6b6b;

    line-height: 1.72;
  }

  .contact-check-list {
    display: grid;

    gap: 10px;

    margin:
      18px
      0
      0;

    padding: 0;

    list-style: none;
  }

  .contact-check-list li {
    display: flex;

    align-items: flex-start;

    gap: 9px;

    color: #5f6368;

    line-height: 1.5;
  }

  .contact-check-list svg {
    flex-shrink: 0;

    margin-top: 2px;

    color: #22c55e;
  }

  .contact-card-actions {
    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 20px;
  }

  .contact-education-card__media {
    min-height: 300px;

    position: relative;

    overflow: hidden;

    border:
      1px solid
      rgba(148, 163, 184, 0.17);

    border-radius: 20px;

    background:
      rgba(255, 255, 255, 0.55);

    box-shadow:
      0 14px 32px
      rgba(15, 23, 42, 0.08);
  }

  .contact-education-card__media::after {
    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    background:
      radial-gradient(
        circle at 20% 15%,
        rgba(241, 139, 75, 0.12),
        transparent 55%
      ),
      linear-gradient(
        180deg,
        transparent 60%,
        rgba(15, 23, 42, 0.08)
      );
  }

  .contact-education-card__media img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;

    transition:
      transform 0.35s ease;
  }

  .contact-education-card:hover
  .contact-education-card__media
  img {
    transform:
      scale(1.04);
  }

  .contact-main-grid {
    display: grid;

    grid-template-columns:
      minmax(0, 0.9fr)
      minmax(0, 1.1fr);

    align-items: start;

    gap: 20px;

    margin-top: 32px;
  }

  .contact-info-card,
  .contact-form-card {
    padding: 25px;

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

  .contact-info-card__badges {
    display: flex;

    flex-wrap: wrap;

    gap: 8px;
  }

  .contact-pill {
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

  .contact-pill--soft {
    border-color:
      rgba(241, 139, 75, 0.2);

    color: #9a3412;

    background:
      rgba(255, 237, 213, 0.78);
  }

  .contact-info-card__title,
  .contact-form-card__header h2,
  .contact-cta h2 {
    margin:
      16px
      0
      0;

    color: #0f172a;
  }

  .contact-info-card__description,
  .contact-form-card__header p,
  .contact-cta p {
    margin:
      10px
      0
      0;

    color: #6b6b6b;

    line-height: 1.7;
  }

  .contact-info-list {
    display: grid;

    gap: 11px;

    margin:
      20px
      0
      0;

    padding: 0;

    list-style: none;
  }

  .contact-info-list li {
    display: flex;

    align-items: center;

    gap: 12px;

    padding: 13px;

    border:
      1px solid
      rgba(148, 163, 184, 0.17);

    border-radius: 17px;

    background:
      rgba(255, 255, 255, 0.58);

    box-shadow:
      0 10px 24px
      rgba(15, 23, 42, 0.06);

    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .contact-info-list li:hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 16px 34px
      rgba(15, 23, 42, 0.09);
  }

  .contact-info-list__icon {
    width: 42px;
    height: 42px;

    display: grid;

    place-items: center;

    align-self: center;

    flex-shrink: 0;

    border-radius: 14px;

    color: #c46a2c;

    background:
      rgba(255, 237, 213, 0.82);

    line-height: 0;
  }

  .contact-info-list__icon svg {
    display: block;
  }

  .contact-info-list li > div strong,
  .contact-info-list li > div span {
    display: block;
  }

  .contact-info-list li > div strong {
    color: #0f172a;

    font-size: 0.9rem;
  }

  .contact-info-list li > div > span {
    margin-top: 3px;

    color: #6b6b6b;

    font-size: 0.87rem;
  }

  .contact-info-card__actions {
    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 20px;
  }

  .contact-tip {
    display: flex;

    align-items: flex-start;

    gap: 11px;

    margin-top: 18px;

    padding: 14px;

    border:
      1px solid
      rgba(234, 179, 8, 0.22);

    border-radius: 17px;

    color: #92400e;

    background:
      rgba(255, 255, 255, 0.48);
  }

  .contact-tip svg {
    flex-shrink: 0;
  }

  .contact-tip strong {
    color: #92400e;

    font-size: 0.87rem;
  }

  .contact-tip p {
    margin:
      4px
      0
      0;

    color: #6b6b6b;

    font-size: 0.83rem;

    line-height: 1.55;
  }

  .contact-form-grid {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 14px;

    margin-top: 20px;
  }

  .contact-field {
    display: grid;

    gap: 7px;
  }

  .contact-field--full {
    grid-column:
      1 / -1;
  }

  .contact-field > span {
    color: #5f6368;

    font-size: 0.84rem;
    font-weight: 750;
  }

  .contact-field input,
  .contact-field textarea {
    width: 100%;

    padding:
      13px
      14px;

    border:
      1px solid
      rgba(148, 163, 184, 0.24);

    border-radius: 16px;

    outline: none;

    color: #0f172a;

    background:
      rgba(255, 255, 255, 0.78);

    box-shadow:
      0 10px 24px
      rgba(15, 23, 42, 0.05);

    font: inherit;

    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;
  }

  .contact-field textarea {
    min-height: 145px;

    resize: vertical;
  }

  .contact-field input:focus,
  .contact-field textarea:focus {
    transform:
      translateY(-1px);

    border-color:
      rgba(241, 139, 75, 0.52);

    box-shadow:
      0 14px 34px
      rgba(241, 139, 75, 0.13);
  }

  .contact-field input:disabled,
  .contact-field textarea:disabled {
    opacity: 0.68;

    cursor: not-allowed;
  }

  .contact-form-success {
    display: flex;

    align-items: center;

    gap: 9px;

    margin-top: 15px;

    padding:
      11px
      13px;

    border:
      1px solid
      #bbf7d0;

    border-radius: 14px;

    color: #15803d;

    background: #f0fdf4;

    font-size: 0.87rem;
    font-weight: 700;
  }

  .contact-form-actions {
    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 18px;
  }

  .contact-cta {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 24px;

    margin-top: 32px;

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

  .contact-cta > div {
    max-width: 720px;
  }

  @keyframes contactFadeUp {
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

  @media (
    max-width: 900px
  ) {
    .contact-education-card,
    .contact-main-grid {
      grid-template-columns:
        1fr;
    }

    .contact-education-card--reverse
    .contact-education-card__media {
      order: 2;
    }

    .contact-education-card__media {
      min-height: 260px;
    }
  }

  @media (
    max-width: 650px
  ) {
    .contact-page {
      width:
        min(
          100% - 28px,
          1120px
        );

      padding-top: 116px;

      margin-bottom: -72px;
    }

    .contact-form-grid {
      grid-template-columns:
        1fr;
    }

    .contact-field--full {
      grid-column:
        auto;
    }

    .contact-cta {
      flex-direction: column;

      align-items: stretch;

      text-align: center;
    }

    .contact-cta
    .contact-button {
      width: 100%;
    }

    .contact-info-card,
    .contact-form-card,
    .contact-education-card {
      padding: 18px;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .contact-page *,
    .contact-page *::before,
    .contact-page *::after {
      animation: none !important;

      transition: none !important;
    }
  }
`;