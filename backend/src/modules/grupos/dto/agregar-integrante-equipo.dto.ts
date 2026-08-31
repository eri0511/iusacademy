import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class AgregarIntegranteEquipoDto {
  @IsInt()
  @Min(1)
  estudianteId!: number;

  @IsOptional()
  @IsBoolean()
  esRepresentante?: boolean;
}
