/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Administrador' | 'Empleado' | 'Autoservicio';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  whatsapp: string;
  direccion?: string;
  observaciones?: string;
  fechaRegistro: string;
}

export interface Vehiculo {
  matricula: string; // Patente o patente de auto
  marca: string;
  modelo: string;
  color: string;
  anio: number;
  clienteId: string; // Relación con Cliente
  fotosUrl: string[];
}

export type ReservaEstado = 'Reservado' | 'En proceso' | 'Finalizado' | 'Cancelado';

export interface Reserva {
  id: string;
  clienteId: string;
  vehiculoMatricula: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  servicioSol: string; // Tipo de servicio solicitado
  estado: ReservaEstado;
  observaciones?: string;
}

export type FormaPago = 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Mercado Pago' | 'Otro';

export interface ServicioRealizado {
  id: string;
  fecha: string; // YYYY-MM-DD HH:MM
  clienteId: string;
  vehiculoMatricula: string;
  tipo: string; // Lavado básico, Lavado premium, etc.
  precio: number;
  formaPago: FormaPago;
  observaciones?: string;
  fotosAntes: string[];
  fotosDespues: string[];
}

export type GastoCategoria = 'Productos de limpieza' | 'Combustible' | 'Herramientas' | 'Mantenimiento' | 'Otros';

export interface Gasto {
  id: string;
  fecha: string; // YYYY-MM-DD
  categoria: GastoCategoria;
  descripcion: string;
  monto: number;
}

export interface CatalogoServicio {
  id: string;
  tipo: string;
  precio: number;
  descripcion?: string;
}

export interface DatabaseState {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  reservas: Reserva[];
  servicios: ServicioRealizado[];
  gastos: Gasto[];
  serviciosCatalogo: CatalogoServicio[];
  currentRole: UserRole;
  currentUserId: string;
  adminPassword?: string;
}
