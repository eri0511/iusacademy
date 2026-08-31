import { Rol } from '../../../generated/prisma/client';

export interface UsuarioAutenticado {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
}
