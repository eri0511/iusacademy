import {
  Type,
} from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  CapacidadTarea,
  ComponenteEvaluacion,
  ModalidadNotaTarea,
  ModalidadTarea,
  OrigenGrupoTarea,
  TipoDescuentoRetraso,
  TipoTarea,
} from '../../../generated/prisma/client';

import {
  CrearComponenteTareaDto,
} from './crear-componente-tarea.dto';

export class CrearTareaDto {
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  hitoId!:
    number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titulo!:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  instrucciones?:
    string;

  @IsEnum(
    TipoTarea,
  )
  tipo!:
    TipoTarea;

  /**
   * El backend añade siempre las capacidades obligatorias según el tipo.
   * Este arreglo sirve para capacidades opcionales válidas, por ejemplo
   * permitir adjuntos en una respuesta escrita o redacción jurídica.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(
    CapacidadTarea,
    {
      each:
        true,
    },
  )
  capacidades?:
    CapacidadTarea[];

  @IsOptional()
  @IsObject()
  configuracionTipo?:
    Record<string, unknown>;

  /** Solo se utiliza cuando tipo = MIXTA. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({
    each:
      true,
  })
  @Type(
    () =>
      CrearComponenteTareaDto,
  )
  componentes?:
    CrearComponenteTareaDto[];

  @IsOptional()
  @IsBoolean()
  esCalificable?:
    boolean;

  @IsOptional()
  @IsEnum(
    ComponenteEvaluacion,
  )
  componente?:
    ComponenteEvaluacion;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(1)
  @Max(100)
  puntajeMaximo?:
    number;

  @IsEnum(
    ModalidadTarea,
  )
  modalidad!:
    ModalidadTarea;

  @IsOptional()
  @IsEnum(
    OrigenGrupoTarea,
  )
  origenGrupo?:
    OrigenGrupoTarea;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  conjuntoGrupoId?:
    number;

  @IsOptional()
  @IsEnum(
    ModalidadNotaTarea,
  )
  modalidadNota?:
    ModalidadNotaTarea;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  @Max(100)
  porcentajeNotaGrupal?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  @Max(100)
  porcentajeNotaIndividual?:
    number;

  @IsOptional()
  @IsBoolean()
  requiereRepresentante?:
    boolean;

  @IsDateString()
  fechaApertura!:
    string;

  @IsDateString()
  fechaLimite!:
    string;

  @IsDateString()
  fechaCierre!:
    string;

  @IsOptional()
  @IsBoolean()
  visibleAntesDeApertura?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirRetrasos?:
    boolean;

  @IsOptional()
  @IsDateString()
  fechaMaximaRetraso?:
    string;

  @IsOptional()
  @IsEnum(
    TipoDescuentoRetraso,
  )
  tipoDescuentoRetraso?:
    TipoDescuentoRetraso;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  valorDescuentoRetraso?:
    number;

  @IsOptional()
  @IsBoolean()
  exigirContenidoEditor?:
    boolean;

  @IsOptional()
  @IsBoolean()
  exigirArchivo?:
    boolean;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(20)
  maximoArchivos?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(50)
  tamanioMaximoArchivoMb?:
    number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({
    each:
      true,
  })
  extensionesPermitidas?:
    string[];

  @IsOptional()
  @IsBoolean()
  permitirEditarEntrega?:
    boolean;

  @IsOptional()
  @IsBoolean()
  publicar?:
    boolean;
}
