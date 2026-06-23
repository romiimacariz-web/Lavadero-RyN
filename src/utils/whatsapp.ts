/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WhatsAppTemplateData {
  nombre: string;
  fecha?: string;
  hora?: string;
  vehiculoInfo?: string;
}

export const getConfirmationMessage = (data: WhatsAppTemplateData): string => {
  return `Hola ${data.nombre}, confirmamos tu reserva en Lavadero RyN para el día ${data.fecha || ''} a las ${data.hora || ''}.`;
};

export const getVehicleReadyMessage = (data: WhatsAppTemplateData): string => {
  return `Hola ${data.nombre}, tu vehículo ya está listo para retirar. Gracias por elegir Lavadero RyN. 🚗✨`;
};

export const getInactiveGreetingMessage = (data: WhatsAppTemplateData): string => {
  return `Hola ${data.nombre}, hace más de 30 días de tu último lavado. ¡Te esperamos nuevamente en Lavadero RyN!`;
};

export function getWhatsAppHref(telefono: string, message: string): string {
  // Format phone number (remove +, spaces, and prefix with 54 for Argentina if necessary, or just clean it)
  const cleanedPhone = telefono.replace(/[+\s\-()]/g, '');
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
