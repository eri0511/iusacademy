import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import WavesBottom from "../../components/shared/WaveBackground";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type EstadoFormulario =
  | "formulario"
  | "enviando"
  | "exito"
  | "error";

type RespuestaError = {
  message?: string | string[];
  mensaje?: string;
};

export default function ActivarCuenta() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [estado, setEstado] =
    useState<EstadoFormulario>("formulario");

  const [mensajeError, setMensajeError] = useState("");

  const requisitos = useMemo(
    () => ({
      longitud: password.length >= 8,
      mayuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /\d/.test(password),
      especial: /[^A-Za-z0-9]/.test(password),
      coincide:
        confirmarPassword.length > 0 &&
        password === confirmarPassword,
    }),
    [password, confirmarPassword],
  );

  const requisitosObligatoriosCumplidos =
    requisitos.longitud &&
    requisitos.mayuscula &&
    requisitos.minuscula &&
    requisitos.numero &&
    requisitos.especial;

  const formularioValido =
    Boolean(token) &&
    requisitosObligatoriosCumplidos &&
    requisitos.coincide &&
    estado !== "enviando";

  const nivelSeguridad = useMemo(() => {
    if (!password) {
      return {
        valor: 0,
        texto: "Sin contraseña",
        clase: "empty",
      };
    }

    let puntuacion = 0;

    if (requisitos.longitud) puntuacion += 1;
    if (requisitos.mayuscula) puntuacion += 1;
    if (requisitos.minuscula) puntuacion += 1;
    if (requisitos.numero) puntuacion += 1;
    if (requisitos.especial) puntuacion += 1;
    if (password.length >= 12) puntuacion += 1;

    if (puntuacion <= 2) {
      return {
        valor: 25,
        texto: "Muy débil",
        clase: "veryWeak",
      };
    }

    if (puntuacion === 3) {
      return {
        valor: 50,
        texto: "Débil",
        clase: "weak",
      };
    }

    if (puntuacion === 4) {
      return {
        valor: 75,
        texto: "Segura",
        clase: "secure",
      };
    }

    return {
      valor: 100,
      texto: "Muy segura",
      clase: "verySecure",
    };
  }, [password, requisitos]);

  const obtenerMensajeError = (data: RespuestaError) => {
    if (Array.isArray(data.message)) {
      return data.message.join(". ");
    }

    return (
      data.message ||
      data.mensaje ||
      "No se pudo activar la cuenta. El enlace puede haber expirado o ya fue utilizado."
    );
  };

  const activarCuenta = async (event: FormEvent) => {
    event.preventDefault();

    setMensajeError("");

    if (!token) {
      setMensajeError(
        "El enlace de activación no contiene un token válido.",
      );
      setEstado("error");
      return;
    }

    if (!requisitosObligatoriosCumplidos) {
      setMensajeError(
        "La contraseña debe cumplir todos los requisitos obligatorios.",
      );
      return;
    }

    if (!requisitos.coincide) {
      setMensajeError("Las contraseñas no coinciden.");
      return;
    }

    setEstado("enviando");

    try {
      const response = await fetch(
        `${API_URL}/usuarios/activar-cuenta`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmarPassword,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(obtenerMensajeError(data));
      }

      setEstado("exito");
      setPassword("");
      setConfirmarPassword("");
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo activar la cuenta.",
      );

      setEstado("error");
    }
  };

  if (estado === "exito") {
    return (
      <main className="activationPage">
        <DecoracionFondo />

        <section
          className="activationCard activationCard--result"
          aria-labelledby="activation-success-title"
        >
          <div className="resultIcon resultIcon--success">
            ✓
          </div>

          <p className="activationCard__eyebrow">
            IUSACADEMY
          </p>

          <h1
            id="activation-success-title"
            className="activationCard__title"
          >
            ¡Cuenta activada!
          </h1>

          <p className="activationCard__sub">
            Tu contraseña fue creada correctamente. Ya puedes
            ingresar a la plataforma.
          </p>

          <Link className="btnPrimary btnPrimary--link" to="/login">
            <span
              className="btnPrimary__shine"
              aria-hidden="true"
            />
            Ir a iniciar sesión
          </Link>
        </section>

        <WavesBottom height={240} />

        <style>{styles}</style>
      </main>
    );
  }

  return (
    <main className="activationPage">
      <DecoracionFondo />

      <section
        className="activationCard"
        aria-labelledby="activation-title"
      >
        <p className="activationCard__eyebrow">
          IUSACADEMY
        </p>

        <h1
          id="activation-title"
          className="activationCard__title"
        >
          Activa tu cuenta
        </h1>

        <p className="activationCard__sub">
          Crea una contraseña segura para acceder a la
          plataforma académica.
        </p>

        {!token ? (
          <div className="invalidToken">
            <div className="resultIcon resultIcon--error">
              !
            </div>

            <h2>Enlace no válido</h2>

            <p>
              El enlace de activación está incompleto. Solicita
              al administrador un nuevo enlace.
            </p>
          </div>
        ) : (
          <form
            className="activationForm"
            onSubmit={activarCuenta}
            noValidate
          >
            <label className="field">
              <span className="field__label">
                Nueva contraseña
              </span>

              <div className="inputWrap">
                <span
                  className="inputWrap__icon"
                  aria-hidden="true"
                >
                  🔒
                </span>

                <input
                  type={mostrarPassword ? "text" : "password"}
                  className="input"
                  placeholder="Crea una contraseña segura"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMensajeError("");

                    if (estado === "error") {
                      setEstado("formulario");
                    }
                  }}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="toggle"
                  onClick={() =>
                    setMostrarPassword((actual) => !actual)
                  }
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            <div className="strength">
              <div className="strength__header">
                <span>Seguridad de la contraseña</span>

                <strong
                  className={`strength__text strength__text--${nivelSeguridad.clase}`}
                >
                  {nivelSeguridad.texto}
                </strong>
              </div>

              <div
                className="strength__track"
                role="progressbar"
                aria-label="Seguridad de la contraseña"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={nivelSeguridad.valor}
              >
                <span
                  className={`strength__bar strength__bar--${nivelSeguridad.clase}`}
                  style={{
                    width: `${nivelSeguridad.valor}%`,
                  }}
                />
              </div>
            </div>

            <div className="requirements">
              <p className="requirements__title">
                La contraseña debe contener:
              </p>

              <Requirement
                cumplido={requisitos.longitud}
                texto="Al menos 8 caracteres"
              />

              <Requirement
                cumplido={requisitos.mayuscula}
                texto="Una letra mayúscula"
              />

              <Requirement
                cumplido={requisitos.minuscula}
                texto="Una letra minúscula"
              />

              <Requirement
                cumplido={requisitos.numero}
                texto="Un número"
              />

              <Requirement
                cumplido={requisitos.especial}
                texto="Un carácter especial"
              />
            </div>

            <label className="field">
              <span className="field__label">
                Confirmar contraseña
              </span>

              <div className="inputWrap">
                <span
                  className="inputWrap__icon"
                  aria-hidden="true"
                >
                  🔐
                </span>

                <input
                  type={
                    mostrarConfirmacion
                      ? "text"
                      : "password"
                  }
                  className={`input ${
                    confirmarPassword
                      ? requisitos.coincide
                        ? "input--valid"
                        : "input--invalid"
                      : ""
                  }`}
                  placeholder="Repite la contraseña"
                  value={confirmarPassword}
                  onChange={(event) => {
                    setConfirmarPassword(event.target.value);
                    setMensajeError("");

                    if (estado === "error") {
                      setEstado("formulario");
                    }
                  }}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="toggle"
                  onClick={() =>
                    setMostrarConfirmacion(
                      (actual) => !actual,
                    )
                  }
                  aria-label={
                    mostrarConfirmacion
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                >
                  {mostrarConfirmacion
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>

              {confirmarPassword && (
                <div
                  className={`matchMessage ${
                    requisitos.coincide
                      ? "matchMessage--valid"
                      : "matchMessage--invalid"
                  }`}
                >
                  <span>
                    {requisitos.coincide ? "✓" : "×"}
                  </span>

                  {requisitos.coincide
                    ? "Las contraseñas coinciden"
                    : "Las contraseñas no coinciden"}
                </div>
              )}
            </label>

            {mensajeError && (
              <div className="errorMessage" role="alert">
                <span aria-hidden="true">!</span>
                <p>{mensajeError}</p>
              </div>
            )}

            <button
              type="submit"
              className="btnPrimary"
              disabled={!formularioValido}
            >
              <span
                className="btnPrimary__shine"
                aria-hidden="true"
              />

              {estado === "enviando"
                ? "Activando cuenta..."
                : "Activar cuenta"}
            </button>
          </form>
        )}
      </section>

      <WavesBottom height={240} />

      <style>{styles}</style>
    </main>
  );
}

type RequirementProps = {
  cumplido: boolean;
  texto: string;
};

function Requirement({
  cumplido,
  texto,
}: RequirementProps) {
  return (
    <div
      className={`requirement ${
        cumplido
          ? "requirement--valid"
          : "requirement--pending"
      }`}
    >
      <span className="requirement__icon">
        {cumplido ? "✓" : "○"}
      </span>

      <span>{texto}</span>
    </div>
  );
}

function DecoracionFondo() {
  return (
    <>
      <div
        className="activationPage__papers"
        aria-hidden="true"
      >
        <span className="paper paper--1" />
        <span className="paper paper--2" />
        <span className="paper paper--3" />
        <span className="paper paper--4" />
        <span className="paper paper--5" />
        <span className="paper paper--6" />
      </div>

      <div
        className="activationPage__bgGrad"
        aria-hidden="true"
      />

      <div
        className="activationPage__bgCircle"
        aria-hidden="true"
      />
    </>
  );
}

const styles = `
:root {
  --bg-main: #fbf3e8;
  --text-main: #191919;
  --accent: #f18b4b;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
}

* {
  box-sizing: border-box;
}

.activationPage {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: relative;
  isolation: isolate;
  overflow: hidden;

  display: grid;
  place-items: start center;

  /* Mantiene el fondo y las olas anclados a la ventana */
  padding: 0;

  background: var(--bg-main);
  color: var(--text-main);

  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "SF Pro Text",
    "Segoe UI",
    sans-serif;
}

.activationPage__bgGrad {
  position: absolute;
  inset: 0;
  z-index: -4;
  pointer-events: none;

  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(241, 139, 75, 0.13) 0%,
      transparent 48%
    ),
    radial-gradient(
      circle at 88% 0%,
      rgba(245, 158, 11, 0.12) 0%,
      transparent 48%
    );
}

.activationPage__bgCircle {
  position: absolute;
  right: -90px;
  top: 70px;
  z-index: -3;

  width: 380px;
  height: 380px;
  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      #ffe7c8 0%,
      #fdf3e7 55%,
      transparent 75%
    );

  opacity: 0.9;
  animation: bgPulse 10s ease-in-out infinite;
}

.activationCard {
  width: min(560px, 92vw);
  max-height: calc(100dvh - 3rem);

  position: relative;
  z-index: 5;
  overflow: hidden;

  padding: 1.9rem 1.8rem 2rem;

  border: 1px solid rgba(241, 139, 75, 0.2);
  border-radius: 28px;

  background: rgba(255, 255, 255, 0.78);

  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.14);

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  transform: translateY(-40px);
  animation: fadeUpCard 0.85s ease-out both;
}

.activationCard::before {
  content: "";
  position: absolute;
  inset: -1px;

  border-radius: 28px;
  padding: 1px;

  background:
    linear-gradient(
      135deg,
      rgba(241, 139, 75, 0.28),
      rgba(234, 179, 8, 0.12),
      rgba(148, 163, 184, 0.1)
    );

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);

  -webkit-mask-composite: xor;
  mask-composite: exclude;

  pointer-events: none;
}

.activationCard--result {
  max-width: 470px;
  text-align: center;
  padding-block: 2rem;
}

.activationCard__eyebrow {
  margin: 0;
  text-align: center;

  color: #9ca3af;

  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.activationCard__title {
  margin: 0.42rem 0 0.25rem;
  text-align: center;

  color: #0f172a;

  font-size: clamp(1.9rem, 4vw, 2.25rem);
  font-weight: 900;
  line-height: 1.05;
}

.activationCard__sub {
  margin: 0 0 0.9rem;
  text-align: center;

  color: rgba(15, 23, 42, 0.58);

  font-size: 0.95rem;
  line-height: 1.42;
}

.activationForm {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field__label {
  color: rgba(15, 23, 42, 0.74);

  font-size: 0.88rem;
  font-weight: 800;
}

.inputWrap {
  position: relative;
  display: flex;
  align-items: center;
}

.inputWrap__icon {
  position: absolute;
  left: 0.88rem;
  z-index: 1;

  font-size: 0.95rem;
  opacity: 0.72;
}

.input {
  width: 100%;
  min-height: 50px;

  padding: 0.82rem 6rem 0.82rem 2.55rem;

  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 17px;

  outline: none;

  background: rgba(255, 255, 255, 0.88);
  color: #0f172a;

  font: inherit;

  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.06);

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.input:focus {
  transform: translateY(-1px);

  border-color: rgba(241, 139, 75, 0.55);

  box-shadow:
    0 16px 34px rgba(241, 139, 75, 0.13);
}

.input--valid {
  border-color: rgba(34, 197, 94, 0.62);
}

.input--invalid {
  border-color: rgba(239, 68, 68, 0.58);
}

.toggle {
  position: absolute;
  right: 0.58rem;
  top: 50%;

  transform: translateY(-50%);

  padding: 0.38rem 0.68rem;

  border: 1px solid rgba(200, 154, 85, 0.4);
  border-radius: 999px;

  background: rgba(255, 237, 213, 0.94);
  color: #7c2d12;

  font-size: 0.76rem;
  font-weight: 900;

  cursor: pointer;

  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.toggle:hover {
  transform: translateY(-50%) translateY(-1px);

  background: rgba(255, 237, 213, 1);

  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.1);
}

.strength {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.strength__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;

  color: rgba(15, 23, 42, 0.62);

  font-size: 0.78rem;
}

.strength__text {
  font-weight: 900;
}

.strength__text--empty {
  color: #94a3b8;
}

.strength__text--veryWeak {
  color: #dc2626;
}

.strength__text--weak {
  color: #ea580c;
}

.strength__text--secure {
  color: #ca8a04;
}

.strength__text--verySecure {
  color: #15803d;
}

.strength__track {
  height: 7px;

  overflow: hidden;

  border-radius: 999px;

  background: rgba(148, 163, 184, 0.18);
}

.strength__bar {
  display: block;
  height: 100%;

  border-radius: inherit;

  transition:
    width 0.25s ease,
    background-color 0.25s ease;
}

.strength__bar--empty {
  background: transparent;
}

.strength__bar--veryWeak {
  background: #ef4444;
}

.strength__bar--weak {
  background: #f97316;
}

.strength__bar--secure {
  background: #eab308;
}

.strength__bar--verySecure {
  background: #22c55e;
}

.requirements {
  display: grid;

  grid-template-columns: 1fr;

  gap: 0.55rem;

  padding: 1rem;

  border: 1px solid rgba(241, 139, 75, 0.18);
  border-radius: 16px;

  background: rgba(255, 247, 237, 0.72);
}

.requirements__title {
  grid-column: 1 / -1;

  margin: 0 0 0.12rem;

  color: rgba(15, 23, 42, 0.72);

  font-size: 0.82rem;
  font-weight: 900;
}

.requirement {
  display: flex;
  align-items: center;

  gap: .65rem;

  min-height: 30px;

  font-size: .88rem;
  line-height: 1.35;
}

.requirement--valid {
  color: #15803d;
}

.requirement--pending {
  color: #64748b;
}

.requirement__icon {
  width: 22px;
  height: 22px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-size: .8rem;
  font-weight: 700;
}

.requirement--valid .requirement__icon {
  color: white;
  background: #22c55e;
}

.requirement--pending .requirement__icon {
  color: #94a3b8;

  border: 1px solid rgba(148, 163, 184, 0.45);
}

.matchMessage {
  display: flex;
  align-items: center;
  gap: 0.36rem;

  font-size: 0.77rem;
  font-weight: 800;
}

.matchMessage--valid {
  color: #15803d;
}

.matchMessage--invalid {
  color: #b91c1c;
}

.errorMessage {
  display: flex;
  align-items: flex-start;
  gap: 0.58rem;

  padding: 0.7rem 0.84rem;

  border: 1px solid #ffc7c7;
  border-radius: 16px;

  background: #ffe8e8;
  color: #8a1f1f;

  font-size: 0.83rem;
}

.errorMessage span {
  width: 20px;
  height: 20px;
  flex-shrink: 0;

  display: grid;
  place-items: center;

  border-radius: 999px;

  background: rgba(185, 28, 28, 0.12);

  font-weight: 900;
}

.errorMessage p {
  margin: 0;
  line-height: 1.4;
}

.btnPrimary {
  width: 100%;
  min-height: 48px;

  margin-top: 0.08rem;
  padding: 0.86rem 1rem;

  position: relative;
  overflow: hidden;

  border: none;
  border-radius: 999px;

  background:
    linear-gradient(
      135deg,
      #f18b4b,
      #f39a5c
    );

  color: white;

  font-size: 0.96rem;
  font-weight: 900;

  cursor: pointer;

  box-shadow:
    0 16px 40px rgba(217, 119, 6, 0.24);

  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

.btnPrimary:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow:
    0 22px 52px rgba(180, 83, 9, 0.3);
}

.btnPrimary:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
}

.btnPrimary:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

.btnPrimary--link {
  max-width: 310px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  text-decoration: none;
}

.btnPrimary__shine {
  position: absolute;
  inset: -60% -70%;

  transform: translateX(-35%) rotate(10deg);

  background:
    linear-gradient(
      120deg,
      transparent 35%,
      rgba(255, 255, 255, 0.55) 50%,
      transparent 65%
    );

  opacity: 0.32;
  pointer-events: none;

  animation: shine 3.9s ease-in-out infinite;
}

.invalidToken {
  display: grid;
  justify-items: center;

  padding: 0.7rem 0 0.3rem;

  text-align: center;
}

.invalidToken h2 {
  margin: 0.65rem 0 0.3rem;
  color: #0f172a;
}

.invalidToken p {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

.resultIcon {
  width: 64px;
  height: 64px;

  margin: 0 auto 0.9rem;

  display: grid;
  place-items: center;

  border-radius: 50%;

  font-size: 1.85rem;
  font-weight: 900;
}

.resultIcon--success {
  color: #15803d;
  background: rgba(34, 197, 94, 0.14);

  box-shadow:
    0 14px 30px rgba(34, 197, 94, 0.14);
}

.resultIcon--error {
  margin-bottom: 0;

  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}

.wavesBottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0 !important;

  width: 100%;
  height: 240px;

  z-index: -1;
  overflow: hidden;
  pointer-events: none;

  filter: drop-shadow(
    0 10px 18px rgba(0, 0, 0, 0.05)
  );
}

.wavesBottom__svg {
  position: absolute;
  left: 0;
  bottom: 0;

  width: 200%;
  height: 100%;

  will-change: transform;
}

.wavesBottom__svg--back {
  opacity: 0.78;
  animation: waveMoveBack 30s linear infinite;
}

.wavesBottom__svg--front {
  opacity: 1;
  animation: waveMoveFront 20s linear infinite;
}

.paper {
  position: absolute;
  z-index: -2;

  width: 26px;
  height: 34px;

  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 5px;

  background:
    linear-gradient(
      145deg,
      #ffffff,
      #f9fafb
    );

  box-shadow:
    0 6px 12px rgba(15, 23, 42, 0.25);

  opacity: 0;
  transform-origin: top left;

  animation: paperFall 13s linear infinite;
}

.paper::before {
  content: "";

  position: absolute;
  top: 6px;
  left: 6px;
  right: 8px;

  height: 2px;

  border-radius: 999px;

  background: rgba(148, 163, 184, 0.6);
}

.paper::after {
  content: "";

  position: absolute;
  top: 0;
  right: 0;

  width: 10px;
  height: 10px;

  background:
    linear-gradient(
      135deg,
      #e5e7eb,
      #ffffff
    );

  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.paper--1 {
  left: 8%;
  animation-duration: 14s;
  animation-delay: 0s;
}

.paper--2 {
  left: 24%;
  animation-duration: 12s;
  animation-delay: -4s;
}

.paper--3 {
  left: 42%;
  animation-duration: 15s;
  animation-delay: -7s;
}

.paper--4 {
  left: 60%;
  animation-duration: 13s;
  animation-delay: -2s;
}

.paper--5 {
  left: 78%;
  animation-duration: 16s;
  animation-delay: -9s;
}

.paper--6 {
  left: 90%;
  animation-duration: 14s;
  animation-delay: -6s;
}

@keyframes shine {
  0% {
    transform: translateX(-35%) rotate(10deg);
  }

  60%,
  100% {
    transform: translateX(35%) rotate(10deg);
  }
}

@keyframes waveMoveFront {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@keyframes waveMoveBack {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@keyframes fadeUpCard {
  from {
    opacity: 0;
    transform: translateY(-24px);
  }

  to {
    opacity: 1;
    transform: translateY(-40px);
  }
}

@keyframes bgPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.04);
    opacity: 1;
  }
}

@keyframes paperFall {
  0% {
    transform:
      translate3d(0, -120px, 0)
      rotateZ(0deg)
      rotateX(0deg);

    opacity: 0;
  }

  10% {
    opacity: 0.95;
  }

  50% {
    transform:
      translate3d(40px, 50vh, 0)
      rotateZ(35deg)
      rotateX(25deg);

    opacity: 0.9;
  }

  100% {
    transform:
      translate3d(-40px, 115vh, 0)
      rotateZ(-25deg)
      rotateX(55deg);

    opacity: 0;
  }
}

@media (max-height: 760px) and (min-width: 621px) {
  .activationPage {
    padding-top: 0.65rem;
  }

  .activationCard {
    width: min(530px, 90vw);
    max-height: calc(100dvh - 1.2rem);
    padding: 0.8rem 1.35rem 0.9rem;
    transform: translateY(-20px);
    animation: none;
  }

  .activationCard__title {
    font-size: 1.7rem;
  }

  .activationCard__sub {
    margin-bottom: 0.5rem;
    font-size: 0.87rem;
  }

  .activationForm {
    gap: 0.48rem;
  }

  .input {
    min-height: 43px;
    padding-block: 0.68rem;
  }

  .requirements {
    gap: 0.28rem;
    padding: 0.58rem 0.8rem;
  }

  .requirement {
    min-height: 22px;
    font-size: 0.78rem;
  }

  .btnPrimary {
    min-height: 43px;
    padding-block: 0.72rem;
  }
}

@media (max-width: 620px) {
  body {
    overflow: auto;
  }

  .activationPage {
    min-height: 100dvh;
    height: auto;

    overflow-x: hidden;
    overflow-y: auto;

    place-items: start center;

    padding: 1rem 0.8rem 7rem;
  }

  .activationCard {
    width: min(100%, 520px);
    max-height: none;

    padding: 1.1rem 1rem 1.15rem;

    border-radius: 22px;
    transform: none;
    animation: none;
  }

  .input {
    padding-right: 5.2rem;
  }

  .toggle {
    padding: 0.36rem 0.54rem;
    font-size: 0.7rem;
  }

  .strength__header {
    align-items: flex-start;
  }

  .requirements {
    grid-template-columns: 1fr;
  }

  .wavesBottom {
    position: fixed;
    height: 170px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
`;