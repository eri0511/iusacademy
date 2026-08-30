import {
  BookOpenText,
  Feather,
  Gavel,
  GraduationCap,
  Landmark,
  Scale,
  ScrollText,
  Shield,
  type LucideIcon,
} from 'lucide-react';

import type {
  AvatarQuizCodigo,
} from '../../types/quizzes/avatar-quiz.types';

type Props = {
  codigo?:
    AvatarQuizCodigo |
    null;

  iniciales:
    string;

  size?:
    number;
};

const iconos:
  Record<
    AvatarQuizCodigo,
    LucideIcon
  > = {
    BALANZA:
      Scale,

    CODIGO:
      BookOpenText,

    TRIBUNAL:
      Landmark,

    PERGAMINO:
      ScrollText,

    PLUMA:
      Feather,

    MAZO:
      Gavel,

    ESCUDO:
      Shield,

    BIRRETE:
      GraduationCap,
  };

export default function AvatarQuiz({
  codigo,
  iniciales,
  size = 22,
}: Props) {
  if (
    !codigo
  ) {
    return (
      <span className="avatar-quiz__iniciales">
        {iniciales}
      </span>
    );
  }

  const Icono =
    iconos[
      codigo
    ];

  return (
    <Icono
      size={
        size
      }
      strokeWidth={
        1.9
      }
    />
  );
}

export function nombreAvatarQuiz(
  codigo:
    AvatarQuizCodigo,
) {
  const nombres:
    Record<
      AvatarQuizCodigo,
      string
    > = {
      BALANZA:
        'Balanza',

      CODIGO:
        'Código',

      TRIBUNAL:
        'Tribunal',

      PERGAMINO:
        'Pergamino',

      PLUMA:
        'Pluma',

      MAZO:
        'Mazo',

      ESCUDO:
        'Escudo',

      BIRRETE:
        'Birrete',
    };

  return nombres[
    codigo
  ];
}