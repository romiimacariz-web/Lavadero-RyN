/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, CatalogoServicio } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Bookmark,
  Check,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface CatalogoProps {
  state: DatabaseState;
  onUpdateCatalogo: (catalogo: CatalogoServicio[]) => void;
  onUpdatePassword: (password: string) => void;
}

export default function Catalogo({ state, onUpdateCatalogo, onUpdatePassword }: CatalogoProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states (Add/Edit)
  const [tipo, setTipo] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  // Active delete confirmation states
  const [serviceToDelete, setServiceToDelete] = useState<CatalogoServicio | null>(null);

  // Password change states
  const [newPassword, setNewPassword] = useState(state.adminPassword || 'ryn123');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordFeedback('La contraseña no puede estar vacía.');
      return;
    }
    onUpdatePassword(newPassword.trim());
    setPasswordFeedback('¡Contraseña de administración guardada correctamente!');
    setTimeout(() => setPasswordFeedback(null), 3000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo.trim()) {
      setErrorText('Por favor ingrese el nombre para el servicio.');
      return;
    }
    if (precio < 0) {
      setErrorText('El precio de cobro debe ser un valor positivo.');
      return;
    }

    const newService: CatalogoServicio = {
      id: `cat-${Date.now()}`,
      tipo: tipo.trim(),
      precio,
      descripcion: descripcion.trim() || undefined
    };

    const updated = [...state.serviciosCatalogo, newService];
    onUpdateCatalogo(updated);
    resetForm();
  };

  const handleStartEdit = (service: CatalogoServicio) => {
    setEditingId(service.id);
    setTipo(service.tipo);
    setPrecio(service.precio);
    setDescripcion(service.descripcion || '');
    setErrorText(null);
    setIsAdding(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo.trim()) {
      setErrorText('Por favor ingrese el nombre para el servicio.');
      return;
    }
    if (precio < 0) {
      setErrorText('El precio debe ser un valor positivo.');
      return;
    }

    const updated = state.serviciosCatalogo.map(item => {
      if (item.id === editingId) {
        return {
          ...item,
          tipo: tipo.trim(),
          precio,
          descripcion: descripcion.trim() || undefined
        };
      }
      return item;
    });

    onUpdateCatalogo(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = state.serviciosCatalogo.filter(item => item.id !== id);
    onUpdateCatalogo(updated);
    setServiceToDelete(null);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTipo('');
    setPrecio(0);
    setDescripcion('');
    setErrorText(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            CATÁLOGO DE <span className="text-brand-red font-black">SERVICIOS</span>
          </h1>
          <p className="text-gray-400 text-sm font-sans mt-1">
            Administra los tipos de servicios y los costos de cada trabajo para que los clientes y operarios puedan elegirlos con un clic.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 bg-brand-red hover:bg-[#B30F15] text-white font-black text-xs py-3 px-5 rounded-xl transition duration-200 uppercase tracking-widest self-start sm:self-center shrink-0 shadow-lg shadow-brand-red/10 border border-brand-red/30 focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
        )}
      </div>

      {/* Form Area for Adding or Editing */}
      {(isAdding || editingId) && (
        <div id="service-form-panel" className="bg-brand-card rounded-2xl border border-gray-800 p-5 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red" />
              {editingId ? 'Editar Servicio del Catálogo' : 'Añadir Nuevo Servicio al Catálogo'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-brand-card-light text-gray-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={editingId ? handleSaveEdit : handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type / Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Nombre del Servicio *</label>
                <div className="relative">
                  <Bookmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2 text-white focus:outline-none focus:border-brand-red text-sm font-bold"
                    placeholder="Ej. Lavado de tapizado completo"
                  />
                </div>
              </div>

              {/* Price / Cost */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Costo base ($) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-success font-bold" />
                  <input
                    type="number"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2 text-white font-mono focus:outline-none focus:border-brand-red text-sm text-brand-success font-black"
                    placeholder="Precio en pesos argentinos"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Descripción / Detalles del Trabajo</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red text-xs resize-none"
                  rows={2}
                  placeholder="Ej. Remoción profunda de manchas, limpieza de cinturones de seguridad y vaporizado antibacteriano..."
                />
              </div>
            </div>

            {errorText && (
              <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={resetForm}
                className="bg-brand-card-light hover:bg-[#2B2B2B] text-gray-300 font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-brand-success hover:bg-green-700 text-white font-black text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Guardar Cambios' : 'Registrar Servicio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid listing the catalog of services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.serviciosCatalogo.map((service) => (
          <div 
            key={service.id} 
            className="bg-brand-card border border-gray-800/60 rounded-2xl p-5 flex flex-col justify-between hover:border-brand-red/20 transition-all duration-200 group relative overflow-hidden"
          >
            {/* Visual overlay gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/5 rounded-full blur-2xl -z-10 group-hover:bg-brand-red/10 transition"></div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-display font-black text-white text-base tracking-tight select-text">
                  {service.tipo}
                </h3>
                <span className="shrink-0 text-md font-mono font-black text-brand-success select-text bg-brand-success/5 border border-brand-success/10 px-2.5 py-1 rounded-xl">
                  ${service.precio.toLocaleString('es-AR')}
                </span>
              </div>

              <p className="text-gray-400 text-xs leading-relaxed min-h-[36px] select-text">
                {service.descripcion || 'Sin descripción o especificaciones registradas para este servicio.'}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-gray-850">
              <button
                onClick={() => handleStartEdit(service)}
                className="p-1.5 bg-brand-card hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400 hover:text-white transition"
                title="Editar servicio"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setServiceToDelete(service)}
                className="p-1.5 bg-brand-card hover:bg-brand-red/10 border border-gray-800 hover:border-brand-red/30 rounded-lg text-brand-red/80 hover:text-brand-red transition"
                title="Eliminar servicio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {state.serviciosCatalogo.length === 0 && (
        <div className="text-center py-12 bg-brand-card border border-gray-800/60 rounded-2xl space-y-3">
          <Bookmark className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="font-display font-bold text-white">Catálogo Vacío</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
            No posees servicios cargados en el catálogo. Agrega uno nuevo desde el botón superior para dar de alta precios del local.
          </p>
        </div>
      )}

      {/* Sección de seguridad para la administración (Solo visible para el Administrador) */}
      {state.currentRole === 'Administrador' && (
        <div className="mt-8 pt-8 border-t border-gray-800 space-y-4">
          <div className="bg-brand-card border border-gray-800/80 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-red/10 border border-brand-red/25 text-brand-red rounded-xl shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-display font-black text-white">Contraseña de Administración</h3>
                <p className="text-xs text-gray-400">
                  Configura la clave requerida para cambiar del modo Empleado/Autoservicio al panel de Administración de Lavadero RyN.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Nueva Clave de Seguridad</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordFeedback(null);
                    }}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-red"
                    placeholder="Clave de seguridad"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="bg-brand-red hover:bg-[#B30F15] text-white font-black text-xs py-3 px-5 rounded-xl transition duration-200 uppercase tracking-widest flex items-center justify-center gap-2 shadow-md w-full"
              >
                <Save className="w-4 h-4" />
                Guardar Clave
              </button>
            </form>

            {passwordFeedback && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                passwordFeedback.includes('correctamente') 
                  ? 'bg-brand-success/10 border border-brand-success/30 text-brand-success' 
                  : 'bg-brand-red/10 border border-brand-red/30 text-brand-red'
              }`}>
                {passwordFeedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern custom modal for catalog service deleting */}
      {serviceToDelete !== null && (
        <div id="confirm-delete-catalog-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Eliminar del Catálogo?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ¿Seguro que deseas eliminar el servicio <span className="font-bold text-white">"{serviceToDelete.tipo}"</span> del catálogo de precios? Esto no borrará registros históricos, pero ya no aparecerá como opción para nuevos turnos.
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
                onClick={() => handleDelete(serviceToDelete.id)}
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
