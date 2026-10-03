import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  actualizarDiapositivaExposicion,
  actualizarPreguntaExposicion,
  configurarJornadaExposicion,
  finalizarJornadaExposicion,
  finalizarTurnoExposicion,
  iniciarJornadaExposicion,
  iniciarTurnoExposicion,
  generarAnalisisExposicion,
  obtenerAnalisisExposicion,
  obtenerSalaExposicionDocente,
  pausarTurnoExposicion,
  reanudarTurnoExposicion,
  reordenarTurnosExposicion,
} from '../../services/tareas/tareas-exposiciones.service';
import type {
  ConfigurarJornadaExposicionDatos,
  EstadoPreguntaExposicion,
  SalaExposicionDocente,
} from '../../types/tareas/exposiciones.types';

export default function useSalaExposicionDocente(cursoId: number, tareaId: number) {
  const { accessToken } = useAuth();
  const [sala, setSala] = useState<SalaExposicionDocente | null>(null);
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
      const resultado = await obtenerSalaExposicionDocente(token(), cursoId, tareaId);
      setSala(resultado);
      return resultado;
    } catch (causa) {
      const mensaje = causa instanceof Error ? causa.message : 'No fue posible abrir la sala de exposición.';
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
    if (!sala || !['EN_CURSO', 'PAUSADA'].includes(sala.estado)) return;
    const intervalo = window.setInterval(() => {
      void cargar(true).catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(intervalo);
  }, [cargar, sala?.estado]);

  const ejecutar = useCallback(async (accion: (accessToken: string) => Promise<SalaExposicionDocente>) => {
    try {
      setProcesando(true);
      setError(null);
      const resultado = await accion(token());
      setSala(resultado);
      return resultado;
    } catch (causa) {
      const mensaje = causa instanceof Error ? causa.message : 'No fue posible completar la operación.';
      setError(mensaje);
      throw causa;
    } finally {
      setProcesando(false);
    }
  }, [token]);

  const refrescarDespues = useCallback(async <T,>(accion: (accessToken: string) => Promise<T>) => {
    try {
      setProcesando(true);
      setError(null);
      const resultado = await accion(token());
      await cargar(true);
      return resultado;
    } catch (causa) {
      const mensaje = causa instanceof Error ? causa.message : 'No fue posible completar la operación.';
      setError(mensaje);
      throw causa;
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
    configurar: (datos: ConfigurarJornadaExposicionDatos) => ejecutar((t) => configurarJornadaExposicion(t, cursoId, tareaId, datos)),
    reordenar: (jornadaId: number, entregaIds: number[]) => ejecutar((t) => reordenarTurnosExposicion(t, cursoId, tareaId, jornadaId, entregaIds)),
    iniciarJornada: (jornadaId: number) => ejecutar((t) => iniciarJornadaExposicion(t, cursoId, tareaId, jornadaId)),
    finalizarJornada: (jornadaId: number) => ejecutar((t) => finalizarJornadaExposicion(t, cursoId, tareaId, jornadaId)),
    iniciarTurno: (jornadaId: number, turnoId: number) => ejecutar((t) => iniciarTurnoExposicion(t, cursoId, tareaId, jornadaId, turnoId)),
    pausarTurno: (jornadaId: number, turnoId: number) => ejecutar((t) => pausarTurnoExposicion(t, cursoId, tareaId, jornadaId, turnoId)),
    reanudarTurno: (jornadaId: number, turnoId: number) => ejecutar((t) => reanudarTurnoExposicion(t, cursoId, tareaId, jornadaId, turnoId)),
    finalizarTurno: (jornadaId: number, turnoId: number) => ejecutar((t) => finalizarTurnoExposicion(t, cursoId, tareaId, jornadaId, turnoId)),
    cambiarDiapositiva: (jornadaId: number, turnoId: number, diapositiva: number) => refrescarDespues((t) => actualizarDiapositivaExposicion(t, cursoId, tareaId, jornadaId, turnoId, diapositiva)),
    actualizarPregunta: (preguntaId: number, datos: { estado?: EstadoPreguntaExposicion; destacada?: boolean }) => refrescarDespues((t) => actualizarPreguntaExposicion(t, cursoId, tareaId, preguntaId, datos)),
    obtenerAnalisis: (jornadaId: number, turnoId: number) => obtenerAnalisisExposicion(token(), cursoId, tareaId, jornadaId, turnoId),
    generarAnalisis: (jornadaId: number, turnoId: number) => generarAnalisisExposicion(token(), cursoId, tareaId, jornadaId, turnoId),
  };
}
