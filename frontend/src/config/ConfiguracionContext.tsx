import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ReactNode,
} from 'react';

import {
  PREFERENCIAS_PREDETERMINADAS,
} from './configuracion.types';

import type {
  PreferenciasConfiguracion,
  TemaAplicacion,
} from './configuracion.types';

const CLAVE_CONFIGURACION =
  'iusacademy_configuracion';

type TemaResuelto =
  | 'CLARO'
  | 'OSCURO';

type ConfiguracionContextValue = {
  preferencias:
    PreferenciasConfiguracion;

  temaAplicado:
    TemaResuelto;

  actualizarPreferencia:
    <K extends keyof PreferenciasConfiguracion>(
      clave: K,
      valor:
        PreferenciasConfiguracion[K],
    ) => void;

  restaurarPreferencias:
    () => void;
};

type ConfiguracionProviderProps = {
  children:
    ReactNode;
};

const ConfiguracionContext =
  createContext<ConfiguracionContextValue | null>(
    null,
  );

function esObjeto(
  valor: unknown,
): valor is Record<string, unknown> {
  return Boolean(
    valor &&
    typeof valor ===
      'object' &&
    !Array.isArray(
      valor,
    ),
  );
}

function esTemaValido(
  valor: unknown,
): valor is TemaAplicacion {
  return (
    valor ===
      'CLARO' ||
    valor ===
      'OSCURO' ||
    valor ===
      'SISTEMA'
  );
}

function resolverTema(
  tema:
    TemaAplicacion,
): TemaResuelto {
  if (
    tema ===
    'CLARO'
  ) {
    return 'CLARO';
  }

  if (
    tema ===
    'OSCURO'
  ) {
    return 'OSCURO';
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'OSCURO'
    : 'CLARO';
}

function leerPreferenciasGuardadas():
  PreferenciasConfiguracion {
  try {
    const valor =
      localStorage.getItem(
        CLAVE_CONFIGURACION,
      );

    if (!valor) {
      return {
        ...PREFERENCIAS_PREDETERMINADAS,
      };
    }

    const datos:
      unknown =
        JSON.parse(
          valor,
        );

    if (!esObjeto(datos)) {
      return {
        ...PREFERENCIAS_PREDETERMINADAS,
      };
    }

    return {
      tema:
        esTemaValido(
          datos.tema,
        )
          ? datos.tema
          : PREFERENCIAS_PREDETERMINADAS
              .tema,

      reducirAnimaciones:
        typeof datos.reducirAnimaciones ===
        'boolean'
          ? datos.reducirAnimaciones
          : PREFERENCIAS_PREDETERMINADAS
              .reducirAnimaciones,

      sidebarContraido:
        typeof datos.sidebarContraido ===
        'boolean'
          ? datos.sidebarContraido
          : PREFERENCIAS_PREDETERMINADAS
              .sidebarContraido,
    };
  } catch {
    return {
      ...PREFERENCIAS_PREDETERMINADAS,
    };
  }
}

export function ConfiguracionProvider({
  children,
}: ConfiguracionProviderProps) {
  const [
    preferencias,
    setPreferencias,
  ] =
    useState<PreferenciasConfiguracion>(
      leerPreferenciasGuardadas,
    );

  const [
    temaAplicado,
    setTemaAplicado,
  ] = useState<TemaResuelto>(
    () =>
      resolverTema(
        leerPreferenciasGuardadas()
          .tema,
      ),
  );

  const actualizarPreferencia =
    useCallback(
      <
        K extends keyof PreferenciasConfiguracion,
      >(
        clave: K,
        valor:
          PreferenciasConfiguracion[K],
      ) => {
        setPreferencias(
          (
            anteriores,
          ) => ({
            ...anteriores,
            [clave]:
              valor,
          }),
        );
      },
      [],
    );

  const restaurarPreferencias =
    useCallback(
      () => {
        setPreferencias({
          ...PREFERENCIAS_PREDETERMINADAS,
        });
      },
      [],
    );

  useEffect(
    () => {
      localStorage.setItem(
        CLAVE_CONFIGURACION,
        JSON.stringify(
          preferencias,
        ),
      );
    },
    [
      preferencias,
    ],
  );

  useEffect(
    () => {
      const raiz =
        document.documentElement;

      const tema =
        resolverTema(
          preferencias.tema,
        );

      setTemaAplicado(
        tema,
      );

      raiz.dataset.theme =
        tema.toLowerCase();

      raiz.dataset.reduceMotion =
        preferencias.reducirAnimaciones
          ? 'true'
          : 'false';
    },
    [
      preferencias.tema,
      preferencias.reducirAnimaciones,
    ],
  );

  useEffect(
    () => {
      if (
        preferencias.tema !==
        'SISTEMA'
      ) {
        return;
      }

      const consulta =
        window.matchMedia(
          '(prefers-color-scheme: dark)',
        );

      const actualizarTemaSistema =
        () => {
          const tema:
            TemaResuelto =
              consulta.matches
                ? 'OSCURO'
                : 'CLARO';

          setTemaAplicado(
            tema,
          );

          document.documentElement
            .dataset.theme =
            tema.toLowerCase();
        };

      consulta.addEventListener(
        'change',
        actualizarTemaSistema,
      );

      return () => {
        consulta.removeEventListener(
          'change',
          actualizarTemaSistema,
        );
      };
    },
    [
      preferencias.tema,
    ],
  );

  const valor =
    useMemo<ConfiguracionContextValue>(
      () => ({
        preferencias,
        temaAplicado,
        actualizarPreferencia,
        restaurarPreferencias,
      }),
      [
        preferencias,
        temaAplicado,
        actualizarPreferencia,
        restaurarPreferencias,
      ],
    );

  return (
    <ConfiguracionContext.Provider
      value={valor}
    >
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion():
  ConfiguracionContextValue {
  const contexto =
    useContext(
      ConfiguracionContext,
    );

  if (!contexto) {
    throw new Error(
      'useConfiguracion debe utilizarse dentro de ConfiguracionProvider',
    );
  }

  return contexto;
}