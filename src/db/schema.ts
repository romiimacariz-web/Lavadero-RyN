import { pgTable, text, integer, timestamp, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// System Users linked to Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Clientes (Clients)
export const clientes = pgTable('clientes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  whatsapp: text('whatsapp').notNull(),
  direccion: text('direccion'),
  observaciones: text('observaciones'),
  fechaRegistro: text('fecha_registro').notNull(),
  fotoUrl: text('foto_url'),
});

// Vehiculos (Vehicles)
export const vehiculos = pgTable('vehiculos', {
  matricula: text('matricula').primaryKey(),
  marca: text('marca').notNull(),
  modelo: text('modelo').notNull(),
  color: text('color').notNull(),
  anio: integer('anio').notNull(),
  clienteId: text('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  fotosUrlJson: text('fotos_url_json').notNull().default('[]'), // Stored as JSON string
  kilometros: integer('kilometros'),
  observaciones: text('observaciones'),
  proximoMantenimiento: text('proximo_mantenimiento'),
});

// Reservas (Appointments)
export const reservas = pgTable('reservas', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  vehiculoMatricula: text('vehiculo_matricula')
    .notNull()
    .references(() => vehiculos.matricula, { onDelete: 'cascade' }),
  fecha: text('fecha').notNull(), // YYYY-MM-DD
  hora: text('hora').notNull(),  // HH:MM
  servicioSol: text('servicio_sol').notNull(),
  estado: text('estado').notNull(), // 'Reservado' | 'Recibido' | 'Lavando' | 'Secando' | 'Finalizado' | 'Entregado' | 'Cancelado'
  observaciones: text('observaciones'),
  empleado: text('empleado'),
});

// Servicios Realizados (Completed Services)
export const servicios = pgTable('servicios', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(), // YYYY-MM-DD HH:MM
  clienteId: text('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  vehiculoMatricula: text('vehiculo_matricula')
    .notNull()
    .references(() => vehiculos.matricula, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  precio: integer('precio').notNull(),
  formaPago: text('forma_pago').notNull(),
  observaciones: text('observaciones'),
  fotosAntesJson: text('fotos_antes_json').notNull().default('[]'), // Stored as JSON string
  fotosDespuesJson: text('fotos_despues_json').notNull().default('[]'), // Stored as JSON string
});

// Gastos (Expenses)
export const gastos = pgTable('gastos', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(), // YYYY-MM-DD
  categoria: text('categoria').notNull(),
  descripcion: text('descripcion').notNull(),
  monto: integer('monto').notNull(),
});

// Catálogo de Servicios (Services Catalog)
export const serviciosCatalogo = pgTable('servicios_catalogo', {
  id: text('id').primaryKey(),
  tipo: text('tipo').notNull(),
  precio: integer('precio').notNull(),
  descripcion: text('descripcion'),
});

// Configuración general del negocio (Business settings)
export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // We will use 'config' as single record
  adminPassword: text('admin_password').notNull().default('ryn123'),
  businessWhatsapp: text('business_whatsapp').notNull().default('5491123456789'),
  nombreNegocio: text('nombre_negocio').notNull().default('Lavadero RyN'),
  logoUrl: text('logo_url').notNull().default('/src/assets/images/lavadero_ryn_logo_1782222462483.jpg'),
  direccionNegocio: text('direccion_negocio').notNull().default('Av. San Martín 1500'),
  instagram: text('instagram').notNull().default('lavaderoryn'),
  facebook: text('facebook').notNull().default('lavaderorynoficial'),
  horarios: text('horarios').notNull().default('Lunes a Sábado de 08:00 a 20:00'),
});

// Relations declarations
export const clientesRelations = relations(clientes, ({ many }) => ({
  vehiculos: many(vehiculos),
  reservas: many(reservas),
  servicios: many(servicios),
}));

export const vehiculosRelations = relations(vehiculos, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [vehiculos.clienteId],
    references: [clientes.id],
  }),
  reservas: many(reservas),
  servicios: many(servicios),
}));

export const reservasRelations = relations(reservas, ({ one }) => ({
  cliente: one(clientes, {
    fields: [reservas.clienteId],
    references: [clientes.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [reservas.vehiculoMatricula],
    references: [vehiculos.matricula],
  }),
}));

export const serviciosRelations = relations(servicios, ({ one }) => ({
  cliente: one(clientes, {
    fields: [servicios.clienteId],
    references: [clientes.id],
  }),
  vehiculo: one(vehiculos, {
    fields: [servicios.vehiculoMatricula],
    references: [vehiculos.matricula],
  }),
}));
