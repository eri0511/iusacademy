import type {
  FormEvent,
} from 'react';

import {
  useState,
} from 'react';

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  useAuth,
} from '../../auth/AuthContext';

import Toast from '../../components/shared/Toast';

import {
  rutaInicioPorRol,
} from '../../auth/ProtectedRoute';

type EstadoLogin =
  | 'inicial'
  | 'enviando'
  | 'error';

type EstadoNavegacion = {
  desde?: string;
};

const EXPRESION_CORREO =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    iniciarSesion,
    sesion,
    estaAutenticado,
  } = useAuth();

  const [
    correo,
    setCorreo,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    estado,
    setEstado,
  ] = useState<EstadoLogin>(
    'inicial',
  );

  const [
    mensajeError,
    setMensajeError,
  ] = useState('');

  const enviando =
    estado === 'enviando';

  if (
    estaAutenticado &&
    sesion
  ) {
    return (
      <Navigate
        to={rutaInicioPorRol(
          sesion.usuario.rol,
        )}
        replace
      />
    );
  }

  const limpiarError = () => {
    if (mensajeError) {
      setMensajeError('');
    }

    if (estado === 'error') {
      setEstado('inicial');
    }
  };

  const manejarSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const correoNormalizado =
        correo
          .trim()
          .toLowerCase();

      setMensajeError('');

      if (
        !correoNormalizado ||
        !password
      ) {
        setEstado('error');

        setMensajeError(
          'Completa el correo y la contraseña.',
        );

        return;
      }

      if (
        !EXPRESION_CORREO.test(
          correoNormalizado,
        )
      ) {
        setEstado('error');

        setMensajeError(
          'Ingresa un correo electrónico válido.',
        );

        return;
      }

      setEstado('enviando');

      try {
        const nuevaSesion =
          await iniciarSesion({
            correo:
              correoNormalizado,
            password,
          });

        const estadoNavegacion =
          location.state as
            | EstadoNavegacion
            | null;

        const rutaSolicitada =
          estadoNavegacion?.desde;

        const rutaDestino =
          rutaSolicitada &&
          rutaSolicitada !==
            '/login'
            ? rutaSolicitada
            : rutaInicioPorRol(
                nuevaSesion
                  .usuario
                  .rol,
              );

        navigate(
          rutaDestino,
          {
            replace: true,
          },
        );
      } catch (error) {
        setEstado('error');

        setPassword('');

        setMensajeError(
          error instanceof Error
            ? error.message
            : 'No fue posible iniciar sesión.',
        );
      }
    };

  return (
    <main className="login-page">
      <div
        className="login-page__glow"
        aria-hidden="true"
      />

      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        <p className="login-card__eyebrow">
          IUSACADEMY
        </p>

        <h1
          id="login-title"
          className="login-card__title"
        >
          Inicia sesión
        </h1>

        <p className="login-card__subtitle">
          Accede a tu espacio académico
          de manera segura.
        </p>

        <form
          className="login-form"
          onSubmit={manejarSubmit}
          noValidate
        >
          <label className="login-field">
            <span className="login-field__label">
              Correo electrónico
            </span>

            <div className="login-input-wrap">
              <span
                className="login-input-wrap__icon"
                aria-hidden="true"
              >
                <Mail size={18} />
              </span>

              <input
                type="email"
                className="login-input"
                placeholder="nombre@correo.com"
                value={correo}
                onChange={(event) => {
                  setCorreo(
                    event.target.value,
                  );

                  limpiarError();
                }}
                autoComplete="username"
                inputMode="email"
                disabled={enviando}
                required
              />
            </div>
          </label>

          <label className="login-field">
            <span className="login-field__label">
              Contraseña
            </span>

            <div className="login-input-wrap">
              <span
                className="login-input-wrap__icon"
                aria-hidden="true"
              >
                <LockKeyhole size={18} />
              </span>

              <input
                type={
                  mostrarPassword
                    ? 'text'
                    : 'password'
                }
                className="login-input login-input--password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );

                  limpiarError();
                }}
                autoComplete="current-password"
                disabled={enviando}
                required
              />

              <button
                type="button"
                className="login-toggle"
                onClick={() =>
                  setMostrarPassword(
                    (actual) =>
                      !actual,
                  )
                }
                disabled={enviando}
                aria-label={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                title={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {mostrarPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={enviando}
          >
            {enviando
              ? 'Iniciando sesión...'
              : 'Ingresar'}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck
            size={16}
            aria-hidden="true"
          />

          <span>
            Tus credenciales se verifican de forma segura.
          </span>
        </div>
      </section>

      <Toast
        visible={Boolean(mensajeError)}
        tipo="error"
        titulo="No se pudo iniciar sesión"
        mensaje={mensajeError}
        onCerrar={limpiarError}
      />

      <style>{styles}</style>
    </main>
  );
}

const styles = `
  /*
   * La ruta /login ocupa exactamente una pantalla.
   * PublicLayout conserva el navbar, el fondo, los papeles
   * y las mismas olas de las otras páginas públicas.
   */
  .public-layout:has(.login-page) {
    width: 100%;

    height: 100vh;
    height: 100dvh;

    min-height: 100vh;
    min-height: 100dvh;

    padding-bottom: 0;

    overflow: hidden;
  }

  .public-layout:has(.login-page)
  .public-layout__content {
    height: 100%;
  }

  .public-layout:has(.login-page)
  > .wavesBottom {
    position: absolute;

    inset:
      auto
      0
      0;

    z-index: 1;

    height: 230px !important;
  }

  .login-page {
    width: 100%;

    height: 100vh;
    height: 100dvh;

    position: relative;
    z-index: 5;

    display: grid;

    place-items: center;

    padding:
      102px
      20px
      145px;

    overflow: hidden;

    background:
      transparent;

    color: #0f172a;
  }

  .login-page__glow {
    position: absolute;

    top: 15%;
    right: 8%;

    width: 390px;
    height: 390px;

    z-index: -1;

    border-radius: 50%;

    pointer-events: none;

    opacity: 0.62;

    background:
      radial-gradient(
        circle,
        rgba(
          255,
          231,
          200,
          0.95
        )
        0%,
        rgba(
          253,
          243,
          231,
          0.54
        )
        58%,
        transparent
        75%
      );

    animation:
      loginGlow
      9s
      ease-in-out
      infinite;
  }

  .login-card {
    width:
      min(
        470px,
        100%
      );

    position: relative;

    z-index: 5;

    padding:
      1.75rem;

    border:
      1px solid
      rgba(
        241,
        139,
        75,
        0.21
      );

    border-radius: 27px;

    background:
      rgba(
        255,
        255,
        255,
        0.78
      );

    box-shadow:
      0
      24px
      60px
      rgba(
        15,
        23,
        42,
        0.13
      );

    backdrop-filter:
      blur(16px);

    -webkit-backdrop-filter:
      blur(16px);

    animation:
      loginCardIn
      0.7s
      ease-out
      both;
  }

  .login-card::before {
    content: "";

    position: absolute;

    inset: -1px;

    z-index: -1;

    border-radius: 27px;

    padding: 1px;

    pointer-events: none;

    background:
      linear-gradient(
        135deg,
        rgba(
          241,
          139,
          75,
          0.28
        ),
        rgba(
          234,
          179,
          8,
          0.1
        ),
        rgba(
          148,
          163,
          184,
          0.08
        )
      );

    -webkit-mask:
      linear-gradient(
        #000
        0
        0
      )
      content-box,
      linear-gradient(
        #000
        0
        0
      );

    -webkit-mask-composite:
      xor;

    mask-composite:
      exclude;
  }

  .login-card__eyebrow {
    margin: 0;

    color: #9ca3af;

    text-align: center;

    font-size: 0.72rem;
    font-weight: 850;

    letter-spacing: 0.18em;
  }

  .login-card__title {
    margin:
      0.48rem
      0
      0.25rem;

    color: #0f172a;

    text-align: center;

    font-size:
      clamp(
        1.95rem,
        5vw,
        2.25rem
      );

    font-weight: 900;

    letter-spacing:
      -0.025em;
  }

  .login-card__subtitle {
    margin:
      0
      0
      1.18rem;

    color:
      rgba(
        15,
        23,
        42,
        0.58
      );

    text-align: center;

    font-size: 0.94rem;

    line-height: 1.5;
  }

  .login-form {
    display: flex;

    flex-direction: column;

    gap: 0.86rem;
  }

  .login-field {
    display: flex;

    flex-direction: column;

    gap: 0.38rem;
  }

  .login-field__label {
    color:
      rgba(
        15,
        23,
        42,
        0.74
      );

    font-size: 0.87rem;
    font-weight: 800;
  }

  .login-input-wrap {
    position: relative;

    display: flex;

    align-items: center;
  }

  .login-input-wrap__icon {
    width: 38px;
    height: 38px;

    position: absolute;

    left: 0.53rem;

    z-index: 2;

    display: grid;

    place-items: center;

    border-radius: 12px;

    color: #9a5f34;

    background:
      rgba(
        255,
        237,
        213,
        0.78
      );

    pointer-events: none;

    line-height: 0;
  }

  .login-input-wrap__icon svg {
    display: block;
  }

  .login-input {
    width: 100%;

    min-height: 52px;

    padding:
      0.85rem
      1rem
      0.85rem
      3.25rem;

    border:
      1px solid
      rgba(
        148,
        163,
        184,
        0.26
      );

    border-radius: 17px;

    outline: none;

    background:
      rgba(
        255,
        255,
        255,
        0.9
      );

    color: #0f172a;

    box-shadow:
      0
      10px
      24px
      rgba(
        15,
        23,
        42,
        0.05
      );

    font: inherit;

    transition:
      border-color
      0.18s
      ease,
      box-shadow
      0.18s
      ease,
      transform
      0.18s
      ease;
  }

  .login-input--password {
    padding-right:
      4.35rem;
  }

  .login-input::placeholder {
    color:
      rgba(
        100,
        116,
        139,
        0.72
      );
  }

  .login-input:focus {
    transform:
      translateY(-1px);

    border-color:
      rgba(
        241,
        139,
        75,
        0.58
      );

    box-shadow:
      0
      16px
      34px
      rgba(
        241,
        139,
        75,
        0.13
      );
  }

  .login-input:disabled {
    opacity: 0.68;

    cursor: not-allowed;
  }

  .login-toggle {
    width: 38px;
    height: 38px;

    position: absolute;

    top: 50%;
    right: 0.53rem;

    z-index: 2;

    display: grid;

    place-items: center;

    transform:
      translateY(-50%);

    border:
      1px solid
      rgba(
        200,
        154,
        85,
        0.36
      );

    border-radius: 12px;

    color: #7c2d12;

    background:
      rgba(
        255,
        237,
        213,
        0.9
      );

    cursor: pointer;

    transition:
      transform
      0.16s
      ease,
      background
      0.16s
      ease,
      box-shadow
      0.16s
      ease;
  }

  .login-toggle:hover {
    transform:
      translateY(-50%)
      translateY(-1px);

    background:
      rgba(
        255,
        237,
        213,
        1
      );

    box-shadow:
      0
      10px
      22px
      rgba(
        15,
        23,
        42,
        0.09
      );
  }

  .login-toggle:disabled {
    opacity: 0.55;

    cursor: not-allowed;

    transform:
      translateY(-50%);

    box-shadow: none;
  }

  .login-toggle svg {
    display: block;
  }

  .login-button {
    min-height: 50px;

    position: relative;

    overflow: hidden;

    margin-top: 0.08rem;

    border: none;

    border-radius: 999px;

    color: white;

    background:
      linear-gradient(
        135deg,
        #f18b4b,
        #f39a5c
      );

    box-shadow:
      0
      18px
      48px
      rgba(
        217,
        119,
        6,
        0.25
      );

    font: inherit;

    font-size: 0.98rem;
    font-weight: 900;

    cursor: pointer;

    transition:
      transform
      0.16s
      ease,
      box-shadow
      0.16s
      ease,
      opacity
      0.16s
      ease;
  }

  .login-button:hover:not(
    :disabled
  ) {
    transform:
      translateY(-2px);

    box-shadow:
      0
      23px
      56px
      rgba(
        180,
        83,
        9,
        0.3
      );
  }

  .login-button:active:not(
    :disabled
  ) {
    transform:
      translateY(-1px)
      scale(0.995);
  }

  .login-button:disabled {
    opacity: 0.58;

    cursor: not-allowed;

    box-shadow: none;
  }

  .login-security {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    margin-top: 0.85rem;

    color:
      rgba(
        71,
        85,
        105,
        0.78
      );

    font-size: 0.76rem;

    line-height: 1.4;
  }

  .login-security svg {
    flex-shrink: 0;

    color: #c46a2c;
  }

  @keyframes loginCardIn {
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

  @keyframes loginGlow {
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
   * Ajuste para notebooks de poca altura:
   * reduce la tarjeta sin generar desplazamiento.
   */
  @media (
    max-height: 760px
  ) and (
    min-width: 621px
  ) {
    .login-page {
      padding:
        88px
        20px
        112px;
    }

    .login-card {
      width:
        min(
          450px,
          100%
        );

      padding:
        1.35rem;
    }

    .login-card__title {
      font-size: 1.85rem;
    }

    .login-card__subtitle {
      margin-bottom: 0.9rem;

      font-size: 0.88rem;
    }

    .login-form {
      gap: 0.68rem;
    }

    .login-input {
      min-height: 48px;
    }

    .login-button {
      min-height: 47px;
    }

    .login-security {
      margin-top: 0.65rem;
    }
  }

  /*
   * En móviles muy pequeños puede permitirse scroll,
   * porque sería peor recortar el formulario.
   */
  @media (
    max-width: 620px
  ) {
    .public-layout:has(.login-page) {
      height: auto;

      min-height: 100dvh;

      overflow-y: auto;
    }

    .public-layout:has(.login-page)
    .public-layout__content {
      height: auto;
    }

    .login-page {
      height: auto;

      min-height: 100dvh;

      place-items:
        start
        center;

      padding:
        105px
        12px
        150px;

      overflow: visible;
    }

    .login-page__glow {
      top: 80px;

      right: -130px;

      width: 320px;
      height: 320px;
    }

    .login-card {
      width: 100%;

      padding:
        1.35rem
        1rem;

      border-radius: 22px;
    }

    .login-card::before {
      border-radius: 22px;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .login-page *,
    .login-page *::before,
    .login-page *::after {
      animation: none !important;

      transition: none !important;
    }
  }
`;