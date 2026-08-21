import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  apellidoMaterno?: string;
}