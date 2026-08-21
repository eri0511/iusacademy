import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

const booleano = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

export class CambiarVisibilidadRecursoDto {
  @Transform(booleano)
  @IsBoolean()
  visibleParaEstudiantes!: boolean;
}
