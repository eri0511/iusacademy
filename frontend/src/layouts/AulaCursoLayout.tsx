import {
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react';

import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import EncabezadoCurso from '../components/aula/EncabezadoCurso';

import NavegacionAula, {
  type SeccionAula,
} from '../components/aula/NavegacionAula';

import SelectorHitos from '../components/aula/SelectorHitos';

import SinPlanificacion from '../components/aula/SinPlanificacion';

import {
  useAulaCurso,
} from '../hooks/useAulaCurso';

import {
  AulaProvider,
  type AulaContextValue,
} from '../contexts/AulaContext';

import type {
  AulaCursoRespuesta,
  HitoAula,
  RolAula,
} from '../types/aulaCurso.types';

export type AulaCursoOutletContext = {
  aula:
    AulaCursoRespuesta;

  curso:
    AulaCursoRespuesta['curso'];

  permisos:
    AulaCursoRespuesta['permisos'];

  hitoSeleccionado:
    HitoAula | null;

  seleccionarHito: (
    hito:
      HitoAula,
  ) => void;

  recargarAula:
    () => Promise<void>;


  recargarCurso:
    () => Promise<void>;
};

type AulaCursoLayoutProps = {
  rolEsperado:
    RolAula;

  rutaRegreso:
    string;
};

function obtenerSeccionActual(
  pathname:
    string,
): SeccionAula {
  if (
    pathname.includes(
      '/tablon',
    )
  ) {
    return 'tablon';
  }

  if (
    pathname.includes(
      '/foro',
    )
  ) {
    return 'foro';
  }

  if (
    pathname.includes(
      '/tareas',
    )
  ) {
    return 'tareas';
  }

  if (
    pathname.includes(
      '/quizzes',
    )
  ) {
    return 'quizzes';
  }

  if (
    pathname.includes(
      '/calificaciones',
    )
  ) {
    return 'calificaciones';
  }

  if (
    pathname.includes(
      '/estudiantes',
    )
  ) {
    return 'estudiantes';
  }

  if (
    pathname.includes(
      '/grupos',
    )
  ) {
    return 'grupos';
  }

  if (
    pathname.includes(
      '/recursos',
    )
  ) {
    return 'recursos';
  }

  if (
    pathname.includes(
      '/estadisticas',
    )
  ) {
    return 'estadisticas';
  }

  return 'inicio';
}

function obtenerRutaSeccion(
  seccion:
    SeccionAula,
): string {
  return seccion ===
    'inicio'
    ? ''
    : seccion;
}

type SeccionDetalleDependienteHito =
  | 'foro'
  | 'grupos'
  | 'tareas'
  | 'quizzes';

function obtenerDetalleDependienteHito(
  pathname:
    string,
): SeccionDetalleDependienteHito | null {

  if (
    /\/foro\/\d+(?:\/|$)/.test(
      pathname,
    )
  ) {
    return 'foro';
  }


  if (
    /\/grupos\/\d+(?:\/|$)/.test(
      pathname,
    )
  ) {
    return 'grupos';
  }


  if (
    /\/tareas\/\d+(?:\/|$)/.test(
      pathname,
    )
  ) {
    return 'tareas';
  }

  if (
    /\/quizzes\/\d+(?:\/|$)/.test(
      pathname,
    )
  ) {
    return 'quizzes';
  }

  return null;
}

export default function AulaCursoLayout({
  rolEsperado,
  rutaRegreso,
}: AulaCursoLayoutProps) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    cursoId,
  } =
    useParams();

  const cursoIdNumerico =
    cursoId
      ? Number(
          cursoId,
        )
      : null;

  const {
    aula,
    cargando,
    error,
    hitoActual,
    proximoHito,
    hitoInicial,
    recargar,
  } =
    useAulaCurso(
      Number.isInteger(
        cursoIdNumerico,
      )
        ? cursoIdNumerico
        : null,
    );

  const [
    hitoSeleccionadoId,
    setHitoSeleccionadoId,
  ] =
    useState<number | null>(
      null,
    );


  useEffect(
    () => {
      if (
        hitoSeleccionadoId !==
          null ||
        !hitoInicial
      ) {
        return;
      }

      setHitoSeleccionadoId(
        hitoInicial.id,
      );
    },
    [
      hitoInicial,
      hitoSeleccionadoId,
    ],
  );


  useEffect(
    () => {
      if (
        !aula ||
        aula.usuario.rol ===
          rolEsperado
      ) {
        return;
      }

      navigate(
        rutaRegreso,
        {
          replace:
            true,
        },
      );
    },
    [
      aula,
      navigate,
      rolEsperado,
      rutaRegreso,
    ],
  );


  const hitoSeleccionado =
    useMemo(
      () =>
        aula?.planificacion.hitos.find(
          (
            hito,
          ) =>
            hito.id ===
            hitoSeleccionadoId,
        ) ??
        hitoInicial ??
        null,
      [
        aula,
        hitoInicial,
        hitoSeleccionadoId,
      ],
    );


  const seccionActiva =
    useMemo(
      () =>
        obtenerSeccionActual(
          location.pathname,
        ),
      [
        location.pathname,
      ],
    );


  const seleccionarHito =
    (
      hito:
        HitoAula,
    ) => {
      const cambioRealDeHito =
        hito.id !==
        hitoSeleccionado?.id;

      const detalleDependiente =
        obtenerDetalleDependienteHito(
          location.pathname,
        );

      setHitoSeleccionadoId(
        hito.id,
      );

      if (
        !cambioRealDeHito ||
        !detalleDependiente ||
        !cursoIdNumerico
      ) {
        return;
      }

      const prefijoRol =
        location.pathname.startsWith(
          '/docente/',
        )
          ? 'docente'
          : 'estudiante';

      navigate(
        `/${prefijoRol}/cursos/${cursoIdNumerico}/${detalleDependiente}`,
      );
    };

  const cambiarSeccion =
    (
      seccion:
        SeccionAula,
    ) => {
      const ruta =
        obtenerRutaSeccion(
          seccion,
        );

      navigate(
        ruta
          ? ruta
          : '.',
      );
    };


  if (
    cargando &&
    !aula
  ) {
    return (
      <section className="aula-compartida-shell">
        <div className="aula-compartida-state">
          <div className="aula-compartida-state__icono">
            <LoaderCircle
              size={
                25
              }
              className="spin"
            />
          </div>

          <div>
            <strong>
              Cargando aula virtual
            </strong>

            <p>
              Estamos preparando el curso y su planificación académica.
            </p>
          </div>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }


  if (
    error ||
    !aula
  ) {
    return (
      <section className="aula-compartida-shell">
        <div className="aula-compartida-state error">
          <div className="aula-compartida-state__icono">
            <ShieldAlert
              size={
                25
              }
            />
          </div>

          <div>
            <strong>
              No fue posible abrir el aula
            </strong>

            <p>
              {error ||
              'El curso no existe o no está disponible para tu cuenta.'}
            </p>

            <div className="aula-compartida-state__acciones">
              <button
                type="button"
                onClick={() =>
                  void recargar()
                }
              >
                Intentar nuevamente
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  navigate(
                    rutaRegreso,
                  )
                }
              >
                Volver a Mis cursos
              </button>
            </div>
          </div>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }


  const valorAulaContext:
    AulaContextValue = {
      aula,

      curso:
        aula.curso,

      permisos:
        aula.permisos,

      hitoSeleccionado,

      hitoActual,

      proximoHito,

      seleccionarHito,

      recargarAula:
        recargar,

      actualizandoAula:
        cargando &&
        aula !==
          null,
    };


  const contexto:
    AulaCursoOutletContext = {
      aula,

      curso:
        aula.curso,

      permisos:
        aula.permisos,

      hitoSeleccionado,

      seleccionarHito,

      recargarAula:
        recargar,

      recargarCurso:
        recargar,
    };


  const seccionDisponibleSinPlanificacion =
    seccionActiva ===
      'estudiantes' ||
    seccionActiva ===
      'grupos' ||
    seccionActiva ===
      'recursos' ||
    seccionActiva ===
      'estadisticas';

  return (
    <AulaProvider
      value={
        valorAulaContext
      }
    >
      <section className="aula-compartida-shell">
        <EncabezadoCurso
          curso={
            aula.curso
          }
          rol={
            aula.usuario.rol
          }
        />

        {aula.planificacion
          .tienePlanificacion ? (
          <>
            <SelectorHitos
              hitos={
                aula.planificacion.hitos
              }
              hitoSeleccionadoId={
                hitoSeleccionado?.id ??
                null
              }
              onSeleccionar={
                seleccionarHito
              }
            />

            <NavegacionAula
              seccionActiva={
                seccionActiva
              }
              permisos={
                aula.permisos
              }
              onCambiarSeccion={
                cambiarSeccion
              }
            />

            <main className="aula-compartida-content aula-view-transition">
              <Outlet
                context={
                  contexto
                }
              />
            </main>
          </>
        ) : (
          <>
            <NavegacionAula
              seccionActiva={
                seccionActiva
              }
              permisos={
                aula.permisos
              }
              onCambiarSeccion={
                cambiarSeccion
              }
            />

            {!seccionDisponibleSinPlanificacion && (
              <SinPlanificacion
                gestion={
                  aula.curso.gestion
                }
                puedeAdministrar={
                  aula.permisos
                    .puedeAdministrar
                }
                recargando={
                  cargando
                }
                onRecargar={() =>
                  void recargar()
                }
              />
            )}

            {seccionDisponibleSinPlanificacion && (
              <main className="aula-compartida-content aula-view-transition">
                <Outlet
                  context={
                    contexto
                  }
                />
              </main>
            )}
          </>
        )}

        <style>
          {styles}
        </style>
      </section>
    </AulaProvider>
  );
}

const styles = `
  .aula-compartida-shell {
    width: 100%;
    min-width: 0;
    display: grid;
    gap: 18px;
    padding: 0 34px 50px;
    color: var(--app-text);
  }

  .aula-compartida-content {
    min-width: 0;
    min-height: 420px;
    position: relative;
  }

  .aula-view-transition {
    animation:
      aulaEntrada
      160ms
      ease-out;
  }

  @keyframes aulaEntrada {
    from {
      opacity: .76;
      transform:
        translateY(
          3px
        );
    }

    to {
      opacity: 1;
      transform:
        translateY(
          0
        );
    }
  }

  .aula-compartida-state {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .aula-compartida-state.error {
    border-color: var(--app-danger-border);
    background: var(--app-danger-bg);
  }

  .aula-compartida-state__icono {
    width: 49px;
    height: 49px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .aula-compartida-state.error
  .aula-compartida-state__icono {
    color: var(--app-danger);
    background: var(--app-surface);
  }

  .aula-compartida-state strong {
    display: block;
    font-size: 16px;
  }

  .aula-compartida-state p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
  }

  .aula-compartida-state__acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 13px;
  }

  .aula-compartida-state button {
    min-height: 44px;
    padding: 9px 13px;
    border: none;
    border-radius: 11px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    font-family: inherit;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .aula-compartida-state button.secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .spin {
    animation:
      spin
      .8s
      linear
      infinite;
  }

  @keyframes spin {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @media (
    max-width:
      760px
  ) {
    .aula-compartida-shell {
      padding:
        0
        18px
        36px;
    }
  }

  @media (
    max-width:
      520px
  ) {
    .aula-compartida-shell {
      padding:
        0
        12px
        30px;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .aula-view-transition {
      animation: none;
    }
  }
`;