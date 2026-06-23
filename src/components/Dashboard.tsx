/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, Cliente, Vehiculo, Reserva, ServicioRealizado } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Clock, 
  Search, 
  Car, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  Play, 
  XOctagon,
  CalendarDays,
  Smartphone
} from 'lucide-react';
import { getWhatsAppHref, getVehicleReadyMessage, getConfirmationMessage } from '../utils/whatsapp';

interface DashboardProps {
  state: DatabaseState;
  onNavigate: (tab: string) => void;
  onTriggerWhatsApp: (phone: string, text: string) => void;
  onOpenQuickNewService: (suggestedReserva?: Reserva) => void;
  onUpdateReservaState: (reservaId: string, newState: any) => void;
}

export default function Dashboard({ 
  state, 
  onNavigate, 
  onTriggerWhatsApp, 
  onOpenQuickNewService,
  onUpdateReservaState
}: DashboardProps) {
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Calculations for TODAY (Hoy) using local date format
  const todayStr = new Date().toISOString().split('T')[0];

  // Services registered today
  const servicesToday = state.servicios.filter(s => s.fecha.startsWith(todayStr));
  const autosAtendidosHoyCount = servicesToday.length;
  const ingresosHoy = servicesToday.reduce((acc, curr) => acc + curr.precio, 0);

  // Expenses logged today
  const gastosHoy = state.gastos
    .filter(g => g.fecha === todayStr)
    .reduce((acc, curr) => acc + curr.monto, 0);

  // Net earnings
  const gananciaNetaHoy = ingresosHoy - gastosHoy;

  // Active reservations details for today
  const reservasHoy = state.reservas.filter(r => r.fecha === todayStr);
  const proximasReservas = state.reservas.filter(r => r.estado === 'Reservado' || r.estado === 'En proceso');

  // Pending bookings (not finished / not cancelled)
  const serviciosPendientes = state.reservas.filter(r => r.estado === 'En proceso' || r.estado === 'Reservado');

  // Search Results
  const showSearchResults = globalSearch.trim().length > 0;
  const matchedClientes = showSearchResults
    ? state.clientes.filter(c => 
        c.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || 
        c.telefono.includes(globalSearch)
      )
    : [];

  const matchedVehiculos = showSearchResults
    ? state.vehiculos.filter(v => 
        v.matricula.toLowerCase().includes(globalSearch.toLowerCase()) || 
        v.marca.toLowerCase().includes(globalSearch.toLowerCase()) || 
        v.modelo.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : [];

  const matchedReservas = showSearchResults
    ? state.reservas.filter(r => {
        const cliName = state.clientes.find(c => c.id === r.clienteId)?.nombre || '';
        return r.vehiculoMatricula.toLowerCase().includes(globalSearch.toLowerCase()) ||
               cliName.toLowerCase().includes(globalSearch.toLowerCase());
      })
    : [];

  // Template Quick Send
  const handleReadyWhatsApp = (res: Reserva) => {
    const client = state.clientes.find(c => c.id === res.clienteId);
    if (!client) return;
    const msg = getVehicleReadyMessage({ nombre: client.nombre });
    onTriggerWhatsApp(client.whatsapp, msg);
  };

  const handleConfirmWhatsApp = (res: Reserva) => {
    const client = state.clientes.find(c => c.id === res.clienteId);
    if (!client) return;
    const msg = getConfirmationMessage({ 
      nombre: client.nombre, 
      fecha: res.fecha, 
      hora: res.hora 
    });
    onTriggerWhatsApp(client.whatsapp, msg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
            alt="Lavadero RyN Logo" 
            className="w-14 h-14 object-cover rounded-xl border border-brand-red/30 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
              LAVADERO <span className="text-brand-red font-black">RyN</span>
            </h1>
            <p className="text-gray-400 text-sm font-sans mt-1">
              Gestión Inteligente de Lavado Automotor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-brand-card px-3 py-1.5 rounded-full border border-gray-800">
          <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
          <span className="text-gray-300 font-mono">Modo: {state.currentRole}</span>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-3 border border-gray-800 rounded-xl bg-brand-card text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red font-sans"
          placeholder="Búsqueda rápida por cliente, matrícula (patente), marca, modelo..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        {globalSearch && (
          <button 
            type="button" 
            onClick={() => setGlobalSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brand-red hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Global Search Results Panel */}
      {showSearchResults && (
        <div className="p-5 bg-brand-card rounded-2xl border border-brand-red/30 space-y-4">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-red" />
            Resultados de Búsqueda Rápida:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clientes */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Clientes correspondientes ({matchedClientes.length})</h3>
              {matchedClientes.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No se encontraron clientes</p>
              ) : (
                <div className="space-y-1.5">
                  {matchedClientes.map(c => (
                    <div key={c.id} className="p-2.5 bg-brand-card-light rounded-xl flex justify-between items-center text-xs hover:border-brand-red border border-transparent transition-all">
                      <div>
                        <p className="font-semibold text-white">{c.nombre}</p>
                        <p className="text-gray-400 font-mono text-[10px]">{c.telefono}</p>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearch(''); onNavigate('Clientes'); }} 
                        className="text-[10px] text-brand-red bg-brand-red/10 px-2 py-1 rounded hover:bg-brand-red/20"
                      >
                        Ver Perfil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehículos */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Vehículos correspondientes ({matchedVehiculos.length})</h3>
              {matchedVehiculos.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No se encontraron vehículos</p>
              ) : (
                <div className="space-y-1.5">
                  {matchedVehiculos.map(v => (
                    <div key={v.matricula} className="p-2.5 bg-brand-card-light rounded-xl flex justify-between items-center text-xs hover:border-brand-red border border-transparent transition-all">
                      <div>
                        <p className="font-semibold text-white capitalize">{v.marca} {v.modelo}</p>
                        <span className="bg-white text-black font-mono text-[10px] px-1.5 py-0.5 rounded font-bold plate-font">
                          {v.matricula}
                        </span>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearch(''); onNavigate('Vehículos'); }} 
                        className="text-[10px] text-brand-red bg-brand-red/10 px-2 py-1 rounded hover:bg-brand-red/20"
                      >
                        Ver Historial
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reservas Coincidentes */}
          <div className="pt-2 border-t border-gray-800">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Reservas correspondientes ({matchedReservas.length})</h3>
            {matchedReservas.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No se encontraron reservas</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matchedReservas.map(r => {
                  const client = state.clientes.find(c => c.id === r.clienteId);
                  return (
                    <div key={r.id} className="p-3 bg-brand-card-light rounded-xl flex justify-between items-center border border-gray-800 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{client?.nombre}</span>
                          <span className="bg-brand-red/30 text-brand-red font-mono px-1 rounded text-[10px]">
                            {r.vehiculoMatricula}
                          </span>
                        </div>
                        <p className="text-gray-400 font-mono text-[10px] mt-0.5">
                          {r.fecha} a las {r.hora} - <span className="italic">{r.servicioSol}</span>
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => { setGlobalSearch(''); onNavigate('Agenda'); }}
                          className="bg-brand-card px-2 py-1 rounded text-[10px] text-gray-300 border border-gray-700 hover:border-brand-red"
                        >
                          Ir a Agenda
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Autos Atendidos */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-brand-red/50 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono font-medium text-gray-400">AUTOS HOY</p>
            <div className="absolute top-2 right-3 opacity-15">
              <Car className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <p className="text-3xl font-display font-extrabold text-white mt-3">{autosAtendidosHoyCount}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Servicios de lavado hoy</span>
          </div>
        </div>

        {/* Ingresos Hoy */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-brand-success/50 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono font-medium text-gray-400">INGRESOS HOY</p>
            <div className="absolute top-2 right-3 opacity-15">
              <TrendingUp className="w-16 h-16 text-brand-success" />
            </div>
          </div>
          <p className="text-3xl font-display font-extrabold text-brand-success mt-3 font-mono">
            ${ingresosHoy.toLocaleString('es-AR')}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <span className="w-1.5 h-1.5 bg-brand-success rounded-full"></span>
            <span>Caja bruta hoy</span>
          </div>
        </div>

        {/* Gastos Hoy */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-brand-red/50 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono font-medium text-gray-400">GASTOS HOY</p>
            <div className="absolute top-2 right-3 opacity-15">
              <TrendingDown className="w-16 h-16 text-brand-red" />
            </div>
          </div>
          <p className="text-3xl font-display font-extrabold text-brand-red mt-3 font-mono">
            ${gastosHoy.toLocaleString('es-AR')}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
            <span>Egresos registrados</span>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono font-medium text-gray-400 text-brand-warning">GANANCIA NETA</p>
            <div className="absolute top-2 right-3 opacity-15">
              <DollarSign className="w-16 h-16 text-brand-warning" />
            </div>
          </div>
          <p className="text-3xl font-display font-extrabold text-[#FFC107] mt-3 font-mono">
            ${gananciaNetaHoy.toLocaleString('es-AR')}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <span className="w-1.5 h-1.5 bg-brand-warning rounded-full"></span>
            <span>Ingresos - Gastos</span>
          </div>
        </div>
      </div>

      {/* Services in Process (Servicios Pendientes / En Proceso) */}
      <div className="p-5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-warning" />
            Servicios en Proceso / Pendientes ({serviciosPendientes.length})
          </h2>
          <button 
            type="button"
            onClick={() => onNavigate('Servicios')}
            className="text-xs text-brand-red font-medium hover:underline"
          >
            Ver Historial Completado
          </button>
        </div>

        {serviciosPendientes.length === 0 ? (
          <div className="p-6 text-center bg-brand-card-light rounded-xl border border-dashed border-gray-800 text-gray-400">
            <CheckCircle2 className="w-8 h-8 text-brand-success mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium">¡No hay servicios en proceso en este momento!</p>
            <p className="text-xs mt-1 text-gray-500">Haz clic en el botón flotante inferior para programar un lavado o iniciar un servicio de inmediato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {serviciosPendientes.map(res => {
              const client = state.clientes.find(c => c.id === res.clienteId);
              const car = state.vehiculos.find(v => v.matricula === res.vehiculoMatricula);
              
              return (
                <div 
                  key={res.id} 
                  className={`p-4 bg-brand-card-light rounded-xl border transition-all flex flex-col justify-between ${
                    res.estado === 'En proceso' 
                      ? 'border-brand-warning/30 bg-brand-warning/5' 
                      : 'border-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded tracking-wider bg-white text-black plate-font">
                          {res.vehiculoMatricula}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{car?.marca} {car?.modelo}</span>
                      </div>
                      <p className="font-display font-bold text-base text-white mt-1.5">{client?.nombre}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize font-medium flex items-center gap-1 justify-start">
                        <Activity className="w-3.5 h-3.5 text-brand-red inline" />
                        Solicitado: <span className="text-gray-200">{res.servicioSol}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono font-medium text-gray-500 italic block">{res.fecha}</span>
                      <span className="text-xs font-mono font-bold text-gray-300 mt-1">{res.hora} hs</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-bold mt-2 ${
                        res.estado === 'En proceso' 
                          ? 'bg-brand-warning text-black animate-pulse' 
                          : 'bg-brand-card text-gray-400 border border-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${res.estado === 'En proceso' ? 'bg-black' : 'bg-gray-400'}`}></span>
                        {res.estado}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside the pending item */}
                  <div className="mt-4 pt-3 border-t border-gray-800/60 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleConfirmWhatsApp(res)}
                        title="Enviar Confirmación de Reserva"
                        className="bg-brand-card-light hover:bg-[#28A745]/20 border border-gray-800 text-[#28A745] px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Mandar Reserva
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {res.estado === 'Reservado' && (
                        <button
                          onClick={() => onUpdateReservaState(res.id, 'En proceso')}
                          className="bg-brand-warning hover:bg-yellow-500 text-black px-2.5 py-1.5 rounded-lg font-medium text-[11px] flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Iniciar Lavado
                        </button>
                      )}
                      {res.estado === 'En proceso' && (
                        <>
                          <button
                            onClick={() => handleReadyWhatsApp(res)}
                            className="bg-[#28A745]/20 hover:bg-[#28A745]/30 border border-[#28A745]/40 text-[#28A745] px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            Avisar Listo
                          </button>
                          <button
                            onClick={() => onOpenQuickNewService(res)}
                            className="bg-brand-red hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-medium text-[11px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Finalizar y Cobrar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Upcoming Bookings and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Bookings */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-red" />
              Próximas Reservas
            </h2>
            <button 
              type="button" 
              onClick={() => onNavigate('Agenda')}
              className="text-xs text-brand-red font-medium hover:underline"
            >
              Ver Agenda Calendario
            </button>
          </div>

          <div className="space-y-2.5">
            {proximasReservas.slice(0, 4).map(res => {
              const client = state.clientes.find(c => c.id === res.clienteId);
              const car = state.vehiculos.find(v => v.matricula === res.vehiculoMatricula);
              
              return (
                <div key={res.id} className="p-3 bg-brand-card-light rounded-xl border border-gray-800/80 flex justify-between items-center text-xs hover:border-gray-700 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-sm">{client?.nombre}</span>
                      <span className="text-[10px] bg-brand-red/15 text-brand-red px-1.5 py-0.5 rounded plate-font font-bold">
                        {res.vehiculoMatricula}
                      </span>
                    </div>
                    <p className="text-gray-400 capitalize">{car?.marca} {car?.modelo} &mdash; <span className="text-gray-300 italic">{res.servicioSol}</span></p>
                    <p className="text-[10px] text-gray-500 font-mono">Reserva ID: {res.id}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <p className="text-white font-bold">{res.hora} hs</p>
                      <p className="text-[10px] text-gray-400">{res.fecha}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleConfirmWhatsApp(res)}
                        title="Recordatorio de Reserva"
                        className="bg-brand-card hover:bg-[#28A745]/15 text-[#28A745] p-2 rounded-lg border border-gray-800 hover:border-[#28A745]/30 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {proximasReservas.length === 0 && (
              <p className="text-xs text-gray-500 italic text-center py-4">No hay reservas programadas próximas.</p>
            )}
          </div>
        </div>

        {/* Brand/Status card */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-display font-medium text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-warning" />
              Acerca de Lavadero RyN
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Plataforma unificada para optimizar las operaciones de lavado diario. Puedes gestionar turnos desde la **Agenda**, administrar fotos de control (antes/después) en los **Servicios** para resguardo ante reclamos, y fidelizar clientes inactivos por **WhatsApp**.
            </p>
            
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Total Clientes:</span>
                <span className="font-mono text-white font-semibold">{state.clientes.length}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Vehículos vinculados:</span>
                <span className="font-mono text-white font-semibold">{state.vehiculos.length}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Servicios Históricos:</span>
                <span className="font-mono text-white font-semibold">{state.servicios.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigate('Servicios')}
                className="bg-brand-red text-white py-2 rounded-lg text-xs font-semibold hover:bg-red-800 transition text-center"
              >
                + Registrar Lavado
              </button>
              <button 
                onClick={() => onNavigate('Agenda')}
                className="bg-[#2B2B2B] text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-700 transition"
              >
                Ver Calendario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkles helper component since we didn't import it
function Sparkles(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}
