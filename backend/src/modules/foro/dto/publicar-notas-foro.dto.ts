import {
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class PublicarNotasForoDto {
  @IsOptional()
  @IsBoolean()
  permitirPendientes?:
    boolean;
}
