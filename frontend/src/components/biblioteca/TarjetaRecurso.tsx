import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import {

  Building2,

  CalendarDays,

  Download,

  Eye,

  FileText,

  Heart,

} from 'lucide-react';

import {

  mensajeError,

  useBiblioteca,

} from '../../contexts/BibliotecaContext';

import { categorias } from '../../types/biblioteca/biblioteca.types';

import { grupoDeCategoria } from '../../types/biblioteca/biblioteca.visual';

import type { Recurso } from '../../types/biblioteca/biblioteca.types';



export function TarjetaRecurso({

  recurso,

  alGuardar,

  compacta = false,

}: {

  recurso: Recurso;

  alGuardar?: () => void;

  compacta?: boolean;

}) {

  const { api, base, avisar } = useBiblioteca();

  const [favorito, setFavorito] = useState(recurso.esFavorito ?? false);

  const [ocupado, setOcupado] = useState(false);



  useEffect(() => {

    setFavorito(recurso.esFavorito ?? false);

  }, [recurso.esFavorito]);



  const version = recurso.contenidos.find(

    (contenido) =>

      contenido.tipo === 'ARCHIVO' &&

      contenido.versiones.length > 0,

  )?.versiones[0];



  const grupo = grupoDeCategoria(recurso.categoria);



  const extension =

    version?.extension?.replace('.', '').toUpperCase() ?? 'DOC';



  const year = recurso.fechaDocumento

    ? new Date(recurso.fechaDocumento).getFullYear()

    : new Date(recurso.actualizadoEn).getFullYear();



  async function descargar() {

    if (!version) return;



    setOcupado(true);



    try {

      const blob = await api.archivo(version.id, false);

      const url = URL.createObjectURL(blob);

      const enlace = document.createElement('a');



      enlace.href = url;

      enlace.download = version.nombreOriginal;



      document.body.appendChild(enlace);

      enlace.click();

      enlace.remove();



      setTimeout(() => URL.revokeObjectURL(url), 10000);

    } catch (e) {

      avisar(mensajeError(e), true);

    } finally {

      setOcupado(false);

    }

  }



  async function cambiarFavorito() {

    setOcupado(true);



    try {

      await api.send(

        `/recursos/${recurso.id}/favorito`,

        favorito ? 'DELETE' : 'PUT',

      );



      setFavorito(!favorito);

      alGuardar?.();

    } catch (e) {

      avisar(mensajeError(e), true);

    } finally {

      setOcupado(false);

    }

  }



  if (compacta) {

    return (

      <>

        <article className={`bib-recurso-compacto tone-${grupo?.tono ?? 'orange'}`}>

          <div className="bib-recurso-compacto__cabecera">

            <Link
              to={`${base}/recursos/${recurso.id}`}
              className={`bib-recurso-compacto__archivo bib-recurso-compacto__archivo--${extension.toLowerCase()}`}
              aria-label={`Abrir ${recurso.titulo}`}
            >
              <FileText size={29} strokeWidth={1.8} />
              <small>{extension}</small>
            </Link>

            <div className="bib-recurso-compacto__titulo">
              <h3>
                <Link to={`${base}/recursos/${recurso.id}`}>
                  {recurso.titulo}
                </Link>
              </h3>

              <span className="bib-recurso-compacto__categoria">
                {grupo?.nombre ?? categorias[recurso.categoria]}
              </span>
            </div>

            <button
              type="button"
              className={`bib-recurso-compacto__favorito ${favorito ? 'activo' : ''}`}
              onClick={() => void cambiarFavorito()}
              disabled={ocupado}
              aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              title={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart
                size={17}
                strokeWidth={1.9}
                fill={favorito ? 'currentColor' : 'none'}
              />
            </button>

          </div>

          {recurso.descripcion && (
            <p className="bib-recurso-compacto__descripcion">
              {recurso.descripcion}
            </p>
          )}

          <div className="bib-recurso-compacto__meta">
            <span>
              <CalendarDays size={13} strokeWidth={1.8} />
              {year}
            </span>

            <span>
              <FileText size={13} strokeWidth={1.8} />
              {extension}
            </span>
          </div>

          <div className="bib-recurso-compacto__acciones">
            <Link to={`${base}/recursos/${recurso.id}`}>
              <Eye size={15} strokeWidth={1.9} />
              Vista previa
            </Link>

            {version && (
              <button
                type="button"
                onClick={() => void descargar()}
                disabled={ocupado}
              >
                <Download size={15} strokeWidth={1.9} />
                Descargar
              </button>
            )}
          </div>

        </article>

        <style>{tarjetaStyles}</style>

      </>

    );

  }

  return (

    <>

      <article

        className={`bib-recurso-card tone-${grupo?.tono ?? 'orange'}`}

      >

        <div className="bib-recurso-card__top">

          <div

            className={`bib-recurso-card__archivo bib-recurso-card__archivo--${extension.toLowerCase()}`}

          >

            <FileText size={32} strokeWidth={1.8} />

            <small>{extension}</small>

          </div>



          <div className="bib-recurso-card__titulo">

            <h3>

              <Link to={`${base}/recursos/${recurso.id}`}>

                {recurso.titulo}

              </Link>

            </h3>



            <span className="bib-recurso-card__categoria">

              {grupo?.nombre ?? categorias[recurso.categoria]}

            </span>

          </div>



          <button

            type="button"

            className={

              favorito

                ? 'bib-recurso-card__favorito activo'

                : 'bib-recurso-card__favorito'

            }

            onClick={() => void cambiarFavorito()}

            disabled={ocupado}

            aria-label={

              favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'

            }

            title={

              favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'

            }

          >

            <Heart

              size={18}

              strokeWidth={1.9}

              fill={favorito ? 'currentColor' : 'none'}

            />

          </button>

        </div>



        <p className="bib-recurso-card__descripcion">

          {recurso.descripcion || 'Sin descripción disponible.'}

        </p>



        <div className="bib-recurso-card__meta">

          <span>

            <CalendarDays size={14} strokeWidth={1.8} />

            {year}

          </span>



          <span>

            <FileText size={14} strokeWidth={1.8} />

            {extension}

          </span>



          {recurso.autorInstitucion && (

            <span

              className="bib-recurso-card__autor"

              title={recurso.autorInstitucion}

            >

              <Building2 size={14} strokeWidth={1.8} />

              {recurso.autorInstitucion}

            </span>

          )}

        </div>



        <footer className="bib-recurso-card__acciones">

          <Link to={`${base}/recursos/${recurso.id}`}>

            <Eye size={16} strokeWidth={1.9} />

            Vista previa

          </Link>



          {version && (

            <button

              type="button"

              onClick={() => void descargar()}

              disabled={ocupado}

            >

              <Download size={16} strokeWidth={1.9} />

              {ocupado ? 'Espera...' : 'Descargar'}

            </button>

          )}

        </footer>

      </article>



      <style>{tarjetaStyles}</style>

    </>

  );

}



const tarjetaStyles = `

  /* Tarjeta compacta del Home: visualmente ligera, pero con acciones completas. */
  .bib-recurso-compacto {
    --tone: #e86f27;
    --tone-bg: #fff0e5;

    min-width: 0;
    min-height: 196px;
    padding: 15px;

    display: flex;
    flex-direction: column;
    gap: 11px;

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 17px;

    box-shadow: 0 5px 16px rgba(15,23,42,.025);

    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .bib-recurso-compacto:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong, rgba(241,139,75,.36));
    box-shadow: 0 10px 24px rgba(15,23,42,.055);
  }

  .bib-recurso-compacto__cabecera {
    min-width: 0;

    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 30px;
    align-items: start;
    gap: 11px;
  }

  .bib-recurso-compacto__archivo {
    position: relative;

    width: 48px;
    height: 52px;

    display: grid;
    place-items: center;

    color: #2f7de1;
    background: #eef5ff;
    border: 1px solid #d8e7ff;
    border-radius: 11px;

    text-decoration: none;

    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .bib-recurso-compacto:hover .bib-recurso-compacto__archivo {
    transform: translateY(-1px);
    box-shadow: 0 5px 12px rgba(15,23,42,.045);
  }

  .bib-recurso-compacto__archivo svg {
    transform: translateY(-3px);
  }

  .bib-recurso-compacto__archivo small {
    position: absolute;
    bottom: 4px;

    font-size: 7.5px;
    font-weight: 900;
    line-height: 1;
  }

  .bib-recurso-compacto__archivo--pdf {
    color: #ef233c;
    background: #fff1f2;
    border-color: #ffd8dd;
  }

  .bib-recurso-compacto__archivo--doc,
  .bib-recurso-compacto__archivo--docx {
    color: #2f7de1;
    background: #eef5ff;
    border-color: #d8e7ff;
  }

  .bib-recurso-compacto__titulo {
    min-width: 0;
    padding-top: 2px;

    display: grid;
    gap: 7px;
  }

  .bib-recurso-compacto__titulo h3 {
    min-width: 0;
    margin: 0;

    font-size: 12px;
    font-weight: 850;
    line-height: 1.3;
  }

  .bib-recurso-compacto__titulo h3 a {
    display: -webkit-box;
    overflow: hidden;

    color: var(--app-text, #0f172a);
    text-decoration: none;

    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .bib-recurso-compacto__titulo h3 a:hover {
    color: #d8611b;
  }

  .bib-recurso-compacto__categoria {
    width: fit-content;
    max-width: 100%;
    padding: 4px 8px;

    overflow: hidden;

    color: var(--tone);
    background: var(--tone-bg);
    border-radius: 999px;

    font-size: 8.5px;
    font-weight: 800;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bib-recurso-compacto__favorito {
    width: 30px;
    height: 30px;
    padding: 0;

    display: grid;
    place-items: center;

    color: var(--app-text-muted, #94a3b8);
    background: #fff;
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
    border-radius: 10px;

    cursor: pointer;

    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease;
  }

  .bib-recurso-compacto__favorito:hover,
  .bib-recurso-compacto__favorito.activo {
    color: #e11d48;
    background: #fff1f4;
    border-color: #ffd7e0;
  }

  .bib-recurso-compacto__descripcion {
    min-height: 34px;
    margin: 0;

    display: -webkit-box;
    overflow: hidden;

    color: var(--app-text-secondary, #475569);

    font-size: 10px;
    line-height: 1.55;

    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .bib-recurso-compacto__meta {
    min-width: 0;
    margin-top: auto;

    display: flex;
    align-items: center;
    gap: 13px;

    color: var(--app-text-soft, #64748b);
    font-size: 9.5px;
  }

  .bib-recurso-compacto__meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .bib-recurso-compacto__meta svg {
    color: var(--app-accent, #f18b4b);
  }

  .bib-recurso-compacto__acciones {
    padding-top: 11px;

    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    border-top: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
  }

  .bib-recurso-compacto__acciones a,
  .bib-recurso-compacto__acciones button {
    min-width: 0;
    height: 38px;
    padding: 0 10px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    border-radius: 11px;

    font: inherit;
    font-size: 9.5px;
    font-weight: 800;
    line-height: 1;

    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;

    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      background 150ms ease;
  }

  .bib-recurso-compacto__acciones a {
    color: #c75b1b;
    background: #fff8f1;
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
  }

  .bib-recurso-compacto__acciones button {
    color: #fff;
    background: linear-gradient(
      135deg,
      var(--app-accent, #f18b4b),
      #ef6b1d
    );
    border: 0;

    box-shadow: 0 4px 11px rgba(239,107,29,.13);
  }

  .bib-recurso-compacto__acciones a:hover,
  .bib-recurso-compacto__acciones button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .bib-recurso-compacto__acciones a:hover {
    background: #fff2e7;
  }

  .bib-recurso-compacto__acciones button:hover:not(:disabled) {
    box-shadow: 0 7px 15px rgba(239,107,29,.18);
  }

  .bib-recurso-compacto__acciones button:disabled,
  .bib-recurso-compacto__favorito:disabled {
    opacity: .55;
    cursor: wait;
  }

  .bib-recurso-compacto.tone-orange {
    --tone: #e86f27;
    --tone-bg: #fff0e5;
  }

  .bib-recurso-compacto.tone-purple {
    --tone: #7c3aed;
    --tone-bg: #f3edff;
  }

  .bib-recurso-compacto.tone-blue {
    --tone: #2f7de1;
    --tone-bg: #eaf4ff;
  }

  .bib-recurso-compacto.tone-green {
    --tone: #20a567;
    --tone-bg: #eafaef;
  }

  .bib-recurso-compacto.tone-yellow {
    --tone: #d87908;
    --tone-bg: #fff7df;
  }

  .bib-recurso-compacto.tone-pink {
    --tone: #dc2d60;
    --tone-bg: #ffedf2;
  }

  .bib-recurso-card {

    --tone: #e86f27;

    --tone-bg: #fff0e5;



    width: 100%;

    min-width: 0;

    min-height: 232px;

    padding: 17px;



    display: flex;

    flex-direction: column;



    background: var(--app-surface, #fffdf9);

    border: 1px solid var(--app-border, rgba(241,139,75,.20));

    border-radius: 19px;



    box-shadow: 0 5px 18px rgba(15,23,42,.035);



    transition:

      transform 160ms ease,

      border-color 160ms ease,

      box-shadow 160ms ease;

  }



  .bib-recurso-card:hover {

    transform: translateY(-3px);

    border-color: var(--app-border-strong, rgba(241,139,75,.34));

    box-shadow: 0 12px 28px rgba(15,23,42,.065);

  }



  .bib-recurso-card.tone-orange {

    --tone: #e86f27;

    --tone-bg: #fff0e5;

  }



  .bib-recurso-card.tone-purple {

    --tone: #7c3aed;

    --tone-bg: #f3edff;

  }



  .bib-recurso-card.tone-blue {

    --tone: #2f7de1;

    --tone-bg: #eaf4ff;

  }



  .bib-recurso-card.tone-green {

    --tone: #20a567;

    --tone-bg: #eafaef;

  }



  .bib-recurso-card.tone-yellow {

    --tone: #d87908;

    --tone-bg: #fff7df;

  }



  .bib-recurso-card.tone-pink {

    --tone: #dc2d60;

    --tone-bg: #ffedf2;

  }



  .bib-recurso-card__top {

    min-width: 0;



    display: grid;

    grid-template-columns: 50px minmax(0, 1fr) 34px;

    align-items: start;

    gap: 12px;

  }



  .bib-recurso-card__archivo {

    position: relative;



    width: 50px;

    height: 56px;



    display: grid;

    place-items: center;



    color: #ef233c;

    background: #fff4f5;

    border: 1px solid rgba(239,35,60,.08);

    border-radius: 13px;

  }



  .bib-recurso-card__archivo--doc,

  .bib-recurso-card__archivo--docx {

    color: #3478ed;

    background: #edf4ff;

    border-color: rgba(52,120,237,.09);

  }



  .bib-recurso-card__archivo--pdf {

    color: #ef233c;

    background: #fff1f3;

  }



  .bib-recurso-card__archivo small {

    position: absolute;

    bottom: 4px;



    font-size: 7.5px;

    font-weight: 900;

    line-height: 1;

  }



  .bib-recurso-card__titulo {

    min-width: 0;

  }



  .bib-recurso-card__titulo h3 {

    margin: 2px 0 8px;



    font-size: 13px;

    font-weight: 850;

    line-height: 1.3;

  }



  .bib-recurso-card__titulo h3 a {

    display: -webkit-box;

    overflow: hidden;



    color: var(--app-text, #0f172a);

    text-decoration: none;



    -webkit-line-clamp: 2;

    -webkit-box-orient: vertical;



    transition: color 150ms ease;

  }



  .bib-recurso-card__titulo h3 a:hover {

    color: var(--tone);

  }



  .bib-recurso-card__categoria {

    display: inline-flex;

    max-width: 100%;

    padding: 5px 9px;



    overflow: hidden;



    color: var(--tone);

    background: var(--tone-bg);

    border-radius: 999px;



    font-size: 9px;

    font-weight: 800;

    line-height: 1;



    text-overflow: ellipsis;

    white-space: nowrap;

  }



  .bib-recurso-card__favorito {

    width: 34px;

    height: 34px;

    padding: 0;



    display: grid;

    place-items: center;



    color: var(--app-text-muted, #94a3b8);

    background: #fff;



    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));

    border-radius: 11px;



    cursor: pointer;



    transition:

      color 150ms ease,

      background 150ms ease,

      border-color 150ms ease,

      transform 150ms ease;

  }



  .bib-recurso-card__favorito:hover {

    color: #df3561;

    background: #fff0f4;

    border-color: rgba(223,53,97,.18);

    transform: scale(1.04);

  }



  .bib-recurso-card__favorito.activo {

    color: #df3561;

    background: #ffedf3;

    border-color: rgba(223,53,97,.16);

  }



  .bib-recurso-card__favorito:disabled {

    cursor: wait;

    opacity: .6;

  }



  .bib-recurso-card__descripcion {

    min-height: 34px;

    margin: 13px 0 12px !important;



    display: -webkit-box;

    overflow: hidden;



    color: var(--app-text-secondary, #475569);



    font-size: 10.5px !important;

    line-height: 1.55 !important;



    -webkit-line-clamp: 2;

    -webkit-box-orient: vertical;

  }



  .bib-recurso-card__meta {

    min-width: 0;

    margin-top: auto;

    padding: 10px 1px;



    display: flex;

    align-items: center;

    gap: 13px;



    border-top: 1px solid var(--app-border-soft, rgba(148,163,184,.18));



    color: var(--app-text-soft, #64748b);



    font-size: 9.5px;

    line-height: 1.2;

  }



  .bib-recurso-card__meta > span {

    min-width: 0;



    display: inline-flex;

    align-items: center;

    gap: 5px;

  }



  .bib-recurso-card__meta svg {

    flex: 0 0 auto;

    color: var(--tone);

  }



  .bib-recurso-card__autor {

    flex: 1;



    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

  }



  .bib-recurso-card__acciones {

    margin-top: 1px;



    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 8px;

  }



  .bib-recurso-card__acciones a,

  .bib-recurso-card__acciones button {

    min-width: 0;

    height: 40px;

    padding: 0 10px;



    display: flex;

    align-items: center;

    justify-content: center;

    gap: 6px;



    border-radius: 11px;



    font: inherit;

    font-size: 10.5px;

    font-weight: 800;



    cursor: pointer;



    transition:

      transform 150ms ease,

      background 150ms ease,

      box-shadow 150ms ease;

  }



  .bib-recurso-card__acciones a {

    color: #c75b1b;

    background: #fff4e9;



    border: 1px solid rgba(241,139,75,.18);



    text-decoration: none;

  }



  .bib-recurso-card__acciones a:hover {

    background: #ffede0;

    transform: translateY(-1px);

  }



  .bib-recurso-card__acciones button {

    color: #fff;



    background:

      linear-gradient(

        135deg,

        var(--app-accent, #f18b4b),

        #ef6b1d

      );



    border: 0;



    box-shadow: 0 6px 14px rgba(239,107,29,.13);

  }



  .bib-recurso-card__acciones button:hover:not(:disabled) {

    transform: translateY(-1px);

    box-shadow: 0 8px 18px rgba(239,107,29,.20);

  }



  .bib-recurso-card__acciones button:disabled {

    opacity: .65;

    cursor: wait;

  }



  @media (max-width: 520px) {

    .bib-recurso-card {

      min-height: auto;

      padding: 15px;

    }



    .bib-recurso-card__meta {

      flex-wrap: wrap;

    }



    .bib-recurso-card__autor {

      flex-basis: 100%;

    }

  }

`;
