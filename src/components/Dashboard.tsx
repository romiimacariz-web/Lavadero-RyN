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
  Award,
  Plus,
  RefreshCw,
  Zap,
  ArrowUpRight,
  AlertCircle
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
  const [activeChartTab, setActiveChartTab] = useState<'ventas' | 'servicios' | 'volumen' | 'clientes'>('ventas');
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // --- Calculations for KPI Cards ---

  // 1. Vehículos de hoy
  const reservasHoy = useMemo(() => {
    return state.reservas.filter(r => r.fecha === todayStr && r.estado !== 'Cancelado');
  }, [state.reservas, todayStr]);

  const vehiculosAgendadosHoyCount = useMemo(() => reservasHoy.length, [reservasHoy]);

  // 2. Vehículos en proceso
  const vehiculosEnProcesoCount = useMemo(() => {
    return reservasHoy.filter(r => 
      r.estado === 'Recibido' || r.estado === 'Lavando' || r.estado === 'Secando'
    ).length;
  }, [reservasHoy]);

  // 3. Vehículos finalizados
  const vehiculosFinalizadosCount = useMemo(() => {
    return reservasHoy.filter(r => 
      r.estado === 'Finalizado' || r.estado === 'Entregado'
    ).length;
  }, [reservasHoy]);

  // 4. Facturación del día
  const facturacionHoy = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.precio, 0);
  }, [state.servicios, todayStr]);

  // 5. Facturación del mes
  const facturacionMensual = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.precio, 0);
  }, [state.servicios, currentMonthStr]);

  // 6. Próximo turno
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

  // 7. Clientes nuevos
  const clientesNuevosDelMesCount = useMemo(() => {
    return state.clientes.filter(c => 
      c.fechaRegistro && c.fechaRegistro.startsWith(currentMonthStr)
    ).length;
  }, [state.clientes, currentMonthStr]);

  // 8. Servicios realizados
  const serviciosHoyCount = useMemo(() => {
    return state.servicios.filter(s => s.fecha.startsWith(todayStr)).length;
  }, [state.servicios, todayStr]);

  const serviciosTotalCount = useMemo(() => {
    return state.servicios.length;
  }, [state.servicios]);


  // --- Calculations for Charting Data ---

  // 1. Weekly Billing (Past 7 Days)
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

  // 2. Monthly Margin (Past 6 Months)
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

  // 3. Best Selling Services
  const dataServicios = useMemo(() => {
    const serviceCounts: { [key: string]: number } = {};
    state.servicios.forEach(s => {
      const type = s.tipo || 'Lavado básico';
      serviceCounts[type] = (serviceCounts[type] || 0) + 1;
    });
    return Object.keys(serviceCounts).map(type => ({
      name: type,
      value: serviceCounts[type]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [state.servicios]);

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // 4. Clientes frecuentes
  const topClientes = useMemo(() => {
    const clientCounts: { [key: string]: number } = {};
    state.servicios.forEach(s => {
      clientCounts[s.clienteId] = (clientCounts[s.clienteId] || 0) + 1;
    });
    return Object.keys(clientCounts).map(cid => {
      const client = state.clientes.find(c => c.id === cid);
      return {
        name: client?.nombre || 'Consumidor Final',
        count: clientCounts[cid],
        totalSpent: state.servicios
          .filter(s => s.clienteId === cid)
          .reduce((sum, s) => sum + s.precio, 0)
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [state.servicios, state.clientes]);


  // --- Global Quick Search Filter ---
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


  // --- Recent Activity ---
  const recentActivity = useMemo(() => {
    const services = state.servicios.map(s => ({
      id: s.id,
      timestamp: s.fecha,
      type: 'servicio' as const,
      title: 'Lavado Realizado',
      description: `${s.tipo} - Patente: ${s.vehiculoMatricula}`,
      amount: s.precio,
      owner: state.clientes.find(c => c.id === s.clienteId)?.nombre || 'Particular'
    }));

    const expenses = state.gastos.map(g => ({
      id: g.id,
      timestamp: `${g.fecha} 00:00`,
      type: 'gasto' as const,
      title: 'Egreso Registrado',
      description: `${g.descripcion} (${g.categoria})`,
      amount: -g.monto,
      owner: 'Administración'
    }));

    return [...services, ...expenses]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);
  }, [state.servicios, state.gastos, state.clientes]);


  // --- WhatsApp Triggers ---
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


  // --- Helper state styles mappings ---
  const getStateColor = (estado: string) => {
    switch (estado) {
      case 'Reservado': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Recibido': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Lavando': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse';
      case 'Secando': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Finalizado': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Entregado': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default: return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
  };

  const getNextState = (estado: string) => {
    switch (estado) {
      case 'Reservado': return 'Recibido';
      case 'Recibido': return 'Lavando';
      case 'Lavando': return 'Secando';
      case 'Secando': return 'Finalizado';
      default: return null;
    }
  };

  const getNextStateLabel = (estado: string) => {
    switch (estado) {
      case 'Reservado': return 'Recibir';
      case 'Recibido': return 'Iniciar Lavado';
      case 'Lavando': return 'Secado';
      case 'Secando': return 'Finalizar';
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 2.0 Professional Banner Header */}
      <div className="p-6 bg-brand-card rounded-3xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-brand-red text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-1 shadow shadow-brand-red/10">
              <Zap className="w-3 h-3 animate-bounce" /> SaaS v2.0
            </span>
            <p className="text-xs text-brand-red font-semibold font-mono tracking-wider">Centro de Mando Pro</p>
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-white">
            {state.nombreNegocio || 'Lavadero RyN'}
          </h1>
          <p className="text-xs text-gray-400">
            {state.horarios || 'Lunes a Sábado de 08:00 a 20:00'} &bull; {state.direccionNegocio || 'Av. San Martín 1500'}
          </p>
        </div>

        {/* Global search launcher bar */}
        <div className="w-full md:max-w-xs relative z-10">
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2.5 text-xs border border-gray-800 rounded-xl bg-brand-card-light text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red font-sans"
            placeholder="Buscar patentes, clientes o reservas..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          {showSearchResults && (
            <button 
              onClick={() => setGlobalSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brand-red font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Global Interactive Search Drawer Overlay */}
      {showSearchResults && (
        <div className="p-5 bg-brand-card border border-brand-red/30 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-850 pb-2">
            <AlertCircle className="w-4 h-4 text-brand-red" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Resultados de Búsqueda Global ({matchedClientes.length + matchedVehiculos.length + matchedReservas.length})</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Clientes */}
            <div className="space-y-2">
              <p className="font-mono text-gray-500 uppercase tracking-widest text-[9px] border-b border-gray-800 pb-1">👤 Clientes ({matchedClientes.length})</p>
              {matchedClientes.slice(0, 3).map(c => (
                <div key={c.id} onClick={() => onNavigate('Clientes')} className="p-2 bg-brand-card-light rounded-lg border border-gray-850 cursor-pointer hover:border-brand-red transition">
                  <p className="font-bold text-white">{c.nombre}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{c.telefono}</p>
                </div>
              ))}
              {matchedClientes.length === 0 && <p className="text-[10px] text-gray-600 italic">No hay coincidencia</p>}
            </div>

            {/* Vehículos */}
            <div className="space-y-2">
              <p className="font-mono text-gray-500 uppercase tracking-widest text-[9px] border-b border-gray-800 pb-1">🚗 Vehículos ({matchedVehiculos.length})</p>
              {matchedVehiculos.slice(0, 3).map(v => (
                <div key={v.matricula} onClick={() => onNavigate('Vehículos')} className="p-2 bg-brand-card-light rounded-lg border border-gray-850 cursor-pointer hover:border-brand-red transition">
                  <span className="bg-white text-black px-1 py-0.5 rounded text-[8px] font-mono font-black">{v.matricula}</span>
                  <p className="font-bold text-white mt-1 capitalize">{v.marca} {v.modelo}</p>
                </div>
              ))}
              {matchedVehiculos.length === 0 && <p className="text-[10px] text-gray-600 italic">No hay coincidencia</p>}
            </div>

            {/* Reservas */}
            <div className="space-y-2">
              <p className="font-mono text-gray-500 uppercase tracking-widest text-[9px] border-b border-gray-800 pb-1">📅 Reservas ({matchedReservas.length})</p>
              {matchedReservas.slice(0, 3).map(r => {
                const owner = state.clientes.find(c => c.id === r.clienteId)?.nombre || 'Particular';
                return (
                  <div key={r.id} onClick={() => onNavigate('Agenda')} className="p-2 bg-brand-card-light rounded-lg border border-gray-850 cursor-pointer hover:border-brand-red transition">
                    <div className="flex justify-between">
                      <span className="font-bold text-white font-mono">{r.hora}</span>
                      <span className="text-[9px] text-brand-red font-semibold">{r.estado}</span>
                    </div>
                    <p className="text-[10px] text-gray-300 truncate mt-0.5">{owner} - {r.vehiculoMatricula}</p>
                  </div>
                );
              })}
              {matchedReservas.length === 0 && <p className="text-[10px] text-gray-600 italic">No hay coincidencia</p>}
            </div>
          </div>
        </div>
      )}

      {/* FASE 1: Grid of 8 Premium SaaS KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        
        {/* Card 1: Vehículos de hoy */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-gray-700 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Vehículos Hoy</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-display font-extrabold text-white">{vehiculosAgendadosHoyCount}</span>
            <span className="text-[9px] text-gray-500 font-medium">unidades</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <CalendarDays className="w-3 h-3 text-blue-400" />
            <span>Planificados hoy</span>
          </div>
        </div>

        {/* Card 2: Vehículos en proceso */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-amber-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">En Proceso</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-display font-extrabold text-amber-400">{vehiculosEnProcesoCount}</span>
            <span className="text-[9px] text-amber-500/60 font-medium">activos</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="truncate">Lavando / secando</span>
          </div>
        </div>

        {/* Card 3: Vehículos finalizados */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-green-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Finalizados</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-display font-extrabold text-brand-success">{vehiculosFinalizadosCount}</span>
            <span className="text-[9px] text-brand-success/60 font-medium">listos</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <CheckCircle2 className="w-3 h-3 text-brand-success" />
            <span>Listos para retirar</span>
          </div>
        </div>

        {/* Card 4: Facturación del día */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-emerald-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Caja Hoy</p>
          <div className="flex items-baseline gap-0.5 mt-1.5">
            <span className="text-xl font-display font-extrabold text-emerald-400 font-mono">${facturacionHoy.toLocaleString('es-AR')}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Ingresos brutos hoy</span>
          </div>
        </div>

        {/* Card 5: Facturación del mes */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-emerald-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Facturación Mes</p>
          <div className="flex items-baseline gap-0.5 mt-1.5">
            <span className="text-xl font-display font-extrabold text-emerald-400 font-mono">${facturacionMensual.toLocaleString('es-AR')}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span>Acumulado del mes</span>
          </div>
        </div>

        {/* Card 6: Próximo turno */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-red-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Próximo Turno</p>
          {proximoTurno ? (
            <div className="mt-1">
              <p className="text-[10px] font-bold text-white truncate">{proximoTurnoCliente?.nombre || 'S/D'}</p>
              <p className="text-[9px] text-brand-red font-bold font-mono">{proximoTurno.hora} hs</p>
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 italic mt-2.5">Sin pendientes</p>
          )}
          <div className="mt-1 flex items-center gap-1 text-[8px] text-gray-500">
            <Clock className="w-2.5 h-2.5 text-brand-red" />
            <span className="truncate">{proximoTurno?.servicioSol || 'Ninguno'}</span>
          </div>
        </div>

        {/* Card 7: Clientes nuevos */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-purple-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Clientes Nuevos</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-display font-extrabold text-purple-400">{clientesNuevosDelMesCount}</span>
            <span className="text-[9px] text-purple-500 font-medium">mes</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <Users className="w-3 h-3 text-purple-400" />
            <span>Registrados este mes</span>
          </div>
        </div>

        {/* Card 8: Servicios realizados */}
        <div className="p-3 bg-brand-card rounded-2xl border border-gray-800 hover:border-cyan-500/20 transition relative overflow-hidden group">
          <p className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">Trabajos</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-lg font-display font-extrabold text-cyan-400 font-mono">
              {serviciosHoyCount}
            </span>
            <span className="text-[8px] text-gray-500 ml-1">hoy &bull;</span>
            <span className="text-xs font-bold text-cyan-400 font-mono ml-1">{serviciosTotalCount}</span>
            <span className="text-[8px] text-gray-500 ml-0.5">tot</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[9px] text-gray-500">
            <Award className="w-3 h-3 text-cyan-400" />
            <span>Lavados realizados</span>
          </div>
        </div>

      </div>

      {/* QUICK ACCESS ACTIONS ROW */}
      <div className="p-4 bg-brand-card rounded-2xl border border-gray-800/80">
        <p className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-red animate-pulse" /> Accesos Rápidos Operativos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          <button 
            onClick={() => onOpenQuickNewService()}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-red hover:bg-red-800 text-white font-extrabold rounded-xl transition duration-150 shadow shadow-brand-red/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Registrar Lavado
          </button>
          <button 
            onClick={() => onNavigate('Agenda')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-card-light hover:bg-[#2B2B2B] text-white border border-gray-800 rounded-xl transition cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-blue-400 shrink-0" />
            Crear Reserva
          </button>
          <button 
            onClick={() => onNavigate('Clientes')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-card-light hover:bg-[#2B2B2B] text-white border border-gray-800 rounded-xl transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
            Registrar Cliente
          </button>
          <button 
            onClick={() => onNavigate('Caja')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-card-light hover:bg-[#2B2B2B] text-white border border-gray-800 rounded-xl transition cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            Registrar Gasto
          </button>
          <button 
            onClick={() => onNavigate('Caja')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-success/10 hover:bg-brand-success/20 text-brand-success border border-brand-success/20 rounded-xl transition font-bold cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Cierre de Caja
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Charts (Col Span 8) & Today's Calendar Timeline (Col Span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recharts Interactive Analytics Panel */}
        <div className="bg-brand-card rounded-3xl border border-gray-800 p-6 lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-lg font-display font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-red" />
                Métricas del Lavadero RyN
              </h2>
              <p className="text-xs text-gray-400">Estadísticas e ingresos financieros actualizados al instante</p>
            </div>
            
            <div className="flex bg-brand-card-light p-1 rounded-xl border border-gray-800 shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveChartTab('ventas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  activeChartTab === 'ventas' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Ventas Semanales
              </button>
              <button
                onClick={() => setActiveChartTab('volumen')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  activeChartTab === 'volumen' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Histórico Mensual
              </button>
              <button
                onClick={() => setActiveChartTab('servicios')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  activeChartTab === 'servicios' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Servicios Populares
              </button>
              <button
                onClick={() => setActiveChartTab('clientes')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                  activeChartTab === 'clientes' ? 'bg-brand-red text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Clientes Frecuentes
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {/* Chart 1: Facturación Semanal AreaChart */}
            {activeChartTab === 'ventas' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataSemanal} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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

            {/* Chart 2: Facturación Mensual Ingresos vs Gastos */}
            {activeChartTab === 'volumen' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMensual} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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

            {/* Chart 3: Servicios más vendidos PieChart */}
            {activeChartTab === 'servicios' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full items-center">
                <div className="md:col-span-6 h-full">
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
                <div className="md:col-span-6 space-y-2 max-h-full overflow-y-auto pr-2">
                  <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Top Servicios Más Vendidos</h4>
                  {dataServicios.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No hay datos de servicios aún</p>
                  ) : (
                    dataServicios.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-2.5 bg-brand-card-light rounded-xl border border-gray-850">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="font-semibold text-white truncate max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-[10px]">{item.value} u.</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Chart 4: Clientes Frecuentes Leaderboard */}
            {activeChartTab === 'clientes' && (
              <div className="space-y-3 h-full overflow-y-auto pr-1">
                <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Clientes Recurrentes de Mayor Impacto</h4>
                {topClientes.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-12">No hay servicios registrados en la base de datos</p>
                ) : (
                  topClientes.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs p-3 bg-brand-card-light rounded-xl border border-gray-850">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red font-bold flex items-center justify-center text-[10px]">
                          #{index + 1}
                        </div>
                        <span className="font-bold text-white text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-mono">VISITAS</p>
                          <p className="font-mono font-bold text-gray-200">{item.count} veces</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-[10px] text-gray-500 font-mono">TOTAL GASTADO</p>
                          <p className="font-mono font-extrabold text-brand-success">${item.totalSpent.toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-brand-card-light rounded-2xl border border-gray-850 flex items-center justify-between">
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

            <div className="p-4 bg-brand-card-light rounded-2xl border border-gray-850 flex items-center justify-between">
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

        {/* Right Section: Today's Timeline Calendar & Recent Activity Feed */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* Calendar Agenda of Today */}
          <div className="bg-brand-card rounded-3xl border border-gray-800 p-5 space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-gray-850 pb-4">
              <div>
                <h2 className="text-base font-display font-black text-white flex items-center gap-1.5">
                  <CalendarDays className="w-4.5 h-4.5 text-brand-red" />
                  Agenda del Día
                </h2>
                <p className="text-[10px] text-gray-500">Turnos agendados para hoy ({todayStr})</p>
              </div>
              <button 
                onClick={() => onNavigate('Agenda')}
                className="text-xs text-brand-red font-bold hover:underline shrink-0"
              >
                Ver Agenda
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {reservasHoy.length === 0 ? (
                <div className="py-12 text-center bg-brand-card-light rounded-2xl border border-dashed border-gray-850 text-gray-400">
                  <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-gray-400">No hay turnos hoy</p>
                  <button 
                    onClick={() => onNavigate('Agenda')}
                    className="mt-3 bg-brand-red hover:bg-red-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    + Planificar Turno
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
                        className="p-3 bg-brand-card-light rounded-xl border border-gray-850 flex flex-col gap-2 relative hover:border-gray-800 transition"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-white font-mono">{res.hora} hs</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${getStateColor(res.estado)}`}>
                                {res.estado}
                              </span>
                            </div>
                            <p className="font-bold text-gray-100 text-xs truncate max-w-[150px]">{client?.nombre || 'Particular'}</p>
                            <p className="text-[10px] text-gray-400">
                              {car?.marca || ''} {car?.modelo || ''} &mdash; <span className="bg-white/10 text-gray-200 px-1 py-0.5 rounded font-mono text-[9px] font-bold">{res.vehiculoMatricula}</span>
                            </p>
                            <p className="text-[9px] font-mono text-gray-500 truncate">Servicio: {res.servicioSol}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleConfirmWhatsApp(res)}
                              title="Enviar recordatorio WhatsApp"
                              className="p-1.5 bg-[#28A745]/10 hover:bg-[#28A745]/20 text-[#28A745] border border-[#28A745]/20 rounded-lg transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            {(res.estado === 'Lavando' || res.estado === 'Secando') && (
                              <button
                                onClick={() => handleReadyWhatsApp(res)}
                                title="Notificar que está Listo por WhatsApp"
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {nextS && nextLabel && (
                          <div className="mt-0.5 pt-2 border-t border-gray-850 flex justify-end">
                            <button
                              onClick={() => onUpdateReservaState(res.id, nextS)}
                              className="text-[9px] bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white px-2 py-1 rounded-md font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>{nextLabel}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {res.estado === 'Finalizado' && (
                          <div className="mt-0.5 pt-2 border-t border-gray-850 flex justify-end">
                            <button
                              onClick={() => onOpenQuickNewService(res)}
                              className="text-[9px] bg-emerald-500 hover:bg-emerald-600 text-black px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1 transition shadow cursor-pointer"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Cobrar Lavado</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Recent Activity Stream Panel */}
          <div className="bg-brand-card rounded-3xl border border-gray-800 p-5 space-y-4">
            <h2 className="text-sm font-display font-bold text-white flex items-center gap-1.5 border-b border-gray-850 pb-3">
              <Activity className="w-4 h-4 text-brand-red" />
              Actividad Reciente
            </h2>

            <div className="space-y-3">
              {recentActivity.map(act => (
                <div key={act.id} className="flex gap-2.5 items-start text-xs border-b border-gray-850/40 pb-2.5 last:border-0 last:pb-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${act.type === 'servicio' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-red/10 text-brand-red'}`}>
                    {act.type === 'servicio' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white truncate max-w-[120px]">{act.title}</p>
                      <span className="text-[9px] font-mono text-gray-500">{act.timestamp.split(' ')[0]}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{act.description}</p>
                    <p className="text-[9px] text-gray-500 truncate">Por: {act.owner}</p>
                  </div>
                  <span className={`font-mono text-xs font-bold shrink-0 ${act.type === 'servicio' ? 'text-emerald-400' : 'text-brand-red'}`}>
                    {act.type === 'servicio' ? '+' : ''}${Math.abs(act.amount).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <p className="text-[10px] text-gray-500 italic text-center py-6">Sin registros de actividad reciente.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
