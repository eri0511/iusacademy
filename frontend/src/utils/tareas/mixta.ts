import type {
  ComponenteTarea,
  TipoComponenteTarea,
} from '../../types/tareas/tareas.types';

import {
  leerConfiguracionRespuesta,
} from './respuestaEscrita';

import {
  leerConfiguracionCaso,
} from './casoPractico';

import {
  leerConfiguracionRedaccion,
} from './redaccionJuridica';

import {
  leerConfiguracionExposicion,
} from './exposicion';

import {
  leerConfiguracionDocumentoColaborativo,
} from './documentoColaborativo';

export type ContenidoComponenteMIXTA =
  string;

export type EstadoMIXTA = {
  formato: 'MIXTA';
  version: 1;
  componentes: Record<
    string,
    ContenidoComponenteMIXTA
  >;
};

export const estadosMixin =
  (
    contenido:
      string,
  ): EstadoMIXTA | null => {
    if (
      !contenido
    ) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(
          contenido,
        ) as {
          formato?: unknown;
          version?: unknown;
          componentes?: unknown;
        };

      if (
        parsed.formato ===
          'MIXTA' &&
        parsed.version ===
          1 &&
        parsed.componentes &&
        typeof parsed.componentes ===
          'object' &&
        !Array.isArray(
          parsed.componentes,
        )
      ) {
        return {
          formato:
            'MIXTA',
          version: 1,
          componentes:
            parsed.componentes as Record<
              string,
              ContenidoComponenteMIXTA
            >,
        };
      }
    } catch {
      // no-op
    }

    return null;
  };

export const serializarMIXTA =
  (
    estado:
      EstadoMIXTA,
  ): string =>
    JSON.stringify(
      estado,
    );

export const nuevoEstadoMIXTA =
  (
    componentes:
      ComponenteTarea[],
  ): EstadoMIXTA => {
    const mapa: Record<
      string,
      ContenidoComponenteMIXTA
    > = {};

    for (
      const c
      of componentes
    ) {
      mapa[
        String(
          c.id,
        )
      ] = '';
    }

    return {
      formato:
        'MIXTA',
      version: 1,
      componentes:
        mapa,
    };
  };

export const contenidoParaComponente =
  (
    estadoMixta:
      EstadoMIXTA | null,
    componenteId:
      number,
  ): ContenidoComponenteMIXTA =>
    estadoMixta
      ?.componentes[
        String(
          componenteId,
        )
      ] ??
    '';

export const actualizarComponente =
  (
    estadoMixta:
      EstadoMIXTA,
    componenteId:
      number,
    nuevoContenido:
      ContenidoComponenteMIXTA,
  ): EstadoMIXTA => ({
    ...estadoMixta,
    componentes: {
      ...estadoMixta.componentes,
      [
        String(
          componenteId,
        )
      ]:
        nuevoContenido,
    },
  });

export const tieneConfiguracionComponente =
  (
    tipo:
      TipoComponenteTarea,
  ): boolean =>
    [
      'TEXTO',
      'CASO_PRACTICO',
      'REDACCION_JURIDICA',
      'EXPOSICION',
      'DOCUMENTO_COLABORATIVO',
    ].includes(
      tipo,
    );

export const leerConfiguracionComponente =
  (
    componente:
      ComponenteTarea,
  ):
    | Record<
        string,
        unknown
      >
    | null => {
    const config =
      componente.configuracion;

    if (
      !config ||
      typeof config !==
        'object'
    ) {
      return null;
    }

    switch (
      componente.tipo
    ) {
      case 'TEXTO':
        return leerConfiguracionRespuesta(
          config,
        );

      case 'CASO_PRACTICO':
        return leerConfiguracionCaso(
          config,
        );

      case 'REDACCION_JURIDICA':
        return leerConfiguracionRedaccion(
          config,
        );

      case 'EXPOSICION':
        return leerConfiguracionExposicion(
          config,
        );

      case 'DOCUMENTO_COLABORATIVO':
        return leerConfiguracionDocumentoColaborativo(
          config,
        );

      default:
        return null;
    }
  };

export const validarComponenteMIXTA =
  (
    componente:
      ComponenteTarea,
    contenido:
      ContenidoComponenteMIXTA,
  ):
    | {
        valido: true;
      }
    | {
        valido: false;
        error:
          string;
      } => {
    if (
      !componente.obligatorio
    ) {
      return {
        valido: true,
      };
    }

    if (
      componente.tipo ===
        'ARCHIVOS' ||
      componente.tipo ===
        'PRESENCIAL'
    ) {
      return {
        valido: true,
      };
    }

    if (
      !contenido.trim()
    ) {
      return {
        valido: false,
        error: `El componente "${componente.titulo}" es obligatorio.`,
      };
    }

    const config =
      leerConfiguracionComponente(
        componente,
      );

    if (
      config
    ) {
      if (
        componente.tipo ===
          'EXPOSICION' &&
        config.exigirEnlacePresentacion
      ) {
        try {
          const estado =
            JSON.parse(
              contenido,
            ) as {
              enlacePresentacion?: unknown;
            };

          const enlace =
            typeof estado.enlacePresentacion ===
              'string'
              ? estado.enlacePresentacion.trim()
              : '';

          if (
            !enlace
          ) {
            return {
              valido: false,
              error: `El componente "${componente.titulo}" requiere un enlace de presentación.`,
            };
          }
        } catch {
          return {
            valido: false,
            error: `El componente "${componente.titulo}" tiene un formato inválido.`,
          };
        }
      }
    }

    return {
      valido: true,
    };
  };

export const etiquetaComponenteMIXTA =
  (
    tipo:
      TipoComponenteTarea,
  ): string => {
    const etiquetas: Record<
      TipoComponenteTarea,
      string
    > = {
      ARCHIVOS:
        'Archivos',
      TEXTO:
        'Texto',
      DOCUMENTO_COLABORATIVO:
        'Documento',
      REDACCION_JURIDICA:
        'Redacción',
      EXPOSICION:
        'Exposición',
      CASO_PRACTICO:
        'Caso',
      PRESENCIAL:
        'Presencial',
    };

    return (
      etiquetas[
        tipo
      ] ?? tipo
    );
  };
