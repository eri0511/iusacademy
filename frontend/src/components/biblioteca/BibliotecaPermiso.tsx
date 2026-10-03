import { Navigate, Outlet } from "react-router-dom";
import { useBiblioteca } from "../../contexts/BibliotecaContext";

export default function BibliotecaPermiso({
  soloAdmin = false,
}: {
  soloAdmin?: boolean;
}) {
  const { base, capacidades } = useBiblioteca();
  const permitido = soloAdmin
    ? capacidades.puedeDelegar
    : capacidades.puedeGestionar;
  return permitido ? <Outlet /> : <Navigate to={base} replace />;
}

export function BibliotecaRegreso() {
  const { base } = useBiblioteca();
  return <Navigate to={base} replace />;
}
