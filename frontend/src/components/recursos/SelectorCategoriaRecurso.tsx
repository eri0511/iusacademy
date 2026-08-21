import type {
  CSSProperties,
} from 'react';

import {
  ArrowRight,
  BookOpenText,
  Check,
  FileBadge2,
  FileQuestion,
  Gavel,
  GraduationCap,
  Landmark,
  LibraryBig,
  Scale,
  Video,
} from 'lucide-react';

import type {
  LucideIcon,
} from 'lucide-react';

import type {
  CategoriaRecursoCurso,
} from '../../types/recursos/recursos.types';

import {
  CATEGORIAS_RECURSO,
  obtenerCategoriaRecurso,
} from '../../types/recursos/recursos.types';

const iconos: Record<CategoriaRecursoCurso, LucideIcon> = {
  NORMATIVA: Scale,
  JURISPRUDENCIA: Landmark,
  DOCTRINA: LibraryBig,
  GUIA_ACADEMICA: GraduationCap,
  CASO_PRACTICO: FileQuestion,
  MODELO_JURIDICO: Gavel,
  MATERIAL_AUDIOVISUAL: Video,
  MATERIAL_COMPLEMENTARIO: BookOpenText,
  OTRO: FileBadge2,
};

type Props = {
  valor: CategoriaRecursoCurso;
  modo?: 'compacto' | 'catalogo';
  deshabilitado?: boolean;
  onCambiar: (categoria: CategoriaRecursoCurso) => void;
  onAbrirCatalogo?: () => void;
};

export default function SelectorCategoriaRecurso({
  valor,
  modo = 'compacto',
  deshabilitado = false,
  onCambiar,
  onAbrirCatalogo,
}: Props) {
  const seleccionada = obtenerCategoriaRecurso(valor);
  const IconoSeleccionado = iconos[valor];

  if (modo === 'catalogo') {
    return (
      <div className="selector-recurso-modal">
        <div className="selector-recurso-modal__introduccion">
          <strong>¿Qué tipo de recurso vas a crear?</strong>
          <span>
            Selecciona la categoría que mejor describe el material. Cada tipo tendrá un color propio en el aula.
          </span>
        </div>

        <div className="selector-recurso-modal__grid">
          {CATEGORIAS_RECURSO.map((opcion) => {
            const Icono = iconos[opcion.id];
            const activo = opcion.id === valor;

            return (
              <button
                key={opcion.id}
                type="button"
                disabled={deshabilitado}
                className={`selector-recurso-modal__opcion ${activo ? 'activo' : ''}`}
                style={{
                  '--categoria-color': opcion.color,
                  '--categoria-fondo': opcion.fondo,
                } as CSSProperties}
                onClick={() => onCambiar(opcion.id)}
              >
                <span className="selector-recurso-modal__opcion-icono">
                  <Icono size={22} />
                </span>

                <span className="selector-recurso-modal__opcion-contenido">
                  <strong>{opcion.etiqueta}</strong>
                  <small>{opcion.descripcion}</small>
                </span>

                {activo && (
                  <span className="selector-recurso-modal__seleccionada">
                    <Check size={16} strokeWidth={2.8} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <>
      <div className="selector-recurso-compacto">
        <div className="selector-recurso-compacto__etiqueta">Tipo de recurso</div>

        <button
          type="button"
          disabled={deshabilitado}
          className="selector-recurso-compacto__boton"
          style={{
            '--categoria-color': seleccionada.color,
            '--categoria-fondo': seleccionada.fondo,
          } as CSSProperties}
          onClick={onAbrirCatalogo}
        >
          <span className="selector-recurso-compacto__icono">
            <IconoSeleccionado size={21} />
          </span>

          <span className="selector-recurso-compacto__texto">
            <strong>{seleccionada.etiqueta}</strong>
            <small>{seleccionada.descripcion}</small>
          </span>

          <span className="selector-recurso-compacto__accion">
            Cambiar
            <ArrowRight size={15} />
          </span>
        </button>
      </div>

      <style>{styles}</style>
    </>
  );
}

const styles = `
  .selector-recurso-compacto {
    display: grid;
    gap: 6px;
  }

  .selector-recurso-compacto__etiqueta {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 850;
  }

  .selector-recurso-compacto__boton {
    width: 100%;
    min-height: 72px;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 11px 13px;
    border: 1px solid var(--app-border-strong);
    border-radius: 13px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color .16s ease, background .16s ease, box-shadow .16s ease;
  }

  .selector-recurso-compacto__boton:hover:not(:disabled) {
    border-color: var(--categoria-color);
    background: var(--categoria-fondo);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--categoria-color) 10%, transparent);
  }

  .selector-recurso-compacto__boton:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .selector-recurso-compacto__icono {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--categoria-color) 28%, var(--app-border));
    border-radius: 12px;
    color: var(--categoria-color);
    background: var(--categoria-fondo);
  }

  .selector-recurso-compacto__texto {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .selector-recurso-compacto__texto strong {
    color: var(--app-text);
    font-size: 13px;
    font-weight: 850;
  }

  .selector-recurso-compacto__texto small {
    color: var(--app-text-muted);
    font-size: 10.5px;
    line-height: 1.4;
  }

  .selector-recurso-compacto__accion {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--categoria-color);
    font-size: 10.5px;
    font-weight: 850;
    white-space: nowrap;
  }

  .selector-recurso-modal {
    width: 100%;
    display: grid;
    gap: 12px;
  }

  .selector-recurso-modal__introduccion {
    display: grid;
    gap: 4px;
    padding: 1px 2px 2px;
  }

  .selector-recurso-modal__introduccion strong {
    color: var(--app-text);
    font-size: 13.5px;
    font-weight: 850;
  }

  .selector-recurso-modal__introduccion span {
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .selector-recurso-modal__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .selector-recurso-modal__opcion {
    position: relative;
    min-height: 132px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    align-content: start;
    gap: 9px;
    padding: 13px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color .16s ease, background .16s ease, transform .16s ease, box-shadow .16s ease;
  }

  .selector-recurso-modal__opcion:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--categoria-color) 55%, var(--app-border));
    background: color-mix(in srgb, var(--categoria-fondo) 75%, var(--app-surface));
    box-shadow: 0 8px 22px rgba(15, 23, 42, .045);
  }

  .selector-recurso-modal__opcion.activo {
    border-color: var(--categoria-color);
    background: var(--categoria-fondo);
    box-shadow: inset 0 0 0 1px var(--categoria-color);
  }

  .selector-recurso-modal__opcion-icono {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--categoria-color) 28%, var(--app-border));
    border-radius: 12px;
    color: var(--categoria-color);
    background: var(--app-surface);
  }

  .selector-recurso-modal__opcion-contenido {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 5px;
    padding-right: 25px;
  }

  .selector-recurso-modal__opcion-contenido strong {
    color: var(--app-text);
    font-size: 12.5px;
    font-weight: 850;
  }

  .selector-recurso-modal__opcion-contenido small {
    color: var(--app-text-secondary);
    font-size: 10px;
    line-height: 1.42;
  }

  .selector-recurso-modal__seleccionada {
    position: absolute;
    top: 11px;
    right: 11px;
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: var(--categoria-color);
    box-shadow: 0 5px 12px color-mix(in srgb, var(--categoria-color) 20%, transparent);
  }

  @media (max-width: 760px) {
    .selector-recurso-modal__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .selector-recurso-modal__grid {
      grid-template-columns: 1fr;
    }

    .selector-recurso-compacto__boton {
      grid-template-columns: 40px minmax(0, 1fr);
    }

    .selector-recurso-compacto__accion {
      grid-column: 1 / -1;
      justify-content: flex-end;
    }
  }
`;
