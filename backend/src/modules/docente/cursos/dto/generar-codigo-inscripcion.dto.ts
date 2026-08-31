import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { Type } from 'class-transformer';

export class GenerarCodigoInscripcionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Los días de vigencia deben ser un número entero',
  })
  @Min(1, {
    message: 'El código debe tener al menos 1 día de vigencia',
  })
  @Max(30, {
    message: 'El código no puede superar los 30 días de vigencia',
  })
  diasVigencia?: number;
}
