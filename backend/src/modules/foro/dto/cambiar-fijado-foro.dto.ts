import {
  IsBoolean,
} from 'class-validator';

export class CambiarFijadoForoDto {
  @IsBoolean()
  estaFijado!:
    boolean;
}
