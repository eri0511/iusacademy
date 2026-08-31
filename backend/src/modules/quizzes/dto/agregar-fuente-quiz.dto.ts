import { Type } from 'class-transformer';

import { IsInt, Min } from 'class-validator';

export class AgregarFuenteQuizDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  versionId!: number;
}
