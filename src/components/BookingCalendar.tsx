/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseState, Reserva, Cliente, Vehiculo, ReservaEstado } from '../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock3, 
  XOctagon, 
  FileText, 
  Smartphone, 
  MessageSquare,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check,
  Edit,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { getWhatsAppHref, getConfirmationMessage } from '../utils/whatsapp';

interface BookingCalendarProps {
  state: DatabaseState;
  onAddReserva: (reserva: Omit<Reserva, 'id'>) => void;
  onUpdateReserva: (reserva: Reserva) => void;
  onDeleteReserva: (id: string) => void;
  onTriggerWhatsApp: (phone: string, text: string) => void;
}

type CalendarViewMode = 'Día' | 'Semana' | 'Mes';

const EMPLEADOS_WASHERS = [
  'Juan Pérez',
  'Pedro Gómez',
  'Carlos Rodríguez',
  'Matías López',
  'Santi Herrera',
  'Facundo Díaz'
];

export default function BookingCalendar({ 
  state, 
  onAddReserva, 
  onUpdateReserva, 
  onDeleteReserva,
  onTriggerWhatsApp
}: BookingCalendarProps) {
  // Date and view management
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Semana');
  const [isAdding, setIsAdding] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState<string | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Form states
  const [clienteId, setClienteId] = useState('');
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  const [fecha, setFecha] = useState(selectedDate);
  const [hora, setHora] = useState('08:00');
  const [servicioSol, setServicioSol] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [empleado, setEmpleado] = useState('');

  // Default dynamic package choice when catalog loads
  useEffect(() => {
    if (!servicioSol && state.serviciosCatalogo && state.serviciosCatalogo.length > 0) {
      setServicioSol(state.serviciosCatalogo[0].tipo);
    }
  }, [state.serviciosCatalogo, servicioSol]);

  // Fetch client or vehicle details
  const getCliente = (id: string) => state.clientes.find(c => c.id === id);
  const getVehiculo = (plate: string) => state.vehiculos.find(v => v.matricula.toUpperCase() === plate.toUpperCase());

  // Filter reservations depending on selected viewMode
  const getReservasForDate = (dateStr: string) => {
    return state.reservas.filter(r => r.fecha === dateStr);
  };

  // Get days of the week starting from Monday of selected date's week
  const daysOfWeek = useMemo((): Date[] => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(current.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [selectedDate]);

  // Get days of month for Month view grid
  const daysOfMonth = useMemo((): (Date | null)[] => {
    const selected = new Date(selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week index for first day (Monday as index 0)
    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; // Sunday

    const days: (Date | null)[] = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Populate actual month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [selectedDate]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, r: Reserva) => {
    e.dataTransfer.setData('text/plain', r.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDay = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const reserva = state.reservas.find(r => r.id === id);
    if (reserva && reserva.fecha !== targetDateStr) {
      onUpdateReserva({
        ...reserva,
        fecha: targetDateStr
      });
    }
  };

  // Auto-fill form when choosing user
  const handleClienteChange = (cid: string) => {
    setClienteId(cid);
    const firstCar = state.vehiculos.find(v => v.clienteId === cid);
    if (firstCar) {
      setVehiculoMatricula(firstCar.matricula);
    } else {
      setVehiculoMatricula('');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !vehiculoMatricula || !fecha || !hora) return;

    onAddReserva({
      clienteId,
      vehiculoMatricula: vehiculoMatricula.toUpperCase().replace(/\s+/g, ''),
      fecha,
      hora,
      servicioSol,
      estado: 'Reservado',
      observaciones: observaciones.trim() || undefined,
      empleado: empleado || undefined
    });

    setIsAdding(false);
    setObservaciones('');
    setEmpleado('');
  };

  const changeSelectedDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
    setFecha(current.toISOString().split('T')[0]);
  };

  const changeSelectedMonth = (months: number) => {
    const current = new Date(selectedDate);
    current.setMonth(current.getMonth() + months);
    setSelectedDate(current.toISOString().split('T')[0]);
    setFecha(current.toISOString().split('T')[0]);
  };

  // Service package specific color schemes
  const getServiceColorStyle = (srvName: string) => {
    const name = srvName.toLowerCase();
    if (name.includes('premium') || name.includes('completo')) {
      return 'bg-amber-500/10 hover:bg-amber-500/20 text-[#FFC107] border-brand-warning/30';
    } else if (name.includes('acril') || name.includes('pulido') || name.includes('ceramico')) {
      return 'bg-red-500/10 hover:bg-red-500/20 text-brand-red border-brand-red/30';
    } else if (name.includes('motor') || name.includes('chasis')) {
      return 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-800/40';
    } else if (name.includes('tapizado') || name.includes('interior')) {
      return 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-800/40';
    } else {
      return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-brand-success border-brand-success/30';
    }
  };

  const getStatusStyle = (estado: ReservaEstado) => {
    switch(estado) {
      case 'Reservado':
        return 'bg-blue-900/30 text-blue-300 border-blue-800';
      case 'Recibido':
        return 'bg-purple-900/30 text-purple-300 border-purple-800';
      case 'Lavando':
        return 'bg-orange-950/40 text-orange-400 border-orange-850 animate-pulse';
      case 'Secando':
        return 'bg-cyan-950/40 text-cyan-400 border-cyan-850';
      case 'Finalizado':
        return 'bg-emerald-950/40 text-brand-success border-brand-success/30';
      case 'Entregado':
        return 'bg-gray-800 text-gray-400 border-gray-700';
      case 'Cancelado':
        return 'bg-brand-red/10 text-brand-red border-brand-red/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const sendConfirmationWhatsApp = (res: Reserva) => {
    const client = getCliente(res.clienteId);
    if (!client) return;
    const msg = getConfirmationMessage({
      nombre: client.nombre,
      fecha: res.fecha,
      hora: res.hora
    });
    onTriggerWhatsApp(client.whatsapp, msg);
  };

  const handleQuickStatusChange = (res: Reserva, newStatus: ReservaEstado) => {
    onUpdateReserva({
      ...res,
      estado: newStatus
    });
    if (selectedReserva && selectedReserva.id === res.id) {
      setSelectedReserva({
        ...selectedReserva,
        estado: newStatus
      });
    }
  };

  const handleQuickEmployeeAssign = (res: Reserva, empName: string) => {
    onUpdateReserva({
      ...res,
      empleado: empName === 'Ninguno' ? undefined : empName
    });
    if (selectedReserva && selectedReserva.id === res.id) {
      setSelectedReserva({
        ...selectedReserva,
        empleado: empName === 'Ninguno' ? undefined : empName
      });
    }
  };

  // Memoized grid data values are declared and computed above via useMemo.

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white">Agenda del Lavadero</h2>
            <p className="text-xs text-gray-400">Arqueo visual en cuadrícula interactiva con soporte de reordenamiento drag-and-drop</p>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-1.5 bg-[#070709] p-1 rounded-xl border border-white/[0.04] self-start md:self-auto">
          {(['Día', 'Semana', 'Mes'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === mode 
                  ? 'bg-[#181822] text-white border border-white/[0.05] shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Create Booking trigger */}
        <button
          onClick={() => { setIsAdding(true); setFecha(selectedDate); }}
          className="premium-btn-primary px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          Crear Reserva
        </button>
      </div>

      {/* Date controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-brand-card rounded-2xl border border-white/[0.04] shadow-md gap-3">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => viewMode === 'Mes' ? changeSelectedMonth(-1) : changeSelectedDate(-1)} 
            className="p-2 bg-[#181822]/40 hover:bg-[#181822] rounded-xl text-gray-400 hover:text-white border border-white/[0.04] transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="bg-[#181822]/40 border border-white/[0.04] hover:bg-[#181822] text-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition"
          >
            Hoy
          </button>
          <button 
            onClick={() => viewMode === 'Mes' ? changeSelectedMonth(1) : changeSelectedDate(1)} 
            className="p-2 bg-[#181822]/40 hover:bg-[#181822] rounded-xl text-gray-400 hover:text-white border border-white/[0.04] transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm font-black text-white font-display uppercase tracking-wider">
            {viewMode === 'Mes' ? (
              new Date(selectedDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
            ) : viewMode === 'Semana' ? (
              `Semana del ${daysOfWeek[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al ${daysOfWeek[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
            ) : (
              new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            )}
          </span>
        </div>

        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setFecha(e.target.value); }}
          className="bg-[#181822]/40 border border-white/[0.04] rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-brand-red focus:outline-none font-mono cursor-pointer"
        />
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Reservation form collapsible sidebar */}
        {isAdding && (
          <div className="lg:col-span-4 p-5 bg-[#0F0F15] rounded-3xl border border-white/[0.04] space-y-4 shadow-xl">
            <h3 className="text-base font-display font-black text-white border-b border-white/[0.05] pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red" />
              Nueva Reserva de Turno
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Cliente *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3 py-2 text-xs transition duration-150 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {state.clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Patente del Vehículo *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3 py-2 text-xs transition duration-150 focus:outline-none font-mono uppercase"
                  placeholder="Ej: AA123BC"
                  value={vehiculoMatricula}
                  onChange={(e) => setVehiculoMatricula(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-2 py-2 text-xs transition duration-150 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Hora *</label>
                  <select
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-2 py-2 text-xs transition duration-150 focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="08:00">08:00</option>
                    <option value="10:00">10:00</option>
                    <option value="12:00">12:00</option>
                    <option value="14:00">14:00</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Servicio Solicitado</label>
                <select
                  value={servicioSol}
                  onChange={(e) => setServicioSol(e.target.value)}
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3 py-2 text-xs transition duration-150 focus:outline-none cursor-pointer"
                >
                  {state.serviciosCatalogo.map(p => (
                    <option key={p.id} value={p.tipo}>{p.tipo} (${p.precio})</option>
                  ))}
                  <option value="Otro">Otro / Personalizado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Asignar Lavador / Empleado</label>
                <select
                  value={empleado}
                  onChange={(e) => setEmpleado(e.target.value)}
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3 py-2 text-xs transition duration-150 focus:outline-none cursor-pointer"
                >
                  <option value="">Sin asignar</option>
                  {EMPLEADOS_WASHERS.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Observaciones de Ingreso</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles particulares..."
                  className="w-full bg-[#181822] border border-white/[0.06] text-white min-h-[60px] focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3 py-2 text-xs transition duration-150 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-1/2 bg-[#181822] hover:bg-white/[0.04] text-white border border-white/[0.06] font-bold py-2.5 rounded-xl cursor-pointer transition text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-red hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-brand-red/10 text-xs"
                >
                  Reservar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dynamic Interactive Google Calendar Grid */}
        <div className={`p-5 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl shadow-black/30 ${isAdding ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* DAY VIEW TIMELINE GRID */}
          {viewMode === 'Día' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                <Clock className="w-5 h-5 text-brand-red" />
                <h3 className="font-display font-black text-white">Cronograma del Día</h3>
              </div>
              
              <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto pr-1">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hourStr) => {
                  const hourPrefix = hourStr.split(':')[0];
                  // Map reservations that match this slot or are within the 2-hour interval
                  const listHourReservas = getReservasForDate(selectedDate).filter(r => {
                    const resHour = parseInt(r.hora.split(':')[0]);
                    const slotHour = parseInt(hourPrefix);
                    return resHour === slotHour || (resHour === slotHour + 1);
                  });

                  return (
                    <div key={hourStr} className="py-3.5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-16 font-mono text-xs font-black text-brand-red flex items-center gap-1">
                        <span>{hourStr}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {listHourReservas.map(res => {
                          const client = getCliente(res.clienteId);
                          return (
                            <div 
                              key={res.id}
                              onClick={() => setSelectedReserva(res)}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all duration-150 hover:scale-[1.01] ${getServiceColorStyle(res.servicioSol)}`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="bg-white text-black font-mono font-black px-1.5 py-0.5 rounded text-[9px] plate-font leading-none">
                                  {res.vehiculoMatricula}
                                </span>
                                <span className="text-[9px] font-bold tracking-wider uppercase truncate">{res.servicioSol}</span>
                              </div>
                              <p className="font-bold text-white text-xs truncate font-display">{client?.nombre || 'Particular'}</p>
                              <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
                                <span className={`px-1.5 py-0.5 rounded-full border ${getStatusStyle(res.estado)}`}>{res.estado}</span>
                                {res.empleado && <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1">👤 {res.empleado.split(' ')[0]}</span>}
                              </div>
                            </div>
                          );
                        })}
                        {listHourReservas.length === 0 && (
                          <span className="text-gray-600 italic text-[10px] py-1">Sin turnos agendados</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW PLANNER */}
          {viewMode === 'Semana' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center border-b border-white/[0.05] pb-2.5">
                {daysOfWeek.map((day, index) => {
                  const dayStr = day.toISOString().split('T')[0];
                  const isToday = dayStr === new Date().toISOString().split('T')[0];
                  return (
                    <div key={dayStr} className="space-y-1">
                      <p className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                        {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </p>
                      <p className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-display font-black text-xs ${
                        isToday ? 'bg-brand-red text-white' : 'text-gray-300'
                      }`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Weekly drops zone blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {daysOfWeek.map(day => {
                  const dayStr = day.toISOString().split('T')[0];
                  const reservations = getReservasForDate(dayStr).sort((a,b) => a.hora.localeCompare(b.hora));

                  return (
                    <div 
                      key={dayStr}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnDay(e, dayStr)}
                      className="p-2 bg-[#181822]/20 rounded-xl border border-white/[0.03] min-h-[160px] space-y-1.5 hover:border-white/[0.1] transition-all duration-200 flex flex-col"
                    >
                      {reservations.map(res => {
                        const client = getCliente(res.clienteId);
                        return (
                          <div
                            key={res.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, res)}
                            onClick={() => setSelectedReserva(res)}
                            className={`p-2 rounded-lg border text-[10px] flex flex-col gap-1 cursor-grab active:cursor-grabbing transition duration-150 ${getServiceColorStyle(res.servicioSol)}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-black bg-white text-black px-1 rounded text-[8px] plate-font leading-none uppercase">
                                {res.vehiculoMatricula}
                              </span>
                              <span className="font-bold font-mono text-[9px] text-white shrink-0">{res.hora}</span>
                            </div>
                            <p className="font-bold truncate text-white font-display">{client?.nombre || 'Particular'}</p>
                            <span className="text-[8px] text-gray-400 capitalize truncate">{res.servicioSol}</span>
                          </div>
                        );
                      })}
                      {reservations.length === 0 && (
                        <p className="text-[9px] text-gray-600 italic text-center m-auto">Arrastrar aquí</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTH VIEW GRID */}
          {viewMode === 'Mes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-gray-500 uppercase border-b border-white/[0.05] pb-2.5 font-bold">
                <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {daysOfMonth.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="bg-transparent h-16 sm:h-20"></div>;

                  const dayStr = day.toISOString().split('T')[0];
                  const isToday = dayStr === new Date().toISOString().split('T')[0];
                  const reservations = getReservasForDate(dayStr);

                  return (
                    <div 
                      key={dayStr}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnDay(e, dayStr)}
                      onClick={() => { setSelectedDate(dayStr); setViewMode('Día'); }}
                      className={`p-1.5 bg-[#181822]/20 rounded-xl border cursor-pointer min-h-[72px] sm:min-h-[88px] flex flex-col justify-between hover:border-brand-red transition duration-150 ${
                        isToday ? 'border-brand-red bg-brand-red/5' : 'border-white/[0.03]'
                      }`}
                    >
                      <span className={`text-[10px] font-black font-display p-1 self-start rounded-md leading-none ${isToday ? 'text-brand-red' : 'text-gray-400'}`}>
                        {day.getDate()}
                      </span>

                      {/* Display small dots or text for desktop */}
                      <div className="space-y-1 overflow-hidden max-h-[48px] w-full">
                        {reservations.slice(0, 3).map(res => (
                          <div 
                            key={res.id} 
                            className="hidden sm:block text-[8px] px-1 py-0.5 rounded truncate font-mono uppercase bg-brand-red/20 text-brand-red font-bold"
                          >
                            {res.hora} - {res.vehiculoMatricula}
                          </div>
                        ))}
                        {/* Mobile dots indicator */}
                        <div className="flex flex-wrap gap-1 p-1 sm:hidden">
                          {reservations.map(res => (
                            <span key={res.id} className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reservation Advanced Inspector/Drawer modal */}
      {selectedReserva && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F0F15] rounded-3xl border border-white/[0.04] p-6 space-y-6 shadow-2xl shadow-black/60 animate-scaleUp text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3.5">
              <h3 className="text-base font-display font-black text-white flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-brand-red" />
                Detalles del Turno
              </h3>
              <button onClick={() => setSelectedReserva(null)} className="text-gray-400 hover:text-white font-bold cursor-pointer transition">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-wider">Dueño del Vehículo</p>
                  <p className="font-black text-white text-base font-display mt-0.5">{getCliente(selectedReserva.clienteId)?.nombre || 'Particular'}</p>
                  <p className="text-gray-400 font-mono text-xs">{getCliente(selectedReserva.clienteId)?.telefono}</p>
                </div>

                <div className="text-right">
                  <span className="bg-white text-black text-xs font-mono font-black px-2.5 py-1 rounded tracking-widest plate-font uppercase inline-block shadow">
                    {selectedReserva.vehiculoMatricula}
                  </span>
                  <p className="text-[9px] text-gray-500 font-mono mt-1 font-bold uppercase tracking-wider">Patente Control</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#181822]/40 rounded-xl border border-white/[0.04]">
                <div>
                  <p className="text-[9px] text-gray-500 font-mono font-bold uppercase">Fecha & Hora</p>
                  <p className="text-white font-bold font-mono mt-0.5">{selectedReserva.fecha}</p>
                  <p className="text-brand-red font-extrabold font-mono text-xs">{selectedReserva.hora} hs</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-mono font-bold uppercase">Servicio Solicitado</p>
                  <p className="text-white font-bold capitalize mt-0.5 font-display">{selectedReserva.servicioSol}</p>
                </div>
              </div>

              {/* Assignment controls */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-wider">Lavador Asignado</p>
                <select
                  value={selectedReserva.empleado || 'Ninguno'}
                  onChange={(e) => handleQuickEmployeeAssign(selectedReserva, e.target.value)}
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Ninguno">Sin asignar</option>
                  {EMPLEADOS_WASHERS.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              {/* Status selectors */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-wider">Estado del Vehículo</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Reservado', 'Recibido', 'Lavando', 'Secando', 'Finalizado', 'Entregado', 'Cancelado'] as ReservaEstado[]).map(st => {
                    const isActive = selectedReserva.estado === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(selectedReserva, st)}
                        className={`py-1.5 rounded-lg border text-[9px] font-bold text-center transition duration-150 cursor-pointer ${
                          isActive 
                            ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/10 font-extrabold' 
                            : 'bg-[#181822]/40 border-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedReserva.observaciones && (
                <div className="p-3 bg-[#FFC107]/5 border border-amber-500/10 rounded-xl text-xs text-gray-300">
                  <span className="font-bold text-white">Notas/Indicaciones:</span>
                  <p className="mt-1 italic leading-relaxed">"{selectedReserva.observaciones}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-white/[0.05] pt-4">
              <button
                onClick={() => sendConfirmationWhatsApp(selectedReserva)}
                className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Mandar WhatsApp
              </button>
              <button
                onClick={() => {
                  setReservaToDelete(selectedReserva.id);
                  setSelectedReserva(null);
                }}
                className="bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/30 text-brand-red p-2.5 rounded-xl transition cursor-pointer"
                title="Eliminar Reserva"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedReserva(null)}
                className="bg-[#181822] hover:bg-white/[0.04] border border-white/[0.06] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {reservaToDelete !== null && (
        <div id="confirm-delete-reserva-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0F0F15] rounded-3xl border border-white/[0.04] p-6 space-y-6 shadow-2xl shadow-black/60 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Borrar Turno?</h3>
              <p className="text-xs text-gray-400">
                ¿Seguro que deseas eliminar este turno de la agenda? Esta acción alterará permanentemente la planificación.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setReservaToDelete(null)}
                className="flex-1 bg-[#181822] hover:bg-white/[0.04] text-white border border-white/[0.06] font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReserva(reservaToDelete);
                  setReservaToDelete(null);
                }}
                className="flex-1 bg-brand-red hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-brand-red/10"
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
