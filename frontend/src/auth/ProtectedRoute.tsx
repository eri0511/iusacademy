import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './AuthContext';

import type {
  Rol,
} from './auth.types';

type ProtectedRouteProps = {
  rolesPermitidos?: Rol[];
};

export function rutaInicioPorRol(
  rol: Rol,
): string {
  switch (rol) {
    case 'ADMINISTRADOR':
      return '/admin';

    case 'DOCENTE':
      return '/docente';

    case 'ESTUDIANTE':
      return '/estudiante';

    default:
      return '/login';
  }
}

export default function ProtectedRoute({
  rolesPermitidos,
}: ProtectedRouteProps) {
  const location =
    useLocation();

  const {
    sesion,
    estaAutenticado,
  } = useAuth();

  if (
    !estaAutenticado ||
    !sesion
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          desde:
            location.pathname,
        }}
      />
    );
  }

  const tieneRolPermitido =
    !rolesPermitidos ||
    rolesPermitidos.includes(
      sesion.usuario.rol,
    );

  if (!tieneRolPermitido) {
    return (
      <Navigate
        to={rutaInicioPorRol(
          sesion.usuario.rol,
        )}
        replace
      />
    );
  }

  return <Outlet />;
}