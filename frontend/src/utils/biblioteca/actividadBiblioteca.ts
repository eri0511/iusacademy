import type { Recurso } from "../../types/biblioteca/biblioteca.types";
export type ActividadBiblioteca = {
  id: number;
  titulo: string;
  categoria: Recurso["categoria"];
  fecha: string;
  archivo?: string;
};
export function leerActividad(
  usuario: number,
  tipo: "consulta" | "descarga",
): ActividadBiblioteca[] {
  try {
    const datos: unknown = JSON.parse(
      localStorage.getItem(`iusacademy_biblioteca_${usuario}_${tipo}`) ?? "[]",
    );
    return Array.isArray(datos)
      ? datos.filter(
          (r): r is ActividadBiblioteca =>
            r &&
            Number.isInteger(r.id) &&
            typeof r.titulo === "string" &&
            typeof r.categoria === "string" &&
            typeof r.fecha === "string" &&
            Number.isFinite(Date.parse(r.fecha)),
        )
      : [];
  } catch {
    return [];
  }
}
export function registrarActividad(
  usuario: number | undefined,
  tipo: "consulta" | "descarga",
  recurso: Recurso,
  archivo?: string,
) {
  if (usuario === undefined) return;
  try {
    const registro: ActividadBiblioteca = {
      id: recurso.id,
      titulo: recurso.titulo,
      categoria: recurso.categoria,
      fecha: new Date().toISOString(),
      ...(archivo ? { archivo } : {}),
    };
    const anteriores = leerActividad(usuario, tipo).filter(
      (r) =>
        r.id !== recurso.id || (tipo === "descarga" && r.archivo !== archivo),
    );
    localStorage.setItem(
      `iusacademy_biblioteca_${usuario}_${tipo}`,
      JSON.stringify([registro, ...anteriores].slice(0, 100)),
    );
  } catch {
    /* La navegación y la descarga siguen funcionando sin almacenamiento. */
  }
}
