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
  Briefcase,
  AlertTriangle,
  FileText,
  Clock,
  Camera,
  Gauge
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
  const [kilometros, setKilometros] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [proximoMantenimiento, setProximoMantenimiento] = useState('');
  const [fotoBase64, setFotoBase64] = useState('');

  const [isDraggingFile, setIsDraggingFile] = useState(false);

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
    setAnio(new Date().getFullYear());
    setClienteId(state.clientes[0]?.id || '');
    setKilometros('');
    setObservaciones('');
    setProximoMantenimiento('');
    setFotoBase64('');
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
    setKilometros(v.kilometros !== undefined ? v.kilometros : '');
    setObservaciones(v.observaciones || '');
    setProximoMantenimiento(v.proximoMantenimiento || '');
    setFotoBase64(v.fotosUrl?.[0] || '');
    setIsAdding(false);
    setIsEditing(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        setFotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !marca || !modelo || !clienteId) return;

    const formattedMatricula = matricula.replace(/\s+/g, '').toUpperCase();
    const defaultCarPhoto = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
    const finalFotos = fotoBase64 ? [fotoBase64] : [defaultCarPhoto];

    const payload: Vehiculo = {
      matricula: formattedMatricula,
      marca,
      modelo,
      color,
      anio: Number(anio),
      clienteId,
      fotosUrl: finalFotos,
      kilometros: kilometros !== '' ? Number(kilometros) : undefined,
      observaciones: observaciones || undefined,
      proximoMantenimiento: proximoMantenimiento || undefined
    };

    if (isAdding) {
      onAddVehiculo(payload);
      setIsAdding(false);
    } else if (isEditing && selectedVehiculo) {
      onUpdateVehiculo(payload);
      setSelectedVehiculo(payload);
      setIsEditing(false);
    }
  };

  const getVehiculoOwner = (cliId: string): Cliente | undefined => {
    return state.clientes.find(c => c.id === cliId);
  };

  const getVehiculoServicios = (plate: string) => {
    return state.servicios
      .filter(s => s.vehiculoMatricula.toUpperCase() === plate.toUpperCase())
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  const getVehiculoTotalSpent = (plate: string) => {
    return getVehiculoServicios(plate).reduce((acc, curr) => acc + curr.precio, 0);
  };

  const getVehiculoLastWash = (plate: string) => {
    const services = getVehiculoServicios(plate);
    return services[0]?.fecha || 'Sin lavados';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List Column */}
      <div className="lg:col-span-5 p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-extrabold text-white">Vehículos Registrados</h2>
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
            placeholder="Buscar por matrícula (patente) o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Vehicle list */}
        <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
          {filteredVehiculos.map(v => {
            const owner = getVehiculoOwner(v.clienteId);
            const isSelected = selectedVehiculo?.matricula === v.matricula;
            
            return (
              <div 
                key={v.matricula}
                onClick={() => { setSelectedVehiculo(v); setIsAdding(false); setIsEditing(false); }}
                className={`p-3.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  isSelected 
                    ? 'bg-brand-red/10 border-brand-red' 
                    : 'bg-brand-card-light border-gray-800/60 hover:bg-[#2B2B2B]/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-black text-[10px] font-mono font-black px-1.5 py-0.5 rounded tracking-wider leading-none plate-font uppercase">
                      {v.matricula}
                    </span>
                    <span className="font-display font-bold text-white text-sm capitalize">{v.marca} {v.modelo}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-sans flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-red/80" />
                    <span>Dueño: <span className="text-gray-300 font-semibold">{owner?.nombre || 'Desconocido'}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-sans">
                    <span>Color: {v.color}</span>
                    <span>&bull;</span>
                    <span>Año: {v.anio}</span>
                    {v.kilometros && (
                      <>
                        <span>&bull;</span>
                        <span className="font-mono">{v.kilometros.toLocaleString('es-AR')} km</span>
                      </>
                    )}
                  </div>
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
              {isAdding ? 'Vincular Nuevo Vehículo' : `Editar Vehículo Patente: ${selectedVehiculo?.matricula}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              
              {/* Photo uploader with drag and drop */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">Foto del Vehículo</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isDraggingFile 
                      ? 'border-brand-red bg-brand-red/5' 
                      : 'border-gray-800 hover:border-brand-red/30 bg-brand-card-light'
                  }`}
                >
                  {fotoBase64 ? (
                    <div className="relative">
                      <img 
                        src={fotoBase64} 
                        alt="Previsualización" 
                        className="w-40 h-24 object-cover rounded-xl border border-gray-800 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoBase64('')}
                        className="absolute -top-2 -right-2 bg-brand-red text-white p-1 rounded-full text-xs shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-500" />
                      <p className="text-xs text-gray-300 font-semibold">Arrastra una foto del auto o haz clic para subir</p>
                      <p className="text-[10px] text-gray-500">Soporta formatos PNG/JPG. Se almacena en la base del sistema.</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute opacity-0 w-full max-w-[280px] h-20 cursor-pointer hidden"
                    id="vehicle-file-upload"
                  />
                  {!fotoBase64 && (
                    <label 
                      htmlFor="vehicle-file-upload" 
                      className="bg-brand-card border border-gray-700 hover:border-brand-red/50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer mt-1"
                    >
                      Seleccionar Archivo
                    </label>
                  )}
                </div>
              </div>

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
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Propietario Asociado *</label>
                  <select
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                    disabled={isEditing}
                  >
                    <option value="">-- Seleccionar propietario --</option>
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
                    placeholder="Ej: Honda, Chevrolet..."
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
                    placeholder="Ej: Civic, Cruze..."
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
                    placeholder="Ej: Gris Plata, Azul..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Kilómetros</label>
                  <input
                    type="number"
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Kilometraje actual..."
                    value={kilometros}
                    onChange={(e) => setKilometros(e.target.value !== '' ? Number(e.target.value) : '')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Próximo Mantenimiento</label>
                  <input
                    type="date"
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                    value={proximoMantenimiento}
                    onChange={(e) => setProximoMantenimiento(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Observaciones Técnicas del Vehículo</label>
                <textarea
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white min-h-[90px] focus:outline-none focus:ring-1 focus:ring-brand-red"
                  placeholder="Detalles sobre el estado (ej: rayón en guardabarros izquierdo, llantas personalizadas, tapizado delicado...)"
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
                  {isAdding ? 'Registrar Auto' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedVehiculo ? (
          <div className="space-y-6">
            
            {/* Vehicle Profile Card */}
            <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedVehiculo)}
                  className="p-2 bg-brand-card-light text-gray-300 hover:text-white rounded-lg border border-gray-800 hover:border-gray-700 transition"
                  title="Editar Vehículo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 bg-brand-card-light text-brand-red/70 hover:text-brand-red rounded-lg border border-gray-800 hover:border-brand-red/30 transition"
                  title="Eliminar Vehículo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Vehicle Photo display */}
                <div className="w-full md:w-48 h-32 md:h-36 rounded-2xl bg-gray-900 overflow-hidden relative border border-gray-800 shadow-inner group shrink-0">
                  <img 
                    src={selectedVehiculo.fotosUrl?.[0]} 
                    alt="Foto del vehículo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 px-2 py-0.5 rounded text-[9px] text-gray-300 flex items-center gap-1 border border-gray-800">
                    <ImageIcon className="w-3.5 h-3.5 text-brand-red" />
                    <span>Control Técnico</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-white text-black text-xs font-mono font-black px-3 py-1 rounded tracking-widest plate-font shadow-lg uppercase">
                      {selectedVehiculo.matricula}
                    </span>
                    <span className="text-gray-400 text-xs font-mono tracking-wider">Modelo {selectedVehiculo.anio}</span>
                  </div>

                  <h2 className="text-2xl font-display font-extrabold text-white capitalize leading-tight">
                    {selectedVehiculo.marca} {selectedVehiculo.modelo}
                  </h2>

                  {/* Owner link */}
                  <div className="p-3 bg-brand-card-light rounded-xl border border-gray-800 inline-flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center font-bold">
                      {getVehiculoOwner(selectedVehiculo.clienteId)?.nombre[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-mono">DUEÑO ASOCIADO</p>
                      <p className="text-white font-bold text-xs">{getVehiculoOwner(selectedVehiculo.clienteId)?.nombre || 'Cliente Particular'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical / Extended Information Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 bg-brand-card-light rounded-2xl border border-gray-850">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Kilometraje</p>
                  <p className="text-sm font-display font-black text-white mt-1 flex items-center justify-center gap-1 font-mono">
                    <Gauge className="w-4 h-4 text-brand-red" />
                    {selectedVehiculo.kilometros !== undefined ? `${selectedVehiculo.kilometros.toLocaleString('es-AR')} km` : 'N/D'}
                  </p>
                </div>
                <div className="text-center border-l sm:border-x border-gray-800">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Total Gastado</p>
                  <p className="text-sm font-display font-black text-brand-success mt-1 font-mono">
                    ${getVehiculoTotalSpent(selectedVehiculo.matricula).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-center border-t sm:border-t-0 sm:border-r border-gray-800 pt-3 sm:pt-0">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Último Lavado</p>
                  <p className="text-xs font-bold text-gray-300 mt-2 truncate">
                    {getVehiculoLastWash(selectedVehiculo.matricula).split(' ')[0]}
                  </p>
                </div>
                <div className="text-center pt-3 sm:pt-0">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Mantenimiento</p>
                  <p className="text-xs font-bold text-[#FFC107] mt-2 truncate">
                    {selectedVehiculo.proximoMantenimiento || 'Sin programar'}
                  </p>
                </div>
              </div>

              {selectedVehiculo.proximoMantenimiento && new Date(selectedVehiculo.proximoMantenimiento) < new Date() && (
                <div className="mt-4 p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl flex items-center gap-2.5 text-xs text-brand-red">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>
                    <span className="font-bold">Mantenimiento Vencido:</span> Este vehículo superó su fecha programada de lavado preventivo/revisión ({selectedVehiculo.proximoMantenimiento}).
                  </p>
                </div>
              )}

              {/* Technical Observations Section */}
              {selectedVehiculo.observaciones && (
                <div className="mt-4 p-3.5 bg-brand-card border border-gray-800 rounded-2xl text-xs text-gray-300 flex items-start gap-2.5">
                  <FileText className="w-4.5 h-4.5 text-brand-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Observaciones Técnicas / Diagnóstico:</p>
                    <p className="mt-1 leading-relaxed text-gray-400">{selectedVehiculo.observaciones}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Service history detailed logs / Timeline */}
            <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2 border-b border-gray-850 pb-2">
                <Calendar className="w-4 h-4 text-brand-red" />
                Línea de Tiempo de Servicios ({getVehiculoServicios(selectedVehiculo.matricula).length})
              </h3>

              <div className="relative pl-6 border-l border-gray-800/80 space-y-6 max-h-[350px] overflow-y-auto pr-1 py-1">
                {getVehiculoServicios(selectedVehiculo.matricula).map((s, sIdx) => (
                  <div key={s.id} className="relative group">
                    {/* Circle Node indicator on the left line */}
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-red border border-black group-hover:scale-125 transition-transform"></div>

                    {/* Timeline card */}
                    <div className="p-3.5 bg-brand-card-light rounded-xl border border-gray-850 flex flex-col gap-3 hover:border-gray-800 transition">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm capitalize">{s.tipo}</span>
                            <span className="text-[9px] bg-white/10 text-gray-300 font-bold px-1.5 py-0.5 rounded font-mono">
                              ID: {s.id}
                            </span>
                            <span className="text-[9px] bg-brand-success/15 text-brand-success font-black px-2 py-0.5 rounded font-mono">
                              Pago: {s.formaPago}
                            </span>
                          </div>
                          
                          <p className="text-gray-400 font-mono text-[10px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>Realizado: {s.fecha} hs</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm text-brand-success font-black block">
                            ${s.precio.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {s.observaciones && (
                        <div className="p-2 bg-brand-card border border-gray-850 rounded-lg text-[11px] text-gray-400 font-sans italic">
                          &ldquo;{s.observaciones}&rdquo;
                        </div>
                      )}

                      {/* Timeline photos list if present */}
                      {((s.fotosAntes && s.fotosAntes.length > 0) || (s.fotosDespues && s.fotosDespues.length > 0)) && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {s.fotosAntes && s.fotosAntes[0] && (
                            <div className="space-y-1">
                              <p className="text-[8px] font-mono text-gray-500 uppercase">Antes</p>
                              <img 
                                src={s.fotosAntes[0]} 
                                alt="Antes" 
                                className="w-full h-16 object-cover rounded-lg border border-gray-850"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          {s.fotosDespues && s.fotosDespues[0] && (
                            <div className="space-y-1">
                              <p className="text-[8px] font-mono text-gray-500 uppercase">Después</p>
                              <img 
                                src={s.fotosDespues[0]} 
                                alt="Después" 
                                className="w-full h-16 object-cover rounded-lg border border-gray-850"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {getVehiculoServicios(selectedVehiculo.matricula).length === 0 && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-700 border border-black"></div>
                    <p className="p-4 rounded-xl text-center text-xs text-gray-500 italic border border-dashed border-gray-850 bg-brand-card-light">
                      Ningún lavado registrado en nuestro sistema para este vehículo todavía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-brand-card rounded-2xl border border-gray-800 space-y-3 flex flex-col items-center justify-center min-h-[440px]">
            <Car className="w-16 h-16 text-gray-600 animate-pulse" />
            <h3 className="text-lg font-display font-medium text-gray-300">Selecciona un Vehículo</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Inicia búsquedas ingresando la patente a la izquierda para visualizar la ficha de control, kilometraje, historial de mantenimientos preventivos y servicios facturados.
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
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
