/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, Vehiculo, Cliente, ServicioRealizado } from '../types';
import { 
  Plus, 
  Search, 
  Car, 
  User, 
  Calendar, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Tag, 
  Image as ImageIcon, 
  Upload, 
  DollarSign,
  Briefcase
} from 'lucide-react';

interface VehiclesProps {
  state: DatabaseState;
  onAddVehiculo: (vehiculo: Vehiculo) => void;
  onUpdateVehiculo: (vehiculo: Vehiculo) => void;
  onDeleteVehiculo: (matricula: string) => void;
}

export default function Vehicles({ 
  state, 
  onAddVehiculo, 
  onUpdateVehiculo, 
  onDeleteVehiculo 
}: VehiclesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Form states
  const [matricula, setMatricula] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [clienteId, setClienteId] = useState('');
  const [fotoUrlInput, setFotoUrlInput] = useState('');

  // Filter vehicles by license plate (matrícula) or brand/model
  const filteredVehiculos = state.vehiculos.filter(v => 
    v.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setMatricula('');
    setMarca('');
    setModelo('');
    setColor('');
    setAnio(2023);
    setClienteId(state.clientes[0]?.id || '');
    setFotoUrlInput('');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (v: Vehiculo) => {
    setMatricula(v.matricula);
    setMarca(v.marca);
    setModelo(v.modelo);
    setColor(v.color);
    setAnio(v.anio);
    setClienteId(v.clienteId);
    setFotoUrlInput(v.fotosUrl[0] || '');
    setIsAdding(false);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !marca || !modelo || !clienteId) return;

    const formattedMatricula = matricula.replace(/\s+/g, '').toUpperCase();
    const cleanFotos = fotoUrlInput ? [fotoUrlInput] : [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ];

    if (isAdding) {
      onAddVehiculo({
        matricula: formattedMatricula,
        marca,
        modelo,
        color,
        anio: Number(anio),
        clienteId,
        fotosUrl: cleanFotos
      });
      setIsAdding(false);
    } else if (isEditing && selectedVehiculo) {
      onUpdateVehiculo({
        ...selectedVehiculo,
        marca,
        modelo,
        color,
        anio: Number(anio),
        clienteId,
        fotosUrl: cleanFotos
      });
      // Update selected locally
      setSelectedVehiculo({
        ...selectedVehiculo,
        marca,
        modelo,
        color,
        anio: Number(anio),
        clienteId,
        fotosUrl: cleanFotos
      });
      setIsEditing(false);
    }
  };

  // Get associated owner
  const getVehiculoOwner = (cliId: string): Cliente | undefined => {
    return state.clientes.find(c => c.id === cliId);
  };

  // Get service logs of the vehicle
  const getVehiculoServicios = (plate: string) => {
    return state.servicios
      .filter(s => s.vehiculoMatricula.toUpperCase() === plate.toUpperCase())
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List Column */}
      <div className="lg:col-span-5 p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-extrabold text-white">Vehículos Vinculados</h2>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="bg-brand-red hover:bg-red-800 text-white font-medium text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Vincular Auto
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-800 rounded-xl bg-brand-card text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
            placeholder="Buscar por matrícula (patente)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Vehicle cards list */}
        <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
          {filteredVehiculos.map(v => {
            const owner = getVehiculoOwner(v.clienteId);
            const isSelected = selectedVehiculo?.matricula === v.matricula;
            
            return (
              <div 
                key={v.matricula}
                onClick={() => { setSelectedVehiculo(v); setIsAdding(false); setIsEditing(false); }}
                className={`p-3.5 rounded-xl border border-gray-800/60 cursor-pointer flex justify-between items-center transition-all ${
                  isSelected 
                    ? 'bg-brand-red/10 border-brand-red' 
                    : 'bg-brand-card-light hover:bg-[#2B2B2B]/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-black text-[10.5px] font-mono font-bold px-2 py-0.5 rounded tracking-wider leading-none plate-font">
                      {v.matricula}
                    </span>
                    <span className="font-display font-bold text-white text-sm capitalize">{v.marca} {v.modelo}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-sans flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-red/80" />
                    <span>Dueño: <span className="text-gray-300 font-semibold">{owner?.nombre || 'Desconocido'}</span></span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-sans">Color: {v.color} &bull; Año: {v.anio}</p>
                </div>

                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isSelected ? 'translate-x-1 text-brand-red' : ''}`} />
              </div>
            );
          })}

          {filteredVehiculos.length === 0 && (
            <p className="text-xs text-center text-gray-500 italic py-6">No se encontraron vehículos.</p>
          )}
        </div>
      </div>

      {/* Detail / CRUD Column */}
      <div className="lg:col-span-7">
        {isAdding || isEditing ? (
          <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-display font-bold text-white border-b border-gray-800 pb-2">
              {isAdding ? 'Registrar Nuevo Vehículo' : `Editar Vehículo Patente: ${selectedVehiculo?.matricula}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Matrícula / Patente *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-brand-red disabled:opacity-50"
                    placeholder="Ej: AA123BC o XYZ-789"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                  />
                  {isAdding && <p className="text-[10px] text-gray-500 italic">Identificador único. Mayúsculas sin espacios.</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Cliente Asociado (Propietario) *</label>
                  <select
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                    disabled={isEditing}
                  >
                    <option value="">-- Elegir propietario --</option>
                    {state.clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Marca *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red capitalize"
                    placeholder="Ej: Toyota, Ford..."
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Modelo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red capitalize"
                    placeholder="Ej: Hilux, Fiesta..."
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Color *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Ej: Negro, Azul..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Año de Fabricación</label>
                  <input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear() + 1}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Imagen del Vehículo (URL de foto)</label>
                  <input
                    type="text"
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Dejar vacío para usar foto por defecto"
                    value={fotoUrlInput}
                    onChange={(e) => setFotoUrlInput(e.target.value)}
                  />
                </div>
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
                  {isAdding ? 'Registrar Auto' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedVehiculo ? (
          <div className="space-y-6">
            {/* Vehicle Profile Card */}
            <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 relative">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedVehiculo)}
                  className="p-2 bg-brand-card-light text-gray-300 hover:text-white rounded-lg border border-gray-800 hover:border-gray-700"
                  title="Editar Vehículo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 bg-brand-card-light text-brand-red/70 hover:text-brand-red rounded-lg border border-gray-800 hover:border-brand-red/30"
                  title="Eliminar Vehículo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Vehicle Photo display */}
                <div className="w-full md:w-44 h-28 md:h-36 rounded-xl bg-gray-900 overflow-hidden relative border border-gray-800 shadow-inner group shrink-0">
                  <img 
                    src={selectedVehiculo.fotosUrl[0]} 
                    alt="Foto del vehículo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-gray-300 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-brand-red" />
                    <span>Control</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-white text-black text-xs font-mono font-extrabold px-2.5 py-1 rounded tracking-widest plate-font shadow-lg">
                      {selectedVehiculo.matricula}
                    </span>
                    <span className="text-gray-400 text-sm font-mono tracking-wider">Año {selectedVehiculo.anio}</span>
                  </div>

                  <h2 className="text-2xl font-display font-extrabold text-white capitalize leading-tight">
                    {selectedVehiculo.marca} {selectedVehiculo.modelo}
                  </h2>

                  {/* Owner quicklink */}
                  <div className="p-3 bg-brand-card-light rounded-xl border border-gray-800 inline-flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-bold">
                      {getVehiculoOwner(selectedVehiculo.clienteId)?.nombre[0] || 'D'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono">PROPIETARIO</p>
                      <p className="text-white font-bold">{getVehiculoOwner(selectedVehiculo.clienteId)?.nombre || 'Cliente de paso'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical badges */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800/80 text-xs">
                <div className="p-3 bg-brand-card-light rounded-xl flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-red" />
                    Color:
                  </span>
                  <span className="text-white font-semibold capitalize">{selectedVehiculo.color}</span>
                </div>
                <div className="p-3 bg-brand-card-light rounded-xl flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-warning" />
                    Lavados Registrados:
                  </span>
                  <span className="text-white font-mono font-semibold">
                    {getVehiculoServicios(selectedVehiculo.matricula).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Logs for this License Plate */}
            <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-3">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red" />
                Historial de Servicios en este Vehículo ({getVehiculoServicios(selectedVehiculo.matricula).length})
              </h3>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {getVehiculoServicios(selectedVehiculo.matricula).map(s => (
                  <div key={s.id} className="p-3.5 bg-brand-card-light rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm capitalize">{s.tipo}</span>
                        <span className="text-[10px] bg-brand-card text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-mono">
                          ID: {s.id}
                        </span>
                      </div>
                      <p className="text-gray-400 font-mono text-[10px] mt-1">Realizado: {s.fecha} hs &bull; {s.formaPago}</p>
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

                {getVehiculoServicios(selectedVehiculo.matricula).length === 0 && (
                  <p className="p-4 rounded-xl text-center text-xs text-gray-500 italic border border-dashed border-gray-800 col-span-2">
                    Ningún lavado registrado en nuestro sistema para este vehículo todavía.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-brand-card rounded-2xl border border-gray-100/10 space-y-3 flex flex-col items-center justify-center min-h-[400px]">
            <Car className="w-16 h-16 text-gray-600 animate-pulse" />
            <h3 className="text-lg font-display font-medium text-gray-300">Selecciona un Vehículo</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Inicia búsquedas ingresando la patente del vehículo a la izquierda. Verás su ficha técnica completa, fotos de control y su historial de visitas realizadas en Lavadero RyN.
            </p>
          </div>
        )}
      </div>

      {/* Modern custom modal for delete confirmation */}
      {showConfirmDelete && selectedVehiculo && (
        <div id="confirm-delete-vehiculo-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Desvincular Vehículo?</h3>
              <p className="text-xs text-gray-400">
                ¿Seguro que deseas desvincular el auto patentado <span className="font-bold text-white font-mono bg-white text-black px-1 rounded">{selectedVehiculo.matricula}</span>? Esta acción no se puede deshacer.
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
                  onDeleteVehiculo(selectedVehiculo.matricula);
                  setSelectedVehiculo(null);
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
