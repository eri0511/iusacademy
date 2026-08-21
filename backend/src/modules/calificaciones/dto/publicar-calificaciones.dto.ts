import {
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class PublicarCalificacionesDto {
  @IsOptional()
  @IsBoolean()
  publicarActividad?:
    boolean;
}
