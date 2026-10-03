import type { Categoria } from './biblioteca.types';

export type GrupoBibliotecaId = 'legislacion' | 'doctrina' | 'jurisprudencia' | 'material-academico' | 'modelos-formatos' | 'revistas-articulos';
export type GrupoBiblioteca = {
  id: GrupoBibliotecaId;
  nombre: string;
  descripcion: string;
  categorias: Categoria[];
  tono: string;
};

export const gruposBiblioteca: GrupoBiblioteca[] = [
  { id: 'legislacion', nombre: 'Legislación', descripcion: 'Leyes, códigos, decretos, reglamentos y normas vigentes.', categorias: ['CODIGO', 'LEY'], tono: 'orange' },
  { id: 'doctrina', nombre: 'Doctrina', descripcion: 'Libros, manuales y obras de autores especializados.', categorias: ['DOCTRINA'], tono: 'purple' },
  { id: 'jurisprudencia', nombre: 'Jurisprudencia', descripcion: 'Sentencias, autos y resoluciones de tribunales.', categorias: ['JURISPRUDENCIA', 'SENTENCIA'], tono: 'blue' },
  { id: 'material-academico', nombre: 'Material académico', descripcion: 'Guías, apuntes, casos prácticos y materiales de apoyo.', categorias: ['GUIA', 'CASO_PRACTICO'], tono: 'green' },
  { id: 'modelos-formatos', nombre: 'Modelos y formatos', descripcion: 'Demandas, contratos, memoriales y formatos descargables.', categorias: ['MEMORIAL', 'CONTRATO', 'DEMANDA'], tono: 'yellow' },
  { id: 'revistas-articulos', nombre: 'Revistas y artículos', descripcion: 'Investigaciones, artículos científicos y publicaciones académicas.', categorias: ['OTRO'], tono: 'pink' },
];

export function grupoPorId(id: string | null) { return gruposBiblioteca.find((g) => g.id === id); }
export function grupoDeCategoria(categoria: Categoria) { return gruposBiblioteca.find((g) => g.categorias.includes(categoria)); }
