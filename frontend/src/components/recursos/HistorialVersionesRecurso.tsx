import { Clock3, FileText, History } from 'lucide-react';

import AulaModal from '../aula/AulaModal';
import type { RecursoContenido } from '../../types/recursos/recursos.types';

type Props = {
  abierto: boolean;
  contenido: RecursoContenido | null;
  onCerrar: () => void;
};

export default function HistorialVersionesRecurso({ abierto, contenido, onCerrar }: Props) {
  if (!contenido) return null;

  return (
    <AulaModal
      abierto={abierto}
      titulo="Historial de versiones"
      etiqueta={contenido.titulo}
      descripcion="Las versiones anteriores se conservan para trazabilidad y futuros quizzes."
      icono={History}
      ancho="mediano"
      onCerrar={onCerrar}
    >
      <div className="historial-versiones">
        {contenido.versiones.map((version) => (
          <article key={version.id} className={version.esVigente ? 'vigente' : ''}>
            <span className="historial-versiones__icon"><FileText size={18} /></span>
            <div>
              <div className="historial-versiones__top">
                <strong>Versión {version.numeroVersion}</strong>
                <span>{version.esVigente ? 'VIGENTE' : 'REEMPLAZADA'}</span>
              </div>
              <p>{version.archivo.nombreOriginal}</p>
              <small><Clock3 size={11} /> {new Date(version.creadoEn).toLocaleString()}</small>
              {version.motivoActualizacion && <em>{version.motivoActualizacion}</em>}
            </div>
          </article>
        ))}
      </div>
      <style>{styles}</style>
    </AulaModal>
  );
}

const styles = `
  .historial-versiones { display:grid; gap:8px; }
  .historial-versiones article { display:grid; grid-template-columns:40px minmax(0,1fr); gap:10px; padding:11px; border:1px solid var(--app-border); border-radius:13px; background:var(--app-surface-alt); }
  .historial-versiones article.vigente { border-color:var(--app-accent); background:var(--app-accent-soft); }
  .historial-versiones__icon { width:40px; height:40px; display:grid; place-items:center; border-radius:11px; color:var(--app-accent-dark); background:var(--app-surface); }
  .historial-versiones__top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .historial-versiones__top strong { font-size:10px; }
  .historial-versiones__top span { font-size:7px; font-weight:900; color:var(--app-accent-dark); }
  .historial-versiones p { margin:3px 0; font-size:9px; color:var(--app-text-secondary); }
  .historial-versiones small { display:flex; align-items:center; gap:4px; color:var(--app-text-muted); font-size:8px; }
  .historial-versiones em { display:block; margin-top:5px; color:var(--app-text-soft); font-size:8px; font-style:normal; }
`;
