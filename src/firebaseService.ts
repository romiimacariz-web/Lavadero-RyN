/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { DatabaseState, Cliente, Vehiculo, Reserva, ServicioRealizado, Gasto, CatalogoServicio } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper to validate firestore integration on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

/**
 * Seeds the Firestore database with initial data if collections are empty.
 */
export async function seedFirestoreIfEmpty(seedState: DatabaseState) {
  try {
    // 1. Check if clientes collection is empty
    const clientsRef = collection(db, 'clientes');
    const clientsSnap = await getDocs(clientsRef);
    
    if (clientsSnap.empty) {
      console.log('Firestore is empty. Seeding initial data...');
      
      const batch = writeBatch(db);

      // Seed clientes
      seedState.clientes.forEach(c => {
        batch.set(doc(db, 'clientes', c.id), c);
      });

      // Seed vehiculos
      seedState.vehiculos.forEach(v => {
        batch.set(doc(db, 'vehiculos', v.matricula), v);
      });

      // Seed reservas
      seedState.reservas.forEach(r => {
        batch.set(doc(db, 'reservas', r.id), r);
      });

      // Seed servicios
      seedState.servicios.forEach(s => {
        batch.set(doc(db, 'servicios', s.id), s);
      });

      // Seed gastos
      seedState.gastos.forEach(g => {
        batch.set(doc(db, 'gastos', g.id), g);
      });

      // Seed serviciosCatalogo
      seedState.serviciosCatalogo.forEach(sc => {
        batch.set(doc(db, 'serviciosCatalogo', sc.id), sc);
      });

      // Seed general settings
      batch.set(doc(db, 'settings', 'config'), {
        adminPassword: seedState.adminPassword || 'ryn123',
        businessWhatsapp: seedState.businessWhatsapp || '5491123456789'
      });

      await batch.commit();
      console.log('Firestore seeded successfully!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seeding');
  }
}

// --- Write Mutations ---

export async function createOrUpdateCliente(cliente: Cliente) {
  const path = `clientes/${cliente.id}`;
  try {
    await setDoc(doc(db, 'clientes', cliente.id), cliente);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClienteFromDb(id: string) {
  const path = `clientes/${id}`;
  try {
    await deleteDoc(doc(db, 'clientes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrUpdateVehiculo(vehiculo: Vehiculo) {
  const path = `vehiculos/${vehiculo.matricula}`;
  try {
    await setDoc(doc(db, 'vehiculos', vehiculo.matricula), vehiculo);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVehiculoFromDb(matricula: string) {
  const path = `vehiculos/${matricula}`;
  try {
    await deleteDoc(doc(db, 'vehiculos', matricula));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrUpdateReserva(reserva: Reserva) {
  const path = `reservas/${reserva.id}`;
  try {
    await setDoc(doc(db, 'reservas', reserva.id), reserva);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteReservaFromDb(id: string) {
  const path = `reservas/${id}`;
  try {
    await deleteDoc(doc(db, 'reservas', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrUpdateServicio(servicio: ServicioRealizado) {
  const path = `servicios/${servicio.id}`;
  try {
    await setDoc(doc(db, 'servicios', servicio.id), servicio);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteServicioFromDb(id: string) {
  const path = `servicios/${id}`;
  try {
    await deleteDoc(doc(db, 'servicios', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrUpdateGasto(gasto: Gasto) {
  const path = `gastos/${gasto.id}`;
  try {
    await setDoc(doc(db, 'gastos', gasto.id), gasto);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGastoFromDb(id: string) {
  const path = `gastos/${id}`;
  try {
    await deleteDoc(doc(db, 'gastos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCatalogoToDb(catalogo: CatalogoServicio[]) {
  const path = 'serviciosCatalogo';
  try {
    const batch = writeBatch(db);
    // Delete existing catalogs to overwrite cleanly
    const currentSnap = await getDocs(collection(db, 'serviciosCatalogo'));
    currentSnap.forEach(document => {
      batch.delete(document.ref);
    });
    // Set new catalog list
    catalogo.forEach(item => {
      batch.set(doc(db, 'serviciosCatalogo', item.id), item);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSettingsToDb(
  adminPassword?: string, 
  businessWhatsapp?: string,
  nombreNegocio?: string,
  logoUrl?: string,
  direccionNegocio?: string,
  instagram?: string,
  facebook?: string,
  horarios?: string
) {
  const path = 'settings/config';
  try {
    await setDoc(doc(db, 'settings', 'config'), {
      adminPassword: adminPassword || 'ryn123',
      businessWhatsapp: businessWhatsapp || '5491123456789',
      nombreNegocio: nombreNegocio || 'Lavadero RyN',
      logoUrl: logoUrl || '/src/assets/images/lavadero_ryn_logo_1782222462483.jpg',
      direccionNegocio: direccionNegocio || 'Av. San Martín 1500',
      instagram: instagram || 'lavaderoryn',
      facebook: facebook || 'lavaderorynoficial',
      horarios: horarios || 'Lunes a Sábado de 08:00 a 20:00'
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
