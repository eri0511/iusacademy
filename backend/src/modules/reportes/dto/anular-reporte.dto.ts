import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AnularReporteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(300)
  motivo!: string;
}
