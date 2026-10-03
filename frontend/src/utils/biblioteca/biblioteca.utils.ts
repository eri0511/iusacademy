export const fecha = (valor?: string) =>
  valor
    ? new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(
        new Date(valor),
      )
    : "Sin fecha";
export const nombre = (persona: {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
}) =>
  [persona.nombres, persona.apellidoPaterno, persona.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
