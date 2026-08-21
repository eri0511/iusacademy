import {
  Link,
} from 'react-router-dom';

import {
  ArrowRight,
  Bot,
  Gavel,
  GraduationCap,
  Scale,
  Sparkles,
} from 'lucide-react';

import drFranzImg from '../../assets/drfranz.png';

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__left">
          <span className="home-hero__eyebrow">
            <Sparkles size={15} />
            BIENVENIDO A IUSACADEMY
          </span>

          <h1 className="home-hero__title">
            La nueva forma de aprender{' '}
            <span>
              Derecho Civil
            </span>
          </h1>

          <p className="home-hero__description">
            Practica memoriales, comprende procesos y
            desarrolla criterio jurídico en un entorno
            académico profesional, guiado por{' '}
            <strong>
              Dr. Franz
            </strong>
            .
          </p>

          <div className="home-hero__actions">
            <Link
              to="/login"
              className="home-button home-button--primary"
            >
              Empezar ahora
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/servicios"
              className="home-button home-button--secondary"
            >
              Ver servicios
            </Link>
          </div>

          <div className="home-hero__tags">
            <span>
              <Scale size={15} />
              Derecho Civil
            </span>

            <span>
              <Gavel size={15} />
              Simulación de casos
            </span>

            <span>
              <GraduationCap size={15} />
              Enfoque académico
            </span>
          </div>
        </div>

        <div className="home-hero__right">
          <div
            className="home-hero__halo"
            aria-hidden="true"
          />

          <div className="home-hero__portrait">
            <img
              src={drFranzImg}
              alt="Dr. Franz, asistente jurídico virtual de IusAcademy"
            />
          </div>

          <div className="home-hero__assistant-card">
            <span className="home-hero__assistant-icon">
              <Bot size={21} />
            </span>

            <div>
              <strong>
                Dr. Franz
              </strong>

              <span>
                Tu asistente jurídico virtual
              </span>
            </div>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
  /*
   * En el Home el PublicLayout ocupa exactamente la pantalla.
   * No genera scroll y las olas permanecen pegadas abajo.
   */
  .public-layout:has(.home-page) {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;

    padding-bottom: 0;

    overflow: hidden;
  }

  .public-layout:has(.home-page)
  .public-layout__content {
    height: 100%;
  }

  .public-layout:has(.home-page)
  > .wavesBottom {
    position: absolute;
    inset: auto 0 0;

    z-index: 1;

    height: 230px !important;
  }

  .home-page {
    width:
      min(
        1200px,
        calc(100% - 40px)
      );

    height: 100vh;
    height: 100dvh;

    position: relative;
    z-index: 5;

    margin: 0 auto;

    overflow: hidden;

    color: #0f172a;
  }

  .home-hero {
    width: 100%;
    height: 100%;

    display: grid;

    grid-template-columns:
      minmax(0, 1.18fr)
      minmax(320px, 0.82fr);

    align-items: center;

    gap:
      clamp(
        42px,
        6vw,
        76px
      );

    padding:
      112px
      0
      145px;
  }

  .home-hero__left {
    max-width: 680px;

    animation:
      homeFadeUp
      0.8s
      ease-out
      both;
  }

  .home-hero__eyebrow {
    display: inline-flex;

    align-items: center;

    gap: 7px;

    color: #9ca3af;

    font-size: 0.76rem;
    font-weight: 850;

    letter-spacing: 0.18em;
  }

  .home-hero__eyebrow svg {
    color: #f18b4b;
  }

  .home-hero__title {
    margin:
      18px
      0
      0;

    color: #0f172a;

    font-size:
      clamp(
        2.75rem,
        5.5vw,
        4.65rem
      );

    font-weight: 900;

    line-height: 1.06;

    letter-spacing: -0.047em;
  }

  .home-hero__title span {
    display: inline;

    padding:
      0
      0.34rem
      0.08rem;

    border-radius: 0.82rem;

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

  .home-hero__description {
    max-width: 590px;

    margin:
      24px
      0
      0;

    color: #6b6b6b;

    font-size: 1.03rem;

    line-height: 1.8;
  }

  .home-hero__description strong {
    color: #92400e;
  }

  .home-hero__actions {
    display: flex;

    flex-wrap: wrap;

    gap: 12px;

    margin-top: 29px;
  }

  .home-button {
    min-height: 48px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 9px;

    padding:
      12px
      21px;

    border:
      1px solid
      transparent;

    border-radius: 999px;

    font-size: 0.94rem;
    font-weight: 800;

    text-decoration: none;

    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;
  }

  .home-button--primary {
    color: white;

    background:
      linear-gradient(
        135deg,
        #f18b4b,
        #f39a5c
      );

    box-shadow:
      0 16px 40px
      rgba(217, 119, 6, 0.27);
  }

  .home-button--primary:hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 22px 52px
      rgba(180, 83, 9, 0.31);
  }

  .home-button--secondary {
    border-color:
      rgba(200, 154, 85, 0.9);

    color: #c46a2c;

    background:
      rgba(255, 255, 255, 0.46);

    backdrop-filter:
      blur(10px);

    -webkit-backdrop-filter:
      blur(10px);
  }

  .home-button--secondary:hover {
    transform:
      translateY(-2px);

    border-color:
      rgba(200, 154, 85, 1);

    background:
      rgba(255, 255, 255, 0.88);

    box-shadow:
      0 12px 30px
      rgba(148, 163, 184, 0.17);
  }

  .home-hero__tags {
    display: flex;

    flex-wrap: wrap;

    gap: 8px;

    margin-top: 23px;
  }

  .home-hero__tags span {
    display: inline-flex;

    align-items: center;

    gap: 6px;

    padding:
      6px
      11px;

    border:
      1px solid
      rgba(234, 179, 8, 0.4);

    border-radius: 999px;

    color: #92400e;

    background:
      rgba(254, 243, 199, 0.85);

    font-size: 0.76rem;
    font-weight: 700;
  }

  .home-hero__right {
    min-height: 500px;

    position: relative;

    display: flex;

    align-items: center;

    justify-content: center;

    animation:
      homeFadeUp
      0.9s
      ease-out
      0.1s
      both;
  }

  .home-hero__halo {
    position: absolute;

    width: 445px;
    height: 445px;

    border-radius: 50%;

    background:
      radial-gradient(
        circle,
        rgba(255, 231, 200, 0.95),
        rgba(253, 243, 231, 0.58) 60%,
        transparent 75%
      );

    animation:
      homeHalo
      8s
      ease-in-out
      infinite;
  }

  .home-hero__portrait {
    width:
      min(
        405px,
        100%
      );

    aspect-ratio: 3 / 4;

    position: relative;
    z-index: 2;

    display: flex;

    align-items: flex-end;

    justify-content: center;

    overflow: hidden;

    padding-bottom: 18px;

    border:
      1px solid
      rgba(255, 255, 255, 0.8);

    border-radius: 999px;

    background:
      radial-gradient(
        circle at 30% 0%,
        #fff7ec,
        #ffe3c2 48%,
        #fbe9d4 75%
      );

    box-shadow:
      0 26px 60px
      rgba(148, 81, 22, 0.3);

    animation:
      homeFranzFloat
      7.2s
      ease-in-out
      infinite;
  }

  .home-hero__portrait img {
    width: auto;

    max-width: 100%;
    max-height: 100%;

    object-fit: contain;
  }

  .home-hero__assistant-card {
    position: absolute;

    left: -38px;
    bottom: 21%;

    z-index: 3;

    width: 275px;

    display: flex;

    align-items: center;

    gap: 13px;

    padding: 16px;

    border:
      1px solid
      rgba(248, 213, 174, 0.92);

    border-radius: 18px;

    background:
      rgba(255, 255, 255, 0.94);

    box-shadow:
      0 18px 42px
      rgba(15, 23, 42, 0.16);

    backdrop-filter:
      blur(12px);

    -webkit-backdrop-filter:
      blur(12px);
  }

  .home-hero__assistant-icon {
    width: 56px;
    height: 56px;

    display: flex;

    align-items: center;

    justify-content: center;

    flex-shrink: 0;

    border-radius: 16px;

    color: #c46a2c;

    background:
      linear-gradient(
        135deg,
        #fff0df,
        #ffe2c6
      );

    line-height: 0;
  }

  .home-hero__assistant-icon svg {
    width: 26px;
    height: 26px;

    display: block;

    margin: auto;

    transform: translateY(10px);
    stroke-width: 2.1;
  }

  .home-hero__assistant-card strong,
  .home-hero__assistant-card span {
    display: block;
  }

  .home-hero__assistant-card strong {
    color: #0f172a;

    font-size: 1rem;
  }

  .home-hero__assistant-card span {
    margin-top: 3px;

    color: #6b7280;

    font-size: 0.82rem;

    line-height: 1.35;
  }

  @keyframes homeFadeUp {
    from {
      opacity: 0;

      transform:
        translateY(18px);
    }

    to {
      opacity: 1;

      transform:
        translateY(0);
    }
  }

  @keyframes homeFranzFloat {
    0%,
    100% {
      transform:
        translateY(0);
    }

    50% {
      transform:
        translateY(-8px);
    }
  }

  @keyframes homeHalo {
    0%,
    100% {
      transform:
        scale(1);
    }

    50% {
      transform:
        scale(1.05);
    }
  }

  /*
   * Portátiles con poca altura:
   * se reduce todo sin crear desplazamiento.
   */
  @media (
    max-height: 780px
  ) and (
    min-width: 901px
  ) {
    .home-hero {
      padding:
        98px
        0
        112px;
    }

    .home-hero__title {
      font-size:
        clamp(
          2.5rem,
          4.7vw,
          4rem
        );
    }

    .home-hero__description {
      margin-top: 18px;

      line-height: 1.65;
    }

    .home-hero__actions {
      margin-top: 21px;
    }

    .home-hero__tags {
      margin-top: 17px;
    }

    .home-hero__right {
      min-height: 430px;
    }

    .home-hero__portrait {
      width: 340px;
    }

    .home-hero__halo {
      width: 380px;
      height: 380px;
    }
  }

  @media (
    max-width: 900px
  ) {
    .public-layout:has(.home-page) {
      height: auto;
      min-height: 100dvh;

      overflow-y: auto;
    }

    .public-layout:has(.home-page)
    .public-layout__content {
      height: auto;
    }

    .home-page {
      height: auto;
      min-height: 100dvh;

      overflow: visible;
    }

    .home-hero {
      min-height: 100dvh;
      height: auto;

      grid-template-columns:
        1fr;

      gap: 20px;

      padding:
        115px
        0
        165px;

      text-align: center;
    }

    .home-hero__left {
      margin: 0 auto;
    }

    .home-hero__actions,
    .home-hero__tags {
      justify-content: center;
    }

    .home-hero__right {
      min-height: 430px;
    }

    .home-hero__portrait {
      width: 305px;
    }

    .home-hero__assistant-card {
      left: 50%;
      bottom: 4%;

      transform:
        translateX(-50%);
    }
  }

  @media (
    max-width: 560px
  ) {
    .home-page {
      width:
        min(
          100% - 24px,
          1200px
        );
    }

    .home-hero {
      padding-top: 104px;
    }

    .home-hero__title {
      font-size:
        clamp(
          2.25rem,
          12vw,
          3rem
        );
    }

    .home-hero__description {
      font-size: 0.94rem;
    }

    .home-hero__actions {
      flex-direction: column;
    }

    .home-button {
      width: 100%;
    }

    .home-hero__right {
      min-height: 400px;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .home-page *,
    .home-page *::before,
    .home-page *::after {
      animation: none !important;

      transition: none !important;
    }
  }
`;