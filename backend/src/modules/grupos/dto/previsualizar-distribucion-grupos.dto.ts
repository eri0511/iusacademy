import { IsEnum, IsInt, Max, Min, ValidateIf } from 'class-validator';

import { CriterioDistribucionGrupo } from '../../../generated/prisma/client';

export class PrevisualizarDistribucionGruposDto {
  @IsEnum(CriterioDistribucionGrupo, {
    message: 'El criterio de distribución no es válido',
  })
  criterio!: CriterioDistribucionGrupo;

  @ValidateIf(
    (objeto: PrevisualizarDistribucionGruposDto) =>
      objeto.criterio === CriterioDistribucionGrupo.CANTIDAD_GRUPOS,
  )
  @IsInt({
    message: 'La cantidad de grupos debe ser un número entero',
  })
  @Min(2, {
    message: 'Debes solicitar al menos 2 grupos',
  })
  @Max(100, {
    message: 'No puedes solicitar más de 100 grupos',
  })
  cantidadGrupos?: number;

  @ValidateIf(
    (objeto: PrevisualizarDistribucionGruposDto) =>
      objeto.criterio === CriterioDistribucionGrupo.INTEGRANTES_POR_GRUPO,
  )
  @IsInt({
    message: 'La cantidad de integrantes debe ser un número entero',
  })
  @Min(2, {
    message: 'Cada grupo debe tener al menos 2 integrantes',
  })
  @Max(100, {
    message: 'Un grupo no puede tener más de 100 integrantes',
  })
  integrantesPorGrupo?: number;
}
