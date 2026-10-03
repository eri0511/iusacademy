import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import {
  CategoriaBiblioteca,
  EstadoRecursoBiblioteca,
  VigenciaBiblioteca,
  EstadoReporteBiblioteca,
} from '../../../generated/prisma/client';

export class CrearRecursoBibliotecaDto {
  @IsString() @MinLength(3) @MaxLength(200) titulo!: string;
  @IsString() @MinLength(10) @MaxLength(5000) descripcion!: string;
  @IsOptional() @IsString() @MaxLength(3000) finalidad?: string;
  @IsEnum(CategoriaBiblioteca) categoria!: CategoriaBiblioteca;
  @IsString() @MinLength(2) @MaxLength(120) tema!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  etiquetas?: string[];
  @IsOptional() @IsString() @MaxLength(250) autorInstitucion?: string;
  @IsOptional() @IsString() @MaxLength(1000) fuente?: string;
  @IsOptional() @IsDateString() fechaDocumento?: string;
  @IsOptional() @IsString() @MaxLength(100) numeroNorma?: string;
  @IsOptional() @IsString() @MaxLength(250) tribunal?: string;
  @IsOptional() @IsString() @MaxLength(100) numeroResolucion?: string;
  @IsOptional() @IsEnum(VigenciaBiblioteca) vigencia?: VigenciaBiblioteca;
  @IsOptional() @IsString() @MaxLength(2000) observacionVigencia?: string;
  @IsOptional() @IsBoolean() destacado?: boolean;
}
export class ActualizarRecursoBibliotecaDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(200) titulo?: string;
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  descripcion?: string;
  @IsOptional() @IsString() @MaxLength(3000) finalidad?: string;
  @IsOptional() @IsEnum(CategoriaBiblioteca) categoria?: CategoriaBiblioteca;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) tema?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  etiquetas?: string[];
  @IsOptional() @IsString() @MaxLength(250) autorInstitucion?: string;
  @IsOptional() @IsString() @MaxLength(1000) fuente?: string;
  @IsOptional() @IsDateString() fechaDocumento?: string;
  @IsOptional() @IsString() @MaxLength(100) numeroNorma?: string;
  @IsOptional() @IsString() @MaxLength(250) tribunal?: string;
  @IsOptional() @IsString() @MaxLength(100) numeroResolucion?: string;
  @IsOptional() @IsEnum(VigenciaBiblioteca) vigencia?: VigenciaBiblioteca;
  @IsOptional() @IsString() @MaxLength(2000) observacionVigencia?: string;
  @IsOptional() @IsBoolean() destacado?: boolean;
}
export class ConsultarBibliotecaDto {
  @IsOptional() @IsString() @MaxLength(200) q?: string;
  @IsOptional() @IsEnum(CategoriaBiblioteca) categoria?: CategoriaBiblioteca;
  @IsOptional() @IsString() @MaxLength(120) tema?: string;
  @IsOptional()
  @IsEnum(EstadoRecursoBiblioteca)
  estado?: EstadoRecursoBiblioteca;
  @IsOptional() @IsIn(['pdf', 'doc', 'docx', 'enlace']) formato?: string;
  @IsOptional() @IsIn(['recientes', 'titulo', 'antiguos']) orden?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  anio?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limite: number =
    12;
}
export class EstadoBibliotecaDto {
  @IsEnum(EstadoRecursoBiblioteca) estado!: EstadoRecursoBiblioteca;
}
export class EnlaceBibliotecaDto {
  @IsString() @MinLength(2) @MaxLength(200) titulo!: string;
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  url!: string;
}
export class ArchivoBibliotecaDto {
  @IsString() @MinLength(2) @MaxLength(200) titulo!: string;
  @IsOptional() @IsString() @MaxLength(1000) motivoActualizacion?: string;
}
export class ColeccionBibliotecaDto {
  @IsString() @MinLength(2) @MaxLength(100) nombre!: string;
  @IsOptional() @IsString() @MaxLength(1000) descripcion?: string;
}
export class ReportarBibliotecaDto {
  @IsString() @MinLength(10) @MaxLength(2000) motivo!: string;
}
export class AtenderReporteBibliotecaDto {
  @IsEnum(EstadoReporteBiblioteca) estado!: EstadoReporteBiblioteca;
  @IsString() @MinLength(3) @MaxLength(2000) respuesta!: string;
}
export class RelacionesBibliotecaDto {
  @IsArray()
  @ArrayMaxSize(30)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}
