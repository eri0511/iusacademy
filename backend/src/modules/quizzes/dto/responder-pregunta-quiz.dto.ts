import { Type } from 'class-transformer';

import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class ResponderPreguntaQuizDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  preguntaId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  opcionIds!: number[];
}
