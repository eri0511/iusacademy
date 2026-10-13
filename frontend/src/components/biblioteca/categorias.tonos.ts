import type { Categoria } from '../../types/biblioteca/biblioteca.types';

/* =========================================================
   PALETA DE TONOS POR CATEGORÍA (ÚNICA FUENTE DE VERDAD)
   La usan las cards de BibliotecaCategorias y las 6
   categorías destacadas de BibliotecaCatalogo.
   ========================================================= */

export type CategoriaTone =
  | 'orange'
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink'
  | 'teal'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'slate';

export const TONO_POR_CATEGORIA: Record<Categoria, CategoriaTone> = {
  MEMORIAL: 'orange',
  CONTRATO: 'purple',
  DEMANDA: 'blue',
  JURISPRUDENCIA: 'green',
  CODIGO: 'yellow',
  LEY: 'pink',
  SENTENCIA: 'teal',
  DOCTRINA: 'indigo',
  GUIA: 'amber',
  CASO_PRACTICO: 'rose',
  OTRO: 'slate',
};

/* Variables que consume cada card:
   --category-color  → icono, contador, flecha y detalles
   --category-soft   → fondo de la card                       */
export const TONOS_CATEGORIA_CSS = `
  .tone-orange {
    --category-color: #ea6d22;
    --category-soft: #fff0e5;
  }

  .tone-purple {
    --category-color: #7c3aed;
    --category-soft: #f2ebff;
  }

  .tone-blue {
    --category-color: #2f80ed;
    --category-soft: #e8f2ff;
  }

  .tone-green {
    --category-color: #18a86b;
    --category-soft: #e9f9f0;
  }

  .tone-yellow {
    --category-color: #d97706;
    --category-soft: #fff6dc;
  }

  .tone-pink {
    --category-color: #e91e63;
    --category-soft: #ffedf3;
  }

  .tone-teal {
    --category-color: #0f9f9a;
    --category-soft: #e8f8f7;
  }

  .tone-indigo {
    --category-color: #6366f1;
    --category-soft: #eeefff;
  }

  .tone-amber {
    --category-color: #d88a00;
    --category-soft: #fff4d9;
  }

  .tone-rose {
    --category-color: #e5486d;
    --category-soft: #ffedf1;
  }

  .tone-slate {
    --category-color: #64748b;
    --category-soft: #f1f5f9;
  }
`;