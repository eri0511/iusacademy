import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CrearEquipoAfinidadTareaDto {
  /*
   * Se envían únicamente los compañeros elegidos.
   * El creador se agrega automáticamente y queda
   * como representante inicial.
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

  /*
   * Se conserva por compatibilidad futura con frontend,
   * pero durante la creación solamente puede ser el creador.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  representanteId?:
    number;
}