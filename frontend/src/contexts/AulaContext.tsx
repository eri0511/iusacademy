import {
  createContext,
  useContext,
} from 'react';

import type {
  AulaCursoRespuesta,
  HitoAula,
} from '../types/aula/aulaCurso.types';

export type AulaContextValue = {
  aula: AulaCursoRespuesta;
  curso: AulaCursoRespuesta['curso'];
  permisos: AulaCursoRespuesta['permisos'];

  hitoSeleccionado: HitoAula | null;
  hitoActual: HitoAula | null;
  proximoHito: HitoAula | null;

  seleccionarHito: (
    hito:
      HitoAula,
  ) => void;

  recargarAula: () => Promise<void>;

  /*
   * Indica que el aula se está actualizando
   * sin ocultar el contenido ya visible.
   */
  actualizandoAula: boolean;
};

const AulaContext =
  createContext<AulaContextValue | null>(
    null,
  );

type AulaProviderProps = {
  value: AulaContextValue;
  children: React.ReactNode;
};

export function AulaProvider({
  value,
  children,
}: AulaProviderProps) {
  return (
    <AulaContext.Provider
      value={
        value
      }
    >
      {children}
    </AulaContext.Provider>
  );
}

export function useAulaContext(): AulaContextValue {
  const contexto =
    useContext(
      AulaContext,
    );

  if (!contexto) {
    throw new Error(
      'useAulaContext debe utilizarse dentro de AulaProvider.',
    );
  }

  return contexto;
}

export default AulaContext;