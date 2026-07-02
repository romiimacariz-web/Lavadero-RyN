/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, Cliente, Vehiculo, Reserva, ServicioRealizado, Gasto, UserRole, CatalogoServicio } from './types';

// Seed data to make the app incredibly visual and functional upfront!
const initialClientes: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'Carlos Mendoza',
    telefono: '+5491155443322',
    whatsapp: '+5491155443322',
    direccion: 'Av. Libertador 4500, Palermo',
    observaciones: 'Cliente frecuente, prefiere jabón con silicona y cuidado especial en llantas.',
    fechaRegistro: '2026-05-15'
  },
  {
    id: 'cli-2',
    nombre: 'Mariela Santos',
    telefono: '+5491133221100',
    whatsapp: '+5491133221100',
    direccion: 'Juramento 2100, Belgrano',
    observaciones: 'Suele pedir lavado premium y cera. Auto de fines de semana.',
    fechaRegistro: '2026-05-20'
  },
  {
    id: 'cli-3',
    nombre: 'Javier Rodríguez',
    telefono: '+5491166778899',
    whatsapp: '+5491166778899',
    direccion: 'Scalabrini Ortiz 1200, Villa Crespo',
    observaciones: 'Siempre en efectivo o Mercado Pago.',
    fechaRegistro: '2026-06-01'
  },
  {
    id: 'cli-4',
    nombre: 'Sofía Martínez',
    telefono: '+5491122334455',
    whatsapp: '+5491122334455',
    observaciones: 'Cliente de paso para lavado rápido de motor.',
    fechaRegistro: '2026-06-18'
  }
];

const initialVehiculos: Vehiculo[] = [
  {
    matricula: 'AA123BC',
    marca: 'Toyota',
    modelo: 'Hilux',
    color: 'Gris Plata',
    anio: 2022,
    clienteId: 'cli-1',
    fotosUrl: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    matricula: 'AG345DS',
    marca: 'Ford',
    modelo: 'Fiesta',
    color: 'Negro Perlado',
    anio: 2019,
    clienteId: 'cli-2',
    fotosUrl: ['https://images.unsplash.com/photo-1498887960847-2a5e46312788?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    matricula: 'KLO456',
    marca: 'Volkswagen',
    modelo: 'Golf GTI',
    color: 'Rojo Tornado',
    anio: 2017,
    clienteId: 'cli-3',
    fotosUrl: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    matricula: 'AE987YF',
    marca: 'Audi',
    modelo: 'A4',
    color: 'Azul Marino',
    anio: 2021,
    clienteId: 'cli-2',
    fotosUrl: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  }
];

// Helper to calculate relative dates helper so today always has bookings
const getRelativeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const initialReservas: Reserva[] = [
  {
    id: 'res-1',
    clienteId: 'cli-1',
    vehiculoMatricula: 'AA123BC',
    fecha: getRelativeDate(0), // hoy
    hora: '10:00',
    servicioSol: 'Lavado premium',
    estado: 'Lavando',
    observaciones: 'Hacer hincapié en el tapizado.'
  },
  {
    id: 'res-2',
    clienteId: 'cli-2',
    vehiculoMatricula: 'AG345DS',
    fecha: getRelativeDate(0), // hoy
    hora: '14:30',
    servicioSol: 'Lavado con cera',
    estado: 'Reservado'
  },
  {
    id: 'res-3',
    clienteId: 'cli-3',
    vehiculoMatricula: 'KLO456',
    fecha: getRelativeDate(1), // mañana
    hora: '09:00',
    servicioSol: 'Lavado de motor',
    estado: 'Reservado',
    observaciones: 'Lavar con desengrasante biodegradable.'
  },
  {
    id: 'res-4',
    clienteId: 'cli-4',
    vehiculoMatricula: 'AA123BC',
    fecha: getRelativeDate(-1), // ayer
    hora: '16:00',
    servicioSol: 'Aspirado',
    estado: 'Finalizado'
  }
];

// Seed some recent services completed over the past few weeks to populate reports
const initialServicios: ServicioRealizado[] = [
  {
    id: 'srv-1',
    fecha: `${getRelativeDate(0)} 09:15`,
    clienteId: 'cli-1',
    vehiculoMatricula: 'AA123BC',
    tipo: 'Lavado premium',
    precio: 15400,
    formaPago: 'Efectivo',
    observaciones: 'Lavado completo interior y exterior, siliconado.',
    fotosAntes: ['https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    fotosDespues: ['https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    id: 'srv-2',
    fecha: `${getRelativeDate(-1)} 11:30`,
    clienteId: 'cli-2',
    vehiculoMatricula: 'AG345DS',
    tipo: 'Lavado básico',
    precio: 8500,
    formaPago: 'Mercado Pago',
    observaciones: 'Rápido, solo exterior.',
    fotosAntes: ['https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    fotosDespues: ['https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  },
  {
    id: 'srv-3',
    fecha: `${getRelativeDate(-2)} 15:45`,
    clienteId: 'cli-3',
    vehiculoMatricula: 'KLO456',
    tipo: 'Lavado de motor',
    precio: 12000,
    formaPago: 'Transferencia',
    observaciones: 'Cuidado extremo con sensores electrónicos.',
    fotosAntes: [],
    fotosDespues: []
  },
  {
    id: 'srv-4',
    fecha: `${getRelativeDate(-4)} 10:00`,
    clienteId: 'cli-1',
    vehiculoMatricula: 'AA123BC',
    tipo: 'Lavado con cera',
    precio: 11000,
    formaPago: 'Efectivo',
    observaciones: 'Cera de carnauba aplicada a mano.',
    fotosAntes: [],
    fotosDespues: []
  },
  {
    id: 'srv-5',
    fecha: `${getRelativeDate(-8)} 14:00`,
    clienteId: 'cli-2',
    vehiculoMatricula: 'AE987YF',
    tipo: 'Lavado premium',
    precio: 15400,
    formaPago: 'Tarjeta de Crédito',
    observaciones: 'Lavado a detalle, remoción de resina.',
    fotosAntes: [],
    fotosDespues: []
  },
  // Previous month data for month charts
  {
    id: 'srv-6',
    fecha: `2026-05-18 10:30`,
    clienteId: 'cli-1',
    vehiculoMatricula: 'AA123BC',
    tipo: 'Lavado premium',
    precio: 15000,
    formaPago: 'Efectivo',
    observaciones: 'Servicio recurrente mensual.',
    fotosAntes: [],
    fotosDespues: []
  },
  {
    id: 'srv-7',
    fecha: `2026-05-22 16:15`,
    clienteId: 'cli-2',
    vehiculoMatricula: 'AG345DS',
    tipo: 'Lavado básico',
    precio: 8000,
    formaPago: 'Tarjeta de Débito',
    observaciones: '',
    fotosAntes: [],
    fotosDespues: []
  },
  {
    id: 'srv-8',
    fecha: `2026-05-28 11:00`,
    clienteId: 'cli-3',
    vehiculoMatricula: 'KLO456',
    tipo: 'Lavado con cera',
    precio: 11000,
    formaPago: 'Mercado Pago',
    observaciones: '',
    fotosAntes: [],
    fotosDespues: []
  }
];

const initialGastos: Gasto[] = [
  {
    id: 'gst-1',
    fecha: getRelativeDate(0), // hoy
    categoria: 'Productos de limpieza',
    descripcion: 'Compra de shampoo biodegradable 20L y ceras líquidas',
    monto: 3200
  },
  {
    id: 'gst-2',
    fecha: getRelativeDate(-2),
    categoria: 'Combustible',
    descripcion: 'Nafta para lavadora a presión secundaria',
    monto: 1500
  },
  {
    id: 'gst-3',
    fecha: getRelativeDate(-5),
    categoria: 'Herramientas',
    descripcion: 'Boquilla de repuesto para manguera de alta presión',
    monto: 4500
  },
  {
    id: 'gst-4',
    fecha: getRelativeDate(-10),
    categoria: 'Mantenimiento',
    descripcion: 'Limpieza de filtro de grasa y sumidero',
    monto: 8500
  },
  {
    id: 'gst-5',
    fecha: `2026-05-20`,
    categoria: 'Productos de limpieza',
    descripcion: 'Compra mensual de microfibras y esponjas',
    monto: 6000
  }
];

const STORAGE_KEY = 'lavadero_ryn_db';

// Safely access localStorage to prevent "SecurityError" in restricted iframe/browser preview contexts.
const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage is not accessible, using in-memory store:', e);
    }
    return memoryStore[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('localStorage is not accessible, storing in-memory:', e);
    }
    memoryStore[key] = value;
  }
};

const initialCatalogo: CatalogoServicio[] = [
  { id: 'cat-1', tipo: 'Lavado básico', precio: 8500, descripcion: 'Lavado exterior rápido, aspirado express.' },
  { id: 'cat-2', tipo: 'Lavado premium', precio: 15400, descripcion: 'Tratamiento completo interior y exterior profunda + encerado.' },
  { id: 'cat-3', tipo: 'Lavado con cera', precio: 11000, descripcion: 'Lavado exterior de alta espuma con abrillantado de cera acrílica.' },
  { id: 'cat-4', tipo: 'Lavado de motor', precio: 12000, descripcion: 'Remoción de grasas del motor con vapor y desengrasante seguro.' },
  { id: 'cat-5', tipo: 'Aspirado', precio: 6000, descripcion: 'Aspirado profundo de tapizados, alfombras y baúl.' },
];

export function getInitialState(): DatabaseState {
  const localData = safeStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      // Validate structure roughly
      if (parsed.clientes && parsed.vehiculos && parsed.reservas && parsed.servicios && parsed.gastos) {
        // Safe check / upgrade for preexisting storage lacking the catalogo
        if (!parsed.serviciosCatalogo) {
          parsed.serviciosCatalogo = initialCatalogo;
          saveState(parsed);
        }
        if (!parsed.adminPassword) {
          parsed.adminPassword = 'ryn123';
          saveState(parsed);
        }
        if (!parsed.businessWhatsapp) {
          parsed.businessWhatsapp = '5491123456789';
          saveState(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing stored state, using initial seed instead', e);
    }
  }

  const newState: DatabaseState = {
    clientes: initialClientes,
    vehiculos: initialVehiculos,
    reservas: initialReservas,
    servicios: initialServicios,
    gastos: initialGastos,
    serviciosCatalogo: initialCatalogo,
    currentRole: 'Administrador',
    currentUserId: 'admin-1',
    adminPassword: 'ryn123',
    businessWhatsapp: '5491123456789'
  };

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

export function saveState(state: DatabaseState) {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
