import { useEffect, useState } from 'react';



import { Link } from 'react-router-dom';

import Toast from '../shared/Toast';
import type { TipoToast } from '../shared/Toast';



import {



  Building2,



  CalendarDays,



  Check,



  Download,



  ExternalLink,



  Eye,



  FileText,



  Folder,



  FolderHeart,



  Heart,



  Layers,



  Link as LinkIcono,



  Plus,



  User,



  X,



} from 'lucide-react';



import {



  mensajeError,



  useBiblioteca,



} from '../../contexts/BibliotecaContext';



import { categorias } from '../../types/biblioteca/biblioteca.types';



import type { Coleccion, Recurso } from '../../types/biblioteca/biblioteca.types';



import {



  TONO_POR_CATEGORIA,



  TONOS_CATEGORIA_CSS,



} from './categorias.tonos';



import {



  resumirElementos,



  textoElementos,



  textoVersion,



  tonoIcono,



} from './recurso.resumen';



export function TarjetaRecurso({



  recurso,



  alGuardar,



  compacta = false,



}: {



  recurso: Recurso;



  alGuardar?: () => void;



  compacta?: boolean;



}) {



  const { api, base } = useBiblioteca();



  const [favorito, setFavorito] = useState(recurso.esFavorito ?? false);



  const [ocupado, setOcupado] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
  }>({
    visible: false,
    tipo: 'exito',
    titulo: '',
  });

  const [modalGuardado, setModalGuardado] = useState(false);

  const [colecciones, setColecciones] = useState<Coleccion[]>([]);

  const [coleccionesIniciales, setColeccionesIniciales] = useState<number[]>([]);

  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState<number[]>([]);

  const [guardarFavorito, setGuardarFavorito] = useState(recurso.esFavorito ?? false);

  const [cargandoColecciones, setCargandoColecciones] = useState(false);

  const [creandoColeccion, setCreandoColeccion] = useState(false);

  const [nombreNuevaColeccion, setNombreNuevaColeccion] = useState('');



  useEffect(() => {



    setFavorito(recurso.esFavorito ?? false);



  }, [recurso.esFavorito]);



  /* La variante se deriva EXCLUSIVAMENTE de recurso.contenidos.
     No se guarda esCarpeta ni ningun otro campo en BD. */



  const {



    variante,



    cantidadElementos,



    versionPrincipal,



    etiqueta,



    composicion,



  } = resumirElementos(recurso);



  const tono = tonoIcono(variante, versionPrincipal);



  const insigniaVersion = textoVersion(versionPrincipal);



  const detalle = `${base}/recursos/${recurso.id}`;



  const esArchivo = variante === 'archivo';



  const esEnlace = variante === 'enlace';



  const esCarpeta = variante === 'carpeta';



  const esVacio = variante === 'vacio';



  const year = recurso.fechaDocumento



    ? new Date(recurso.fechaDocumento).getFullYear()



    : new Date(recurso.actualizadoEn).getFullYear();



  function mostrarToast(tipo: TipoToast, titulo: string, mensaje?: string) {
    setToast({ visible: true, tipo, titulo, mensaje });
  }

  function cerrarToast() {
    setToast((actual) => ({ ...actual, visible: false }));
  }

  async function descargar() {



    if (!versionPrincipal) return;



    setOcupado(true);



    try {



      const blob = await api.archivo(versionPrincipal.id, false);



      const url = URL.createObjectURL(blob);



      const enlace = document.createElement('a');



      enlace.href = url;



      enlace.download = versionPrincipal.nombreOriginal;



      document.body.appendChild(enlace);



      enlace.click();



      enlace.remove();



      setTimeout(() => URL.revokeObjectURL(url), 10000);



    } catch (e) {



      mostrarToast('error', 'No se pudo completar la operación', mensajeError(e));



    } finally {



      setOcupado(false);



    }



  }



  async function cargarColeccionesGuardado() {

    setCargandoColecciones(true);



    try {

      const respuesta = await api.get<Coleccion[]>('/colecciones');

      const seleccionadas = respuesta

        .filter((coleccion) =>

          coleccion.recursos.some(({ recurso: item }) => item.id === recurso.id),

        )

        .map((coleccion) => coleccion.id);



      setColecciones(respuesta);

      setColeccionesIniciales(seleccionadas);

      setColeccionesSeleccionadas(seleccionadas);

    } catch (e) {

      mostrarToast('error', 'No se pudo completar la operación', mensajeError(e));

    } finally {

      setCargandoColecciones(false);

    }

  }



  async function abrirModalGuardado() {

    setGuardarFavorito(favorito || true);

    setModalGuardado(true);

    setNombreNuevaColeccion('');

    setCreandoColeccion(false);

    await cargarColeccionesGuardado();

  }



  function cerrarModalGuardado() {

    if (ocupado) return;

    setModalGuardado(false);

    setCreandoColeccion(false);

    setNombreNuevaColeccion('');

  }



  function alternarColeccion(coleccionId: number) {

    setColeccionesSeleccionadas((actuales) => {

      const existe = actuales.includes(coleccionId);

      const siguientes = existe

        ? actuales.filter((id) => id !== coleccionId)

        : [...actuales, coleccionId];



      if (siguientes.length > 0) {

        setGuardarFavorito(true);

      }



      return siguientes;

    });

  }



  async function crearColeccionDesdeModal() {

    const nombre = nombreNuevaColeccion.trim();

    if (nombre.length < 2 || ocupado) return;



    setOcupado(true);

    try {

      await api.send('/colecciones', 'POST', { nombre });

      const respuesta = await api.get<Coleccion[]>('/colecciones');

      const creada = respuesta.find(

        (coleccion) => coleccion.nombre.trim().toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),

      );



      setColecciones(respuesta);

      if (creada) {

        setColeccionesSeleccionadas((actuales) =>

          actuales.includes(creada.id) ? actuales : [...actuales, creada.id],

        );

        setGuardarFavorito(true);

      }

      setNombreNuevaColeccion('');

      setCreandoColeccion(false);

      mostrarToast('exito', 'Colección creada', 'La colección se creó correctamente.');

    } catch (e) {

      mostrarToast('error', 'No se pudo completar la operación', mensajeError(e));

    } finally {

      setOcupado(false);

    }

  }



  async function guardarOrganizacion() {

    if (ocupado) return;



    setOcupado(true);

    try {

      const debeSerFavorito = guardarFavorito || coleccionesSeleccionadas.length > 0;



      if (debeSerFavorito !== favorito) {

        await api.send(

          `/recursos/${recurso.id}/favorito`,

          debeSerFavorito ? 'PUT' : 'DELETE',

        );

      }



      const agregar = coleccionesSeleccionadas.filter(

        (id) => !coleccionesIniciales.includes(id),

      );

      const quitar = coleccionesIniciales.filter(

        (id) => !coleccionesSeleccionadas.includes(id),

      );



      await Promise.all([

        ...agregar.map((coleccionId) =>

          api.send(`/colecciones/${coleccionId}/recursos/${recurso.id}`, 'PUT'),

        ),

        ...quitar.map((coleccionId) =>

          api.send(`/colecciones/${coleccionId}/recursos/${recurso.id}`, 'DELETE'),

        ),

      ]);



      setFavorito(debeSerFavorito);

      setGuardarFavorito(debeSerFavorito);

      setColeccionesIniciales(coleccionesSeleccionadas);

      setModalGuardado(false);

      alGuardar?.();

      mostrarToast(
        'exito',
        coleccionesSeleccionadas.length
          ? 'Recurso guardado y organizado'
          : debeSerFavorito
            ? 'Recurso guardado en favoritos'
            : 'Recurso quitado de favoritos',
        coleccionesSeleccionadas.length
          ? 'El recurso quedó guardado en favoritos y organizado en tus colecciones.'
          : debeSerFavorito
            ? 'El recurso se agregó correctamente a tus favoritos.'
            : 'El recurso se quitó correctamente de tus favoritos.',
      );

    } catch (e) {

      mostrarToast('error', 'No se pudo completar la operación', mensajeError(e));

    } finally {

      setOcupado(false);

    }

  }



  async function quitarDeFavoritosYColecciones() {

    if (ocupado) return;



    setOcupado(true);

    try {

      await Promise.all([

        ...(favorito

          ? [api.send(`/recursos/${recurso.id}/favorito`, 'DELETE')]

          : []),

        ...coleccionesIniciales.map((coleccionId) =>

          api.send(`/colecciones/${coleccionId}/recursos/${recurso.id}`, 'DELETE'),

        ),

      ]);



      setFavorito(false);

      setGuardarFavorito(false);

      setColeccionesIniciales([]);

      setColeccionesSeleccionadas([]);

      setModalGuardado(false);

      alGuardar?.();

      mostrarToast('exito', 'Recurso quitado', 'El recurso se quitó de tus guardados.');

    } catch (e) {

      mostrarToast('error', 'No se pudo completar la operación', mensajeError(e));

    } finally {

      setOcupado(false);

    }

  }



  const modalGuardar = modalGuardado ? (

    <div

      className="bib-guardar-modal"

      role="presentation"

      onMouseDown={(event) => {

        if (event.target === event.currentTarget) cerrarModalGuardado();

      }}

    >

      <section

        className="bib-guardar-modal__panel"

        role="dialog"

        aria-modal="true"

        aria-labelledby={`guardar-recurso-${recurso.id}`}

      >

        <header className="bib-guardar-modal__header">

          <span className="bib-guardar-modal__icono">

            <FolderHeart size={24} strokeWidth={1.8} />

          </span>

          <div>

            <h2 id={`guardar-recurso-${recurso.id}`}>Guardar recurso</h2>

            <p>Organiza este recurso para encontrarlo fácilmente después.</p>

          </div>

          <button

            type="button"

            className="bib-guardar-modal__cerrar"

            onClick={cerrarModalGuardado}

            disabled={ocupado}

            aria-label="Cerrar"

          >

            <X size={18} />

          </button>

        </header>



        <div className="bib-guardar-modal__body">

          <button

            type="button"

            className={`bib-guardar-opcion bib-guardar-opcion--favorito ${guardarFavorito ? 'seleccionada' : ''}`}

            onClick={() => {

              if (coleccionesSeleccionadas.length === 0) {

                setGuardarFavorito((actual) => !actual);

              }

            }}

            disabled={ocupado}

          >

            <span className="bib-guardar-opcion__icono bib-guardar-opcion__icono--corazon">

              <Heart size={20} fill={guardarFavorito ? 'currentColor' : 'none'} />

            </span>

            <span className="bib-guardar-opcion__texto">

              <strong>Mis favoritos</strong>

              <small>

                {coleccionesSeleccionadas.length

                  ? 'Se mantiene activo porque el recurso está en una colección.'

                  : 'Guárdalo para encontrarlo rápidamente.'}

              </small>

            </span>

            <span className={`bib-guardar-check ${guardarFavorito ? 'activo' : ''}`}>

              {guardarFavorito && <Check size={15} strokeWidth={2.6} />}

            </span>

          </button>



          <div className="bib-guardar-modal__seccion">

            <div className="bib-guardar-modal__seccion-titulo">

              <div>

                <strong>Mis colecciones</strong>

                <small>Puedes guardar el recurso en una o varias listas.</small>

              </div>

              {!!coleccionesSeleccionadas.length && (

                <span>{coleccionesSeleccionadas.length} seleccionada{coleccionesSeleccionadas.length === 1 ? '' : 's'}</span>

              )}

            </div>



            {cargandoColecciones ? (

              <div className="bib-guardar-modal__cargando">Cargando colecciones…</div>

            ) : colecciones.length ? (

              <div className="bib-guardar-modal__colecciones">

                {colecciones.map((coleccion) => {

                  const seleccionada = coleccionesSeleccionadas.includes(coleccion.id);

                  return (

                    <button

                      key={coleccion.id}

                      type="button"

                      className={`bib-guardar-coleccion ${seleccionada ? 'seleccionada' : ''}`}

                      onClick={() => alternarColeccion(coleccion.id)}

                      disabled={ocupado}

                    >

                      <span className="bib-guardar-coleccion__icono">

                        <FolderHeart size={19} strokeWidth={1.8} />

                      </span>

                      <span className="bib-guardar-coleccion__texto">

                        <strong>{coleccion.nombre}</strong>

                        <small>

                          {coleccion.recursos.length} {coleccion.recursos.length === 1 ? 'recurso' : 'recursos'}

                        </small>

                      </span>

                      <span className={`bib-guardar-check ${seleccionada ? 'activo' : ''}`}>

                        {seleccionada && <Check size={15} strokeWidth={2.6} />}

                      </span>

                    </button>

                  );

                })}

              </div>

            ) : (

              <div className="bib-guardar-modal__vacio">

                <Folder size={22} />

                <div>

                  <strong>Aún no tienes colecciones</strong>

                  <small>Crea una para organizar tus recursos por materia, proyecto o tema.</small>

                </div>

              </div>

            )}



            {creandoColeccion ? (

              <div className="bib-guardar-modal__crear-form">

                <input

                  autoFocus

                  value={nombreNuevaColeccion}

                  onChange={(event) => setNombreNuevaColeccion(event.target.value)}

                  onKeyDown={(event) => {

                    if (event.key === 'Enter') void crearColeccionDesdeModal();

                    if (event.key === 'Escape') {

                      setCreandoColeccion(false);

                      setNombreNuevaColeccion('');

                    }

                  }}

                  placeholder="Nombre de la colección"

                  maxLength={80}

                  disabled={ocupado}

                />

                <button

                  type="button"

                  onClick={() => void crearColeccionDesdeModal()}

                  disabled={ocupado || nombreNuevaColeccion.trim().length < 2}

                >

                  Crear

                </button>

                <button

                  type="button"

                  className="secundario"

                  onClick={() => {

                    setCreandoColeccion(false);

                    setNombreNuevaColeccion('');

                  }}

                  disabled={ocupado}

                >

                  Cancelar

                </button>

              </div>

            ) : (

              <button

                type="button"

                className="bib-guardar-modal__nueva"

                onClick={() => setCreandoColeccion(true)}

                disabled={ocupado}

              >

                <Plus size={17} />

                Crear nueva colección

              </button>

            )}

          </div>

        </div>



        <footer className="bib-guardar-modal__footer">

          {favorito && (

            <button

              type="button"

              className="bib-guardar-modal__quitar"

              onClick={() => void quitarDeFavoritosYColecciones()}

              disabled={ocupado}

            >

              Quitar de guardados

            </button>

          )}

          <span className="bib-guardar-modal__footer-spacer" />

          <button

            type="button"

            className="bib-guardar-modal__cancelar"

            onClick={cerrarModalGuardado}

            disabled={ocupado}

          >

            Cancelar

          </button>

          <button

            type="button"

            className="bib-guardar-modal__guardar"

            onClick={() => void guardarOrganizacion()}

            disabled={ocupado || cargandoColecciones}

          >

            {ocupado ? 'Guardando…' : 'Guardar'}

          </button>

        </footer>

      </section>

    </div>

  ) : null;



  if (compacta) {



    return (



      <>



        <article className="bib-recurso-compacto">



          <div className="bib-recurso-compacto__cabecera">



            <Link



              to={detalle}



              className={`bib-recurso-compacto__archivo bib-recurso-compacto__archivo--${tono}`}



              aria-label={`Abrir ${recurso.titulo}`}



            >



              {esCarpeta ? (



                <Folder size={29} strokeWidth={1.8} />



              ) : esEnlace ? (



                <LinkIcono size={29} strokeWidth={1.8} />



              ) : (



                <FileText size={29} strokeWidth={1.8} />



              )}



              <small>{etiqueta}</small>



            </Link>



            <div className="bib-recurso-compacto__titulo">



              <h3>



                <Link to={detalle}>{recurso.titulo}</Link>



              </h3>



              <div className="bib-recurso-compacto__chips">



                <span



                  className={`bib-recurso-compacto__categoria tone-${TONO_POR_CATEGORIA[recurso.categoria]}`}



                >



                  {categorias[recurso.categoria]}



                </span>



                {esEnlace && (



                  <span className="bib-recurso-compacto__chip bib-recurso-compacto__chip--enlace">



                    Enlace



                  </span>



                )}



                {esVacio && (



                  <span className="bib-recurso-compacto__chip bib-recurso-compacto__chip--vacio">



                    Sin contenido



                  </span>



                )}



                {insigniaVersion && (



                  <span



                    className="bib-recurso-compacto__chip bib-recurso-compacto__chip--version"



                    title={`Versión ${versionPrincipal?.numeroVersion} vigente`}



                  >



                    {insigniaVersion}



                  </span>



                )}



              </div>



            </div>



            <button



              type="button"



              className={`bib-recurso-compacto__favorito ${favorito ? 'activo' : ''}`}



              onClick={() => void abrirModalGuardado()}



              disabled={ocupado}



              aria-label={favorito ? 'Administrar guardado' : 'Guardar recurso'}



              title={favorito ? 'Administrar guardado' : 'Guardar recurso'}



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



          {recurso.creadoPor && (



            <p className="bib-recurso-compacto__publicador">



              <span className="bib-recurso-compacto__publicador-icono">



                <User size={12} strokeWidth={1.5} />



              </span>



              <span className="bib-recurso-compacto__publicador-texto">



                {recurso.creadoPor.rol === 'ADMINISTRADOR'



                  ? 'Equipo IusAcademy'



                  : recurso.creadoPor.tratamiento === 'DR'



                    ? `Dr. ${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`



                    : recurso.creadoPor.tratamiento === 'DRA'



                      ? `Dra. ${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`



                      : `${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`}



              </span>



            </p>



          )}



          <div className="bib-recurso-compacto__meta">



            <span>



              <CalendarDays size={13} strokeWidth={1.8} />



              {year}



            </span>



            {esArchivo && (



              <span>



                <FileText size={13} strokeWidth={1.8} />



                {etiqueta}



              </span>



            )}



            {esEnlace && (



              <span>



                <LinkIcono size={13} strokeWidth={1.8} />



                Enlace



              </span>



            )}



            {esCarpeta && (



              <span>



                <Layers size={13} strokeWidth={1.8} />



                {composicion ?? textoElementos(cantidadElementos)}



              </span>



            )}



            {esVacio && (



              <span>



                <FileText size={13} strokeWidth={1.8} />



                Sin contenido



              </span>



            )}



          </div>



          <div



            className={`bib-recurso-compacto__acciones ${



              esArchivo && versionPrincipal ? '' : 'bib-recurso-compacto__acciones--solo'



            }`}



          >



            {esArchivo && (



              <Link to={detalle}>



                <Eye size={15} strokeWidth={1.9} />



                Vista previa



              </Link>



            )}



            {esArchivo && versionPrincipal && (



              <button



                type="button"



                onClick={() => void descargar()}



                disabled={ocupado}



              >



                <Download size={15} strokeWidth={1.9} />



                Descargar



              </button>



            )}



            {esEnlace && (



              <a



                className="bib-recurso-compacto__accion-principal"



                href={recurso.contenidos[0]?.urlExterna}



                target="\_blank"



                rel="noopener noreferrer"



              >



                <ExternalLink size={15} strokeWidth={1.9} />



                Abrir enlace



              </a>



            )}



            {esCarpeta && (



              <Link



                className="bib-recurso-compacto__accion-principal"



                to={detalle}



              >



                <Folder size={15} strokeWidth={1.9} />



                Ver contenido



              </Link>



            )}



          </div>



        </article>



        {modalGuardar}



        
        <Toast
          visible={toast.visible}
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />




      <style>{tarjetaStyles}</style>



      </>



    );



  }



  return (



    <>



      <article



        className="bib-recurso-card"



      >



        <div className="bib-recurso-card__top">



          <div



            className={`bib-recurso-card__archivo bib-recurso-card__archivo--${tono}`}



          >



            {esCarpeta ? (



              <Folder size={32} strokeWidth={1.8} />



            ) : esEnlace ? (



              <LinkIcono size={32} strokeWidth={1.8} />



            ) : (



              <FileText size={32} strokeWidth={1.8} />



            )}



            <small>{etiqueta}</small>



          </div>



          <div className="bib-recurso-card__titulo">



            <h3>



              <Link to={detalle}>



                {recurso.titulo}



              </Link>



            </h3>



            <div className="bib-recurso-card__chips">



              <span



                className={`bib-recurso-card__categoria tone-${TONO_POR_CATEGORIA[recurso.categoria]}`}



              >



                {categorias[recurso.categoria]}



              </span>



              {esEnlace && (



                <span className="bib-recurso-card__chip bib-recurso-card__chip--enlace">



                  Enlace



                </span>



              )}



              {esVacio && (



                <span className="bib-recurso-card__chip bib-recurso-card__chip--vacio">



                  Sin contenido



                </span>



              )}



              {insigniaVersion && (



                <span



                  className="bib-recurso-card__chip bib-recurso-card__chip--version"



                  title={`Versión ${versionPrincipal?.numeroVersion} vigente`}



                >



                  {insigniaVersion}



                </span>



              )}



            </div>



          </div>



          <button



            type="button"



            className={



              favorito



                ? 'bib-recurso-card__favorito activo'



                : 'bib-recurso-card__favorito'



            }



            onClick={() => void abrirModalGuardado()}



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



        {recurso.creadoPor && (



          <p className="bib-recurso-card__publicador">



            <span className="bib-recurso-card__publicador-icono">



              <User size={12} strokeWidth={1.5} />



            </span>



            <span className="bib-recurso-card__publicador-texto">



              {recurso.creadoPor.rol === 'ADMINISTRADOR'



                ? 'Equipo IusAcademy'



                : recurso.creadoPor.tratamiento === 'DR'



                  ? `Dr. ${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`



                  : recurso.creadoPor.tratamiento === 'DRA'



                    ? `Dra. ${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`



                    : `${recurso.creadoPor.nombres} ${recurso.creadoPor.apellidoPaterno}`}



            </span>



          </p>



        )}



        {composicion && (



          <p className="bib-recurso-card__composicion">{composicion}</p>



        )}



        <div className="bib-recurso-card__meta">



          <span>



            <CalendarDays size={14} strokeWidth={1.8} />



            {year}



          </span>



          {esArchivo && (



            <span>



              <FileText size={14} strokeWidth={1.8} />



              {etiqueta}



            </span>



          )}



          {esEnlace && (



            <span>



              <LinkIcono size={14} strokeWidth={1.8} />



              Enlace



            </span>



          )}



          {esCarpeta && (



            <span className="bib-recurso-card__conteo">



              <Layers size={14} strokeWidth={1.8} />



              {textoElementos(cantidadElementos)}



            </span>



          )}



          {esVacio && (



            <span>



              <FileText size={14} strokeWidth={1.8} />



              Sin contenido



            </span>



          )}



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



        <footer



          className={`bib-recurso-card__acciones ${



            esArchivo && versionPrincipal ? '' : 'bib-recurso-card__acciones--solo'



          }`}



        >



          {esArchivo && (



            <Link to={detalle}>



              <Eye size={16} strokeWidth={1.9} />



              Vista previa



            </Link>



          )}



          {esArchivo && versionPrincipal && (



            <button



              type="button"



              onClick={() => void descargar()}



              disabled={ocupado}



            >



              <Download size={16} strokeWidth={1.9} />



              {ocupado ? 'Espera...' : 'Descargar'}



            </button>



          )}



          {esEnlace && (



            <a



              className="bib-recurso-card__accion-principal"



              href={recurso.contenidos[0]?.urlExterna}



              target="\_blank"



              rel="noopener noreferrer"



            >



              <ExternalLink size={16} strokeWidth={1.9} />



              Abrir enlace



            </a>



          )}



          {esCarpeta && (



            <Link



              className="bib-recurso-card__accion-principal"



              to={detalle}



            >



              <Folder size={16} strokeWidth={1.9} />



              Ver contenido



            </Link>



          )}



        </footer>



      </article>



      
        {modalGuardar}

        <Toast
          visible={toast.visible}
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />

        <style>{tarjetaStyles}</style>



    </>



  );



}



const tarjetaStyles = `



  /* Tarjeta compacta del Home: visualmente ligera, pero con acciones completas. */



  .bib-recurso-compacto {



    --tone: var(--app-accent);



    --tone-bg: var(--app-accent-soft);



    min-width: 0;



    min-height: 196px;



    padding: 15px;



    display: flex;



    flex-direction: column;



    gap: 11px;



    background: var(--app-surface);



    border: 1px solid var(--app-border);



    border-radius: 17px;



    box-shadow: var(--app-shadow-sm);



    transition:



      transform 160ms ease,



      border-color 160ms ease,



      box-shadow 160ms ease;



  }



  .bib-recurso-compacto:hover {



    transform: translateY(-2px);



    border-color: var(--app-border-strong);



    box-shadow: var(--app-shadow);



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



    color: var(--app-info);



    background: var(--app-info-bg);



    border: 1px solid var(--app-info-border);



    border-radius: 11px;



    text-decoration: none;



    transition:



      transform 160ms ease,



      box-shadow 160ms ease;



  }



  .bib-recurso-compacto:hover .bib-recurso-compacto__archivo {



    transform: translateY(-1px);



    box-shadow: var(--app-shadow-sm);



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



    color: var(--app-danger);



    background: var(--app-danger-bg);



    border-color: var(--app-danger-border);



  }



  .bib-recurso-compacto__archivo--doc,



  .bib-recurso-compacto__archivo--docx {



    color: var(--app-info);



    background: var(--app-info-bg);



    border-color: var(--app-info-border);



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



    font-size: 10px;



    font-weight: 850;



    line-height: 1.3;



  }



  .bib-recurso-compacto__titulo h3 a {



    display: -webkit-box;



    overflow: hidden;



    color: var(--app-text);



    text-decoration: none;



    -webkit-box-orient: vertical;



    -webkit-line-clamp: 2;



  }



  .bib-recurso-compacto__titulo h3 a:hover {



    color: var(--app-accent-dark);



  }



  ${TONOS_CATEGORIA_CSS}



  .bib-recurso-compacto__categoria {



    width: fit-content;



    max-width: 100%;



    padding: 4px 8px;



    overflow: hidden;



    color: var(--category-color);



    background: var(--category-soft);



    border: 1px solid



      color-mix(



        in srgb,



        var(--category-color) 26%,



        transparent



      );



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



    color: var(--app-text-muted);



    background: var(--app-surface-raised);



    border: 1px solid var(--app-border-soft);



    border-radius: 10px;



    cursor: pointer;



    transition:



      color 150ms ease,



      background 150ms ease,



      border-color 150ms ease;



  }



  .bib-recurso-compacto__favorito:hover,



  .bib-recurso-compacto__favorito.activo {



    color: var(--app-danger);



    background: var(--app-danger-bg);



    border-color: var(--app-danger-border);



  }



  .bib-recurso-compacto__descripcion {



    min-height: 34px;



    margin: 0;



    display: -webkit-box;



    overflow: hidden;



    color: var(--app-text-secondary);



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



    color: var(--app-text-soft);



    font-size: 9.5px;



  }



  .bib-recurso-compacto__meta span {



    display: inline-flex;



    align-items: center;



    gap: 5px;



  }



  .bib-recurso-compacto__meta svg {



    color: var(--app-accent);



  }



  .bib-recurso-compacto__acciones {



    padding-top: 11px;



    display: grid;



    grid-template-columns: 1fr 1fr;



    gap: 8px;



    border-top: 1px solid var(--app-border-soft);



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



    color: var(--app-accent-dark);



    background: var(--app-surface-alt);



    border: 1px solid var(--app-border);



  }



  .bib-recurso-compacto__acciones button {



    color: #fff;



    background: var(--app-accent);



    border: 0;



    box-shadow: var(--app-shadow-sm);



  }



  .bib-recurso-compacto__acciones a:hover,



  .bib-recurso-compacto__acciones button:hover:not(:disabled) {



    transform: translateY(-1px);



  }



  .bib-recurso-compacto__acciones a:hover {



    background: var(--app-accent-soft);



  }



.bib-recurso-compacto__acciones button:hover:not(:disabled) {



      background: var(--app-accent-hover);



      box-shadow: var(--app-shadow);



    }



  .bib-recurso-compacto__acciones button:disabled,



  .bib-recurso-compacto__favorito:disabled {



    opacity: .55;



    cursor: wait;



  }



  .bib-recurso-card {



    --tone: var(--app-accent);



    --tone-bg: var(--app-accent-soft);



    width: 100%;



    min-width: 0;



    min-height: 232px;



    padding: 17px;



    display: flex;



    flex-direction: column;



    background: var(--app-surface);



    border: 1px solid var(--app-border);



    border-radius: 19px;



    box-shadow: var(--app-shadow-sm);



    transition:



      transform 160ms ease,



      border-color 160ms ease,



      box-shadow 160ms ease;



  }



  .bib-recurso-card:hover {



    transform: translateY(-3px);



    border-color: var(--app-border-strong);



    box-shadow: var(--app-shadow);



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



    color: var(--app-danger);



    background: var(--app-danger-bg);



    border: 1px solid var(--app-danger-border);



    border-radius: 13px;



  }



  .bib-recurso-card__archivo--doc,



  .bib-recurso-card__archivo--docx {



    color: var(--app-info);



    background: var(--app-info-bg);



    border-color: var(--app-info-border);



  }



  .bib-recurso-card__archivo--pdf {



    color: var(--app-danger);



    background: var(--app-danger-bg);



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



    color: var(--app-text);



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



    color: var(--category-color);



    background: var(--category-soft);



    border: 1px solid



      color-mix(



        in srgb,



        var(--category-color) 26%,



        transparent



      );



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



    color: var(--app-text-muted);



    background: var(--app-surface-raised);



    border: 1px solid var(--app-border-soft);



    border-radius: 11px;



    cursor: pointer;



    transition:



      color 150ms ease,



      background 150ms ease,



      border-color 150ms ease,



      transform 150ms ease;



  }



  .bib-recurso-card__favorito:hover {



    color: var(--app-danger);



    background: var(--app-danger-bg);



    border-color: var(--app-danger-border);



    transform: scale(1.04);



  }



  .bib-recurso-card__favorito.activo {



    color: var(--app-danger);



    background: var(--app-danger-bg);



    border-color: var(--app-danger-border);



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



    color: var(--app-text-secondary);



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



    border-top: 1px solid var(--app-border-soft);



    color: var(--app-text-soft);



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



    color: var(--app-accent-dark);



    background: var(--app-surface-alt);



    border: 1px solid var(--app-border);



    text-decoration: none;



  }



  .bib-recurso-card__acciones a:hover {



    background: var(--app-accent-soft);



    transform: translateY(-1px);



  }



  .bib-recurso-card__acciones button {



    color: #fff;



    background: var(--app-accent);



    border: 0;



    box-shadow: var(--app-shadow-sm);



  }



.bib-recurso-card__acciones button:hover:not(:disabled) {



      background: var(--app-accent-hover);



      transform: translateY(-1px);



      box-shadow: var(--app-shadow);



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



  /* =========================================================



     VARIANTES DERIVADAS DE recurso.contenidos



     archive | link | folder | empty



     Solo se agregan tonos; la paleta de categorias no cambia.



     ========================================================= */



  .bib-recurso-card__chips,



  .bib-recurso-compacto__chips {



    min-width: 0;



    display: flex;



    flex-wrap: wrap;



    align-items: center;



    gap: 6px;



  }



  .bib-recurso-card__chip,



  .bib-recurso-compacto__chip {



    width: fit-content;



    max-width: 100%;



    padding: 4px 8px;



    display: inline-flex;



    align-items: center;



    gap: 4px;



    overflow: hidden;



    border-radius: 999px;



    font-size: 8.5px;



    font-weight: 800;



    line-height: 1;



    text-overflow: ellipsis;



    white-space: nowrap;



  }



  .bib-recurso-card__chip--version,



  .bib-recurso-compacto__chip--version {



    color: var(--app-accent-dark);



    background: var(--app-accent-softer);



    border: 1px solid var(--app-border);



  }



  .bib-recurso-card__chip--enlace,



  .bib-recurso-compacto__chip--enlace {



    color: var(--app-info-strong);



    background: var(--app-info-bg);



    border: 1px solid var(--app-info-border);



  }



  .bib-recurso-card__chip--carpeta,



  .bib-recurso-compacto__chip--carpeta {



    color: var(--app-accent-dark);



    background: var(--app-accent-soft);



    border: 1px solid var(--app-border-strong);



  }



  .bib-recurso-card__chip--vacio,



  .bib-recurso-compacto__chip--vacio {



    color: var(--app-text-muted);



    background: var(--app-surface-alt);



    border: 1px solid var(--app-border);



  }



  /* Recuadro del icono: tonos nuevos con tokens existentes. */



  .bib-recurso-card__archivo--otro,



  .bib-recurso-compacto__archivo--otro {



    color: var(--app-info);



    background: var(--app-info-bg);



    border-color: var(--app-info-border);



  }



  .bib-recurso-card__archivo--carpeta,



  .bib-recurso-compacto__archivo--carpeta {



    color: var(--app-accent-dark);



    background: var(--app-accent-soft);



    border-color: var(--app-border-strong);



  }



  .bib-recurso-card__archivo--enlace,



  .bib-recurso-compacto__archivo--enlace {



    color: var(--app-info-strong);



    background: var(--app-info-bg);



    border-color: var(--app-info-border);



  }



  .bib-recurso-card__archivo--vacio,



  .bib-recurso-compacto__archivo--vacio {



    color: var(--app-text-muted);



    background: var(--app-surface-alt);



    border: 1px dashed var(--app-border-strong);



  }



  /* Composicion de la carpeta: "3 archivos . 1 enlace" */



  .bib-recurso-card__composicion {



    margin: -6px 0 10px !important;



    color: var(--app-text-soft);



    font-size: 9.5px !important;



    font-weight: 700;



    line-height: 1.3 !important;



  }



  .bib-recurso-card__conteo {



    font-weight: 800;



  }



  /* Una sola accion: ocupa todo el ancho del pie. */



  .bib-recurso-card__acciones--solo,



  .bib-recurso-compacto__acciones--solo {



    grid-template-columns: 1fr;



  }



  /* Accion principal de enlace y carpeta: misma naranja



     institucional que usa el boton Descargar. */



  .bib-recurso-card__acciones .bib-recurso-card__accion-principal,



  .bib-recurso-compacto__acciones .bib-recurso-compacto__accion-principal {



    color: #fff;



    background: var(--app-accent);



    border: 0;



    box-shadow: var(--app-shadow-sm);



  }



  .bib-recurso-card__acciones .bib-recurso-card__accion-principal:hover,



  .bib-recurso-compacto__acciones .bib-recurso-compacto__accion-principal:hover {



    background: var(--app-accent-hover);



    transform: translateY(-1px);



    box-shadow: var(--app-shadow);



  }



  /* Compacta del Home: card sólida, legible y con jerarquía visual clara. */



  .bib-recurso-compacto {



    min-height: 248px;



    padding: 16px;



    gap: 11px;



    background: var(--app-surface-raised);



    background-image: none;



    border: 1px solid var(--app-border);



    border-radius: 18px;



    box-shadow: var(--app-shadow-sm);



  }



  .bib-recurso-compacto:hover {



    transform: translateY(-3px);



    border-color: var(--app-border-strong);



    box-shadow: var(--app-shadow);



  }



  .bib-recurso-compacto__cabecera {



    grid-template-columns: 56px minmax(0, 1fr) 34px;



    gap: 12px;



  }



  .bib-recurso-compacto__archivo {



    width: 56px;



    height: 62px;



    border-radius: 13px;



  }



  .bib-recurso-compacto__archivo svg {



    width: 34px;



    height: 34px;



    transform: translateY(-4px);



  }



  .bib-recurso-compacto__archivo small {



    bottom: 5px;



    font-size: 8.5px;



  }



  .bib-recurso-compacto__titulo {



    padding-top: 2px;



    gap: 7px;



  }



  .bib-recurso-compacto__titulo h3 {



    font-size: 14px;



    font-weight: 850;



    line-height: 1.3;



  }



  .bib-recurso-compacto__categoria {



    padding: 4px 9px;



    font-size: 9px;



  }



  .bib-recurso-compacto__favorito {



    width: 34px;



    height: 34px;



    border-radius: 11px;



  }



  .bib-recurso-compacto__favorito svg {



    width: 19px;



    height: 19px;



  }



  .bib-recurso-compacto__descripcion {



    min-height: 34px;



    margin: 1px 0 0;



    color: var(--app-text-secondary);



    font-size: 11px;



    line-height: 1.5;



  }



  .bib-recurso-compacto__publicador {



    min-width: 0;



    margin: 0;



    display: flex;



    align-items: center;



    gap: 7px;



    color: var(--app-text-secondary);



    font-size: 10.5px;



    font-weight: 650;



    line-height: 1.25;



  }



  .bib-recurso-compacto__publicador-icono {



    width: 23px;



    height: 23px;



    display: inline-flex;



    flex: 0 0 23px;



    align-items: center;



    justify-content: center;



    color: var(--app-accent-dark);



    background: var(--app-accent-soft);



    border: 1px solid var(--app-border);



    border-radius: 7px;



  }



  .bib-recurso-compacto__publicador-icono svg {



    width: 13px;



    height: 13px;



  }



  .bib-recurso-compacto__publicador-texto {



    min-width: 0;



    overflow: hidden;



    text-overflow: ellipsis;



    white-space: nowrap;



  }



  .bib-recurso-compacto__meta {



    margin-top: auto;



    padding: 10px 2px 0;



    gap: 14px;



    border-top: 1px solid var(--app-border-soft);



    color: var(--app-text-secondary);



    font-size: 10px;



    font-weight: 600;



  }



  .bib-recurso-compacto__meta span {



    gap: 6px;



  }



  .bib-recurso-compacto__meta svg {



    width: 14px;



    height: 14px;



    color: var(--app-accent);



  }



  .bib-recurso-compacto__acciones {



    padding-top: 0;



    gap: 9px;



    border-top: 0;



  }



  .bib-recurso-compacto__acciones a,



  .bib-recurso-compacto__acciones button {



    height: 40px;



    padding: 0 12px;



    gap: 7px;



    border-radius: 11px;



    font-size: 10.5px;



    font-weight: 850;



  }



  .bib-recurso-compacto__acciones svg {



    width: 16px;



    height: 16px;



  }



  @media (max-width: 520px) {



    .bib-recurso-compacto {



      min-height: 0;



      padding: 14px;



    }



    .bib-recurso-compacto__cabecera {



      grid-template-columns: 52px minmax(0, 1fr) 32px;



    }



    .bib-recurso-compacto__archivo {



      width: 52px;



      height: 58px;



    }



  }





  /* =========================================================

     MODAL DE GUARDADO / FAVORITOS / COLECCIONES

     ========================================================= */

  .bib-guardar-modal {

    position: fixed;

    inset: 0;

    z-index: 1200;

    padding: 24px;

    display: grid;

    place-items: center;

    background: rgba(15, 23, 42, .46);

    backdrop-filter: blur(3px);

  }



  .bib-guardar-modal__panel {

    width: min(560px, 100%);

    max-height: min(760px, calc(100vh - 48px));

    display: flex;

    flex-direction: column;

    overflow: hidden;

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 22px;

    box-shadow: 0 24px 70px rgba(15, 23, 42, .2);

    animation: bibGuardarEntrada 160ms ease-out;

  }



  @keyframes bibGuardarEntrada {

    from { opacity: 0; transform: translateY(8px) scale(.985); }

    to { opacity: 1; transform: translateY(0) scale(1); }

  }



  .bib-guardar-modal__header {

    position: relative;

    padding: 20px 58px 18px 20px;

    display: grid;

    grid-template-columns: 48px minmax(0, 1fr);

    align-items: center;

    gap: 13px;

    border-bottom: 1px solid var(--app-border-soft);

  }



  .bib-guardar-modal__icono {

    width: 48px;

    height: 48px;

    display: grid;

    place-items: center;

    color: var(--app-accent);

    background: var(--app-accent-soft);

    border: 1px solid var(--app-border);

    border-radius: 15px;

  }



  .bib-guardar-modal__header h2 {

    margin: 0;

    color: var(--app-text);

    font-size: 19px;

    font-weight: 900;

    line-height: 1.15;

  }



  .bib-guardar-modal__header p {

    margin: 5px 0 0 !important;

    color: var(--app-text-secondary);

    font-size: 11.5px !important;

    line-height: 1.45 !important;

  }



  .bib-guardar-modal__cerrar {

    position: absolute;

    top: 17px;

    right: 17px;

    width: 34px;

    height: 34px;

    padding: 0;

    display: grid;

    place-items: center;

    color: var(--app-text-soft);

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border-soft);

    border-radius: 10px;

    cursor: pointer;

  }



  .bib-guardar-modal__body {

    padding: 18px 20px;

    display: grid;

    gap: 18px;

    overflow-y: auto;

  }



  .bib-guardar-opcion,

  .bib-guardar-coleccion {

    width: 100%;

    padding: 12px;

    display: grid;

    grid-template-columns: 42px minmax(0, 1fr) 24px;

    align-items: center;

    gap: 11px;

    text-align: left;

    color: var(--app-text);

    background: var(--app-surface);

    border: 1px solid var(--app-border-soft);

    border-radius: 14px;

    cursor: pointer;

    transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;

  }



  .bib-guardar-opcion:hover,

  .bib-guardar-coleccion:hover {

    transform: translateY(-1px);

    border-color: var(--app-border-strong);

  }



  .bib-guardar-opcion.seleccionada {

    background: var(--app-danger-bg);

    border-color: var(--app-danger-border);

  }



  .bib-guardar-coleccion.seleccionada {

    background: var(--app-accent-soft);

    border-color: var(--app-border-strong);

  }



  .bib-guardar-opcion__icono,

  .bib-guardar-coleccion__icono {

    width: 42px;

    height: 42px;

    display: grid;

    place-items: center;

    color: var(--app-accent);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border-soft);

    border-radius: 12px;

  }



  .bib-guardar-opcion__icono--corazon {

    color: var(--app-danger);

  }



  .bib-guardar-opcion__texto,

  .bib-guardar-coleccion__texto {

    min-width: 0;

    display: grid;

    gap: 3px;

  }



  .bib-guardar-opcion__texto strong,

  .bib-guardar-coleccion__texto strong {

    overflow: hidden;

    color: var(--app-text);

    font-size: 11.5px;

    font-weight: 850;

    text-overflow: ellipsis;

    white-space: nowrap;

  }



  .bib-guardar-opcion__texto small,

  .bib-guardar-coleccion__texto small {

    color: var(--app-text-secondary);

    font-size: 9.5px;

    line-height: 1.35;

  }



  .bib-guardar-check {

    width: 22px;

    height: 22px;

    display: grid;

    place-items: center;

    color: transparent;

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border-soft);

    border-radius: 7px;

  }



  .bib-guardar-check.activo {

    color: #fff;

    background: var(--app-accent);

    border-color: var(--app-accent);

  }



  .bib-guardar-opcion--favorito .bib-guardar-check.activo {

    background: var(--app-danger);

    border-color: var(--app-danger);

  }



  .bib-guardar-modal__seccion {

    display: grid;

    gap: 10px;

  }



  .bib-guardar-modal__seccion-titulo {

    display: flex;

    align-items: flex-end;

    justify-content: space-between;

    gap: 12px;

  }



  .bib-guardar-modal__seccion-titulo > div {

    display: grid;

    gap: 3px;

  }



  .bib-guardar-modal__seccion-titulo strong {

    color: var(--app-text);

    font-size: 12px;

    font-weight: 850;

  }



  .bib-guardar-modal__seccion-titulo small,

  .bib-guardar-modal__seccion-titulo > span {

    color: var(--app-text-secondary);

    font-size: 9.5px;

  }



  .bib-guardar-modal__seccion-titulo > span {

    padding: 4px 8px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    border-radius: 999px;

    font-weight: 800;

  }



  .bib-guardar-modal__colecciones {

    max-height: 240px;

    padding-right: 3px;

    display: grid;

    gap: 8px;

    overflow-y: auto;

  }



  .bib-guardar-modal__cargando,

  .bib-guardar-modal__vacio {

    min-height: 78px;

    padding: 14px;

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 11px;

    color: var(--app-text-secondary);

    background: var(--app-surface-alt);

    border: 1px dashed var(--app-border);

    border-radius: 14px;

    font-size: 10.5px;

  }



  .bib-guardar-modal__vacio > svg {

    flex: 0 0 auto;

    color: var(--app-accent);

  }



  .bib-guardar-modal__vacio > div {

    display: grid;

    gap: 3px;

  }



  .bib-guardar-modal__vacio strong {

    color: var(--app-text);

    font-size: 11px;

  }



  .bib-guardar-modal__vacio small {

    color: var(--app-text-secondary);

    font-size: 9.5px;

  }



  .bib-guardar-modal__nueva {

    width: fit-content;

    min-height: 36px;

    padding: 0 11px;

    display: inline-flex;

    align-items: center;

    gap: 7px;

    color: var(--app-accent-dark);

    background: transparent;

    border: 0;

    border-radius: 10px;

    font: inherit;

    font-size: 10.5px;

    font-weight: 800;

    cursor: pointer;

  }



  .bib-guardar-modal__nueva:hover {

    background: var(--app-accent-soft);

  }



  .bib-guardar-modal__crear-form {

    padding: 9px;

    display: grid;

    grid-template-columns: minmax(0, 1fr) auto auto;

    gap: 7px;

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border);

    border-radius: 13px;

  }



  .bib-guardar-modal__crear-form input {

    min-width: 0;

    height: 36px;

    padding: 0 11px;

    color: var(--app-text);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border-soft);

    border-radius: 9px;

    outline: 0;

    font: inherit;

    font-size: 10.5px;

  }



  .bib-guardar-modal__crear-form input:focus {

    border-color: var(--app-border-strong);

    box-shadow: 0 0 0 3px var(--app-input-ring);

  }



  .bib-guardar-modal__crear-form button {

    height: 36px;

    padding: 0 11px;

    color: #fff;

    background: var(--app-accent);

    border: 0;

    border-radius: 9px;

    font: inherit;

    font-size: 9.5px;

    font-weight: 800;

    cursor: pointer;

  }



  .bib-guardar-modal__crear-form button.secundario {

    color: var(--app-text-secondary);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border-soft);

  }



  .bib-guardar-modal__footer {

    padding: 14px 20px 18px;

    display: flex;

    align-items: center;

    gap: 8px;

    border-top: 1px solid var(--app-border-soft);

    background: var(--app-surface-alt);

  }



  .bib-guardar-modal__footer-spacer {

    flex: 1;

  }



  .bib-guardar-modal__footer button {

    min-height: 38px;

    padding: 0 14px;

    border-radius: 11px;

    font: inherit;

    font-size: 10.5px;

    font-weight: 800;

    cursor: pointer;

  }



  .bib-guardar-modal__quitar {

    color: var(--app-danger);

    background: var(--app-danger-bg);

    border: 1px solid var(--app-danger-border);

  }



  .bib-guardar-modal__cancelar {

    color: var(--app-text-secondary);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border-soft);

  }



  .bib-guardar-modal__guardar {

    min-width: 92px;

    color: #fff;

    background: var(--app-accent);

    border: 1px solid var(--app-accent);

    box-shadow: var(--app-shadow-sm);

  }



  .bib-guardar-modal button:disabled {

    opacity: .55;

    cursor: wait;

  }



  @media (max-width: 600px) {

    .bib-guardar-modal { padding: 12px; }

    .bib-guardar-modal__panel { max-height: calc(100vh - 24px); border-radius: 18px; }

    .bib-guardar-modal__header { padding: 16px 52px 15px 16px; grid-template-columns: 42px minmax(0, 1fr); }

    .bib-guardar-modal__icono { width: 42px; height: 42px; border-radius: 13px; }

    .bib-guardar-modal__body { padding: 15px 16px; }

    .bib-guardar-modal__footer { padding: 12px 16px 15px; flex-wrap: wrap; }

    .bib-guardar-modal__quitar { order: 3; width: 100%; }

    .bib-guardar-modal__crear-form { grid-template-columns: 1fr 1fr; }

    .bib-guardar-modal__crear-form input { grid-column: 1 / -1; }

  }



`;