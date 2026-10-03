const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export class ErrorBiblioteca extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export function crearApiBiblioteca(token: string) {
  async function respuesta(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    let res: Response;
    try {
      res = await fetch(`${API_URL}/biblioteca${path}`, { ...init, headers });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      throw new ErrorBiblioteca(
        "No pudimos conectar con el servidor. Comprueba que el backend esté funcionando.",
        0,
      );
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      if (res.status === 401)
        throw new ErrorBiblioteca(
          "Tu sesión venció. Vuelve a iniciar sesión.",
          401,
        );
      const mensaje =
        error.message ?? error.mensaje ?? "No se pudo completar la operación";
      throw new ErrorBiblioteca(
        Array.isArray(mensaje) ? mensaje.join(". ") : mensaje,
        res.status,
      );
    }
    return res;
  }
  return {
    async get<T>(path: string, signal?: AbortSignal): Promise<T> {
      return (await respuesta(path, { signal })).json();
    },
    async send<T = unknown>(
      path: string,
      method: string,
      body?: unknown,
    ): Promise<T> {
      return (
        await respuesta(path, {
          method,
          ...(body !== undefined
            ? { body: body instanceof FormData ? body : JSON.stringify(body) }
            : {}),
        })
      ).json();
    },
    async archivo(id: number, vista: boolean) {
      return (
        await respuesta(
          `/archivos/${id}/${vista ? "vista-previa" : "descargar"}`,
        )
      ).blob();
    },
  };
}
export type ApiBiblioteca = ReturnType<typeof crearApiBiblioteca>;
