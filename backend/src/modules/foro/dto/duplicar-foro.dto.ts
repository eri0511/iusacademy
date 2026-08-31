import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class DuplicarForoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsBoolean()
  conservarFechas?: boolean;

  @IsOptional()
  @IsBoolean()
  conservarGrupo?: boolean;
}
