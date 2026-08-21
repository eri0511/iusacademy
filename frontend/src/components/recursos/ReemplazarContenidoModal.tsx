import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import AulaModal from '../aula/AulaModal';
import type { RecursoContenido, ReemplazarContenidoDatos } from '../../types/recursos/recursos.types';
import { obtenerVersionVigente } from '../../types/recursos/recursos.types';

type Props = {
  abierto: boolean;
  contenido: RecursoContenido | null;
  bloqueado?: boolean;
  onCerrar: () => void;
  onGuardar: (datos: ReemplazarContenidoDatos) => void;
};

export default function ReemplazarContenidoModal({
  abierto,
  contenido,
  bloqueado = false,
  onCerrar,
  onGuardar,
}: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    if (abierto) {
      setArchivo(null);
      setMotivo('');
      setFecha('');
    }
  }, [abierto, contenido?.id]);

  if (!contenido) return null;
  const vigente = obtenerVersionVigente(contenido);

  return (
    <AulaModal
      abierto={abierto}
      titulo="Reemplazar archivo"
      etiqueta={contenido.titulo}
      descripcion={vigente ? `Versión actual: v${vigente.numeroVersion} · ${vigente.archivo.nombreOriginal}` : undefined}
      icono={RefreshCw}
      ancho="compacto"
      bloqueado={bloqueado}
      onCerrar={onCerrar}
      footer={
        <div className="reemplazar-footer">
          <button type="button" className="secondary" disabled={bloqueado} onClick={onCerrar}>Cancelar</button>
          <button
            type="button"
            disabled={bloqueado || !archivo}
            onClick={() => archivo && onGuardar({ archivo, motivoActualizacion: motivo, fechaDocumento: fecha })}
          >
            Crear nueva versión
          </button>
        </div>
      }
    >
      <div className="reemplazar-form">
        <label>
          <span>Nuevo archivo</span>
          <input
            type="file"
            disabled={bloqueado}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          <span>Motivo de actualización</span>
          <textarea
            rows={3}
            value={motivo}
            disabled={bloqueado}
            placeholder="Ej. Modificación normativa 2026"
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>
        <label>
          <span>Fecha del documento</span>
          <input type="date" value={fecha} disabled={bloqueado} onChange={(e) => setFecha(e.target.value)} />
        </label>
      </div>
      <style>{styles}</style>
    </AulaModal>
  );
}

const styles = `
  .reemplazar-form { display:grid; gap:12px; }
  .reemplazar-form label { display:grid; gap:6px; }
  .reemplazar-form span { font-size:10px; font-weight:850; color:var(--app-text-secondary); }
  .reemplazar-form input,.reemplazar-form textarea { box-sizing:border-box; width:100%; padding:10px 11px; border:1px solid var(--app-border-strong); border-radius:11px; color:var(--app-text); background:var(--app-surface); font:inherit; font-size:11px; }
  .reemplazar-footer { width:100%; display:flex; justify-content:flex-end; gap:7px; }
  .reemplazar-footer button { min-height:38px; padding:8px 12px; border:none; border-radius:10px; color:#fff; background:linear-gradient(135deg,var(--app-accent),var(--app-accent-hover)); font:inherit; font-size:9px; font-weight:850; cursor:pointer; }
  .reemplazar-footer button.secondary { border:1px solid var(--app-border-strong); color:var(--app-accent-dark); background:var(--app-surface); }
`;
