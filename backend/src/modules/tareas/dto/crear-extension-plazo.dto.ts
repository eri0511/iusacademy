import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearExtensionPlazoDto {
  @IsArray()
  @IsInt({ each: true })
  estudianteIds!: number[];

  @IsOptional()
  @IsDateString()
  fechaAperturaExtendida?: string;

  @IsOptional()
  @IsDateString()
  fechaLimiteExtendida?: string;

  @IsOptional()
  @IsDateString()
  fechaMaximaRetrasoExtendida?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
