/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getInitialState, saveState } from './db';
import { DatabaseState, Cliente, Vehiculo, Reserva, ServicioRealizado, Gasto, UserRole, ReservaEstado, FormaPago } from './types';

// Components
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Vehicles from './components/Vehicles';
import BookingCalendar from './components/BookingCalendar';
import Services from './components/Services';
import Caja from './components/Caja';
import Reports from './components/Reports';
import SelfService from './components/SelfService';

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
  UserCheck
} from 'lucide-react';
import { getWhatsAppHref, getConfirmationMessage, getVehicleReadyMessage, getInactiveGreetingMessage } from './utils/whatsapp';

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(getInitialState());
  const [activeTab, setActiveTab] = useState<string>('Inicio');
  
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

  // Persistence handler
  const updateStateAndPersist = (updatedFields: Partial<DatabaseState>) => {
    const newState = { ...dbState, ...updatedFields };
    setDbState(newState);
    saveState(newState);
  };

  // Switch User Profile Roles (Admin vs. Empleado)
  const handleToggleRole = (role: UserRole) => {
    // If we transition to Empleado and are on reports or cash, reset to Inicio
    if (role === 'Empleado' && (activeTab === 'Caja' || activeTab === 'Reportes')) {
      setActiveTab('Inicio');
    }
    updateStateAndPersist({ currentRole: role });
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
    const updated = [...dbState.clientes, newCliente];
    updateStateAndPersist({ clientes: updated });
  };

  const handleUpdateCliente = (updatedCli: Cliente) => {
    const updated = dbState.clientes.map(c => c.id === updatedCli.id ? updatedCli : c);
    updateStateAndPersist({ clientes: updated });
  };

  const handleDeleteCliente = (id: string) => {
    const filtered = dbState.clientes.filter(c => c.id !== id);
    // Cascade delete reservations, let's keep them or filter.
    updateStateAndPersist({ clientes: filtered });
  };

  // VEHICLES ACTIONS
  const handleAddVehiculo = (veh: Vehiculo) => {
    const updated = [...dbState.vehiculos, veh];
    updateStateAndPersist({ vehiculos: updated });
  };

  const handleUpdateVehiculo = (updatedVeh: Vehiculo) => {
    const updated = dbState.vehiculos.map(v => v.matricula === updatedVeh.matricula ? updatedVeh : v);
    updateStateAndPersist({ vehiculos: updated });
  };

  const handleDeleteVehiculo = (plate: string) => {
    const filtered = dbState.vehiculos.filter(v => v.matricula !== plate);
    updateStateAndPersist({ vehiculos: filtered });
  };

  // RESERVATIONS BOOKINGS ACTIONS
  const handleAddReserva = (resData: Omit<Reserva, 'id'>) => {
    const newId = `res-${Date.now()}`;
    const newRes: Reserva = {
      ...resData,
      id: newId
    };
    const updated = [...dbState.reservas, newRes];
    updateStateAndPersist({ reservas: updated });
  };

  const handleUpdateReserva = (updatedRes: Reserva) => {
    const updated = dbState.reservas.map(r => r.id === updatedRes.id ? updatedRes : r);
    updateStateAndPersist({ reservas: updated });
  };

  const handleUpdateReservaState = (reservaId: string, newState: ReservaEstado) => {
    const updated = dbState.reservas.map(r => r.id === reservaId ? { ...r, estado: newState } : r);
    updateStateAndPersist({ reservas: updated });
  };

  const handleDeleteReserva = (id: string) => {
    const filtered = dbState.reservas.filter(r => r.id !== id);
    updateStateAndPersist({ reservas: filtered });
  };

  // COMPLETED SERVICES ACTIONS
  const handleAddServicio = (srvData: Omit<ServicioRealizado, 'id'>) => {
    const newId = `srv-${Date.now()}`;
    const newSrv: ServicioRealizado = {
      ...srvData,
      id: newId
    };
    // If this service matches a reservation for the plate, mark it finalized!
    const updatedReservas = dbState.reservas.map(r => 
      r.vehiculoMatricula.toUpperCase() === srvData.vehiculoMatricula.toUpperCase() && r.estado !== 'Cancelado'
        ? { ...r, estado: 'Finalizado' as ReservaEstado }
        : r
    );

    const updatedServices = [...dbState.servicios, newSrv];
    updateStateAndPersist({ 
      servicios: updatedServices,
      reservas: updatedReservas
    });
  };

  const handleDeleteServicio = (id: string) => {
    const filtered = dbState.servicios.filter(s => s.id !== id);
    updateStateAndPersist({ servicios: filtered });
  };

  // EXPENSES GASTOS ACTIONS
  const handleAddGasto = (gstData: Omit<Gasto, 'id'>) => {
    const newId = `gst-${Date.now()}`;
    const newGst: Gasto = {
      ...gstData,
      id: newId
    };
    const updated = [...dbState.gastos, newGst];
    updateStateAndPersist({ gastos: updated });
  };

  const handleDeleteGasto = (id: string) => {
    const filtered = dbState.gastos.filter(g => g.id !== id);
    updateStateAndPersist({ gastos: filtered });
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
    
    const updatedClientes = [...dbState.clientes];
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
      updatedClientes.push(newCliente);
      finalClienteId = newClientId;
    }

    const cleanMatricula = vehiculoMatricula.toUpperCase().replace(/\s+/g, '');
    let vehicle = dbState.vehiculos.find(v => v.matricula.toUpperCase() === cleanMatricula);
    const updatedVehiculos = [...dbState.vehiculos];
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
      updatedVehiculos.push(newVeh);
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
    
    const updatedReservas = [...dbState.reservas, newRes];

    updateStateAndPersist({
      clientes: updatedClientes,
      vehiculos: updatedVehiculos,
      reservas: updatedReservas
    });

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
    ...(dbState.currentRole === 'Administrador' ? [
      { label: 'Caja', icon: DollarSign },
      { label: 'Reportes', icon: BarChart4 }
    ] : [])
  ];

  if (dbState.currentRole === 'Autoservicio') {
    return (
      <div id="lavadero-ryn-app" className="min-h-screen bg-brand-bg text-white p-4 sm:p-6 md:p-8 flex flex-col justify-center relative select-none">
        <SelfService 
          state={dbState}
          onAddBooking={handleAddBookingSelfService}
          onTriggerWhatsApp={handleTriggerWhatsApp}
          onExit={() => handleToggleRole('Administrador')}
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
    <div id="lavadero-ryn-app" className="min-h-screen pb-24 md:pb-6 flex flex-col justify-between select-none font-sans bg-brand-bg text-white">
      {/* Top Bar Navigation / System Profile actions */}
      <header className="sticky top-0 z-40 bg-brand-black border-b border-gray-800/80 p-4 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img 
              src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
              alt="Lavadero RyN Logo" 
              className="w-10 h-10 object-cover rounded-lg border border-brand-red/30 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-extrabold text-lg text-white leading-none tracking-widest hidden sm:inline">
              LAVADERO <span className="text-brand-red">RyN</span>
            </span>
          </div>

          {/* Quick interactive user role controller */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono hidden md:inline">Operario:</span>
            <div className="flex bg-brand-card p-1 rounded-xl border border-gray-850">
              <button
                onClick={() => handleToggleRole('Administrador')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  dbState.currentRole === 'Administrador' 
                    ? 'bg-brand-red text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => handleToggleRole('Empleado')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  dbState.currentRole === 'Empleado' 
                    ? 'bg-brand-warning text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Empleado</span>
              </button>
              <button
                onClick={() => handleToggleRole('Autoservicio')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  dbState.currentRole === 'Autoservicio' 
                    ? 'bg-brand-success text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Autoservicio</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-hidden">
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

      {/* Persistent Simple Navigation Menu at Bottom (Optimized for Mobile/Móvil) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-brand-black border-t border-gray-800/80 p-2 shrink-0 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1">
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
    </div>
  );
}
