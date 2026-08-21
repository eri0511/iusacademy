import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  FileCheck2,
  FileWarning,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type EstadoReporte =
  | 'GENERANDO'
  | 'VALIDO'
  | 'ANULADO'
  | 'ERROR';

type ReporteVerificado = {
  valido?: boolean;
  codigo: string;
  estado: EstadoReporte;
  tipo?: string;
  titulo: string;
  formato: string;
  cantidadRegistros?: number;
  generadoEn: string;
  finalizadoEn?: string | null;
  expiraEn?: string | null;
  anuladoEn?: string | null;
  motivoAnulacion?: string | null;
  generadoPor?:
    | string
    | {
        nombres?: string;
        apellidoPaterno?: string;
        nombreCompleto?: string;
      };
  institucion?: string;
};

type EstadoVista =
  | { tipo: 'cargando' }
  | { tipo: 'encontrado'; reporte: ReporteVerificado }
  | { tipo: 'no-encontrado' }
  | { tipo: 'error'; mensaje: string };

const API_URL =
  (import.meta.env.VITE_API_URL
  ?? 'http://localhost:3000').replace(/\/$/, '');

function formatearFecha(fecha?: string | null): string {
  if (!fecha) {
    return 'No registrada';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(valor);
}

function obtenerGeneradoPor(
  generadoPor: ReporteVerificado['generadoPor'],
): string {
  if (!generadoPor) {
    return 'No registrado';
  }

  if (typeof generadoPor === 'string') {
    return generadoPor;
  }

  return generadoPor.nombreCompleto
    || [
      generadoPor.nombres,
      generadoPor.apellidoPaterno,
    ].filter(Boolean).join(' ')
    || 'No registrado';
}

function configuracionEstado(estado: EstadoReporte) {
  switch (estado) {
    case 'VALIDO':
      return {
        Icono: BadgeCheck,
        titulo: 'Reporte válido',
        descripcion:
          'Este documento fue emitido por IusAcademy y su registro es auténtico.',
        clase: 'valido',
      };
    case 'ANULADO':
      return {
        Icono: FileWarning,
        titulo: 'Reporte anulado',
        descripcion:
          'Este documento existe, pero fue anulado y ya no debe considerarse vigente.',
        clase: 'anulado',
      };
    case 'ERROR':
      return {
        Icono: AlertCircle,
        titulo: 'Reporte con error',
        descripcion:
          'La emisión del documento no pudo completarse correctamente.',
        clase: 'error',
      };
    default:
      return {
        Icono: Clock3,
        titulo: 'Reporte en generación',
        descripcion:
          'El documento todavía está siendo procesado. Intenta nuevamente en unos instantes.',
        clase: 'generando',
      };
  }
}

function VerificarReporte() {
  const {
    codigo = '',
  } = useParams<{ codigo: string }>();

  const [estadoVista, setEstadoVista] =
    useState<EstadoVista>({ tipo: 'cargando' });

  useEffect(() => {
    const controlador = new AbortController();

    async function verificar() {
      if (!codigo.trim()) {
        setEstadoVista({ tipo: 'no-encontrado' });
        return;
      }

      setEstadoVista({ tipo: 'cargando' });

      try {
        const respuesta = await fetch(
          `${API_URL}/reportes/verificar/${encodeURIComponent(codigo)}`,
          {
            signal: controlador.signal,
            headers: {
              Accept: 'application/json',
            },
          },
        );

        if (respuesta.status === 404) {
          setEstadoVista({ tipo: 'no-encontrado' });
          return;
        }

        if (!respuesta.ok) {
          throw new Error(
            'No fue posible verificar el reporte en este momento.',
          );
        }

        const datos = await respuesta.json() as ReporteVerificado;
        setEstadoVista({ tipo: 'encontrado', reporte: datos });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setEstadoVista({
          tipo: 'error',
          mensaje:
            error instanceof Error
              ? error.message
              : 'No fue posible conectar con el servidor.',
        });
      }
    }

    void verificar();

    return () => controlador.abort();
  }, [codigo]);

  return (
    <main className="verificarReporte">
      <style>{ESTILOS}</style>

      <div className="verificarReporte__decoracion verificarReporte__decoracion--uno" />
      <div className="verificarReporte__decoracion verificarReporte__decoracion--dos" />

      <section className="verificarReporte__tarjeta">
        <Link
          className="verificarReporte__marca"
          to="/"
        >
          <span className="verificarReporte__logo">IA</span>
          <span>
            <strong>IusAcademy</strong>
            <small>Verificación institucional</small>
          </span>
        </Link>

        <span className="verificarReporte__insignia">
          <ShieldCheck size={14} strokeWidth={2.2} />
          Registro oficial
        </span>

        {estadoVista.tipo === 'cargando' && (
          <div className="verificarReporte__estado">
            <LoaderCircle className="verificarReporte__cargador" />
            <h1>Verificando reporte</h1>
            <p>Estamos consultando el registro oficial del documento.</p>
          </div>
        )}

        {estadoVista.tipo === 'no-encontrado' && (
          <div className="verificarReporte__estado verificarReporte__estado--noEncontrado">
            <span className="verificarReporte__sello">
              <FileWarning />
            </span>
            <h1>Reporte no encontrado</h1>
            <p>
              El código no existe o no pertenece a un reporte emitido por
              IusAcademy.
            </p>
            <code>{codigo || 'Código no proporcionado'}</code>
          </div>
        )}

        {estadoVista.tipo === 'error' && (
          <div className="verificarReporte__estado verificarReporte__estado--errorConexion">
            <span className="verificarReporte__sello">
              <AlertCircle />
            </span>
            <h1>No pudimos verificarlo</h1>
            <p>{estadoVista.mensaje}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              Intentar nuevamente
            </button>
          </div>
        )}

        {estadoVista.tipo === 'encontrado' && (() => {
          const {
            reporte,
          } = estadoVista;
          const presentacion = configuracionEstado(reporte.estado);
          const IconoEstado = presentacion.Icono;

          return (
            <>
              <div className={`verificarReporte__resultado verificarReporte__resultado--${presentacion.clase}`}>
                <span className="verificarReporte__sello">
                  <IconoEstado />
                </span>
                <div>
                  <span className="verificarReporte__etiqueta">
                    Estado de verificación
                  </span>
                  <h1>{presentacion.titulo}</h1>
                  <p>{presentacion.descripcion}</p>
                </div>
              </div>

              <div className="verificarReporte__documento">
                <span className="verificarReporte__documentoIcono">
                  <FileCheck2 />
                </span>
                <div>
                  <span>Documento verificado</span>
                  <h2>{reporte.titulo}</h2>
                  <code>{reporte.codigo}</code>
                </div>
              </div>

              <dl className="verificarReporte__datos">
                <div>
                  <dt>Formato</dt>
                  <dd>{reporte.formato}</dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{reporte.tipo ?? 'Reporte institucional'}</dd>
                </div>
                <div>
                  <dt>Registros incluidos</dt>
                  <dd>{reporte.cantidadRegistros ?? 'No registrado'}</dd>
                </div>
                <div>
                  <dt>Generado por</dt>
                  <dd>{obtenerGeneradoPor(reporte.generadoPor)}</dd>
                </div>
                <div>
                  <dt>Fecha de generación</dt>
                  <dd>{formatearFecha(reporte.generadoEn)}</dd>
                </div>
                <div>
                  <dt>Institución</dt>
                  <dd>{reporte.institucion ?? 'IusAcademy · UNIFRANZ'}</dd>
                </div>
              </dl>

              {reporte.estado === 'ANULADO' && (
                <aside className="verificarReporte__motivo">
                  <strong>Motivo de anulación</strong>
                  <p>{reporte.motivoAnulacion ?? 'No especificado'}</p>
                  <small>
                    Anulado: {formatearFecha(reporte.anuladoEn)}
                  </small>
                </aside>
              )}
            </>
          );
        })()}

        <footer>
          La verificación consulta directamente el registro oficial de
          IusAcademy.
        </footer>
      </section>
    </main>
  );
}

const ESTILOS = `
  * { box-sizing: border-box; }

  .verificarReporte {
    --naranja: var(--app-primary, #ef8b4a);
    --naranja-oscuro: var(--app-primary-dark, #c96931);
    --tinta: var(--app-text, #342a27);
    --suave: var(--app-text-muted, #786d68);
    --superficie: var(--app-surface, #ffffff);
    --borde: var(--app-border, rgba(128, 91, 66, .13));
    width: 100%;
    height: 100vh;
    height: 100dvh;
    padding: 22px 20px;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    color: var(--tinta);
    background:
      radial-gradient(circle at 12% 15%, rgba(241, 139, 75, .16), transparent 28%),
      radial-gradient(circle at 88% 80%, rgba(248, 195, 143, .27), transparent 30%),
      var(--app-background, #fbf3e8);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .verificarReporte__decoracion {
    position: absolute;
    border: 1px solid rgba(239, 139, 74, .18);
    border-radius: 999px;
    pointer-events: none;
  }

  .verificarReporte__decoracion--uno {
    width: 290px;
    height: 290px;
    top: -145px;
    right: -80px;
  }

  .verificarReporte__decoracion--dos {
    width: 210px;
    height: 210px;
    bottom: -110px;
    left: -45px;
  }

  .verificarReporte__tarjeta {
    width: min(100%, 760px);
    position: relative;
    z-index: 1;
    padding: 24px 30px 20px;
    border: 1px solid var(--borde);
    border-radius: 22px;
    background: color-mix(in srgb, var(--superficie) 96%, transparent);
    box-shadow: var(--app-shadow-lg, 0 24px 70px rgba(92, 58, 37, .14));
    backdrop-filter: blur(14px);
  }

  .verificarReporte__tarjeta::before {
    content: "";
    position: absolute;
    top: 0;
    left: 30px;
    right: 30px;
    height: 4px;
    border-radius: 0 0 999px 999px;
    background: linear-gradient(90deg, var(--naranja), #f5bd85 55%, #d9783e);
  }

  .verificarReporte__marca {
    display: inline-flex;
    gap: 11px;
    align-items: center;
    color: inherit;
    text-decoration: none;
  }

  .verificarReporte__insignia {
    position: absolute;
    top: 31px;
    right: 30px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 11px;
    border: 1px solid #f1dac9;
    border-radius: 999px;
    color: #9a5630;
    background: #fff8f2;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: .035em;
    text-transform: uppercase;
  }

  .verificarReporte__insignia span {
    color: #2a7650;
    font-size: 9px;
  }

  .verificarReporte__insignia svg { color: #2a7650; }

  .verificarReporte__logo {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: white;
    background: linear-gradient(145deg, #f3a36f, var(--naranja));
    box-shadow: 0 8px 18px rgba(239, 139, 74, .27);
    font-weight: 800;
  }

  .verificarReporte__marca strong,
  .verificarReporte__marca small {
    display: block;
  }

  .verificarReporte__marca strong { font-size: 17px; }
  .verificarReporte__marca small { margin-top: 2px; color: var(--suave); }

  .verificarReporte__estado {
    min-height: 390px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .verificarReporte__estado h1 { margin: 20px 0 8px; font-size: 29px; }
  .verificarReporte__estado p { max-width: 480px; margin: 0; color: var(--suave); line-height: 1.6; }
  .verificarReporte__estado code { margin-top: 20px; padding: 9px 13px; border-radius: 10px; background: #f7f2ed; }

  .verificarReporte__estado button {
    margin-top: 22px;
    padding: 11px 19px;
    border: 0;
    border-radius: 12px;
    color: white;
    background: var(--naranja);
    cursor: pointer;
    font: inherit;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(239, 139, 74, .22);
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .verificarReporte__estado button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(239, 139, 74, .3);
  }

  .verificarReporte__cargador {
    width: 52px;
    height: 52px;
    color: var(--naranja);
    stroke-width: 1.8;
    animation: verificarGiro .8s linear infinite;
  }

  @keyframes verificarGiro { to { transform: rotate(360deg); } }

  .verificarReporte__resultado {
    margin-top: 22px;
    padding: 17px 20px;
    display: flex;
    align-items: center;
    gap: 18px;
    border: 1px solid;
    border-radius: 20px;
  }

  .verificarReporte__resultado--valido { color: #226342; background: #edf9f2; border-color: #bfe6cf; }
  .verificarReporte__resultado--anulado { color: #8b4d19; background: #fff6e8; border-color: #efd3a5; }
  .verificarReporte__resultado--error,
  .verificarReporte__estado--errorConexion { color: #9d3939; }
  .verificarReporte__resultado--error { background: #fff1f1; border-color: #edc2c2; }
  .verificarReporte__resultado--generando { color: #425b84; background: #eff5ff; border-color: #cbd9ee; }

  .verificarReporte__sello {
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 2px solid currentColor;
    border-radius: 50%;
  }

  .verificarReporte__sello svg {
    width: 25px;
    height: 25px;
    stroke-width: 2.25;
  }

  .verificarReporte__etiqueta { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; opacity: .78; }
  .verificarReporte__resultado h1 { margin: 2px 0 3px; font-size: 25px; }
  .verificarReporte__resultado p { margin: 0; line-height: 1.5; }

  .verificarReporte__documento {
    margin: 18px 0 13px;
    padding: 13px 15px;
    display: flex;
    align-items: center;
    gap: 13px;
    border-bottom: 1px solid #eee5df;
    border-left: 3px solid var(--naranja);
    border-radius: 0 14px 14px 0;
    background: linear-gradient(90deg, rgba(239, 139, 74, .07), transparent 72%);
  }

  .verificarReporte__documentoIcono {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--naranja-oscuro);
    background: rgba(239, 139, 74, .13);
  }

  .verificarReporte__documentoIcono svg { width: 21px; height: 21px; }

  .verificarReporte__documento span { color: var(--naranja-oscuro); font-size: 13px; font-weight: 650; text-transform: uppercase; letter-spacing: .06em; }
  .verificarReporte__documento h2 { margin: 5px 0 7px; font-size: 22px; }
  .verificarReporte__documento code { color: var(--suave); word-break: break-word; }

  .verificarReporte__datos {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px 12px;
  }

  .verificarReporte__datos div {
    min-height: 67px;
    padding: 11px 14px;
    border: 1px solid rgba(180, 139, 111, .08);
    border-radius: 14px;
    background: linear-gradient(135deg, #fbf8f5, #f8f4f1);
    transition: border-color .18s ease, transform .18s ease;
  }

  .verificarReporte__datos div:hover {
    transform: translateY(-1px);
    border-color: rgba(239, 139, 74, .22);
  }
  .verificarReporte__datos dt { margin-bottom: 3px; color: var(--suave); font-size: 12px; }
  .verificarReporte__datos dd { margin: 0; font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }

  .verificarReporte__motivo { margin-top: 18px; padding: 16px; border-left: 4px solid #d98436; border-radius: 12px; background: #fff6e8; }
  .verificarReporte__motivo p { margin: 5px 0; }
  .verificarReporte__motivo small { color: var(--suave); }

  .verificarReporte__tarjeta footer {
    margin-top: 15px;
    padding-top: 13px;
    border-top: 1px solid #eee5df;
    color: var(--suave);
    text-align: center;
    font-size: 12px;
  }

  @media (max-width: 620px) {
    .verificarReporte { height: auto; min-height: 100dvh; padding: 18px 12px; overflow-y: auto; }
    .verificarReporte__tarjeta { padding: 21px 17px; border-radius: 21px; }
    .verificarReporte__insignia { position: static; margin-top: 14px; }
    .verificarReporte__resultado { align-items: flex-start; padding: 17px; }
    .verificarReporte__resultado h1 { font-size: 22px; }
    .verificarReporte__datos { grid-template-columns: 1fr; }
    .verificarReporte__documento { align-items: flex-start; }
  }

  @media (prefers-reduced-motion: reduce) {
    .verificarReporte__cargador { animation-duration: 1.6s; }
    .verificarReporte__estado button,
    .verificarReporte__datos div { transition: none; }
  }

  @media (min-width: 621px) and (max-height: 760px) {
    .verificarReporte { padding: 12px 20px; }
    .verificarReporte__tarjeta { transform: scale(.92); }
  }
`;

export default VerificarReporte;