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
  DollarSign,
  Camera,
  Layers,
  Clock,
  History,
  CheckCircle2
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
  const [fotoUrl, setFotoUrl] = useState('');

  // Drag & drop file status
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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
    setFotoUrl('');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (c: Cliente) => {
    setNombre(c.nombre);
    setTelefono(c.telefono);
    setWhatsapp(c.whatsapp);
    setDireccion(c.direccion || '');
    setObservaciones(c.observaciones || '');
    setFotoUrl(c.fotoUrl || '');
    setIsAdding(false);
    setIsEditing(true);
  };

  // Convert uploaded image to Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) return;

    const finalWhatsApp = whatsapp ? whatsapp : telefono;

    if (isAdding) {
      onAddCliente({
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones,
        fotoUrl
      });
      setIsAdding(false);
    } else if (isEditing && selectedCliente) {
      onUpdateCliente({
        ...selectedCliente,
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones,
        fotoUrl
      });
      setSelectedCliente({
        ...selectedCliente,
        nombre,
        telefono,
        whatsapp: finalWhatsApp,
        direccion,
        observaciones,
        fotoUrl
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

  // Total spent calculation
  const getClienteTotalSpent = (clienteId: string) => {
    const services = getClienteServicios(clienteId);
    return services.reduce((acc, curr) => acc + curr.precio, 0);
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
      <div className="lg:col-span-5 p-5 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl shadow-black/20 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-black text-white">Clientes Registrados</h2>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="premium-btn-primary px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2 text-xs border border-white/[0.06] rounded-xl bg-[#181822] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red/50 focus:border-brand-red/50 transition font-sans"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Client Rows */}
        <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
          {filteredClientes.map(c => {
            const vehicles = getClienteVehiculos(c.id);
            const isSelected = selectedCliente?.id === c.id;
            const isInactive = offerInactiveReminder(c.id);
            const visits = getClienteServicios(c.id).length;
            
            return (
              <div 
                key={c.id}
                onClick={() => { setSelectedCliente(c); setIsAdding(false); setIsEditing(false); }}
                className={`p-3.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all duration-150 ${
                  isSelected 
                    ? 'bg-brand-red/10 border-brand-red/40' 
                    : 'bg-[#181822]/20 border-white/[0.03] hover:border-white/[0.1] hover:bg-[#181822]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {c.fotoUrl ? (
                    <img 
                      src={c.fotoUrl} 
                      alt={c.nombre} 
                      className="w-10 h-10 object-cover rounded-xl border border-white/[0.04]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-850 flex items-center justify-center text-gray-400 font-bold text-sm border border-white/[0.03]">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-white text-xs">{c.nombre}</span>
                      {isInactive && (
                        <span className="text-[8px] bg-brand-warning/10 text-brand-warning border border-brand-warning/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Phone className="w-3 h-3 text-brand-red" />
                      <span className="font-mono">{c.telefono}</span>
                      <span className="text-gray-600">&bull;</span>
                      <span>{visits} vis.</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <Car className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {vehicles.length === 0 
                          ? 'Sin autos' 
                          : vehicles.map(v => v.matricula).join(', ')}
                      </span>
                    </div>
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
          <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl shadow-black/20 space-y-4">
            <h2 className="text-lg font-display font-black text-white border-b border-white/[0.05] pb-2.5">
              {isAdding ? 'Registrar Nuevo Cliente' : `Editar Cliente: ${selectedCliente?.nombre}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Photo Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Foto del Cliente</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isDraggingFile 
                      ? 'border-brand-red bg-brand-red/5' 
                      : 'border-white/[0.06] hover:border-brand-red/30 bg-[#181822]/20'
                  }`}
                >
                  {fotoUrl ? (
                    <div className="relative">
                      <img 
                        src={fotoUrl} 
                        alt="Previsualización" 
                        className="w-24 h-24 object-cover rounded-2xl border border-white/[0.04] shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="absolute -top-2 -right-2 bg-brand-red text-white p-1 rounded-full text-[10px] font-bold shadow-md cursor-pointer hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-500" />
                      <p className="text-xs text-gray-300 font-bold">Arrastra y suelta una imagen o haz clic para subir</p>
                      <p className="text-[9px] text-gray-500">Soporta PNG, JPG (Se almacena automáticamente en la ficha del cliente)</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute opacity-0 w-full max-w-[280px] h-20 cursor-pointer hidden"
                    id="client-file-upload"
                  />
                  {!fotoUrl && (
                    <label 
                      htmlFor="client-file-upload" 
                      className="bg-[#181822] border border-white/[0.06] hover:bg-white/[0.02] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer mt-1"
                    >
                      Seleccionar Archivo
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3.5 py-2 text-xs transition duration-150 focus:outline-none"
                    placeholder="Escribir nombre del cliente..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Teléfono de Contacto *</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3.5 py-2 text-xs transition duration-150 focus:outline-none"
                    placeholder="Móvil (ej: +549115544...)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Número de WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3.5 py-2 text-xs transition duration-150 focus:outline-none"
                    placeholder="Dejar vacío para usar teléfono"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Dirección de Domicilio (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3.5 py-2 text-xs transition duration-150 focus:outline-none"
                    placeholder="Calle, Número, Departamento..."
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Observaciones / Preferencias</label>
                <textarea
                  className="w-full bg-[#181822] border border-white/[0.06] text-white focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 rounded-xl px-3.5 py-2 text-xs transition duration-150 focus:outline-none min-h-[90px]"
                  placeholder="Detalles específicos (ej: cuidado de tapizados, lavado de motor, horario preferido...)"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setIsEditing(false); }}
                  className="bg-[#181822] hover:bg-white/[0.04] border border-white/[0.06] text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer transition text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-brand-red/10 text-xs"
                >
                  {isAdding ? 'Registrar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedCliente ? (
          <div className="space-y-6 animate-scaleUp">
            
            {/* Extended Profile Overview Card */}
            <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] relative overflow-hidden shadow-xl shadow-black/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>
              
              {/* Profile Actions */}
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedCliente)}
                  className="p-2 bg-[#181822] text-gray-300 hover:text-white rounded-xl border border-white/[0.06] hover:border-white/[0.1] transition cursor-pointer"
                  title="Editar Cliente"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 bg-[#181822] text-brand-red/70 hover:text-brand-red rounded-xl border border-white/[0.06] hover:border-brand-red/30 transition cursor-pointer"
                  title="Eliminar Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {selectedCliente.fotoUrl ? (
                  <img 
                    src={selectedCliente.fotoUrl} 
                    alt={selectedCliente.nombre} 
                    className="w-20 h-20 object-cover rounded-2xl border border-white/[0.04] shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gray-850 flex items-center justify-center text-gray-400 font-black text-2xl border border-white/[0.03]">
                    {selectedCliente.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[9px] font-mono uppercase bg-brand-red/10 text-brand-red border border-brand-red/20 px-2.5 py-1 rounded-full font-bold inline-block">
                    Perfil del Cliente
                  </span>
                  <h2 className="text-2xl font-display font-black text-white leading-tight mt-1">{selectedCliente.nombre}</h2>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedCliente.id} &bull; Registro: {selectedCliente.fechaRegistro}</p>
                </div>
              </div>

              {/* Advanced Real-time Metrics Panels */}
              <div className="grid grid-cols-3 gap-3 mt-6 p-4 bg-[#181822]/40 rounded-2xl border border-white/[0.04]">
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider font-bold">Visitas Totales</p>
                  <p className="text-lg font-display font-black text-white mt-1">
                    {getClienteServicios(selectedCliente.id).length}
                  </p>
                </div>
                <div className="text-center border-x border-white/[0.05]">
                  <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider font-bold">Total Invertido</p>
                  <p className="text-lg font-display font-black text-brand-success mt-1 font-mono">
                    ${getClienteTotalSpent(selectedCliente.id).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider font-bold">Último Servicio</p>
                  <p className="text-xs font-bold text-gray-300 mt-2 truncate font-mono">
                    {getClienteServicios(selectedCliente.id)[0]?.fecha.split(' ')[0] || 'Ninguno'}
                  </p>
                </div>
              </div>

              {/* Quick Contact & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/[0.05] text-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Phone className="w-4 h-4 text-brand-red" />
                    <span className="font-mono text-white font-bold">{selectedCliente.telefono}</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <a 
                      href={getWhatsAppHref(selectedCliente.whatsapp, `Hola ${selectedCliente.nombre}, te saludamos de Lavadero RyN.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                    >
                      <span>Mandar WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-200">{selectedCliente.direccion || <span className="text-gray-500 italic">Sin dirección guardada</span>}</span>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {selectedCliente.observaciones && (
                <div className="mt-5 p-3.5 bg-[#181822]/20 border border-white/[0.04] rounded-2xl text-xs text-gray-300 flex items-start gap-2.5">
                  <FileText className="w-4.5 h-4.5 text-[#FFC107] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Observaciones / Preferencias:</p>
                    <p className="mt-1 leading-relaxed text-gray-400">{selectedCliente.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Inactivity campaigns */}
              {offerInactiveReminder(selectedCliente.id) && (
                <div className="mt-4 p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFC107] shrink-0" />
                    <p className="text-gray-300 leading-relaxed">
                      Este cliente no registra visitas hace más de 30 días. ¿Deseas saludarlo para fidelizarlo?
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendReminder(selectedCliente)}
                    className="bg-amber-500 hover:bg-amber-600 text-black px-3.5 py-2 rounded-xl font-black shrink-0 shadow-md transition uppercase tracking-wider text-[9px] cursor-pointer"
                  >
                    Mandar Saludo
                  </button>
                </div>
              )}
            </div>

            {/* Linked Vehicles Section */}
            <div className="p-5 bg-brand-card rounded-3xl border border-white/[0.04] space-y-3 shadow-xl">
              <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-2 font-bold">
                <Car className="w-4 h-4 text-brand-red" />
                Vehículos Vinculados ({getClienteVehiculos(selectedCliente.id).length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getClienteVehiculos(selectedCliente.id).map(v => (
                  <div key={v.matricula} className="p-3 bg-[#181822]/20 rounded-xl border border-white/[0.04] hover:border-white/[0.1] transition flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-850 flex items-center justify-center text-white shrink-0 border border-white/[0.03]">
                      <Car className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs capitalize">{v.marca} {v.modelo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-white text-black font-mono font-black px-1.5 py-0.5 rounded plate-font uppercase tracking-wider">
                          {v.matricula}
                        </span>
                        <span className="text-[10px] text-gray-400">{v.color} ({v.anio})</span>
                      </div>
                    </div>
                  </div>
                ))}

                {getClienteVehiculos(selectedCliente.id).length === 0 && (
                  <p className="p-4 bg-[#181822]/10 rounded-xl text-center text-xs text-gray-500 italic col-span-2 border border-dashed border-white/[0.05]">
                    Este cliente no tiene ningún auto registrado. Para vincular un auto, dirígete al módulo de Vehículos.
                  </p>
                )}
              </div>
            </div>

            {/* Complete History */}
            <div className="p-5 bg-brand-card rounded-3xl border border-white/[0.04] space-y-3 shadow-xl">
              <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-2 font-bold">
                <History className="w-4 h-4 text-brand-red" />
                Historial Completo de Servicios ({getClienteServicios(selectedCliente.id).length})
              </h3>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {getClienteServicios(selectedCliente.id).map(s => (
                  <div key={s.id} className="p-3.5 bg-[#181822]/20 rounded-xl border border-white/[0.04] flex justify-between items-center text-xs hover:border-white/[0.1] transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm capitalize font-display">{s.tipo}</span>
                        <span className="text-[9px] bg-white/10 text-gray-300 font-bold px-1.5 py-0.5 rounded font-mono">
                          {s.vehiculoMatricula}
                        </span>
                      </div>
                      <p className="text-gray-400 font-mono text-[10px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>{s.fecha} hs &bull; {s.formaPago}</span>
                      </p>
                      {s.observaciones && <p className="text-[11px] text-gray-500 mt-1 italic font-sans">&ldquo;{s.observaciones}&rdquo;</p>}
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm text-brand-success font-black">
                        +${s.precio.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                ))}

                {getClienteServicios(selectedCliente.id).length === 0 && (
                  <p className="p-4 rounded-xl text-center text-xs text-gray-500 italic border border-dashed border-white/[0.05]">
                    No hay trabajos guardados para este cliente en el historial.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-brand-card rounded-3xl border border-white/[0.04] space-y-3 flex flex-col items-center justify-center min-h-[440px] shadow-xl shadow-black/20">
            <User className="w-16 h-16 text-gray-650" />
            <h3 className="text-lg font-display font-black text-gray-300">Selecciona un cliente</h3>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Haz clic en cualquier cliente de la lista de la izquierda para examinar sus fotos, vehículos asociados, facturaciones totales, observaciones y enviar notificaciones directas.
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showConfirmDelete && selectedCliente && (
        <div id="confirm-delete-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0F0F15] rounded-3xl border border-white/[0.04] p-6 space-y-6 shadow-2xl shadow-black/60">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Eliminar Cliente?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ¿Seguro que deseas eliminar el cliente <span className="font-bold text-white">"{selectedCliente.nombre}"</span>? Esta acción no se puede deshacer y desvinculará sus datos.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-[#181822] hover:bg-white/[0.04] text-white border border-white/[0.06] font-bold text-xs py-3 rounded-xl transition cursor-pointer"
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
