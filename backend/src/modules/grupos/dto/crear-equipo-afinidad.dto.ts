import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearEquipoAfinidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  descripcion?:
    string;

  /*
   * Se envían únicamente los compañeros elegidos.
   * El creador se agrega automáticamente al equipo.
   * El nombre del grupo lo genera el backend.
   */
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({
    each:
      true,
  })
  @Min(
    1,
    {
      each:
        true,
    },
  )
  integrantesIds!:
    number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  representanteId?:
    number;
}