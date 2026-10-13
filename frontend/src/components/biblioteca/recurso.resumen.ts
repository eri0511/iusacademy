import type {
  Contenido,
  Recurso,
  Version,
} from '../../types/biblioteca/biblioteca.types';

export type VarianteElemento = 'vacio' | 'archivo' | 'enlace' | 'carpeta';

export type ResumenElementos = {
  cantidadElementos: number;
  cantidadArchivos: number;
  cantidadEnlaces: number;
  esCarpeta: boolean;
  variante: VarianteElemento;
  contenidoUnico?: Contenido;
  versionPrincipal?: Version;
  etiqueta: string;
  composicion?: string;
};

const SIN_ARCHIVO = '—';

function plural(cantidad: number, singular: string, plural: string) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function resumirElementos(recurso: Recurso): ResumenElementos {
  const contenidos = recurso.contenidos ?? [];
  const cantidadElementos = contenidos.length;

  const cantidadArchivos = contenidos.filter(
    (contenido) =>
      contenido.tipo === 'ARCHIVO' &&
      (contenido.versiones?.length ?? 0) > 0,
  ).length;

  const cantidadEnlaces = contenidos.filter(
    (contenido) => contenido.tipo === 'ENLACE',
  ).length;

  const esCarpeta = cantidadElementos > 1;

  const contenidoUnico =
    cantidadElementos === 1 ? contenidos[0] : undefined;

  const versionPrincipal =
    !esCarpeta && contenidoUnico?.tipo === 'ARCHIVO'
      ? (contenidoUnico.versiones?.[0] ?? undefined)
      : undefined;

  const variante: VarianteElemento =
    cantidadElementos === 0
      ? 'vacio'
      : esCarpeta
        ? 'carpeta'
        : contenidoUnico?.tipo === 'ENLACE'
          ? 'enlace'
          : 'archivo';

  const etiqueta =
    variante === 'carpeta'
      ? String(cantidadElementos)
      : variante === 'enlace'
        ? 'URL'
        : variante === 'vacio'
          ? SIN_ARCHIVO
          : (versionPrincipal?.extension ?? '')
                .replace('.', '')
                .toUpperCase() || SIN_ARCHIVO;

  const composicion =
    esCarpeta && cantidadArchivos + cantidadEnlaces > 0
      ? [
          cantidadArchivos > 0
            ? plural(cantidadArchivos, 'archivo', 'archivos')
            : '',
          cantidadEnlaces > 0
            ? plural(cantidadEnlaces, 'enlace', 'enlaces')
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : undefined;

  return {
    cantidadElementos,
    cantidadArchivos,
    cantidadEnlaces,
    esCarpeta,
    variante,
    contenidoUnico,
    versionPrincipal,
    etiqueta,
    composicion,
  };
}

export function textoVersion(version?: Version) {
  if (!version) return undefined;
  return `v${version.numeroVersion}`;
}

export function textoElementos(cantidad: number) {
  return plural(cantidad, 'elemento', 'elementos');
}

export function tonoIcono(variante: VarianteElemento, version?: Version) {
  if (variante === 'carpeta') return 'carpeta';
  if (variante === 'enlace') return 'enlace';
  if (variante === 'vacio') return 'vacio';

  const extension = (version?.extension ?? '')
    .replace('.', '')
    .toLowerCase();

  return extension === 'pdf' ||
    extension === 'doc' ||
    extension === 'docx'
    ? extension
    : 'otro';
}