/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ChevronRight
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

export default function BookingCalendar({ 
  state, 
  onAddReserva, 
  onUpdateReserva, 
  onDeleteReserva,
  onTriggerWhatsApp
}: BookingCalendarProps) {
  // Navigation variables for date
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Día');
  const [isAdding, setIsAdding] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState<string | null>(null);

  // Form states
  const [clienteId, setClienteId] = useState('');
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  const [fecha, setFecha] = useState(selectedDate);
  const [hora, setHora] = useState('09:00');
  const [servicioSol, setServicioSol] = useState('Lavado básico');
  const [observaciones, setObservaciones] = useState('');

  // Fetch client or vehicle details
  const getCliente = (id: string) => state.clientes.find(c => c.id === id);
  const getVehiculo = (plate: string) => state.vehiculos.find(v => v.matricula.toUpperCase() === plate.toUpperCase());

  // Filter reservations depending on selected viewMode
  const getReservasForDate = (dateStr: string) => {
    return state.reservas.filter(r => r.fecha === dateStr);
  };

  // Weekly calculations
  const getReservasForWeek = (): Reserva[] => {
    const startOfWeek = new Date(selectedDate);
    // Find monday of current selected block
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(startOfWeek.setDate(diff));

    const daysOfWeek: string[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      daysOfWeek.push(current.toISOString().split('T')[0]);
    }

    return state.reservas.filter(r => daysOfWeek.includes(r.fecha));
  };

  // Monthly calculations
  const getReservasForMonth = (): Reserva[] => {
    const selected = new Date(selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth(); // 0-indexed

    return state.reservas.filter(r => {
      const d = new Date(r.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  const currentReservas = () => {
    switch(viewMode) {
      case 'Día':
        return getReservasForDate(selectedDate).sort((a,b) => a.hora.localeCompare(b.hora));
      case 'Semana':
        return getReservasForWeek().sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      case 'Mes':
        return getReservasForMonth().sort((a,b) => a.fecha.localeCompare(b.fecha));
      default:
        return [];
    }
  };

  // Auto-fill form when choosing user
  const handleClienteChange = (cid: string) => {
    setClienteId(cid);
    // Auto lookup first vehicle linked
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
      observaciones: observaciones.trim() || undefined
    });

    setIsAdding(false);
    // Clear fields
    setObservaciones('');
  };

  function changeSelectedDate(days: number) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
    setFecha(current.toISOString().split('T')[0]);
  }

  // Get status color coding
  const getStatusStyle = (estado: ReservaEstado) => {
    switch(estado) {
      case 'Reservado':
        return 'bg-blue-900/30 text-blue-300 border-blue-800';
      case 'En proceso':
        return 'bg-[#FFC107]/20 text-[#FFC107] border-brand-warning/30 animate-pulse';
      case 'Finalizado':
        return 'bg-[#28A745]/20 text-[#28A745] border-brand-success/30';
      case 'Cancelado':
        return 'bg-brand-red/10 text-brand-red border-brand-red/30';
      default:
        return 'bg-gray-800 text-gray-300';
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

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">Agenda de Reservas</h2>
            <p className="text-xs text-gray-400">Control visual por Día, Semana y Mes</p>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex items-center gap-1.5 bg-brand-card-light p-1 rounded-xl border border-gray-800 self-start md:self-auto">
          {(['Día', 'Semana', 'Mes'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition ${
                viewMode === mode 
                  ? 'bg-brand-red text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Create Booking trigger */}
        <button
          onClick={() => { setIsAdding(true); setFecha(selectedDate); }}
          className="bg-brand-red hover:bg-red-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Reserva
        </button>
      </div>

      {/* Date controls for timeline */}
      <div className="flex items-center justify-between p-3.5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => changeSelectedDate(-1)} 
            className="p-1.5 hover:bg-brand-card-light rounded-lg text-gray-400 hover:text-white border border-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => changeSelectedDate(1)} 
            className="p-1.5 hover:bg-brand-card-light rounded-lg text-gray-400 hover:text-white border border-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm font-semibold text-white font-display">
            {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <span className="block text-[10px] text-gray-500 font-mono mt-0.5">Filtro: {viewMode}</span>
        </div>

        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setFecha(e.target.value); }}
          className="bg-brand-card-light border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-brand-red focus:outline-none"
        />
      </div>

      {/* Calendar body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reservation form modal / collapsible sidebar */}
        {isAdding && (
          <div className="lg:col-span-4 p-5 bg-brand-card rounded-2xl border border-brand-red/30 space-y-4">
            <h3 className="text-base font-display font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red animate-spin" />
              Nueva Reserva
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Cliente *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {state.clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Matrícula (Vehículo) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-brand-red"
                  placeholder="Ej: AA123BC"
                  value={vehiculoMatricula}
                  onChange={(e) => setVehiculoMatricula(e.target.value.toUpperCase())}
                />
                <p className="text-[10px] text-gray-400">Si el cliente posee un vehículo, se autocompletará.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-2 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Hora *</label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-2 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Servicio Solicitado</label>
                <select
                  value={servicioSol}
                  onChange={(e) => setServicioSol(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Lavado básico">Lavado básico</option>
                  <option value="Lavado premium">Lavado premium</option>
                  <option value="Lavado con cera">Lavado con cera</option>
                  <option value="Lavado de motor">Lavado de motor</option>
                  <option value="Aspirado">Aspirado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Indicaciones Especiales</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white min-h-[60px] focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-1/2 bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-red hover:bg-red-800 text-white font-semibold py-2 rounded-xl"
                >
                  Reservar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List ledger */}
        <div className={`p-5 bg-brand-card rounded-2xl border border-gray-800 ${isAdding ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-red" />
              Lista de Turnos de Lavado ({currentReservas().length})
            </h3>
            <span className="text-xs font-mono text-gray-400">Rango: {viewMode}</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {currentReservas().map(res => {
              const client = getCliente(res.clienteId);
              const car = getVehiculo(res.vehiculoMatricula);

              return (
                <div 
                  key={res.id} 
                  className="p-4 bg-brand-card-light rounded-xl border border-gray-800/80 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 md:max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-white text-black px-1.5 py-0.5 rounded tracking-wide plate-font">
                        {res.vehiculoMatricula}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{car?.marca} {car?.modelo || '(Vehículo no cargado)'}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusStyle(res.estado)}`}>
                        &bull; {res.estado}
                      </span>
                    </div>

                    <p className="font-display font-bold text-base text-white mt-1">{client?.nombre || 'Propietario no encontrado'}</p>
                    
                    <div className="flex gap-4 text-xs text-gray-400">
                      <p className="font-sans">Servicio: <span className="font-bold text-gray-300 capitalize">{res.servicioSol}</span></p>
                      {res.observaciones && <p className="italic text-gray-500">&ldquo;{res.observaciones}&rdquo;</p>}
                    </div>
                  </div>

                  {/* Actions & details right */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-3 justify-between md:justify-end">
                    <div className="font-mono text-xs text-left md:text-right">
                      <p className="text-white font-bold flex items-center gap-1 justify-start md:justify-end">
                        <Clock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        {res.hora} hs
                      </p>
                      <p className="text-[10px] text-gray-400">{res.fecha}</p>
                    </div>

                    {/* Button bar for states */}
                    <div className="flex items-center gap-1">
                      {/* WhatsApp trigger */}
                      <button
                        onClick={() => sendConfirmationWhatsApp(res)}
                        title="Enviar confirmación por WhatsApp"
                        className="p-2 bg-brand-card hover:bg-[#28A745]/10 text-[#28A745] hover:text-[#28A745] border border-gray-800 rounded-lg hover:border-[#28A745]/30"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* State modifications */}
                      <select
                        value={res.estado}
                        onChange={(e) => onUpdateReserva({ ...res, estado: e.target.value as any })}
                        className="bg-brand-card border border-gray-800 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-red font-semibold"
                      >
                        <option value="Reservado">⏱️ Reservado</option>
                        <option value="En proceso">⚡ En proceso</option>
                        <option value="Finalizado">✅ Finalizado</option>
                        <option value="Cancelado">❌ Cancelado</option>
                      </select>

                      {/* Delete */}
                      <button
                        onClick={() => setReservaToDelete(res.id)}
                        title="Borrar reserva"
                        className="p-2 bg-brand-card hover:bg-brand-red/10 text-brand-red/80 hover:text-brand-red border border-gray-800 hover:border-brand-red/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {currentReservas().length === 0 && (
              <div className="p-10 text-center bg-brand-card-light rounded-xl border border-dashed border-gray-800 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-brand-warning" />
                <p className="text-sm font-semibold">No se registran reservas para la selección.</p>
                <p className="text-xs mt-1">Utiliza los botones superiores del calendario o haz clic en "Crear Reserva" para programar citas de lavado.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern custom modal for reservation delete confirmation */}
      {reservaToDelete !== null && (
        <div id="confirm-delete-reserva-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
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
                className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReserva(reservaToDelete);
                  setReservaToDelete(null);
                }}
                className="flex-1 bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl transition-all"
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
