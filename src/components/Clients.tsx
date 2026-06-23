/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, Cliente, Vehiculo, ServicioRealizado } from '../types';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Car, 
  Calendar, 
  MessageSquare,
  Edit2,
  Trash2,
  ChevronRight,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { getWhatsAppHref, getInactiveGreetingMessage } from '../utils/whatsapp';

interface ClientsProps {
  state: DatabaseState;
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  onUpdateCliente: (cliente: Cliente) => void;
  onDeleteCliente: (id: string) => void;
  onTriggerWhatsApp: (phone: string, text: string) => void;
}

export default function Clients({ 
  state, 
  onAddCliente, 
  onUpdateCliente, 
  onDeleteCliente, 
  onTriggerWhatsApp 
}: ClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Filter clients
  const filteredClientes = state.clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setNombre('');
    setTelefono('');
    setWhatsapp('');
    setDireccion('');
    setObservaciones('');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (c: Cliente) => {
    setNombre(c.nombre);
    setTelefono(c.telefono);
    setWhatsapp(c.whatsapp);
    setDireccion(c.direccion || '');
    setObservaciones(c.observaciones || '');
    setIsAdding(false);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) return;

    // Use phone for WhatsApp if empty
    const finalWhatsApp = whatsapp ? whatsapp : telefono;

    if (isAdding) {
      onAddCliente({
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones
      });
      setIsAdding(false);
    } else if (isEditing && selectedCliente) {
      onUpdateCliente({
        ...selectedCliente,
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones
      });
      // Update locally selected reference
      setSelectedCliente({
        ...selectedCliente,
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones
      });
      setIsEditing(false);
    }
  };

  // Find linked vehicles
  const getClienteVehiculos = (clienteId: string) => {
    return state.vehiculos.filter(v => v.clienteId === clienteId);
  };

  // Find service history
  const getClienteServicios = (clienteId: string) => {
    return state.servicios
      .filter(s => s.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  // Determine inactiveness (>30 days) to offer reminder
  const offerInactiveReminder = (clienteId: string): boolean => {
    const services = getClienteServicios(clienteId);
    if (services.length === 0) return false;
    const latestService = services[0];
    const latestDate = new Date(latestService.fecha.split(' ')[0]);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return latestDate < thirtyDaysAgo;
  };

  const handleSendReminder = (cli: Cliente) => {
    const text = getInactiveGreetingMessage({ nombre: cli.nombre });
    onTriggerWhatsApp(cli.whatsapp, text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List Column */}
      <div className="lg:col-span-5 p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-extrabold text-white">Clientes Registrados</h2>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="bg-brand-red hover:bg-red-800 text-white font-medium text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-800 rounded-xl bg-brand-card text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red font-sans"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Client Rows */}
        <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
          {filteredClientes.map(c => {
            const vehicles = getClienteVehiculos(c.id);
            const isSelected = selectedCliente?.id === c.id;
            const isInactive = offerInactiveReminder(c.id);
            
            return (
              <div 
                key={c.id}
                onClick={() => { setSelectedCliente(c); setIsAdding(false); setIsEditing(false); }}
                className={`p-3.5 rounded-xl border border-gray-800/60 cursor-pointer flex justify-between items-center transition-all ${
                  isSelected 
                    ? 'bg-brand-red/10 border-brand-red' 
                    : 'bg-brand-card-light hover:bg-[#2B2B2B]/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-white text-sm">{c.nombre}</span>
                    {isInactive && (
                      <span className="text-[9px] bg-brand-warning/20 text-[#FFC107] border border-brand-warning/30 px-1 py-0.5 rounded font-mono font-medium">
                        &gt; 30d inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Phone className="w-3.5 h-3.5 text-brand-red" />
                    <span className="font-mono text-[11px]">{c.telefono}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
                    <Car className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {vehicles.length === 0 
                        ? 'Sin vehículos' 
                        : `${vehicles.length} vehículo(s) (${vehicles.map(v => v.matricula).join(', ')})`}
                    </span>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isSelected ? 'translate-x-1 text-brand-red' : ''}`} />
              </div>
            );
          })}

          {filteredClientes.length === 0 && (
            <p className="text-xs text-center text-gray-500 italic py-6">No se encontraron clientes.</p>
          )}
        </div>
      </div>

      {/* Detail / Profile & Form Column */}
      <div className="lg:col-span-7">
        {isAdding || isEditing ? (
          <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-display font-bold text-white border-b border-gray-800 pb-2">
              {isAdding ? 'Registrar Nuevo Cliente' : `Editar Cliente: ${selectedCliente?.nombre}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Escribir nombre del cliente..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Teléfono de Contacto *</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Móvil (ej: +549115544...)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Número de WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Dejar vacío para usar teléfono"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Dirección de Domicilio (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Calle, Número, Departamento..."
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Observaciones / Preferencias</label>
                <textarea
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white min-h-[90px] focus:outline-none focus:ring-1 focus:ring-brand-red"
                  placeholder="Detalles específicos (ej: cuidado de vidrios, lavado recurrente, horario preferido...)"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setIsEditing(false); }}
                  className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-xl"
                >
                  {isAdding ? 'Registrar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedCliente ? (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 relative">
              {/* Profile actions top-right */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedCliente)}
                  className="p-2 bg-brand-card-light text-gray-300 hover:text-white rounded-lg border border-gray-800 hover:border-gray-700"
                  title="Editar Cliente"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 bg-brand-card-light text-brand-red/70 hover:text-brand-red rounded-lg border border-gray-800 hover:border-brand-red/30"
                  title="Eliminar Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-brand-red/10 border border-brand-red/40 rounded-2xl text-brand-red">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-[70%]">
                  <span className="text-[10px] font-mono uppercase bg-brand-red/20 text-brand-red px-2 py-0.5 rounded-full font-bold">
                    Cliente Registrado
                  </span>
                  <h2 className="text-2xl font-display font-extrabold text-white leading-tight">{selectedCliente.nombre}</h2>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedCliente.id} &bull; Agregado: {selectedCliente.fechaRegistro}</p>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800/80 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Phone className="w-4 h-4 text-brand-red" />
                    <span className="font-mono text-white">{selectedCliente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <MessageSquare className="w-4 h-4 text-[#28A745]" />
                    <a 
                      href={getWhatsAppHref(selectedCliente.whatsapp, `Hola ${selectedCliente.nombre}, te saludamos desde Lavadero RyN.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#28A745] hover:underline flex items-center gap-1"
                    >
                      <span>Abrir WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>{selectedCliente.direccion || <span className="text-gray-500 italic">Sin dirección guardada</span>}</span>
                  </div>
                </div>
              </div>

              {selectedCliente.observaciones && (
                <div className="mt-4 p-3.5 bg-brand-card-light rounded-xl border border-gray-800 text-xs text-gray-300 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-brand-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Observaciones / Notas:</p>
                    <p className="mt-1 leading-relaxed">{selectedCliente.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Inactivity campaign reminder launcher */}
              {offerInactiveReminder(selectedCliente.id) && (
                <div className="mt-4 p-3 bg-brand-warning/10 border border-brand-warning/20 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFC107] shrink-0" />
                    <p className="text-gray-300">
                      Hace más de 30 días de su último lavado. ¿Lanzar plantilla de reactivación?
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendReminder(selectedCliente)}
                    className="bg-[#FFC107] hover:bg-yellow-500 text-black px-2.5 py-1.5 rounded-lg font-bold shrink-0 shadow-lg"
                  >
                    Mandar WhatsApp
                  </button>
                </div>
              )}
            </div>

            {/* Linked Vehicles Section */}
            <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-3">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-red" />
                Vehículos Vinculados ({getClienteVehiculos(selectedCliente.id).length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getClienteVehiculos(selectedCliente.id).map(v => (
                  <div key={v.matricula} className="p-3 bg-brand-card-light rounded-xl border border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white shrink-0">
                      <Car className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm capitalize">{v.marca} {v.modelo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white text-black font-mono font-bold px-1 rounded plate-font">
                          {v.matricula}
                        </span>
                        <span className="text-[10px] text-gray-400">{v.color} ({v.anio})</span>
                      </div>
                    </div>
                  </div>
                ))}

                {getClienteVehiculos(selectedCliente.id).length === 0 && (
                  <p className="p-4 bg-brand-card-light rounded-xl text-center text-xs text-gray-500 italic col-span-2 border border-dashed border-gray-800">
                    Este cliente no tiene ningún auto registrado. Para vincular un auto, dirígete al módulo de Vehículos.
                  </p>
                )}
              </div>
            </div>

            {/* Historical Services rendered list */}
            <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-3">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#28A745]" />
                Historial de Trabajos Realizados ({getClienteServicios(selectedCliente.id).length})
              </h3>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {getClienteServicios(selectedCliente.id).map(s => (
                  <div key={s.id} className="p-3 bg-brand-card-light rounded-xl border border-gray-800/80 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm capitalize">{s.tipo}</span>
                        <span className="text-[9px] bg-gray-800 text-gray-300 font-bold px-1.5 py-0.5 rounded-full plate-font">
                          {s.vehiculoMatricula}
                        </span>
                      </div>
                      <p className="text-gray-400 font-mono text-[10px] mt-1">Fecha: {s.fecha} hs &bull; {s.formaPago}</p>
                      {s.observaciones && <p className="text-[11px] text-gray-500 mt-1 italic">&ldquo;{s.observaciones}&rdquo;</p>}
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm text-brand-success font-extrabold flex items-center justify-end gap-0.5">
                        <DollarSign className="w-3 px-0 text-brand-success shrink-0" />
                        {s.precio.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                ))}

                {getClienteServicios(selectedCliente.id).length === 0 && (
                  <p className="p-4 rounded-xl text-center text-xs text-gray-500 italic border border-dashed border-gray-800">
                    No hay trabajos guardados para este cliente en el historial.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-brand-card rounded-2xl border border-gray-100/10 space-y-3 flex flex-col items-center justify-center min-h-[400px]">
            <User className="w-16 h-16 text-gray-600 animate-bounce" />
            <h3 className="text-lg font-display font-medium text-gray-300">Selecciona un cliente</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Haz clic en cualquier cliente de la lista de la izquierda para examinar sus vehículos asociados, facturaciones totales, observaciones y enviar notificaciones.
            </p>
          </div>
        )}
      </div>

      {/* Modern custom modal for delete confirmation */}
      {showConfirmDelete && selectedCliente && (
        <div id="confirm-delete-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Eliminar Cliente?</h3>
              <p className="text-xs text-gray-400">
                ¿Seguro que deseas eliminar el cliente <span className="font-bold text-white">"{selectedCliente.nombre}"</span>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCliente(selectedCliente.id);
                  setSelectedCliente(null);
                  setShowConfirmDelete(false);
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
