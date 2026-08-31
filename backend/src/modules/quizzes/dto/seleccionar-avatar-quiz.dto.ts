import { IsIn, IsOptional } from 'class-validator';

export const AVATARES_QUIZ = [
  'BALANZA',
  'CODIGO',
  'TRIBUNAL',
  'PERGAMINO',
  'PLUMA',
  'MAZO',
  'ESCUDO',
  'BIRRETE',
] as const;

export type AvatarQuizCodigo = (typeof AVATARES_QUIZ)[number];

export class SeleccionarAvatarQuizDto {
  @IsOptional()
  @IsIn(AVATARES_QUIZ)
  avatarCodigo?: AvatarQuizCodigo | null;
}
