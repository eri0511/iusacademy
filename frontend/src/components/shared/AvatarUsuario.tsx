import {
  useMemo,
  useState,
} from 'react';

type AvatarUsuarioProps = {
  fotoPerfilUrl?: string | null;
  nombres: string;
  apellidoPaterno: string;
  size?: number;
  className?: string;
  mostrarEstado?: boolean;
  estaActivo?: boolean;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function construirUrlFoto(
  fotoPerfilUrl:
    string | null | undefined,
): string | null {
  if (!fotoPerfilUrl) {
    return null;
  }

  if (
    fotoPerfilUrl.startsWith(
      'http://',
    ) ||
    fotoPerfilUrl.startsWith(
      'https://',
    )
  ) {
    return fotoPerfilUrl;
  }

  return `${API_URL}${fotoPerfilUrl}`;
}

function obtenerIniciales(
  nombres: string,
  apellidoPaterno: string,
): string {
  const primerNombre =
    nombres
      .trim()
      .split(/\s+/)[0] ??
    '';

  const primerApellido =
    apellidoPaterno
      .trim()
      .split(/\s+/)[0] ??
    '';

  const inicialNombre =
    primerNombre.charAt(
      0,
    );

  const inicialApellido =
    primerApellido.charAt(
      0,
    );

  return (
    `${inicialNombre}${inicialApellido}`
      .toUpperCase() ||
    'US'
  );
}

export default function AvatarUsuario({
  fotoPerfilUrl,
  nombres,
  apellidoPaterno,
  size = 46,
  className = '',
  mostrarEstado = false,
  estaActivo = true,
}: AvatarUsuarioProps) {
  const [
    errorFoto,
    setErrorFoto,
  ] =
    useState(
      false,
    );

  const foto =
    errorFoto
      ? null
      : construirUrlFoto(
          fotoPerfilUrl,
        );

  const iniciales =
    useMemo(
      () =>
        obtenerIniciales(
          nombres,
          apellidoPaterno,
        ),
      [
        nombres,
        apellidoPaterno,
      ],
    );

  const tamanioEstado =
    Math.max(
      Math.round(
        size *
          0.28,
      ),
      11,
    );

  const grosorBordeEstado =
    Math.max(
      Math.round(
        size *
          0.055,
      ),
      2,
    );

  const radioAvatar =
    Math.max(
      Math.round(
        size *
          0.3,
      ),
      12,
    );

  const tamanioTexto =
    Math.max(
      Math.round(
        size *
          0.35,
      ),
      13,
    );

  return (
    <div
      className={`ius-avatar ${className}`}
      style={{
        width:
          `${size}px`,

        height:
          `${size}px`,
      }}
      aria-label={`Avatar de ${nombres} ${apellidoPaterno}`}
    >
      <div
        className="ius-avatar__surface"
        style={{
          borderRadius:
            `${radioAvatar}px`,
        }}
      >
        {foto ? (
          <img
            src={
              foto
            }
            alt={`Fotografía de ${nombres} ${apellidoPaterno}`}
            loading="lazy"
            onError={() =>
              setErrorFoto(
                true,
              )
            }
          />
        ) : (
          <span
            className="ius-avatar__initials"
            style={{
              fontSize:
                `${tamanioTexto}px`,
            }}
          >
            {
              iniciales
            }
          </span>
        )}
      </div>

      {mostrarEstado && (
        <span
          className={`ius-avatar__status ${
            estaActivo
              ? 'is-active'
              : 'is-inactive'
          }`}
          style={{
            width:
              `${tamanioEstado}px`,

            height:
              `${tamanioEstado}px`,

            borderWidth:
              `${grosorBordeEstado}px`,
          }}
          aria-hidden="true"
        />
      )}

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
.ius-avatar {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  overflow: visible;
}

.ius-avatar__surface {
  position: relative;
  width: 100%;
  height: 100%;

  display: grid;
  place-items: center;

  overflow: hidden;

  border:
    1px solid
    rgba(
      241,
      139,
      75,
      .42
    );

  color:
    #d96822;

  background:
    linear-gradient(
      135deg,
      #fff2e7,
      #fffaf6
    );

  box-shadow:
    var(
      --app-shadow-sm,
      0 6px 16px
      rgba(
        15,
        23,
        42,
        .08
      )
    );
}

.ius-avatar__surface::before {
  content: "";

  position: absolute;
  inset: 1px;

  border-radius: inherit;

  pointer-events: none;

  box-shadow:
    inset 0 1px 0
    rgba(
      255,
      255,
      255,
      .62
    );

  z-index: 1;
}

.ius-avatar__surface img {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;
  object-position: center;
}

.ius-avatar__initials {
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;

  display: grid;
  place-items: center;

  color:
    #d96822 !important;

  font-weight: 900;
  line-height: 1;
  letter-spacing: -.02em;
  text-align: center;
}

.ius-avatar__status {
  position: absolute;

  right: -3px;
  bottom: -3px;

  border-style: solid;
  border-color:
    var(
      --app-surface,
      #ffffff
    );

  border-radius: 50%;

  box-shadow:
    0 2px 6px
    rgba(
      15,
      23,
      42,
      .18
    );

  z-index: 3;
}

.ius-avatar__status.is-active {
  background:
    #22c55e;
}

.ius-avatar__status.is-inactive {
  background:
    #94a3b8;
}

html[data-theme='oscuro']
.ius-avatar__surface {
  border-color:
    rgba(
      241,
      139,
      75,
      .48
    );

  background:
    linear-gradient(
      135deg,
      rgba(
        241,
        139,
        75,
        .16
      ),
      var(
        --app-surface-raised,
        #1f2937
      )
    );

  box-shadow:
    0 8px 20px
    rgba(
      0,
      0,
      0,
      .22
    );
}

html[data-theme='oscuro']
.ius-avatar__initials {
  color:
    #f39a61 !important;
}
`;