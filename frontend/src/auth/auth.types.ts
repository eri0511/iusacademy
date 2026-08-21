export type Rol =
  | 'ADMINISTRADOR'
  | 'DOCENTE'
  | 'ESTUDIANTE';

export type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
};

export type Sesion = {
  accessToken: string;
  usuario: UsuarioAutenticado;
};

export type RespuestaLogin = {
  mensaje: string;
  accessToken: string;
  usuario: UsuarioAutenticado;
};

export type CredencialesLogin = {
  correo: string;
  password: string;
};