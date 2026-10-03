import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { MetodoOrdenExposicion } from '../../../generated/prisma/client';

export class ConfigurarJornadaExposicionDto {
  @IsEnum(MetodoOrdenExposicion)
  metodoOrden!: MetodoOrdenExposicion;

  @IsInt()
  @Min(60)
  @Max(14400)
  duracionSegundos!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  avisoSegundos?: number;

  @IsOptional()
  @IsBoolean()
  permitirTiempoExtra?: boolean;

  @IsOptional()
  @IsBoolean()
  mostrarSiguiente?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  ordenManualEntregaIds?: number[];
}
