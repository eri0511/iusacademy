import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  actualizarDiapositivaExposicionEstudiante,
  crearPreguntaExposicion,
  obtenerSalaExposicionEstudiante,
  tomarControlPresentacionEstudiante,
  quitarVotoPreguntaExposicion,
  votarPreguntaExposicion,
} from '../../services/tareas/tareas-exposiciones.service';
import type { SalaExposicionEstudiante } from '../../types/tareas/exposiciones.types';

export default function useSalaExposicionEstudiante(cursoId: number, tareaId: number) {
  const { accessToken } = useAuth();
  const [sala, setSala] = useState<SalaExposicionEstudiante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useCallback(() => {
    if (!accessToken) throw new Error('Tu sesión terminó. Inicia sesión nuevamente.');
    if (!cursoId || !tareaId) throw new Error('La exposición solicitada no es válida.');
    return accessToken;
  }, [accessToken, cursoId, tareaId]);

  const cargar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      const resultado = await obtenerSalaExposicionEstudiante(token(), cursoId, tareaId);
      setSala(resultado);
      return resultado;
    } catch (causa) {
      const mensaje = causa instanceof Error ? causa.message : 'No se pudo abrir la sala de exposición.';
      setError(mensaje);
      throw causa;
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [cursoId, tareaId, token]);

  useEffect(() => {
    void cargar().catch(() => undefined);
  }, [cargar]);

  useEffect(() => {
    if (!sala || !['LISTA', 'EN_CURSO', 'PAUSADA'].includes(sala.estado)) return;
    const intervalo = window.setInterval(() => {
      void cargar(true).catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(intervalo);
  }, [cargar, sala?.estado]);

  const ejecutar = useCallback(async <T,>(accion: (t: string) => Promise<T>) => {
    try {
      setProcesando(true);
      setError(null);
      const resultado = await accion(token());
      await cargar(true);
      return resultado;
    } finally {
      setProcesando(false);
    }
  }, [cargar, token]);

  return {
    sala,
    cargando,
    procesando,
    error,
    cargar,
    presentar: (jornadaId: number, turnoId: number) =>
      ejecutar((t) =>
        tomarControlPresentacionEstudiante(
          t,
          cursoId,
          tareaId,
          jornadaId,
          turnoId,
        ),
      ),
    cambiarDiapositiva: (
      jornadaId: number,
      turnoId: number,
      diapositiva: number,
    ) =>
      ejecutar((t) =>
        actualizarDiapositivaExposicionEstudiante(
          t,
          cursoId,
          tareaId,
          jornadaId,
          turnoId,
          diapositiva,
        ),
      ),
    preguntar: (turnoId: number, contenido: string) =>
      ejecutar((t) =>
        crearPreguntaExposicion(t, cursoId, tareaId, turnoId, contenido),
      ),
    votar: (preguntaId: number) => ejecutar((t) => votarPreguntaExposicion(t, cursoId, tareaId, preguntaId)),
    quitarVoto: (preguntaId: number) => ejecutar((t) => quitarVotoPreguntaExposicion(t, cursoId, tareaId, preguntaId)),
  };
}
