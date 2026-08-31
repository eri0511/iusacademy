import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type AjusteIndividualTareaDto = {
  estudianteId: number;

  ajuste: number;
};

export class CalificarEntregaTareaDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  notaBase!: number;

  @IsOptional()
  @IsArray()
  ajustesIndividuales?: AjusteIndividualTareaDto[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  retroalimentacion?: string;
}
