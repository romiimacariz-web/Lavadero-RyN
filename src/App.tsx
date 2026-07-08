/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getInitialState, saveState } from './db';
import { DatabaseState, Cliente, Vehiculo, Reserva, ServicioRealizado, Gasto, UserRole, ReservaEstado, FormaPago, CatalogoServicio } from './types';
import { db } from './firebase';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import {
  OperationType,
  testFirestoreConnection,
  seedFirestoreIfEmpty,
  handleFirestoreError,
  createOrUpdateCliente,
  deleteClienteFromDb,
  createOrUpdateVehiculo,
  deleteVehiculoFromDb,
  createOrUpdateReserva,
  deleteReservaFromDb,
  createOrUpdateServicio,
  deleteServicioFromDb,
  saveCatalogoToDb,
  createOrUpdateGasto,
  deleteGastoFromDb,
  saveSettingsToDb
} from './firebaseService';

// Components
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Vehicles from './components/Vehicles';
import BookingCalendar from './components/BookingCalendar';
import Services from './components/Services';
import Caja from './components/Caja';
import Reports from './components/Reports';
import SelfService from './components/SelfService';
import Catalogo from './components/Catalogo';
import Login from './components/Login';
import { LoadingScreen, SkeletonCard, ForbiddenScreen, ToastContainer, ToastMessage, WhatsAppModal } from './components/Feedback';
import { useAuth } from './contexts/AuthContext';

// Icons
import { 
  BarChart4, 
  DollarSign, 
  CalendarDays, 
  CheckCircle2, 
  Car, 
  Users, 
  LayoutDashboard,
  ShieldAlert,
  Smartphone,
  MessageSquare,
  Copy,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  UserCheck,
  ClipboardList,
  Lock,
  Clock,
  Menu
} from 'lucide-react';
import { getWhatsAppHref, getConfirmationMessage, getVehicleReadyMessage, getInactiveGreetingMessage } from './utils/whatsapp';

// Navigation Helpers to Centralize Routing and fix 404/Hash mismatch issues
function getCurrentRoute(): string {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    return hash.substring(1);
  }
  return window.location.pathname;
}

function getTabFromRoute(route: string): string {
  const cleanRoute = route.toLowerCase().replace(/\/$/, '');
  if (cleanRoute === '' || cleanRoute === '/dashboard' || cleanRoute === '/') {
    return 'Inicio';
  }
  if (cleanRoute === '/clientes') return 'Clientes';
  if (cleanRoute === '/vehiculos') return 'Vehículos';
  if (cleanRoute === '/agenda') return 'Agenda';
  if (cleanRoute === '/servicios') return 'Servicios';
  if (cleanRoute === '/caja') return 'Caja';
  if (cleanRoute === '/reportes') return 'Reportes';
  if (cleanRoute === '/configuracion') return 'Configuración';
  if (cleanRoute === '/autoservicio') return 'Autoservicio';
  return 'Inicio';
}

function getRouteFromTab(tab: string): string {
  switch (tab) {
    case 'Inicio': return '/dashboard';
    case 'Clientes': return '/clientes';
    case 'Vehículos': return '/vehiculos';
    case 'Agenda': return '/agenda';
    case 'Servicios': return '/servicios';
    case 'Caja': return '/caja';
    case 'Reportes': return '/reportes';
    case 'Configuración': return '/configuracion';
    case 'Autoservicio': return '/autoservicio';
    default: return '/dashboard';
  }
}

export default function App() {
  const { user, usuario, loading: authLoading, logout } = useAuth();
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    setToasts(prev => [...prev, { id: Math.random().toString(), type, title, message }]);
  };
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Clock state for SaaS header
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [dbState, setDbState] = useState<DatabaseState>({
    ...getInitialState(),
    currentRole: 'Empleado'
  });

  // Sincronizar el rol del usuario autenticado con el rol activo de la aplicación
  useEffect(() => {
    if (usuario?.rol) {
      setDbState(prev => {
        if (prev.currentRole !== usuario.rol) {
          return { ...prev, currentRole: usuario.rol as UserRole };
        }
        return prev;
      });
    }
  }, [usuario]);
  const [currentPath, setCurrentPath] = useState<string>(getCurrentRoute());
  const [activeTab, setActiveTab] = useState<string>(getTabFromRoute(getCurrentRoute()));

  // Centralized navigation functions
  const navigateTo = (path: string) => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      window.location.hash = '#' + path;
    } else {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  const handleTabChange = (tab: string) => {
    const route = getRouteFromTab(tab);
    navigateTo(route);
  };

  // Router listener for public URL routing
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getCurrentRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Sync currentPath to activeTab
  useEffect(() => {
    const tab = getTabFromRoute(currentPath);
    setActiveTab(tab);
  }, [currentPath]);
  
  // Quick service trigger from dashboard
  const [quickServiceReserva, setQuickServiceReserva] = useState<Reserva | null>(null);

  // WhatsApp Dialog drawer
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    phone: string;
    text: string;
  }>({
    open: false,
    phone: '',
    text: ''
  });
  const [copySuccess, setCopySuccess] = useState(false);

  // Password prompt states for transitioning to Admin
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  // Synchronize with Firestore on component mount
  useEffect(() => {
    const initFirebase = async () => {
      await testFirestoreConnection();
      await seedFirestoreIfEmpty(getInitialState());
    };
    initFirebase();

    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as Cliente);
      setDbState(prev => ({ ...prev, clientes: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clientes'));

    const unsubVehiculos = onSnapshot(collection(db, 'vehiculos'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as Vehiculo);
      setDbState(prev => ({ ...prev, vehiculos: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'vehiculos'));

    const unsubReservas = onSnapshot(collection(db, 'reservas'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as Reserva);
      setDbState(prev => ({ ...prev, reservas: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reservas'));

    const unsubServicios = onSnapshot(collection(db, 'servicios'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as ServicioRealizado);
      setDbState(prev => ({ ...prev, servicios: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'servicios'));

    const unsubGastos = onSnapshot(collection(db, 'gastos'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as Gasto);
      setDbState(prev => ({ ...prev, gastos: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gastos'));

    const unsubCatalogo = onSnapshot(collection(db, 'serviciosCatalogo'), (snap) => {
      const list = snap.docs.map(doc => doc.data() as CatalogoServicio);
      setDbState(prev => ({ ...prev, serviciosCatalogo: list }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'serviciosCatalogo'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDbState(prev => ({ 
          ...prev, 
          adminPassword: data.adminPassword || 'ryn123',
          businessWhatsapp: data.businessWhatsapp || '5491123456789',
          nombreNegocio: data.nombreNegocio || 'Lavadero RyN',
          logoUrl: data.logoUrl || '/src/assets/images/lavadero_ryn_logo_1782222462483.jpg',
          direccionNegocio: data.direccionNegocio || 'Av. San Martín 1500',
          instagram: data.instagram || 'lavaderoryn',
          facebook: data.facebook || 'lavaderorynoficial',
          horarios: data.horarios || 'Lunes a Sábado de 08:00 a 20:00'
        }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/config'));

    return () => {
      unsubClientes();
      unsubVehiculos();
      unsubReservas();
      unsubServicios();
      unsubGastos();
      unsubCatalogo();
      unsubSettings();
    };
  }, []);

  // Persistence handler for local UI settings/state
  const updateStateAndPersist = (updatedFields: Partial<DatabaseState>) => {
    const newState = { ...dbState, ...updatedFields };
    setDbState(newState);
    saveState(newState);
  };

  // Switch User Profile Roles (Admin vs. Empleado)
  const handleToggleRole = (role: UserRole) => {
    if (role === 'Administrador' && dbState.currentRole !== 'Administrador') {
      setAdminPasswordInput('');
      setAdminPasswordError(null);
      setShowAdminPasswordModal(true);
      return;
    }

    // If we transition to Empleado and are on reports, cash or config, reset to Inicio
    if (role === 'Empleado' && (activeTab === 'Caja' || activeTab === 'Reportes' || activeTab === 'Configuración')) {
      handleTabChange('Inicio');
    }
    updateStateAndPersist({ currentRole: role });
  };

  const handleUpdatePassword = (newPassword: string) => {
    saveSettingsToDb(
      newPassword, 
      dbState.businessWhatsapp,
      dbState.nombreNegocio,
      dbState.logoUrl,
      dbState.direccionNegocio,
      dbState.instagram,
      dbState.facebook,
      dbState.horarios
    );
  };

  const handleUpdateBusinessWhatsapp = (newWhatsapp: string) => {
    saveSettingsToDb(
      dbState.adminPassword, 
      newWhatsapp,
      dbState.nombreNegocio,
      dbState.logoUrl,
      dbState.direccionNegocio,
      dbState.instagram,
      dbState.facebook,
      dbState.horarios
    );
  };

  const handleUpdateBusinessConfig = (
    nombre: string,
    logo: string,
    direccion: string,
    insta: string,
    fb: string,
    horas: string
  ) => {
    saveSettingsToDb(
      dbState.adminPassword,
      dbState.businessWhatsapp,
      nombre,
      logo,
      direccion,
      insta,
      fb,
      horas
    );
  };

  const handleRestoreBackup = async (backupData: any): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      
      // Clean target collections if the backup is loaded
      if (Array.isArray(backupData.clientes)) {
        backupData.clientes.forEach((c: any) => {
          batch.set(doc(db, 'clientes', c.id), c);
        });
      }
      if (Array.isArray(backupData.vehiculos)) {
        backupData.vehiculos.forEach((v: any) => {
          batch.set(doc(db, 'vehiculos', v.matricula), v);
        });
      }
      if (Array.isArray(backupData.reservas)) {
        backupData.reservas.forEach((r: any) => {
          batch.set(doc(db, 'reservas', r.id), r);
        });
      }
      if (Array.isArray(backupData.servicios)) {
        backupData.servicios.forEach((s: any) => {
          batch.set(doc(db, 'servicios', s.id), s);
        });
      }
      if (Array.isArray(backupData.gastos)) {
        backupData.gastos.forEach((g: any) => {
          batch.set(doc(db, 'gastos', g.id), g);
        });
      }
      if (Array.isArray(backupData.serviciosCatalogo)) {
        backupData.serviciosCatalogo.forEach((sc: any) => {
          batch.set(doc(db, 'serviciosCatalogo', sc.id), sc);
        });
      }
      if (backupData.settings) {
        batch.set(doc(db, 'settings', 'config'), backupData.settings);
      }
      
      await batch.commit();
      return true;
    } catch (err) {
      console.error('Restore backup error: ', err);
      return false;
    }
  };

  // CLIENTS ACTIONS
  const handleAddCliente = async (cliData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newId = `cli-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newCliente: Cliente = {
      ...cliData,
      id: newId,
      fechaRegistro: today
    };
    try {
      await createOrUpdateCliente(newCliente);
      addToast('success', 'Cliente Registrado', `El cliente ${cliData.nombre} ha sido agregado correctamente.`);
    } catch (err) {
      addToast('error', 'Error', 'No se pudo registrar el cliente.');
    }
  };

  const handleUpdateCliente = async (updatedCli: Cliente) => {
    try {
      await createOrUpdateCliente(updatedCli);
      addToast('success', 'Cliente Actualizado', `Los datos de ${updatedCli.nombre} fueron actualizados.`);
    } catch (err) {
      addToast('error', 'Error', 'No se pudo actualizar el cliente.');
    }
  };

  const handleDeleteCliente = (id: string) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite eliminar información.');
      return;
    }
    setDeleteConfirm({
      open: true,
      title: 'Eliminar Cliente',
      message: '¿Está seguro que desea eliminar este cliente? Se borrará el registro de forma permanente.',
      onConfirm: async () => {
        try {
          await deleteClienteFromDb(id);
          addToast('success', 'Cliente Eliminado', 'El cliente ha sido eliminado.');
        } catch (err) {
          addToast('error', 'Error', 'No se pudo eliminar el cliente.');
        }
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    });
  };

  // VEHICLES ACTIONS
  const handleAddVehiculo = async (veh: Vehiculo) => {
    try {
      await createOrUpdateVehiculo(veh);
      addToast('success', 'Vehículo Registrado', `El vehículo patente ${veh.matricula} ha sido registrado.`);
    } catch (err) {
      addToast('error', 'Error', 'No se pudo registrar el vehículo.');
    }
  };

  const handleUpdateVehiculo = async (updatedVeh: Vehiculo) => {
    try {
      await createOrUpdateVehiculo(updatedVeh);
      addToast('success', 'Vehículo Actualizado', `El vehículo ${updatedVeh.matricula} fue actualizado.`);
    } catch (err) {
      addToast('error', 'Error', 'No se pudo actualizar el vehículo.');
    }
  };

  const handleDeleteVehiculo = (plate: string) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite eliminar información.');
      return;
    }
    setDeleteConfirm({
      open: true,
      title: 'Eliminar Vehículo',
      message: '¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await deleteVehiculoFromDb(plate);
          addToast('success', 'Vehículo Eliminado', `El vehículo ${plate} ha sido eliminado.`);
        } catch (err) {
          addToast('error', 'Error', 'No se pudo eliminar el vehículo.');
        }
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    });
  };

  // RESERVATIONS BOOKINGS ACTIONS
  const handleAddReserva = async (resData: Omit<Reserva, 'id'>) => {
    const newId = `res-${Date.now()}`;
    const newRes: Reserva = {
      ...resData,
      id: newId
    };
    try {
      await createOrUpdateReserva(newRes);
      addToast('success', 'Turno Agendado', 'La reserva se creó con éxito.');
    } catch (err) {
      addToast('error', 'Error', 'No se pudo agendar el turno.');
    }
  };

  const handleUpdateReserva = async (updatedRes: Reserva) => {
    try {
      await createOrUpdateReserva(updatedRes);
      addToast('success', 'Turno Actualizado', 'El turno ha sido modificado.');
    } catch (err) {
      addToast('error', 'Error', 'No se pudo modificar el turno.');
    }
  };

  const handleUpdateReservaState = async (reservaId: string, newState: ReservaEstado) => {
    const res = dbState.reservas.find(r => r.id === reservaId);
    if (res) {
      try {
        await createOrUpdateReserva({ ...res, estado: newState });
        addToast('success', 'Turno Actualizado', `El estado del turno es: ${newState}`);
      } catch (err) {
        addToast('error', 'Error', 'No se pudo actualizar el estado del turno.');
      }
    }
  };

  const handleDeleteReserva = (id: string) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite eliminar información.');
      return;
    }
    setDeleteConfirm({
      open: true,
      title: 'Eliminar Turno',
      message: '¿Está seguro que desea borrar esta reserva de la agenda?',
      onConfirm: async () => {
        try {
          await deleteReservaFromDb(id);
          addToast('success', 'Turno Eliminado', 'La reserva fue cancelada y borrada.');
        } catch (err) {
          addToast('error', 'Error', 'No se pudo borrar la reserva.');
        }
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    });
  };

  // COMPLETED SERVICES ACTIONS
  const handleAddServicio = async (srvData: Omit<ServicioRealizado, 'id'>) => {
    const newId = `srv-${Date.now()}`;
    const newSrv: ServicioRealizado = {
      ...srvData,
      id: newId
    };
    try {
      // If this service matches a reservation for the plate, mark it finalized!
      const matchingReservas = dbState.reservas.filter(
        r => r.vehiculoMatricula.toUpperCase() === srvData.vehiculoMatricula.toUpperCase() && r.estado !== 'Cancelado'
      );
      
      if (matchingReservas.length > 0) {
        await Promise.all(
          matchingReservas.map(r => createOrUpdateReserva({ ...r, estado: 'Finalizado' }))
        );
      }

      await createOrUpdateServicio(newSrv);
      addToast('success', 'Servicio Registrado', 'El servicio realizado fue facturado con éxito.');
    } catch (err) {
      addToast('error', 'Error', 'No se pudo facturar el servicio.');
    }
  };

  const handleDeleteServicio = (id: string) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite eliminar información.');
      return;
    }
    setDeleteConfirm({
      open: true,
      title: 'Eliminar Registro de Servicio',
      message: '¿Está seguro que desea eliminar este registro de servicio facturado? Esto afectará los totales de caja.',
      onConfirm: async () => {
        try {
          await deleteServicioFromDb(id);
          addToast('success', 'Registro Eliminado', 'El servicio facturado fue eliminado de caja.');
        } catch (err) {
          addToast('error', 'Error', 'No se pudo borrar el registro.');
        }
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    });
  };

  // SERVICES CATALOG ACTIONS
  const handleUpdateCatalogo = async (newCatalogo: CatalogoServicio[]) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite modificar el catálogo de servicios.');
      return;
    }
    try {
      await saveCatalogoToDb(newCatalogo);
      addToast('success', 'Catálogo Actualizado', 'Los servicios del catálogo fueron actualizados.');
    } catch (err) {
      addToast('error', 'Error', 'No se pudo guardar el catálogo.');
    }
  };

  // EXPENSES GASTOS ACTIONS
  const handleAddGasto = async (gstData: Omit<Gasto, 'id'>) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite registrar gastos.');
      return;
    }
    const newId = `gst-${Date.now()}`;
    const newGst: Gasto = {
      ...gstData,
      id: newId
    };
    try {
      await createOrUpdateGasto(newGst);
      addToast('success', 'Gasto Registrado', 'El egreso fue cargado correctamente.');
    } catch (err) {
      addToast('error', 'Error', 'No se pudo registrar el gasto.');
    }
  };

  const handleDeleteGasto = (id: string) => {
    if (usuario && usuario.rol === 'Empleado') {
      addToast('error', 'Permiso Denegado', 'Su rol de Empleado no permite eliminar información.');
      return;
    }
    setDeleteConfirm({
      open: true,
      title: 'Eliminar Gasto',
      message: '¿Está seguro que desea eliminar este gasto? Se recalculará la caja diaria.',
      onConfirm: async () => {
        try {
          await deleteGastoFromDb(id);
          addToast('success', 'Gasto Eliminado', 'El gasto fue borrado.');
        } catch (err) {
          addToast('error', 'Error', 'No se pudo borrar el gasto.');
        }
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    });
  };

  // SELF SERVICE CUSTOMER ACTION CHANGER
  const handleAddBookingSelfService = async (
    clienteNombre: string,
    clienteTelefono: string,
    vehiculoMatricula: string,
    vehiculoMarca: string,
    vehiculoModelo: string,
    vehiculoColor: string,
    vehiculoAnio: number,
    fecha: string,
    hora: string,
    servicioSol: string,
    observaciones?: string
  ): Promise<Reserva> => {
    const cleanPhone = clienteTelefono.trim().replace(/\s+/g, '');
    let client = dbState.clientes.find(
      c => c.telefono.replace(/\s+/g, '') === cleanPhone ||
           c.whatsapp.replace(/\s+/g, '') === cleanPhone
    );
    let finalClienteId = '';
    
    if (client) {
      finalClienteId = client.id;
    } else {
      const newClientId = `cli-${Date.now()}`;
      const newCliente: Cliente = {
        id: newClientId,
        nombre: clienteNombre,
        telefono: clienteTelefono,
        whatsapp: clienteTelefono,
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      await createOrUpdateCliente(newCliente);
      finalClienteId = newClientId;
    }

    const cleanMatricula = vehiculoMatricula.toUpperCase().replace(/\s+/g, '');
    let vehicle = dbState.vehiculos.find(v => v.matricula.toUpperCase() === cleanMatricula);
    if (!vehicle) {
      const newVeh: Vehiculo = {
        matricula: cleanMatricula,
        marca: vehiculoMarca,
        modelo: vehiculoModelo,
        color: vehiculoColor,
        anio: Number(vehiculoAnio) || new Date().getFullYear(),
        clienteId: finalClienteId,
        fotosUrl: []
      };
      await createOrUpdateVehiculo(newVeh);
    }

    const newResId = `res-${Date.now()}`;
    const newRes: Reserva = {
      id: newResId,
      clienteId: finalClienteId,
      vehiculoMatricula: cleanMatricula,
      fecha,
      hora,
      servicioSol,
      estado: 'Reservado',
      observaciones: observaciones
    };
    
    await createOrUpdateReserva(newRes);

    return newRes;
  };

  // WhatsApp dialog activator
  const handleTriggerWhatsApp = (phone: string, text: string) => {
    setWhatsAppModal({
      open: true,
      phone,
      text
    });
    setCopySuccess(false);
  };

  const handleCopyMessage = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(whatsAppModal.text)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy text using standard copy, using fallback:', err);
          fallbackCopyText(whatsAppModal.text);
        });
    } else {
      fallbackCopyText(whatsAppModal.text);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        console.warn('Fallback copy failed');
      }
    } catch (err) {
      console.error('Fallback copy generated an exception:', err);
    }
  };

  // Bottom simple navigation layout choices
  // Hide Caja, Reportes & Configuración entirely for "Empleado" to fulfill strict user roles check
  const MENU_TABS = [
    { label: 'Inicio', icon: LayoutDashboard },
    { label: 'Clientes', icon: Users },
    { label: 'Vehículos', icon: Car },
    { label: 'Agenda', icon: CalendarDays },
    { label: 'Servicios', icon: CheckCircle2 },
    ...(dbState.currentRole === 'Administrador' ? [
      { label: 'Caja', icon: DollarSign },
      { label: 'Reportes', icon: BarChart4 },
      { label: 'Configuración', icon: ClipboardList }
    ] : []),
    { label: 'Autoservicio', icon: Smartphone }
  ];

  const isPublicAutoservicio = currentPath === '/autoservicio' || window.location.hash === '#/autoservicio';

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user && !isPublicAutoservicio) {
    return (
      <div id="lavadero-ryn-app" className="min-h-screen bg-[#07070A] flex items-center justify-center p-4 relative overflow-hidden select-none">
        <Login onSuccess={() => addToast('success', 'Bienvenido', 'Has ingresado correctamente al panel de Lavadero RyN.')} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  if (isPublicAutoservicio || dbState.currentRole === 'Autoservicio' || activeTab === 'Autoservicio') {
    return (
      <div id="lavadero-ryn-app" className="min-h-screen bg-brand-bg text-white p-4 sm:p-6 md:p-8 flex flex-col justify-center relative select-none">
        <SelfService 
          state={dbState}
          onAddBooking={handleAddBookingSelfService}
          onTriggerWhatsApp={handleTriggerWhatsApp}
          onExit={() => {
            handleTabChange('Inicio');
            setDbState(prev => ({ ...prev, currentRole: usuario?.rol || 'Empleado' }));
          }}
          isPublicRoute={isPublicAutoservicio}
        />

        <WhatsAppModal
          open={whatsAppModal.open}
          phone={whatsAppModal.phone}
          text={whatsAppModal.text}
          copySuccess={copySuccess}
          onChangeText={(txt) => setWhatsAppModal({ ...whatsAppModal, text: txt })}
          onCopy={handleCopyMessage}
          onClose={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
          onGetWhatsAppHref={getWhatsAppHref}
        />
      </div>
    );
  }

  return (
    <div id="lavadero-ryn-app" className="min-h-screen flex flex-col md:flex-row select-none font-sans bg-brand-bg text-white">
      
      {/* SIDEBAR PARA ESCRITORIO (Visible en md+) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-brand-black border-r border-white/[0.04] shrink-0 p-5 space-y-6 relative overflow-hidden">
        {/* Soft background glow effect */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>
        
        {/* Logo & Marca */}
        <div className="flex items-center gap-3 py-1.5 z-10">
          <img 
            src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
            alt="Lavadero RyN Logo" 
            className="w-10 h-10 object-cover rounded-xl border border-white/[0.08] shadow-lg shadow-black/40"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display font-black text-xs tracking-[0.15em] text-white leading-none uppercase">
              LAVADERO <span className="text-brand-red">RyN</span>
            </span>
            <span className="text-[9px] text-gray-500 font-mono tracking-wider mt-1 uppercase font-bold">Workspace Pro</span>
          </div>
        </div>

        {/* Perfil del Operario */}
        <div className="bg-[#12121A]/80 p-3.5 rounded-2xl border border-white/[0.05] space-y-3.5 shadow-xl shadow-black/20 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red/10 border border-brand-red/30 rounded-xl flex items-center justify-center font-display font-black text-xs text-brand-red select-none shrink-0 shadow-inner">
              {usuario?.nombre?.substring(0, 2).toUpperCase() || 'OP'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate leading-tight font-display tracking-tight">{usuario?.nombre || 'Operador'}</h4>
              <p className="text-[9px] text-gray-500 truncate font-mono mt-0.5">{usuario?.email || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-white/[0.05] pt-2.5">
            <span className={`text-[8px] uppercase tracking-widest font-mono font-extrabold px-2 py-0.5 rounded-md ${
              usuario?.rol === 'Administrador' 
                ? 'bg-brand-red/10 border border-brand-red/20 text-brand-red' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
            }`}>
              {usuario?.rol || 'Empleado'}
            </span>
            <button
              onClick={() => logout().then(() => addToast('info', 'Sesión Cerrada', 'Has cerrado sesión correctamente.'))}
              title="Cerrar Sesión"
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-brand-red/15 border border-white/[0.05] hover:border-brand-red/30 text-gray-400 hover:text-brand-red transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Digital Clock */}
        <div className="bg-[#12121A]/50 px-3.5 py-2 rounded-xl border border-white/[0.04] flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-3.5 h-3.5 text-brand-red" />
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-gray-500">Reloj SaaS:</span>
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-widest">{currentTime || '00:00:00'}</span>
        </div>

        {/* Navegación lateral principal */}
        <div className="flex-1 space-y-1.5 overflow-y-auto z-10">
          <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3 px-1 font-extrabold">Módulos</div>
          {MENU_TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                onClick={() => handleTabChange(tab.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all relative ${
                  isActive 
                    ? 'text-white bg-white/[0.04] border-l-2 border-brand-red pl-2.5 shadow-sm shadow-white/5' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-red' : 'text-gray-500'}`} />
                <span className="font-display tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer del Sidebar con info del negocio */}
        <div className="border-t border-white/[0.04] pt-4 text-center z-10">
          <h5 className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest">{dbState.nombreNegocio || 'Lavadero RyN'}</h5>
          <p className="text-[9px] text-gray-500 mt-1 truncate font-mono">{dbState.direccionNegocio || 'Av. San Martín 1500'}</p>
        </div>
      </aside>

      {/* HEADER PARA MÓVILES (Visible solo en md-) */}
      <header className="sticky top-0 z-40 md:hidden bg-brand-black border-b border-gray-800/80 p-4 shrink-0 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <img 
            src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
            alt="Lavadero RyN Logo" 
            className="w-8 h-8 object-cover rounded-lg border border-brand-red/30 shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-xs text-white leading-none tracking-widest">
              LAVADERO <span className="text-brand-red">RyN</span>
            </span>
            <span className="text-[9px] text-gray-500 font-mono mt-0.5 truncate max-w-[110px]">{usuario?.nombre || 'Operador'}</span>
          </div>
        </div>

        {/* Info de sesión móvil */}
        <div className="flex items-center gap-3">
          <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded-md ${
            usuario?.rol === 'Administrador' 
              ? 'bg-brand-red/10 text-brand-red' 
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {usuario?.rol === 'Administrador' ? 'Admin' : 'Emp'}
          </span>
          <button
            onClick={() => logout().then(() => addToast('info', 'Sesión Cerrada', 'Has cerrado sesión correctamente.'))}
            className="p-2 rounded-lg bg-[#14141A] hover:bg-brand-red/10 border border-gray-800 text-gray-400 hover:text-brand-red transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL CON CONTENEDOR FLEX-1 */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
          {activeTab === 'Inicio' && (
            <Dashboard 
              state={dbState} 
              onNavigate={handleTabChange} 
              onTriggerWhatsApp={handleTriggerWhatsApp} 
              onOpenQuickNewService={(res) => {
                if (res) setQuickServiceReserva(res);
                handleTabChange('Servicios');
              }}
              onUpdateReservaState={handleUpdateReservaState}
            />
          )}

          {activeTab === 'Clientes' && (
            <Clients 
              state={dbState}
              onAddCliente={handleAddCliente}
              onUpdateCliente={handleUpdateCliente}
              onDeleteCliente={handleDeleteCliente}
              onTriggerWhatsApp={handleTriggerWhatsApp}
            />
          )}

          {activeTab === 'Vehículos' && (
            <Vehicles 
              state={dbState}
              onAddVehiculo={handleAddVehiculo}
              onUpdateVehiculo={handleUpdateVehiculo}
              onDeleteVehiculo={handleDeleteVehiculo}
            />
          )}

          {activeTab === 'Agenda' && (
            <BookingCalendar 
              state={dbState}
              onAddReserva={handleAddReserva}
              onUpdateReserva={handleUpdateReserva}
              onDeleteReserva={handleDeleteReserva}
              onTriggerWhatsApp={handleTriggerWhatsApp}
            />
          )}

          {activeTab === 'Servicios' && (
            <Services 
              state={dbState}
              quickServiceReserva={quickServiceReserva}
              onClearQuickServiceReserva={() => setQuickServiceReserva(null)}
              onAddServicio={handleAddServicio}
              onDeleteServicio={handleDeleteServicio}
              onTriggerWhatsApp={handleTriggerWhatsApp}
            />
          )}

          {activeTab === 'Configuración' && (
            <Catalogo 
              state={dbState}
              onUpdateCatalogo={handleUpdateCatalogo}
              onUpdatePassword={handleUpdatePassword}
              onUpdateBusinessWhatsapp={handleUpdateBusinessWhatsapp}
              onUpdateBusinessConfig={handleUpdateBusinessConfig}
              onRestoreBackup={handleRestoreBackup}
            />
          )}

          {activeTab === 'Caja' && dbState.currentRole === 'Administrador' && (
            <Caja 
              state={dbState}
              onAddGasto={handleAddGasto}
              onDeleteGasto={handleDeleteGasto}
            />
          )}

          {activeTab === 'Reportes' && dbState.currentRole === 'Administrador' && (
            <Reports state={dbState} />
          )}
        </main>
      </div>

      {/* MENÚ INFERIOR PARA MÓVILES (Oculto en md+) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-brand-black border-t border-gray-800/80 p-2 shrink-0 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1 font-sans">
          {MENU_TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                onClick={() => handleTabChange(tab.label)}
                style={{ contentVisibility: 'auto' }}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'text-brand-red bg-brand-red/10 font-bold scale-105' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                <span className="text-[10px] tracking-tight mt-1 font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <WhatsAppModal
        open={whatsAppModal.open}
        phone={whatsAppModal.phone}
        text={whatsAppModal.text}
        copySuccess={copySuccess}
        onChangeText={(txt) => setWhatsAppModal({ ...whatsAppModal, text: txt })}
        onCopy={handleCopyMessage}
        onClose={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
        onGetWhatsAppHref={getWhatsAppHref}
      />

      {/* Modal para verificar contraseña de administración */}
      {showAdminPasswordModal && (
        <div id="admin-password-modal" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">Modo Administrador</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ingrese la contraseña de seguridad para acceder al panel de administración del lavadero.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const currentPassword = dbState.adminPassword || 'ryn123';
                if (adminPasswordInput === currentPassword) {
                  // Password matches! Toggle role and close modal
                  updateStateAndPersist({ currentRole: 'Administrador' });
                  setShowAdminPasswordModal(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError(null);
                } else {
                  setAdminPasswordError('Contraseña incorrecta. Por favor intente de nuevo.');
                }
              }} 
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminPasswordError(null);
                  }}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-2.5 text-center text-white font-mono text-sm tracking-widest focus:outline-none focus:border-brand-red"
                  placeholder="••••••••"
                />
              </div>

              {adminPasswordError && (
                <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold rounded-xl text-center">
                  {adminPasswordError}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false);
                    setAdminPasswordInput('');
                    setAdminPasswordError(null);
                  }}
                  className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl transition-all uppercase tracking-wider"
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Custom Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Modern Custom Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-150 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">{deleteConfirm.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{deleteConfirm.message}</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
                className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="flex-1 bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
