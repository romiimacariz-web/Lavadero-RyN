/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  CalendarDays,
  Smartphone,
  Sparkles,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Instagram,
  Facebook,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie 
} from 'recharts';
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
  const [activeChartTab, setActiveChartTab] = useState<'ventas' | 'servicios' | 'volumen'>('ventas');
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // 1. Core KPIs
  const reservasHoy = useMemo(() => {
    return state.reservas.filter(r => r.fecha === todayStr && r.estado !== 'Cancelado');
  }, [state.reservas, todayStr]);

  const vehiculosAgendadosHoyCount = useMemo(() => reservasHoy.length, [reservasHoy]);

  const vehiculosEnProcesoCount = useMemo(() => {
    return reservasHoy.filter(r => 
      r.estado === 'Recibido' || r.estado === 'Lavando' || r.estado === 'Secando'
    ).length;
  }, [reservasHoy]);

  const vehiculosFinalizadosCount = useMemo(() => {
    return reservasHoy.filter(r => 
      r.estado === 'Finalizado' || r.estado === 'Entregado'
    ).length;
  }, [reservasHoy]);

  const facturacionHoy = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.precio, 0);
  }, [state.servicios, todayStr]);

  const facturacionMensual = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.precio, 0);
  }, [state.servicios, currentMonthStr]);

  // Next Appointment
  const proximoTurnoInfo = useMemo(() => {
    const activeReservations = state.reservas.filter(r => 
      r.estado !== 'Finalizado' && r.estado !== 'Entregado' && r.estado !== 'Cancelado'
    );
    const sortedActiveReservations = [...activeReservations].sort((a, b) => {
      const dateCompare = a.fecha.localeCompare(b.fecha);
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });
    const nextTurno = sortedActiveReservations[0] || null;
    const nextTurnoCliente = nextTurno ? state.clientes.find(c => c.id === nextTurno.clienteId) : null;
    return { proximoTurno: nextTurno, proximoTurnoCliente: nextTurnoCliente };
  }, [state.reservas, state.clientes]);

  const proximoTurno = proximoTurnoInfo.proximoTurno;
  const proximoTurnoCliente = proximoTurnoInfo.proximoTurnoCliente;

  // New clients this month
  const clientesNuevosDelMesCount = useMemo(() => {
    return state.clientes.filter(c => 
      c.fechaRegistro && c.fechaRegistro.startsWith(currentMonthStr)
    ).length;
  }, [state.clientes, currentMonthStr]);

  // 2. Charting Data Setup
  // Weekly Billing (Past 7 Days)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  }, []);

  const dataSemanal = useMemo(() => {
    return last7Days.map(date => {
      const parts = date.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      const total = state.servicios
        .filter(s => s.fecha.startsWith(date))
        .reduce((sum, s) => sum + s.precio, 0);
      const autos = state.servicios.filter(s => s.fecha.startsWith(date)).length;
      return { date, label, "Facturación": total, "Vehículos": autos };
    });
  }, [state.servicios, last7Days]);

  // Monthly Business Health (6 Months)
  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().substring(0, 7);
    });
  }, []);

  const dataMensual = useMemo(() => {
    return last6Months.map(month => {
      const [year, m] = month.split('-');
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const label = `${monthNames[parseInt(m) - 1]} ${year.substring(2)}`;
      const ingresos = state.servicios
        .filter(s => s.fecha.startsWith(month))
        .reduce((sum, s) => sum + s.precio, 0);
      const egresos = state.gastos
        .filter(g => g.fecha.startsWith(month))
        .reduce((sum, g) => sum + g.monto, 0);
      return { month, label, "Ingresos": ingresos, "Gastos": egresos, "Ganancia": ingresos - egresos };
    });
  }, [state.servicios, state.gastos, last6Months]);

  // Best Selling Services
  const dataServicios = useMemo(() => {
    const serviceCounts: { [key: string]: number } = {};
    state.servicios.forEach(s => {
      const type = s.tipo || 'Lavado Básico';
      serviceCounts[type] = (serviceCounts[type] || 0) + 1;
    });
    return Object.keys(serviceCounts).map(type => ({
      name: type,
      value: serviceCounts[type]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [state.servicios]);

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // Global Quick Search Filter
  const showSearchResults = globalSearch.trim().length > 0;

  const matchedClientes = useMemo(() => {
    if (!showSearchResults) return [];
    return state.clientes.filter(c => 
      c.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || 
      c.telefono.includes(globalSearch)
    );
  }, [state.clientes, globalSearch, showSearchResults]);

  const matchedVehiculos = useMemo(() => {
    if (!showSearchResults) return [];
    return state.vehiculos.filter(v => 
      v.matricula.toLowerCase().includes(globalSearch.toLowerCase()) || 
      v.marca.toLowerCase().includes(globalSearch.toLowerCase()) || 
      v.modelo.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [state.vehiculos, globalSearch, showSearchResults]);

  const matchedReservas = useMemo(() => {
    if (!showSearchResults) return [];
    return state.reservas.filter(r => {
      const cliName = state.clientes.find(c => c.id === r.clienteId)?.nombre || '';
      return r.vehiculoMatricula.toLowerCase().includes(globalSearch.toLowerCase()) ||
             cliName.toLowerCase().includes(globalSearch.toLowerCase());
    });
  }, [state.reservas, state.clientes, globalSearch, showSearchResults]);

  // WhatsApp quick triggers
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

  // State colors mappings
  const getStateColor = (estado: string) => {
    switch (estado) {
      case 'Reservado': return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
      case 'Recibido': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Lavando': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Secando': return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'Finalizado': return 'bg-green-500/10 text-green-400 border border-green-500/30';
      case 'Entregado': return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40';
      case 'En proceso': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Cancelado': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  // Next state resolver for quick advance flow
  const getNextState = (current: string) => {
    if (current === 'Reservado') return 'Recibido';
    if (current === 'Recibido') return 'Lavando';
    if (current === 'Lavando') return 'Secando';
    if (current === 'Secando') return 'Finalizado';
    if (current === 'Finalizado') return 'Entregado';
    return null;
  };

  const getNextStateLabel = (current: string) => {
    if (current === 'Reservado') return 'Recibir';
    if (current === 'Recibido') return 'Iniciar Lavado';
    if (current === 'Lavando') return 'Iniciar Secado';
    if (current === 'Secando') return 'Terminar';
    if (current === 'Finalizado') return 'Entregar';
    return null;
  };

  const businessName = state.nombreNegocio || 'Lavadero RyN';
  const businessLogo = state.logoUrl || '/src/assets/images/lavadero_ryn_logo_1782222462483.jpg';

  return (
    <div className="space-y-6">
      {/* Redesigned Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-card p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-5">
          <img 
            src={businessLogo} 
            alt="Logo" 
            className="w-16 h-16 object-cover rounded-2xl border border-brand-red/30 shadow-xl"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // fallback if invalid logo
              (e.target as HTMLImageElement).src = '/src/assets/images/lavadero_ryn_logo_1782222462483.jpg';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-display font-extrabold tracking-tight text-white uppercase">
                {businessName}
              </h1>
              <Award className="w-5 h-5 text-brand-red hidden sm:inline" />
            </div>
            <p className="text-gray-400 text-sm font-sans mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span>{state.direccionNegocio || 'Av. San Martín 1500'}</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">{state.horarios || 'Lunes a Sábado de 08:00 a 20:00'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs bg-brand-card-light px-3.5 py-2 rounded-xl border border-gray-800">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-success animate-pulse"></span>
            <span className="text-gray-300 font-mono font-bold">Rol: {state.currentRole}</span>
          </div>
          {state.currentRole === 'Administrador' && (
            <button 
              onClick={() => onNavigate('Configuración')}
              className="bg-brand-red/10 border border-brand-red/30 hover:bg-brand-red/20 text-brand-red text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Configurar Negocio
            </button>
          )}
        </div>
      </div>

      {/* Guía de Inicio Rápido Estilo Notion/Shopify Dashboard */}
      <div className="bg-brand-card/30 border border-gray-800 rounded-3xl overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowQuickGuide(!showQuickGuide)}
          className="w-full flex items-center justify-between p-4 px-6 hover:bg-brand-card/45 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
                Guía de Inicio Rápido: Aprende en 2 minutos
              </h3>
              <p className="text-[10px] text-gray-400">Todo lo necesario para dominar el sistema de lavado de un vistazo</p>
            </div>
          </div>
          <div className="text-gray-400 hover:text-white transition">
            {showQuickGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showQuickGuide && (
          <div className="p-6 pt-2 border-t border-gray-800/60 bg-brand-black/25 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              
              {/* Paso 1 */}
              <div 
                onClick={() => onNavigate('Clientes')}
                className="group p-4 bg-brand-card/60 hover:bg-brand-card border border-gray-800/80 hover:border-brand-red/30 rounded-2xl transition-all cursor-pointer space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Paso 1
                  </span>
                  <Users className="w-4 h-4 text-gray-500 group-hover:text-brand-red transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-brand-red transition-colors">Registrar Cliente & Auto</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    Ve a la pestaña <b>Clientes</b>, registra un nuevo cliente y vincula su vehículo con patente de forma instantánea.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div 
                onClick={() => onNavigate('Agenda')}
                className="group p-4 bg-brand-card/60 hover:bg-brand-card border border-gray-800/80 hover:border-brand-red/30 rounded-2xl transition-all cursor-pointer space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-brand-warning bg-brand-warning/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Paso 2
                  </span>
                  <CalendarDays className="w-4 h-4 text-gray-500 group-hover:text-brand-warning transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-brand-warning transition-colors">Agendar un Turno</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    En <b>Agenda</b>, selecciona el día/hora y haz clic en "Crear Reserva" para programar el servicio solicitado por el cliente.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div 
                onClick={() => onNavigate('Inicio')}
                className="group p-4 bg-brand-card/60 hover:bg-brand-card border border-gray-800/80 hover:border-brand-red/30 rounded-2xl transition-all cursor-pointer space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Paso 3
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-gray-500 group-hover:text-brand-success transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-brand-success transition-colors">Gestionar flujo en vivo</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    Desde el <b>Dashboard</b>, avanza el estado de los autos en tiempo real (Recibido → Lavando → Secando → Terminar → Entregar) y avísales por WhatsApp.
                  </p>
                </div>
              </div>

            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-gray-500 border-t border-gray-800/40 pt-3 gap-2">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-brand-red" />
                <span>¿Sabías que puedes arrastrar turnos en la Agenda semanal/mensual para reprogramar al instante?</span>
              </span>
              <button 
                onClick={() => setShowQuickGuide(false)}
                className="text-gray-400 hover:text-white transition font-medium hover:underline text-left sm:text-right"
              >
                Ocultar de momento
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Global Quick Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-3.5 border border-gray-800 rounded-2xl bg-brand-card text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red font-sans transition-all"
          placeholder="Buscar clientes por nombre, teléfono, patentes, marcas o modelos de vehículos..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        {globalSearch && (
          <button 
            type="button" 
            onClick={() => setGlobalSearch('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-brand-red font-bold hover:underline"
          >
            Limpiar Búsqueda
          </button>
        )}
      </div>

      {/* Global Search Results Panel */}
      {showSearchResults && (
        <div className="p-5 bg-brand-card rounded-2xl border border-brand-red/35 space-y-4 shadow-2xl animate-fadeIn">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-red" />
            Coincidencias encontradas:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clientes */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Clientes ({matchedClientes.length})</h3>
              {matchedClientes.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Sin clientes coincidentes</p>
              ) : (
                <div className="space-y-1.5">
                  {matchedClientes.slice(0, 3).map(c => (
                    <div key={c.id} className="p-3 bg-brand-card-light rounded-xl flex justify-between items-center border border-gray-800 hover:border-brand-red/30 transition-all text-xs">
                      <div>
                        <p className="font-semibold text-white">{c.nombre}</p>
                        <p className="text-gray-400 font-mono text-[10px]">{c.telefono}</p>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearch(''); onNavigate('Clientes'); }} 
                        className="text-[10px] text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/20 font-bold transition"
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
              <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Vehículos ({matchedVehiculos.length})</h3>
              {matchedVehiculos.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Sin vehículos coincidentes</p>
              ) : (
                <div className="space-y-1.5">
                  {matchedVehiculos.slice(0, 3).map(v => (
                    <div key={v.matricula} className="p-3 bg-brand-card-light rounded-xl flex justify-between items-center border border-gray-800 hover:border-brand-red/30 transition-all text-xs">
                      <div>
                        <p className="font-semibold text-white capitalize">{v.marca} {v.modelo}</p>
                        <span className="bg-white text-black font-mono text-[10px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase mt-1 inline-block">
                          {v.matricula}
                        </span>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearch(''); onNavigate('Vehículos'); }} 
                        className="text-[10px] text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/20 font-bold transition"
                      >
                        Ver Perfil Vehículo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reservas Coincidentes */}
          <div className="pt-2 border-t border-gray-800/60">
            <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">Turnos correspondientes ({matchedReservas.length})</h3>
            {matchedReservas.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No se encontraron turnos</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matchedReservas.slice(0, 4).map(r => {
                  const client = state.clientes.find(c => c.id === r.clienteId);
                  return (
                    <div key={r.id} className="p-3 bg-brand-card-light rounded-xl flex justify-between items-center border border-gray-800 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{client?.nombre}</span>
                          <span className="bg-brand-red/20 text-brand-red font-mono px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {r.vehiculoMatricula}
                          </span>
                        </div>
                        <p className="text-gray-400 font-mono text-[10px] mt-1">
                          {r.fecha} a las {r.hora} hs &mdash; <span className="italic">{r.servicioSol}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearch(''); onNavigate('Agenda'); }}
                        className="bg-brand-card hover:bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-[10px] text-gray-300 font-bold transition"
                      >
                        Ir al Calendario
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redesigned Responsive KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* scheduled today */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-gray-700 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Agendados Hoy</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-extrabold text-white">{vehiculosAgendadosHoyCount}</span>
            <span className="text-[10px] text-gray-500">vehículos</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
            <span>Planificados</span>
          </div>
        </div>

        {/* in process */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-amber-500/20 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">En Proceso</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-extrabold text-amber-400">{vehiculosEnProcesoCount}</span>
            <span className="text-[10px] text-amber-500/80">activos</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Lavando o secando</span>
          </div>
        </div>

        {/* finished */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-green-500/20 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Finalizados Hoy</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-extrabold text-brand-success">{vehiculosFinalizadosCount}</span>
            <span className="text-[10px] text-brand-success/80">listos</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
            <span>Limpieza terminada</span>
          </div>
        </div>

        {/* billing day */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-emerald-500/20 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Facturación Día</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-display font-extrabold text-emerald-400 font-mono">${facturacionHoy.toLocaleString('es-AR')}</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Caja bruta hoy</span>
          </div>
        </div>

        {/* billing monthly */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-emerald-500/20 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Facturación Mes</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-display font-extrabold text-emerald-400 font-mono">${facturacionMensual.toLocaleString('es-AR')}</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <DollarSign className="w-3.5 h-3.5 text-brand-success" />
            <span>Acumulado mensual</span>
          </div>
        </div>

        {/* next appointment */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-red-500/20 transition relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Próximo Turno</p>
          {proximoTurno ? (
            <div className="mt-1">
              <p className="text-xs font-bold text-white truncate max-w-[130px]">{proximoTurnoCliente?.nombre || 'S/D'}</p>
              <p className="text-[11px] text-brand-red font-bold font-mono">{proximoTurno.hora} hs ({proximoTurno.fecha === todayStr ? 'Hoy' : proximoTurno.fecha})</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic mt-2">Sin turnos pendientes</p>
          )}
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <Clock className="w-3 h-3 text-brand-red" />
            <span className="truncate">{proximoTurno?.servicioSol || 'Ninguno'}</span>
          </div>
        </div>

        {/* new clients month */}
        <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 hover:border-purple-500/20 transition relative overflow-hidden group">
          <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Nuevos Clientes</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-extrabold text-purple-400">{clientesNuevosDelMesCount}</span>
            <span className="text-[10px] text-purple-500">este mes</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Fidelizados</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Today's Calendar Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Beautiful Charts & Analytics */}
        <div className="bg-brand-card rounded-3xl border border-gray-800 p-6 lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-red" />
                Métricas del Negocio
              </h2>
              <p className="text-xs text-gray-400">Estadísticas e ingresos financieros en tiempo real</p>
            </div>
            
            <div className="flex bg-brand-card-light p-1 rounded-xl border border-gray-800 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('ventas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeChartTab === 'ventas' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Ventas Semanales
              </button>
              <button
                onClick={() => setActiveChartTab('servicios')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeChartTab === 'servicios' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Servicios Populares
              </button>
              <button
                onClick={() => setActiveChartTab('volumen')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeChartTab === 'volumen' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Ingresos vs Gastos
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {activeChartTab === 'ventas' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataSemanal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="label" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }} 
                    formatter={(val: any) => [`$${val.toLocaleString('es-AR')}`, 'Facturación']}
                  />
                  <Area type="monotone" dataKey="Facturación" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFacturacion)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'servicios' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full items-center">
                <div className="md:col-span-7 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataServicios}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataServicios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} lavados`, 'Cantidad']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="md:col-span-5 space-y-2 max-h-full overflow-y-auto pr-2">
                  <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Top Servicios Vendidos</h4>
                  {dataServicios.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No hay datos históricos aún</p>
                  ) : (
                    dataServicios.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-2 bg-brand-card-light rounded-xl border border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="font-medium text-white truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-[10px]">{item.value} u.</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeChartTab === 'volumen' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="label" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`$${val.toLocaleString('es-AR')}`]}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
                  <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-brand-card-light rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500">VOLUMEN SEMANAL</p>
                <p className="text-xl font-display font-extrabold text-white mt-1">
                  {dataSemanal.reduce((sum, d) => sum + d["Vehículos"], 0)} vehículos
                </p>
              </div>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <Car className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-brand-card-light rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500">UTILIDAD ESTIMADA MES</p>
                <p className="text-xl font-display font-extrabold text-emerald-400 mt-1">
                  ${(facturacionMensual - state.gastos.filter(g => g.fecha.startsWith(currentMonthStr)).reduce((sum, g) => sum + g.monto, 0)).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Small Google-Calendar Today's Timeline / Agenda */}
        <div className="bg-brand-card rounded-3xl border border-gray-800 p-6 lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-base font-display font-black text-white flex items-center gap-1.5">
                  <CalendarDays className="w-4.5 h-4.5 text-brand-red" />
                  Agenda del Día
                </h2>
                <p className="text-[11px] text-gray-500">Cronograma de turnos de hoy ({todayStr})</p>
              </div>
              <button 
                onClick={() => onNavigate('Agenda')}
                className="text-xs text-brand-red font-bold hover:underline shrink-0"
              >
                Ver Agenda completa
              </button>
            </div>

            {/* List of today's bookings arranged by hour */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {reservasHoy.length === 0 ? (
                <div className="py-12 text-center bg-brand-card-light rounded-2xl border border-dashed border-gray-800 text-gray-400">
                  <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">No hay turnos hoy</p>
                  <p className="text-[10px] text-gray-500 mt-1">Sugerido para hoy</p>
                  <button 
                    onClick={() => onNavigate('Agenda')}
                    className="mt-3 bg-brand-red hover:bg-red-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition"
                  >
                    + Crear Reserva
                  </button>
                </div>
              ) : (
                [...reservasHoy]
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map(res => {
                    const client = state.clientes.find(c => c.id === res.clienteId);
                    const car = state.vehiculos.find(v => v.matricula === res.vehiculoMatricula);
                    const nextS = getNextState(res.estado);
                    const nextLabel = getNextStateLabel(res.estado);

                    return (
                      <div 
                        key={res.id} 
                        className="p-3 bg-brand-card-light rounded-2xl border border-gray-850 hover:border-gray-800 transition flex flex-col gap-2 relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white">{res.hora} hs</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${getStateColor(res.estado)}`}>
                                {res.estado}
                              </span>
                            </div>
                            <p className="font-bold text-gray-100 text-xs truncate max-w-[150px]">{client?.nombre || 'Cliente Desconocido'}</p>
                            <p className="text-[10px] text-gray-400 capitalize">
                              {car?.marca || ''} {car?.modelo || ''} &mdash; <span className="bg-white/10 text-gray-200 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{res.vehiculoMatricula}</span>
                            </p>
                            <p className="text-[9px] font-mono text-gray-500 italic truncate max-w-[180px]">Servicio: {res.servicioSol}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* WhatsApp reminder trigger button */}
                            <button
                              onClick={() => handleConfirmWhatsApp(res)}
                              title="Enviar recordatorio WhatsApp"
                              className="p-1.5 bg-[#28A745]/10 hover:bg-[#28A745]/20 text-[#28A745] border border-[#28A745]/20 rounded-lg transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            {res.estado === 'Lavando' || res.estado === 'Secando' ? (
                              <button
                                onClick={() => handleReadyWhatsApp(res)}
                                title="Notificar que está Listo por WhatsApp"
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Interactive transition quick control pill */}
                        {nextS && nextLabel && (
                          <div className="mt-1 pt-2 border-t border-gray-800/40 flex justify-end">
                            <button
                              onClick={() => onUpdateReservaState(res.id, nextS)}
                              className="text-[9px] bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white px-2 py-1 rounded-md font-bold flex items-center gap-1 transition"
                            >
                              <span>{nextLabel}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {/* Final completion payment button */}
                        {res.estado === 'Finalizado' && (
                          <div className="mt-1 pt-2 border-t border-gray-800/40 flex justify-end">
                            <button
                              onClick={() => onOpenQuickNewService(res)}
                              className="text-[9px] bg-green-500 hover:bg-green-600 text-black px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1 transition shadow"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Registrar Cobro</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Clientes Totales:</span>
              <span className="font-mono text-white font-bold">{state.clientes.length}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Vehículos Vinculados:</span>
              <span className="font-mono text-white font-bold">{state.vehiculos.length}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={() => { onOpenQuickNewService(); }}
                className="bg-brand-red hover:bg-red-800 text-white py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-brand-red/10 text-center"
              >
                + Registrar Lavado
              </button>
              <button 
                onClick={() => onNavigate('Agenda')}
                className="bg-brand-card-light hover:bg-gray-800 text-white py-2 rounded-xl text-xs font-semibold border border-gray-800 transition"
              >
                Planificar Turno
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
