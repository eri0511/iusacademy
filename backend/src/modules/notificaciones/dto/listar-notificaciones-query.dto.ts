import { Transform, Type } from 'class-transformer';

import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListarNotificacionesQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value === 'true';
  })
  @IsBoolean()
  esLeida?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}
