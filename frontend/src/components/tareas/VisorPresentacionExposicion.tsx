import { ChevronLeft, ChevronRight, ExternalLink, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerArchivoExposicionBlob } from '../../services/tareas/tareas-exposiciones.service';
import type { ArchivoExposicion } from '../../types/tareas/exposiciones.types';

type Props = {
  archivo: ArchivoExposicion | null;
  diapositiva: number;
  puedeControlar?: boolean;
  onCambiarDiapositiva?: (diapositiva: number) => void | Promise<void>;
};

export default function VisorPresentacionExposicion({
  archivo,
  diapositiva,
  puedeControlar = false,
  onCambiarDiapositiva,
}: Props) {
  const { accessToken } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const esPdf = useMemo(() => {
    if (!archivo) return false;
    return archivo.mimeType === 'application/pdf' || archivo.extension.toLowerCase() === 'pdf';
  }, [archivo]);

  useEffect(() => {
    let urlCreada: string | null = null;
    let cancelado = false;

    const cargar = async () => {
      setBlobUrl(null);
      setError(null);

      if (!archivo || !esPdf || !accessToken) return;

      try {
        setCargando(true);
        const blob = await obtenerArchivoExposicionBlob(accessToken, archivo.id);
        if (cancelado) return;
        urlCreada = URL.createObjectURL(blob);
        setBlobUrl(urlCreada);
      } catch (causa) {
        if (!cancelado) {
          setError(causa instanceof Error ? causa.message : 'No se pudo cargar la presentación.');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    void cargar();

    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [accessToken, archivo?.id, esPdf]);


  useEffect(() => {
    const alCambiarPantallaCompleta = () => {
      setPantallaCompleta(document.fullscreenElement === rootRef.current);
    };

    document.addEventListener('fullscreenchange', alCambiarPantallaCompleta);
    return () => document.removeEventListener('fullscreenchange', alCambiarPantallaCompleta);
  }, []);

  const alternarPantallaCompleta = async () => {
    try {
      if (document.fullscreenElement === rootRef.current) {
        await document.exitFullscreen();
        return;
      }

      await rootRef.current?.requestFullscreen();
    } catch {
      return;
    }
  };

  if (!archivo) {
    return (
      <div className="vpe-empty">
        <FileText size={34} />
        <strong>Sin presentación disponible</strong>
        <span>El material aparecerá aquí cuando se inicie el turno.</span>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="vpe-root" ref={rootRef}>
      <div className="vpe-toolbar">
        <div className="vpe-file">
          <FileText size={16} />
          <span>{archivo.nombreOriginal}</span>
        </div>

        <div className="vpe-actions">
          {puedeControlar && (
            <>
              <button
                type="button"
                aria-label="Diapositiva anterior"
                disabled={diapositiva <= 1}
                onClick={() => onCambiarDiapositiva?.(Math.max(1, diapositiva - 1))}
              >
                <ChevronLeft size={17} />
              </button>

              <span>Diapositiva {diapositiva}</span>

              <button
                type="button"
                aria-label="Siguiente diapositiva"
                onClick={() => onCambiarDiapositiva?.(diapositiva + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </>
          )}

          {!puedeControlar && <span>Diapositiva {diapositiva}</span>}


          <button
            type="button"
            className="vpe-fullscreen"
            aria-label={pantallaCompleta ? 'Salir de pantalla completa' : 'Ver presentación en pantalla completa'}
            title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
            onClick={() => void alternarPantallaCompleta()}
          >
            {pantallaCompleta ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {archivo.urlPublica && (
            <a href={archivo.urlPublica} target="_blank" rel="noreferrer" title="Abrir archivo original">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      <div className="vpe-stage">
        {cargando && <div className="vpe-state">Cargando presentación...</div>}

        {!cargando && error && <div className="vpe-state vpe-state--error">{error}</div>}

        {!cargando && !error && esPdf && blobUrl && (
          <iframe
            ref={iframeRef}
            key={archivo.id}
            title={`Presentación ${archivo.nombreOriginal}`}
            src={`${blobUrl}#page=${diapositiva}&zoom=page-width&toolbar=0&navpanes=0&scrollbar=1`}
          />
        )}

        {!cargando && !error && !esPdf && (
          <div className="vpe-state">
            <FileText size={38} />
            <strong>{archivo.extension.toUpperCase()} recibido</strong>
            <span>
              El archivo original está guardado correctamente. Para visualizar PPT/PPTX y diseños de Canva dentro del aula,
              IusAcademy utilizará una versión PDF normalizada.
            </span>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.vpe-root{display:grid;gap:10px}
.vpe-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--app-border-soft);border-radius:14px;background:var(--app-surface-alt)}
.vpe-file{display:flex;align-items:center;gap:8px;min-width:0;color:var(--app-text-secondary);font-size:12px;font-weight:800}
.vpe-file span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vpe-file svg{color:var(--app-accent-dark);flex:0 0 auto}
.vpe-actions{display:flex;align-items:center;gap:7px;flex:0 0 auto}
.vpe-actions>span{padding:6px 9px;border-radius:999px;background:var(--app-accent-soft);color:var(--app-accent-dark);font-size:10px;font-weight:900}
.vpe-actions button,.vpe-actions a{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--app-border);border-radius:10px;background:#fff;color:var(--app-text-secondary);cursor:pointer;text-decoration:none}
.vpe-actions button:hover:not(:disabled),.vpe-actions a:hover{border-color:var(--app-accent);color:var(--app-accent-dark);background:var(--app-accent-soft)}
.vpe-actions button:disabled{opacity:.35;cursor:not-allowed}
.vpe-stage{position:relative;min-height:520px;overflow:hidden;border:1px solid var(--app-border);border-radius:18px;background:#111827}
.vpe-stage iframe{display:block;width:100%;height:66vh;min-height:520px;border:0;background:#fff}
.vpe-state,.vpe-empty{min-height:340px;display:grid;place-items:center;align-content:center;gap:8px;padding:30px;text-align:center;color:var(--app-text-secondary)}
.vpe-state strong,.vpe-empty strong{color:var(--app-text);font-size:14px}
.vpe-state span,.vpe-empty span{max-width:560px;font-size:12px;line-height:1.55}
.vpe-state svg,.vpe-empty svg{color:var(--app-accent-dark)}
.vpe-state--error{color:#b91c1c}

.vpe-root:fullscreen{width:100vw;height:100vh;padding:14px;background:#0f172a;grid-template-rows:auto 1fr;gap:12px}
.vpe-root:fullscreen .vpe-toolbar{border-color:rgba(255,255,255,.16);background:#fff}
.vpe-root:fullscreen .vpe-stage{min-height:0;height:100%;border-radius:14px;border-color:rgba(255,255,255,.15)}
.vpe-root:fullscreen .vpe-stage iframe{height:100%;min-height:0}
.vpe-fullscreen{color:var(--app-accent-dark)!important}
@media(max-width:700px){.vpe-toolbar{align-items:flex-start;flex-direction:column}.vpe-actions{width:100%;justify-content:flex-end}.vpe-stage,.vpe-stage iframe{min-height:420px;height:58vh}}
`;
