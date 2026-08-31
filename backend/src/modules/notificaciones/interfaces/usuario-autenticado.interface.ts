import { Rol } from '../../../generated/prisma/client';

export type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

export type RequestAutenticada = Express.Request & {
  user: UsuarioAutenticado;
};
