export const EVENTO_SESION_EXPIRADA = 'iusacademy-sesion-expirada';

export function notificarSesionExpirada() {
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
}