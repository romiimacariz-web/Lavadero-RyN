/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseState, ServicioRealizado, Cliente, Vehiculo, FormaPago } from '../types';
import { 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  Car, 
  User, 
  CreditCard, 
  FileText, 
  Trash2,
  CheckCircle2, 
  Smartphone,
  Eye, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { getWhatsAppHref, getVehicleReadyMessage } from '../utils/whatsapp';

interface ServicesProps {
  state: DatabaseState;
  quickServiceReserva: any; // Quick trigger from dashboard
  onClearQuickServiceReserva: () => void;
  onAddServicio: (servicio: Omit<ServicioRealizado, 'id'>) => void;
  onDeleteServicio: (id: string) => void;
  onTriggerWhatsApp: (phone: string, text: string) => void;
}

export default function Services({ 
  state, 
  quickServiceReserva,
  onClearQuickServiceReserva,
  onAddServicio, 
  onDeleteServicio,
  onTriggerWhatsApp
}: ServicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Form states
  const [clienteId, setClienteId] = useState('');
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  const [tipo, setTipo] = useState('');
  const [precio, setPrecio] = useState(0);
  const [formaPago, setFormaPago] = useState<FormaPago>('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  
  // Before / After mock uploads
  const [fotoAntes, setFotoAntes] = useState('');
  const [fotoDespues, setFotoDespues] = useState('');
  
  // Active photo comparator states
  const [viewingBeforeAfter, setViewingBeforeAfter] = useState<ServicioRealizado | null>(null);
  const [viewModeCompare, setViewModeCompare] = useState<'Antes' | 'Después'>('Después');

  // Initialize defaults based on the first item in the dynamic catalog
  useEffect(() => {
    if (!tipo && state.serviciosCatalogo && state.serviciosCatalogo.length > 0) {
      setTipo(state.serviciosCatalogo[0].tipo);
      setPrecio(state.serviciosCatalogo[0].precio);
    }
  }, [state.serviciosCatalogo, tipo]);

  // Handle auto preset change
  const handlePresetChange = (tipoSelected: string) => {
    setTipo(tipoSelected);
    const service = state.serviciosCatalogo.find(p => p.tipo === tipoSelected);
    if (service) {
      setPrecio(service.precio);
    }
  };

  // If a quick service was sparked from dashboard
  useEffect(() => {
    if (quickServiceReserva) {
      setClienteId(quickServiceReserva.clienteId);
      setVehiculoMatricula(quickServiceReserva.vehiculoMatricula);
      setTipo(quickServiceReserva.servicioSol);
      const service = state.serviciosCatalogo.find(p => p.tipo === quickServiceReserva.servicioSol);
      if (service) {
        setPrecio(service.precio);
      }
      setIsAdding(true);
    }
  }, [quickServiceReserva, state.serviciosCatalogo]);

  const handleClienteChange = (cid: string) => {
    setClienteId(cid);
    const firstCar = state.vehiculos.find(v => v.clienteId === cid);
    if (firstCar) {
      setVehiculoMatricula(firstCar.matricula);
    } else {
      setVehiculoMatricula('');
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !vehiculoMatricula || !tipo) return;

    const finalAntes = fotoAntes ? [fotoAntes] : [
      'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ];
    const finalDespues = fotoDespues ? [fotoDespues] : [
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ];

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddServicio({
      fecha: dateStr,
      clienteId,
      vehiculoMatricula: vehiculoMatricula.toUpperCase().replace(/\s+/g, ''),
      tipo,
      precio: Number(precio),
      formaPago,
      observaciones: observaciones.trim() || undefined,
      fotosAntes: finalAntes,
      fotosDespues: finalDespues
    });

    setIsAdding(false);
    onClearQuickServiceReserva();
    
    // Clear states
    setClienteId('');
    setVehiculoMatricula('');
    setObservaciones('');
    setFotoAntes('');
    setFotoDespues('');
  };

  const triggerReadyWhatsapp = (srv: ServicioRealizado) => {
    const client = state.clientes.find(c => c.id === srv.clienteId);
    if (!client) return;
    const text = getVehicleReadyMessage({ nombre: client.nombre });
    onTriggerWhatsApp(client.whatsapp, text);
  };

  // Filters
  const filteredServicios = state.servicios.filter(s => {
    const client = state.clientes.find(c => c.id === s.clienteId);
    return s.vehiculoMatricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a,b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">Registro de Servicios</h2>
            <p className="text-xs text-gray-400">Declarar cobros, formas de pago, reportar control visual</p>
          </div>
        </div>

        <button
          onClick={() => { setIsAdding(true); onClearQuickServiceReserva(); }}
          className="bg-brand-red hover:bg-red-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 self-start md:self-auto shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Registrar Servicio Realizado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main interactive form sidebar / modal */}
        {isAdding && (
          <div className="lg:col-span-5 p-5 bg-brand-card rounded-2xl border border-brand-red/30 space-y-4">
            <h3 className="text-base font-display font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red" />
              Nuevo Ticket de Lavado
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Cliente *</label>
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Propietario --</option>
                    {state.clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Matrícula *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none"
                    placeholder="Ej: AA123BC"
                    value={vehiculoMatricula}
                    onChange={(e) => setVehiculoMatricula(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Tipo de Servicio *</label>
                  <select
                    value={tipo}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {state.serviciosCatalogo.map(p => (
                      <option key={p.id} value={p.tipo}>{p.tipo} (${p.precio.toLocaleString('es-AR')})</option>
                    ))}
                    <option value="Otro">Otro / Personalizado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Precio de Cobro ($) *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none text-brand-success font-bold"
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Forma de Pago *</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as FormaPago)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Transferencia">🏦 Transferencia Bancaria</option>
                  <option value="Mercado Pago">📱 Mercado Pago</option>
                  <option value="Tarjeta de Crédito">💳 Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">💳 Tarjeta de Débito</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Visual audit before/after */}
              <div className="p-3 bg-brand-card-light border border-gray-800 rounded-xl space-y-3.5">
                <p className="font-mono text-gray-400 uppercase text-[10px] tracking-widest">Auditoría Visual (Antes / Después)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">URL Antes:</span>
                    <input
                      type="text"
                      className="w-full bg-brand-card border border-gray-800 rounded-lg p-1.5 text-[10px] text-gray-300 focus:outline-none"
                      placeholder="Vacío para placeholder"
                      value={fotoAntes}
                      onChange={(e) => setFotoAntes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">URL Después:</span>
                    <input
                      type="text"
                      className="w-full bg-brand-card border border-gray-800 rounded-lg p-1.5 text-[10px] text-gray-300 focus:outline-none"
                      placeholder="Vacío para placeholder"
                      value={fotoDespues}
                      onChange={(e) => setFotoDespues(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Observaciones / Checklists</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre tapizado, rayones preexistentes, etc."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white min-h-[50px] focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); onClearQuickServiceReserva(); }}
                  className="w-1/2 bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-red hover:bg-red-800 text-white font-semibold py-2 rounded-xl"
                >
                  Cobrar y Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Ledger List */}
        <div className={`space-y-4 ${isAdding ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Compare panel (BEFORE AFTER slide view) */}
          {viewingBeforeAfter && (
            <div className="p-4 bg-brand-card rounded-2xl border border-brand-red/30 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <h4 className="font-display font-bold text-white text-sm">
                    Comparación Visual: ({viewingBeforeAfter.vehiculoMatricula})
                  </h4>
                  <p className="text-[10px] text-gray-400">Servicio de {viewingBeforeAfter.tipo} el {viewingBeforeAfter.fecha}</p>
                </div>
                <div className="flex gap-1.5 bg-brand-card-light p-0.5 rounded-lg border border-gray-800">
                  {(['Antes', 'Después'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewModeCompare(mode)}
                      className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${
                        viewModeCompare === mode 
                          ? 'bg-brand-red text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Showcase box */}
              <div className="h-60 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden relative flex items-center justify-center">
                <img 
                  src={viewModeCompare === 'Antes' 
                    ? (viewingBeforeAfter.fotosAntes[0] || 'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=500&auto=format&fit=crop&q=60')
                    : (viewingBeforeAfter.fotosDespues[0] || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&auto=format&fit=crop&q=60')}
                  alt="Pre-control car wash visual audit illustration" 
                  className="w-full h-full object-cover transition-all"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono border border-gray-800 font-bold uppercase tracking-wider">
                  FILTRO CONTROL: <span className={viewModeCompare === 'Antes' ? 'text-brand-warning' : 'text-brand-success'}>{viewModeCompare}</span>
                </div>
                <button 
                  onClick={() => setViewingBeforeAfter(null)}
                  className="absolute bottom-2 right-2 bg-brand-card hover:bg-gray-700 text-white font-semibold text-[10px] border border-gray-800 px-2 py-1 rounded"
                >
                  Cerrar Inspect
                </button>
              </div>
            </div>
          )}

          {/* Quick filter & List heading */}
          <div className="p-4 bg-brand-card rounded-2xl border border-gray-800 space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <h3 className="font-display font-extrabold text-white">Historial de Trabajos realizados ({filteredServicios.length})</h3>
              
              <div className="relative md:w-64">
                <input
                  type="text"
                  className="block w-full pl-8 pr-3 py-1.5 text-xs bg-brand-card-light border border-gray-850 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                  placeholder="Buscar por patente, cliente, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
              {filteredServicios.map(srv => {
                const client = state.clientes.find(c => c.id === srv.clienteId);
                const car = state.vehiculos.find(v => v.matricula === srv.vehiculoMatricula);

                return (
                  <div 
                    key={srv.id} 
                    className="p-4 bg-brand-card-light rounded-xl border border-gray-800/80 hover:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-white text-black text-[10px] font-mono px-1.5 py-0.5 rounded leading-none font-bold plate-font">
                          {srv.vehiculoMatricula}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{car?.marca} {car?.modelo || '(Cargado)'}</span>
                        <span className="text-[10px] bg-brand-card border border-gray-800 text-gray-300 font-bold px-2 py-0.5 rounded-full capitalize">
                          {srv.tipo}
                        </span>
                      </div>

                      <p className="font-display font-bold text-sm text-white mt-1">{client?.nombre || 'Consumidor Final'}</p>
                      
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                          {srv.fecha} hs
                        </span>
                        <span className="flex items-center gap-1 bg-brand-card px-1.5 py-0.5 rounded text-[10px] border border-gray-800 text-gray-300">
                          <CreditCard className="w-3 h-3 text-brand-warning shrink-0" />
                          {srv.formaPago}
                        </span>
                      </div>

                      {srv.observaciones && (
                        <p className="text-xs italic text-gray-500 mt-1 max-w-sm">
                          &ldquo;{srv.observaciones}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t border-gray-850 md:border-none pt-2.5 md:pt-0">
                      <div className="text-left md:text-right font-mono">
                        <p className="text-brand-success font-extrabold text-base flex items-center justify-start md:justify-end">
                          <DollarSign className="w-3.5 h-3.5 text-brand-success shrink-0" />
                          {srv.precio.toLocaleString('es-AR')}
                        </p>
                        <span className="text-[9px] text-gray-500">ID: {srv.id}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Notify list ready */}
                        <button
                          onClick={() => triggerReadyWhatsapp(srv)}
                          title="Mandar WhatsApp de 'Vehículo Listo'"
                          className="p-1 px-2.5 bg-brand-card hover:bg-[#28A745]/15 text-[#28A745] hover:text-[#28A745] border border-gray-800 hover:border-[#28A745]/30 rounded-lg flex items-center gap-1 text-[10px] font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Notificar Listo
                        </button>

                        {/* View comparative image */}
                        <button
                          onClick={() => { setViewingBeforeAfter(srv); setViewModeCompare('Después'); }}
                          title="Inspeccionar Fotos Antes/Después"
                          className="p-2 bg-brand-card hover:bg-brand-red/10 border border-gray-800 hover:border-brand-red/30 text-gray-300 hover:text-white rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setServiceToDelete(srv.id)}
                          className="p-2 bg-brand-card hover:bg-brand-red/15 text-brand-red/80 hover:text-brand-red border border-gray-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredServicios.length === 0 && (
                <p className="text-xs text-center text-gray-500 italic py-6">No hay servicios completados registrados.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern custom modal for completed work history deletion */}
      {serviceToDelete !== null && (
        <div id="confirm-delete-service-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Remover del Historial?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ¿Seguro que deseas remover este registro del historial? <span className="text-red-400 font-semibold block mt-1">⚠️ Se alterarán los reportes financieros.</span>
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteServicio(serviceToDelete);
                  setServiceToDelete(null);
                }}
                className="flex-1 bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl transition-all"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
