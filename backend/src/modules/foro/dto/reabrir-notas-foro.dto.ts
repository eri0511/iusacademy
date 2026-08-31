import { IsString, MaxLength } from 'class-validator';

export class ReabrirNotasForoDto {
  @IsString()
  @MaxLength(1200)
  motivo!: string;
}
