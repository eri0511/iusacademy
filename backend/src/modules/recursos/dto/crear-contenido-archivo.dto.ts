import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const booleano = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

export class CrearContenidoArchivoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;

  @Transform(booleano)
  @IsBoolean()
  disponibleParaQuiz!: boolean;
}
