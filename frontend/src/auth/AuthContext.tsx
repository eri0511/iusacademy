import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {
  ReactNode,
} from 'react';

import type {
  CredencialesLogin,
  RespuestaLogin,
  Sesion,
} from './auth.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const CLAVE_SESION =
  'iusacademy_sesion';

type AuthContextValue = {
  sesion: Sesion | null;

  accessToken:
    string | null;

  estaAutenticado:
    boolean;

  iniciarSesion: (
    credenciales:
      CredencialesLogin,
  ) => Promise<Sesion>;

  cerrarSesion:
    () => void;
};

type AuthProviderProps = {
  children:
    ReactNode;
};

type RespuestaError = {
  message?:
    | string
    | string[];

  mensaje?:
    string;

  error?:
    string;
};

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

function esSesionValida(
  valor: unknown,
): valor is Sesion {
  if (
    !valor ||
    typeof valor !== 'object'
  ) {
    return false;
  }

  const sesion =
    valor as Partial<Sesion>;

  return Boolean(
    typeof sesion.accessToken ===
      'string' &&
      sesion.accessToken.trim() &&
      sesion.usuario &&
      typeof sesion.usuario ===
        'object',
  );
}

function obtenerSesionGuardada():
  Sesion | null {
  try {
    const sesionGuardada =
      sessionStorage.getItem(
        CLAVE_SESION,
      );

    if (!sesionGuardada) {
      return null;
    }

    const sesionParseada:
      unknown =
        JSON.parse(
          sesionGuardada,
        );

    if (
      !esSesionValida(
        sesionParseada,
      )
    ) {
      sessionStorage.removeItem(
        CLAVE_SESION,
      );

      return null;
    }

    return sesionParseada;
  } catch {
    sessionStorage.removeItem(
      CLAVE_SESION,
    );

    return null;
  }
}

function obtenerMensajeError(
  respuesta:
    RespuestaError,
): string {
  if (
    Array.isArray(
      respuesta.message,
    )
  ) {
    return respuesta.message.join(
      '. ',
    );
  }

  return (
    respuesta.message ||
    respuesta.mensaje ||
    respuesta.error ||
    'No fue posible iniciar sesión'
  );
}

async function leerRespuestaJson(
  respuesta: Response,
): Promise<unknown> {
  const tipoContenido =
    respuesta.headers.get(
      'content-type',
    );

  if (
    !tipoContenido?.includes(
      'application/json',
    )
  ) {
    return {};
  }

  return respuesta
    .json()
    .catch(() => ({}));
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    sesion,
    setSesion,
  ] = useState<Sesion | null>(
    obtenerSesionGuardada,
  );

  const iniciarSesion =
    useCallback(
      async (
        credenciales:
          CredencialesLogin,
      ): Promise<Sesion> => {
        const correoNormalizado =
          credenciales.correo
            .trim()
            .toLowerCase();

        const respuesta =
          await fetch(
            `${API_URL}/auth/login`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  correo:
                    correoNormalizado,

                  password:
                    credenciales.password,
                }),
            },
          );

        const datos =
          await leerRespuestaJson(
            respuesta,
          );

        if (!respuesta.ok) {
          throw new Error(
            obtenerMensajeError(
              datos as
                RespuestaError,
            ),
          );
        }

        const login =
          datos as
            Partial<RespuestaLogin>;

        if (
          !login.accessToken ||
          !login.usuario
        ) {
          throw new Error(
            'El servidor devolvió una sesión incompleta.',
          );
        }

        const nuevaSesion:
          Sesion = {
            accessToken:
              login.accessToken,

            usuario:
              login.usuario,
          };

        sessionStorage.setItem(
          CLAVE_SESION,
          JSON.stringify(
            nuevaSesion,
          ),
        );

        /*
         * Actualiza inmediatamente el estado
         * utilizado por las rutas y componentes.
         */
        setSesion(
          nuevaSesion,
        );

        return nuevaSesion;
      },
      [],
    );

  const cerrarSesion =
    useCallback(() => {
      sessionStorage.removeItem(
        CLAVE_SESION,
      );

      setSesion(null);
    }, []);

  const valor =
    useMemo<AuthContextValue>(
      () => ({
        sesion,

        accessToken:
          sesion?.accessToken ??
          null,

        estaAutenticado:
          Boolean(
            sesion?.accessToken,
          ),

        iniciarSesion,

        cerrarSesion,
      }),
      [
        sesion,
        iniciarSesion,
        cerrarSesion,
      ],
    );

  return (
    <AuthContext.Provider
      value={valor}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth():
  AuthContextValue {
  const contexto =
    useContext(
      AuthContext,
    );

  if (!contexto) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider',
    );
  }

  return contexto;
}