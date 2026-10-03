import { ArrayMinSize, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReordenarTurnosExposicionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  entregaIds!: number[];
}
