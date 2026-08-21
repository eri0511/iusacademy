export type ArchivoParaGuardar = {
  buffer:
    Buffer;

  nombreOriginal:
    string;

  extension:
    string;

  carpeta:
    string;
};

export type ArchivoGuardado = {
  nombreAlmacenado:
    string;

  rutaAbsoluta:
    string;

  rutaRelativa:
    string;

  urlPublica:
    string;
};

export abstract class AlmacenamientoArchivos {
  abstract guardar(
    archivo:
      ArchivoParaGuardar,
  ):
    Promise<ArchivoGuardado>;

  abstract eliminar(
    rutaRelativa:
      string,
  ):
    Promise<void>;

  abstract leer(
    rutaRelativa:
      string,
  ):
    Promise<Buffer>;
}
