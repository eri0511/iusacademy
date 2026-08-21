import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GuardarEntregaTareaDto {
  @IsOptional()
  @IsString()
  @MaxLength(
    50000,
  )
  contenido?:
    string;
}