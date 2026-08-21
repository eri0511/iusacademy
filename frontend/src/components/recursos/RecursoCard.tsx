import type { CSSProperties } from 'react';

import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Files,
  Link2,
} from 'lucide-react';

import AulaDropdown, {
  type OpcionAulaDropdown,
} from '../aula/AulaDropdown';

import type {
  RecursoContenido,
  RecursoCurso,
} from '../../types/recursos/recursos.types';

import {
  obtenerCategoriaRecurso,
  obtenerVersionVigente,
} from '../../types/recursos/recursos.types';

type Props = {
  recurso: RecursoCurso;
  esDocente: boolean;
  procesando?: boolean;
  onAbrirMateriales: () => void;
  onAbrirArchivo: (contenido: RecursoContenido) => void;
  onDescargarArchivo: (contenido: RecursoContenido) => void;
  onAbrirEnlace: (contenido: RecursoContenido) => void;
  onEditar?: () => void;
  onVisibilidad?: () => void;
  onArchivar?: () => void;
};

function formatearBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  const valor = bytes / 1024 ** indice;
  return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

export default function RecursoCard({
  recurso,
  esDocente,
  procesando = false,
  onAbrirMateriales,
  onAbrirArchivo,
  onDescargarArchivo,
  onAbrirEnlace,
  onEditar,
  onVisibilidad,
  onArchivar,
}: Props) {
  const categoria = obtenerCategoriaRecurso(recurso.categoria);
  const contenidos = recurso.contenidos.filter((item) => item.estaActivo);
  const archivos = contenidos.filter((item) => item.tipo === 'ARCHIVO');
  const enlaces = contenidos.filter((item) => item.tipo === 'ENLACE');
  const datasets = archivos.filter((item) => item.disponibleParaQuiz).length;
  const unico = contenidos.length === 1 ? contenidos[0] : null;
  const vigenteUnico = unico?.tipo === 'ARCHIVO' ? obtenerVersionVigente(unico) : null;

  const Icono = contenidos.length > 1
    ? Files
    : unico?.tipo === 'ENLACE'
      ? Link2
      : FileText;

  const opciones: OpcionAulaDropdown[] = esDocente
    ? [
        {
          texto: 'Editar información',
          onClick: () => onEditar?.(),
        },
        {
          texto: 'Administrar materiales',
          onClick: onAbrirMateriales,
        },
        {
          texto: recurso.visibleParaEstudiantes
            ? 'Ocultar a estudiantes'
            : 'Mostrar a estudiantes',
          onClick: () => onVisibilidad?.(),
        },
        {
          texto: 'Archivar recurso',
          peligro: true,
          separadorAntes: true,
          onClick: () => onArchivar?.(),
        },
      ]
    : [];

  return (
    <article
      className="recurso-card"
      style={{
        '--recurso-color': categoria.color,
        '--recurso-fondo': categoria.fondo,
      } as CSSProperties}
    >
      <div className="recurso-card__icono">
        <Icono size={23} />
      </div>

      <div className="recurso-card__contenido">
        <div className="recurso-card__cabecera">
          <div className="recurso-card__titulos">
            <div className="recurso-card__badges-superiores">
              <span className="recurso-card__categoria">{categoria.etiqueta}</span>
              <span className="recurso-card__alcance">
                {recurso.alcance === 'CURSO'
                  ? 'Recurso general'
                  : recurso.hito
                    ? `${recurso.hito.codigo} · ${recurso.hito.nombre}`
                    : 'Recurso de hito'}
              </span>
            </div>

            <h3>{recurso.titulo}</h3>
          </div>

          {esDocente && (
            <AulaDropdown
              opciones={opciones}
              deshabilitado={procesando}
              ariaLabel={`Opciones de ${recurso.titulo}`}
            />
          )}
        </div>

        {recurso.descripcion && (
          <p className="recurso-card__descripcion">{recurso.descripcion}</p>
        )}

        <div className="recurso-card__meta">
          {contenidos.length === 0 && <span>Sin materiales</span>}
          {archivos.length > 0 && <span>{archivos.length} archivo{archivos.length === 1 ? '' : 's'}</span>}
          {enlaces.length > 0 && <span>{enlaces.length} enlace{enlaces.length === 1 ? '' : 's'}</span>}
          {vigenteUnico && (
            <>
              <span>{vigenteUnico.archivo.extension.toUpperCase()}</span>
              <span>{formatearBytes(vigenteUnico.archivo.tamanioBytes)}</span>
              <span>v{vigenteUnico.numeroVersion}</span>
            </>
          )}
        </div>

        {esDocente && (
          <div className="recurso-card__estado">
            <span className={recurso.visibleParaEstudiantes ? 'visible' : 'oculto'}>
              {recurso.visibleParaEstudiantes ? <Eye size={13} /> : <EyeOff size={13} />}
              {recurso.visibleParaEstudiantes ? 'Visible para estudiantes' : 'Oculto para estudiantes'}
            </span>
            {datasets > 0 && <span className="quiz">{datasets} fuente{datasets === 1 ? '' : 's'} para Quiz</span>}
          </div>
        )}

        <div className="recurso-card__acciones">
          {contenidos.length === 0 && esDocente && (
            <button type="button" className="principal-suave" onClick={onAbrirMateriales}>
              <Files size={15} />
              Agregar materiales
            </button>
          )}

          {contenidos.length > 1 && (
            <button type="button" className="principal-suave" onClick={onAbrirMateriales}>
              <Files size={15} />
              Ver materiales ({contenidos.length})
            </button>
          )}

          {unico?.tipo === 'ARCHIVO' && vigenteUnico && (
            <>
              <button type="button" className="secundario" onClick={() => onAbrirArchivo(unico)}>
                <Eye size={15} />
                Ver archivo
              </button>
              {vigenteUnico.archivo.permiteDescarga && (
                <button type="button" className="secundario" onClick={() => onDescargarArchivo(unico)}>
                  <Download size={15} />
                  Descargar
                </button>
              )}
              {esDocente && (
                <button type="button" className="texto" onClick={onAbrirMateriales}>
                  Administrar
                </button>
              )}
            </>
          )}

          {unico?.tipo === 'ENLACE' && (
            <>
              <button type="button" className="secundario" onClick={() => onAbrirEnlace(unico)}>
                <ExternalLink size={15} />
                Abrir enlace
              </button>
              {esDocente && (
                <button type="button" className="texto" onClick={onAbrirMateriales}>
                  Administrar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{styles}</style>
    </article>
  );
}

const styles = `
  .recurso-card {
    min-width: 0;
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 14px;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .recurso-card__icono {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--recurso-color) 20%, var(--app-border));
    border-radius: 15px;
    color: var(--recurso-color);
    background: var(--recurso-fondo);
  }

  .recurso-card__contenido { min-width: 0; }
  .recurso-card__cabecera { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .recurso-card__titulos { min-width:0; }
  .recurso-card__badges-superiores { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
  .recurso-card__categoria,.recurso-card__alcance { min-height:22px; display:inline-flex; align-items:center; padding:3px 8px; border-radius:999px; font-size:8.5px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
  .recurso-card__categoria { color:var(--recurso-color); background:var(--recurso-fondo); }
  .recurso-card__alcance { color:var(--app-text-muted); background:var(--app-surface-alt); }
  .recurso-card h3 { margin:6px 0 0; color:var(--app-text); font-size:17px; line-height:1.25; }
  .recurso-card__descripcion { margin:7px 0 0; color:var(--app-text-soft); font-size:11px; line-height:1.5; }
  .recurso-card__meta,.recurso-card__estado,.recurso-card__acciones { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
  .recurso-card__meta { margin-top:9px; color:var(--app-text-muted); font-size:9px; }
  .recurso-card__meta span:not(:last-child)::after { content:'·'; margin-left:7px; }
  .recurso-card__estado { margin-top:9px; }
  .recurso-card__estado span { min-height:25px; display:inline-flex; align-items:center; gap:5px; padding:4px 8px; border-radius:999px; font-size:8px; font-weight:850; }
  .recurso-card__estado .visible { color:var(--app-success); background:var(--app-success-bg); }
  .recurso-card__estado .oculto { color:var(--app-text-soft); background:var(--app-surface-alt); }
  .recurso-card__estado .quiz { color:var(--recurso-color); background:var(--recurso-fondo); }
  .recurso-card__acciones { margin-top:12px; }
  .recurso-card__acciones button { min-height:34px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:7px 10px; border-radius:10px; font-family:inherit; font-size:9.5px; font-weight:800; cursor:pointer; }
  .recurso-card__acciones .secundario,.recurso-card__acciones .principal-suave { border:1px solid var(--app-border-strong); color:var(--app-text-secondary); background:var(--app-surface); }
  .recurso-card__acciones .principal-suave { color:var(--recurso-color); border-color:color-mix(in srgb,var(--recurso-color) 35%,var(--app-border)); background:var(--recurso-fondo); }
  .recurso-card__acciones .texto { border:0; color:var(--recurso-color); background:transparent; }
  @media(max-width:620px){ .recurso-card{grid-template-columns:1fr;} }
`;
