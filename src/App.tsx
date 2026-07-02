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
  Lock
} from 'lucide-react';
import { getWhatsAppHref, getConfirmationMessage, getVehicleReadyMessage, getInactiveGreetingMessage } from './utils/whatsapp';

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(getInitialState());
  const [activeTab, setActiveTab] = useState<string>('Inicio');
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Router listener for public URL routing
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  
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
      setActiveTab('Inicio');
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
  const handleAddCliente = (cliData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const newId = `cli-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newCliente: Cliente = {
      ...cliData,
      id: newId,
      fechaRegistro: today
    };
    createOrUpdateCliente(newCliente);
  };

  const handleUpdateCliente = (updatedCli: Cliente) => {
    createOrUpdateCliente(updatedCli);
  };

  const handleDeleteCliente = (id: string) => {
    deleteClienteFromDb(id);
  };

  // VEHICLES ACTIONS
  const handleAddVehiculo = (veh: Vehiculo) => {
    createOrUpdateVehiculo(veh);
  };

  const handleUpdateVehiculo = (updatedVeh: Vehiculo) => {
    createOrUpdateVehiculo(updatedVeh);
  };

  const handleDeleteVehiculo = (plate: string) => {
    deleteVehiculoFromDb(plate);
  };

  // RESERVATIONS BOOKINGS ACTIONS
  const handleAddReserva = (resData: Omit<Reserva, 'id'>) => {
    const newId = `res-${Date.now()}`;
    const newRes: Reserva = {
      ...resData,
      id: newId
    };
    createOrUpdateReserva(newRes);
  };

  const handleUpdateReserva = (updatedRes: Reserva) => {
    createOrUpdateReserva(updatedRes);
  };

  const handleUpdateReservaState = (reservaId: string, newState: ReservaEstado) => {
    const res = dbState.reservas.find(r => r.id === reservaId);
    if (res) {
      createOrUpdateReserva({ ...res, estado: newState });
    }
  };

  const handleDeleteReserva = (id: string) => {
    deleteReservaFromDb(id);
  };

  // COMPLETED SERVICES ACTIONS
  const handleAddServicio = (srvData: Omit<ServicioRealizado, 'id'>) => {
    const newId = `srv-${Date.now()}`;
    const newSrv: ServicioRealizado = {
      ...srvData,
      id: newId
    };
    // If this service matches a reservation for the plate, mark it finalized!
    dbState.reservas.forEach(r => {
      if (r.vehiculoMatricula.toUpperCase() === srvData.vehiculoMatricula.toUpperCase() && r.estado !== 'Cancelado') {
        createOrUpdateReserva({ ...r, estado: 'Finalizado' });
      }
    });

    createOrUpdateServicio(newSrv);
  };

  const handleDeleteServicio = (id: string) => {
    deleteServicioFromDb(id);
  };

  // SERVICES CATALOG ACTIONS
  const handleUpdateCatalogo = (newCatalogo: CatalogoServicio[]) => {
    saveCatalogoToDb(newCatalogo);
  };

  // EXPENSES GASTOS ACTIONS
  const handleAddGasto = (gstData: Omit<Gasto, 'id'>) => {
    const newId = `gst-${Date.now()}`;
    const newGst: Gasto = {
      ...gstData,
      id: newId
    };
    createOrUpdateGasto(newGst);
  };

  const handleDeleteGasto = (id: string) => {
    deleteGastoFromDb(id);
  };

  // SELF SERVICE CUSTOMER ACTION CHANGER
  const handleAddBookingSelfService = (
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
  ): Reserva => {
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
      createOrUpdateCliente(newCliente);
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
      createOrUpdateVehiculo(newVeh);
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
    
    createOrUpdateReserva(newRes);

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
  // Hide Caja & Reportes entirely for "Empleado" to fulfill strict user roles check
  const MENU_TABS = [
    { label: 'Inicio', icon: LayoutDashboard },
    { label: 'Clientes', icon: Users },
    { label: 'Vehículos', icon: Car },
    { label: 'Agenda', icon: CalendarDays },
    { label: 'Servicios', icon: CheckCircle2 },
    { label: 'Configuración', icon: ClipboardList },
    ...(dbState.currentRole === 'Administrador' ? [
      { label: 'Caja', icon: DollarSign },
      { label: 'Reportes', icon: BarChart4 }
    ] : [])
  ];

  const isPublicAutoservicio = currentPath === '/autoservicio' || window.location.hash === '#/autoservicio';

  if (isPublicAutoservicio || dbState.currentRole === 'Autoservicio') {
    return (
      <div id="lavadero-ryn-app" className="min-h-screen bg-brand-bg text-white p-4 sm:p-6 md:p-8 flex flex-col justify-center relative select-none">
        <SelfService 
          state={dbState}
          onAddBooking={handleAddBookingSelfService}
          onTriggerWhatsApp={handleTriggerWhatsApp}
          onExit={() => handleToggleRole('Administrador')}
          isPublicRoute={isPublicAutoservicio}
        />

        {/* WhatsApp Message Drafting dialog drawer */}
        {whatsAppModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-brand-card rounded-2xl border border-gray-800 shadow-2xl p-6 relative space-y-4">
              <button
                onClick={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-card-light text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <div className="p-2.5 bg-[#28A745]/15 border border-[#28A745]/30 text-[#28A745] rounded-xl shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-white text-base">Enviar por WhatsApp</h4>
                  <p className="text-[10px] text-gray-400 font-mono">Destinatario: {whatsAppModal.phone}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Contenido de la plantilla:</label>
                <textarea
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-white text-xs min-h-[110px] focus:outline-none focus:ring-1 focus:ring-[#28A745] leading-relaxed"
                  value={whatsAppModal.text}
                  onChange={(e) => setWhatsAppModal({ ...whatsAppModal, text: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleCopyMessage}
                  className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 border border-gray-855"
                >
                  <Copy className="w-4 h-4 text-brand-warning" />
                  <span>{copySuccess ? 'Copiado! ✔' : 'Copiar Texto'}</span>
                </button>

                <a
                  href={getWhatsAppHref(whatsAppModal.phone, whatsAppModal.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
                  className="bg-[#28A745] hover:bg-green-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 text-center"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Enviar Directo</span>
                </a>
              </div>

              <p className="text-[10px] text-center text-gray-500">
                * El botón "Enviar Directo" abrirá una nueva pestaña de chat en WhatsApp Web o en tu aplicación móvil con el mensaje pre-cargado.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="lavadero-ryn-app" className="min-h-screen flex flex-col md:flex-row select-none font-sans bg-brand-bg text-white">
      
      {/* SIDEBAR PARA ESCRITORIO (Visible en md+) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-brand-black border-r border-gray-800/50 shrink-0 p-5 space-y-6">
        {/* Logo & Marca */}
        <div className="flex items-center gap-3 py-1">
          <img 
            src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
            alt="Lavadero RyN Logo" 
            className="w-10 h-10 object-cover rounded-xl border border-brand-red/20 shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-sm tracking-widest text-white leading-none">
              LAVADERO <span className="text-brand-red">RyN</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider mt-1 uppercase">SaaS Premium</span>
          </div>
        </div>

        {/* Selector de Rol de Operario */}
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider px-1">Operario activo:</div>
          <div className="flex flex-col bg-brand-card/30 p-1 rounded-xl border border-gray-800/80 gap-1">
            <button
              onClick={() => handleToggleRole('Administrador')}
              className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between ${
                dbState.currentRole === 'Administrador' 
                  ? 'bg-brand-red text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-brand-card-light/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </span>
              {dbState.currentRole === 'Administrador' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
            <button
              onClick={() => handleToggleRole('Empleado')}
              className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between ${
                dbState.currentRole === 'Empleado' 
                  ? 'bg-brand-warning text-black shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-brand-card-light/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Empleado</span>
              </span>
              {dbState.currentRole === 'Empleado' && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            </button>
            <button
              onClick={() => handleToggleRole('Autoservicio')}
              className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between ${
                dbState.currentRole === 'Autoservicio' 
                  ? 'bg-brand-success text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-brand-card-light/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Autoservicio</span>
              </span>
              {dbState.currentRole === 'Autoservicio' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Navegación lateral principal */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2.5 px-1">Módulos</div>
          {MENU_TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'text-brand-red bg-brand-red/10 font-bold border-l-2 border-brand-red pl-2.5' 
                    : 'text-gray-400 hover:text-white hover:bg-brand-card/40'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-red' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer del Sidebar con info del negocio */}
        <div className="border-t border-gray-800/80 pt-4 text-center">
          <h5 className="text-[11px] font-display font-bold text-gray-300">{dbState.nombreNegocio || 'Lavadero RyN'}</h5>
          <p className="text-[9px] text-gray-500 mt-0.5 truncate">{dbState.direccionNegocio || 'Av. San Martín 1500'}</p>
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
          <span className="font-display font-extrabold text-sm text-white leading-none tracking-widest">
            LAVADERO <span className="text-brand-red">RyN</span>
          </span>
        </div>

        {/* Compact switcher de roles en móvil */}
        <div className="flex bg-brand-card p-0.5 rounded-lg border border-gray-800">
          <button
            onClick={() => handleToggleRole('Administrador')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
              dbState.currentRole === 'Administrador' 
                ? 'bg-brand-red text-white' 
                : 'text-gray-400'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleToggleRole('Empleado')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
              dbState.currentRole === 'Empleado' 
                ? 'bg-brand-warning text-black' 
                : 'text-gray-400'
            }`}
          >
            Emp
          </button>
          <button
            onClick={() => handleToggleRole('Autoservicio')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
              dbState.currentRole === 'Autoservicio' 
                ? 'bg-brand-success text-white' 
                : 'text-gray-400'
            }`}
          >
            Auto
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL CON CONTENEDOR FLEX-1 */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
          {activeTab === 'Inicio' && (
            <Dashboard 
              state={dbState} 
              onNavigate={setActiveTab} 
              onTriggerWhatsApp={handleTriggerWhatsApp} 
              onOpenQuickNewService={(res) => {
                if (res) setQuickServiceReserva(res);
                setActiveTab('Servicios');
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
                onClick={() => setActiveTab(tab.label)}
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

      {/* WhatsApp Message Drafting dialog drawer */}
      {whatsAppModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-card rounded-2xl border border-gray-800 shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-card-light text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
              <div className="p-2.5 bg-[#28A745]/15 border border-[#28A745]/30 text-[#28A745] rounded-xl shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-black text-white text-base">Enviar por WhatsApp</h4>
                <p className="text-[10px] text-gray-400 font-mono">Destinatario: {whatsAppModal.phone}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Contenido de la plantilla:</label>
              <textarea
                className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-white text-xs min-h-[110px] focus:outline-none focus:ring-1 focus:ring-[#28A745] leading-relaxed"
                value={whatsAppModal.text}
                onChange={(e) => setWhatsAppModal({ ...whatsAppModal, text: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyMessage}
                className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 border border-gray-850"
              >
                <Copy className="w-4 h-4 text-brand-warning" />
                <span>{copySuccess ? 'Copiado! ✔' : 'Copiar Texto'}</span>
              </button>

              <a
                href={getWhatsAppHref(whatsAppModal.phone, whatsAppModal.text)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsAppModal({ open: false, phone: '', text: '' })}
                className="bg-[#28A745] hover:bg-green-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 text-center"
              >
                <Smartphone className="w-4 h-4" />
                <span>Enviar Directo</span>
              </a>
            </div>

            <p className="text-[10px] text-center text-gray-500">
              * El botón "Enviar Directo" abrirá una nueva pestaña de chat en WhatsApp Web o en tu aplicación móvil con el mensaje pre-cargado.
            </p>
          </div>
        </div>
      )}

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
    </div>
  );
}
