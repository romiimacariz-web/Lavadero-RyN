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
  EyeOff,
  Store,
  Shield,
  Download,
  Upload,
  Clock,
  Instagram,
  Facebook,
  MapPin,
  CheckCircle2,
  Settings
} from 'lucide-react';

interface CatalogoProps {
  state: DatabaseState;
  onUpdateCatalogo: (catalogo: CatalogoServicio[]) => void;
  onUpdatePassword: (password: string) => void;
  onUpdateBusinessWhatsapp: (whatsapp: string) => void;
  onUpdateBusinessConfig?: (
    nombre: string,
    logo: string,
    direccion: string,
    insta: string,
    fb: string,
    horas: string
  ) => void;
  onRestoreBackup?: (backupData: any) => Promise<boolean>;
}

type ConfigSubTab = 'catalogo' | 'perfil' | 'seguridad';

export default function Catalogo({ 
  state, 
  onUpdateCatalogo, 
  onUpdatePassword, 
  onUpdateBusinessWhatsapp,
  onUpdateBusinessConfig,
  onRestoreBackup
}: CatalogoProps) {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>('catalogo');
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

  // WhatsApp settings states
  const [bWhatsapp, setBWhatsapp] = useState(state.businessWhatsapp || '5491123456789');
  const [whatsappFeedback, setWhatsappFeedback] = useState<string | null>(null);

  // Business settings states
  const [nombreNegocio, setNombreNegocio] = useState(state.nombreNegocio || 'Lavadero RyN');
  const [logoUrl, setLogoUrl] = useState(state.logoUrl || '');
  const [direccionNegocio, setDireccionNegocio] = useState(state.direccionNegocio || '');
  const [instagramVal, setInstagramVal] = useState(state.instagram || '');
  const [facebookVal, setFacebookVal] = useState(state.facebook || '');
  const [horariosVal, setHorariosVal] = useState(state.horarios || 'Lunes a Sábado: 08:00 a 19:00 hs');
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  // Backup states
  const [backupFile, setBackupFile] = useState<any>(null);
  const [backupSummary, setBackupSummary] = useState<string | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

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

  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bWhatsapp.trim()) {
      setWhatsappFeedback('El número de WhatsApp no puede estar vacío.');
      return;
    }
    const cleaned = bWhatsapp.replace(/[+\s\-()]/g, '');
    onUpdateBusinessWhatsapp(cleaned);
    setWhatsappFeedback('¡Número de WhatsApp de la empresa guardado correctamente!');
    setTimeout(() => setWhatsappFeedback(null), 3000);
  };

  const handleSaveBusinessConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBusinessConfig) {
      onUpdateBusinessConfig(
        nombreNegocio.trim() || 'Lavadero RyN',
        logoUrl.trim(),
        direccionNegocio.trim(),
        instagramVal.trim(),
        facebookVal.trim(),
        horariosVal.trim()
      );
      setConfigFeedback('¡Configuración del perfil del negocio guardada con éxito!');
      setTimeout(() => setConfigFeedback(null), 3000);
    }
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

  // FULL JSON SYSTEM BACKUP EXPORTER
  const handleExportBackup = () => {
    try {
      const backupPayload = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        clientes: state.clientes,
        vehiculos: state.vehiculos,
        reservas: state.reservas,
        servicios: state.servicios,
        gastos: state.gastos,
        serviciosCatalogo: state.serviciosCatalogo,
        businessWhatsapp: state.businessWhatsapp,
        nombreNegocio: state.nombreNegocio,
        logoUrl: state.logoUrl,
        direccionNegocio: state.direccionNegocio,
        instagram: state.instagram,
        facebook: state.facebook,
        horarios: state.horarios
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Copia_De_Seguridad_Lavadero_RyN_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (e: any) {
      alert('Error exportando copia de seguridad: ' + e.message);
    }
  };

  // BACKUP FILE PARSING
  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (
          Array.isArray(json.clientes) || 
          Array.isArray(json.vehiculos) || 
          Array.isArray(json.reservas) || 
          Array.isArray(json.serviciosCatalogo)
        ) {
          setBackupFile(json);
          setBackupSummary(
            `Copia válida encontrada (${new Date(json.exportedAt || Date.now()).toLocaleDateString()}). Contiene: ${json.clientes?.length || 0} Clientes, ${json.vehiculos?.length || 0} Vehículos, ${json.reservas?.length || 0} Turnos, ${json.gastos?.length || 0} Gastos.`
          );
          setRestoreFeedback(null);
        } else {
          setBackupSummary(null);
          setBackupFile(null);
          setRestoreFeedback('El archivo no posee un formato de base de datos de Lavadero RyN válido.');
        }
      } catch (err) {
        setBackupSummary(null);
        setBackupFile(null);
        setRestoreFeedback('Error al decodificar el archivo JSON: Formato corrupto.');
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerRestore = async () => {
    if (!backupFile || !onRestoreBackup) return;
    setIsRestoring(true);
    setRestoreFeedback('Restaurando colecciones en la nube. Por favor espera...');
    try {
      const success = await onRestoreBackup(backupFile);
      if (success) {
        setRestoreFeedback('¡Base de datos restaurada correctamente en la nube con éxito!');
        setBackupFile(null);
        setBackupSummary(null);
      } else {
        setRestoreFeedback('Error al procesar los lotes de escritura en Firestore.');
      }
    } catch (err: any) {
      setRestoreFeedback('Fallo crítico en restauración: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header tab-row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">Consola de Configuración</h2>
            <p className="text-xs text-gray-400">Administración de catálogo, datos comerciales de facturación y seguridad</p>
          </div>
        </div>

        {/* Configuration Sub Tabs Selector */}
        <div className="flex items-center gap-1.5 bg-brand-card-light p-1 rounded-xl border border-gray-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('catalogo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition flex items-center gap-1.5 ${
              activeSubTab === 'catalogo' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Servicios
          </button>
          
          {state.currentRole === 'Administrador' && (
            <>
              <button
                onClick={() => setActiveSubTab('perfil')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition flex items-center gap-1.5 ${
                  activeSubTab === 'perfil' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Perfil
              </button>
              <button
                onClick={() => setActiveSubTab('seguridad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition flex items-center gap-1.5 ${
                  activeSubTab === 'seguridad' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Seguridad & Backup
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUB TAB 1: CATALOGO DE SERVICIOS */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display font-extrabold text-white">Catálogo Vigente de Servicios</h3>
            {!isAdding && !editingId && (
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1.5 bg-brand-red hover:bg-red-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Nuevo Servicio
              </button>
            )}
          </div>

          {/* Form Panel for addition/editing */}
          {(isAdding || editingId) && (
            <div className="bg-brand-card rounded-2xl border border-gray-800 p-5 space-y-4 animate-scaleUp text-xs font-sans">
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <span className="font-display font-bold text-white text-sm">
                  {editingId ? '✍️ Editar Servicio' : '✨ Agregar Servicio al Catálogo'}
                </span>
                <button onClick={resetForm} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={editingId ? handleSaveEdit : handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Nombre del Servicio *</label>
                    <input
                      type="text"
                      required
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white font-bold"
                      placeholder="Ej. Lavado Premium Carrocería + Motor"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Costo base ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={precio}
                      onChange={(e) => setPrecio(Number(e.target.value))}
                      className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-brand-success font-mono font-bold"
                      placeholder="Precio en ARS"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Descripción o Alcance del Trabajo</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white resize-none"
                    placeholder="Detalles sobre lo que incluye (ej: aspirado, encerado, perfume...)"
                  />
                </div>

                {errorText && (
                  <p className="text-xs text-brand-red font-semibold">{errorText}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-[#2B2B2B] hover:bg-gray-750 text-white font-bold text-xs py-2 px-4 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-success hover:bg-green-700 text-white font-black text-xs py-2 px-5 rounded-xl"
                  >
                    Guardar Servicio
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Catalog grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.serviciosCatalogo.map(service => (
              <div key={service.id} className="bg-brand-card border border-gray-850 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-800 transition">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-display font-black text-white text-base leading-snug">{service.tipo}</h4>
                    <span className="font-mono font-extrabold text-brand-success bg-brand-success/10 border border-brand-success/15 px-2.5 py-1 rounded-xl text-xs">
                      ${service.precio.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {service.descripcion || 'Sin especificaciones añadidas.'}
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-gray-850">
                  <button
                    onClick={() => handleStartEdit(service)}
                    className="p-1.5 bg-brand-card hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(service)}
                    className="p-1.5 bg-brand-card hover:bg-brand-red/10 border border-gray-800 rounded-lg text-brand-red/80 hover:text-brand-red transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {state.serviciosCatalogo.length === 0 && (
              <p className="text-xs text-gray-500 italic py-10 text-center col-span-3">No hay servicios configurados en el catálogo.</p>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: PERFIL DEL NEGOCIO */}
      {activeSubTab === 'perfil' && (
        <div className="bg-brand-card border border-gray-850 rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4 border-b border-gray-850 pb-4">
            <div className="p-3 bg-brand-red/10 border border-brand-red/25 text-brand-red rounded-xl shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-black text-white">Perfil Comercial del Lavadero</h3>
              <p className="text-xs text-gray-400">Ajusta los datos del local. Estos datos se visualizan en el encabezado del Dashboard.</p>
            </div>
          </div>

          <form onSubmit={handleSaveBusinessConfig} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Nombre Comercial del Negocio *</label>
                <input
                  type="text"
                  required
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
                  placeholder="Ej: Lavadero RyN"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">URL del Logo (Opcional)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2.5 text-white"
                  placeholder="https://ejemplo.com/mi-logo.png"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Dirección Física del Local</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={direccionNegocio}
                    onChange={(e) => setDireccionNegocio(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white"
                    placeholder="Ej. Av. Pellegrini 1500, Rosario"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Días y Horarios de Atención</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={horariosVal}
                    onChange={(e) => setHorariosVal(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white"
                    placeholder="Ej. Lunes a Sábados de 08:00 a 20:00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Usuario de Instagram (Opcional)</label>
                <div className="relative">
                  <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={instagramVal}
                    onChange={(e) => setInstagramVal(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white"
                    placeholder="lavaderoryn"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Enlace/Nombre de Facebook (Opcional)</label>
                <div className="relative">
                  <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={facebookVal}
                    onChange={(e) => setFacebookVal(e.target.value)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white"
                    placeholder="lavaderorynoficial"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-brand-red hover:bg-[#B30F15] text-white font-black text-xs py-3 px-6 rounded-xl transition uppercase tracking-widest flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              Guardar Perfil Comercial
            </button>

            {configFeedback && (
              <div className="p-3 bg-brand-success/10 border border-brand-success/30 text-brand-success text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>{configFeedback}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* SUB TAB 3: SEGURIDAD & COPIAS DE SEGURIDAD */}
      {activeSubTab === 'seguridad' && (
        <div className="space-y-6">
          
          {/* Security details row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Clave de admin */}
            <div className="bg-brand-card border border-gray-850 rounded-2xl p-5 space-y-4 text-xs font-sans">
              <h3 className="font-display font-black text-white text-sm flex items-center gap-2 border-b border-gray-850 pb-2">
                <Lock className="w-4 h-4 text-brand-red" />
                Contraseña de Administrador
              </h3>
              
              <form onSubmit={handleSavePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Clave del Sistema</label>
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
                      className="w-full bg-brand-card-light border border-gray-800 rounded-xl pl-10 pr-10 py-2 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#2B2B2B] border border-gray-800 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4 text-brand-red" />
                  Actualizar Clave
                </button>
              </form>

              {passwordFeedback && (
                <p className="text-[11px] text-brand-success font-semibold mt-1">{passwordFeedback}</p>
              )}
            </div>

            {/* Configurar celular */}
            <div className="bg-brand-card border border-gray-850 rounded-2xl p-5 space-y-4 text-xs font-sans">
              <h3 className="font-display font-black text-white text-sm flex items-center gap-2 border-b border-gray-850 pb-2">
                <svg className="w-4 h-4 text-[#28A745]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                WhatsApp Oficial de Mensajería
              </h3>

              <form onSubmit={handleSaveWhatsapp} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Número (código de país sin el +)</label>
                  <input
                    type="text"
                    required
                    value={bWhatsapp}
                    onChange={(e) => {
                      setBWhatsapp(e.target.value);
                      setWhatsappFeedback(null);
                    }}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono"
                    placeholder="Ej. 5493412345678"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#2B2B2B] border border-gray-800 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4 text-brand-success" />
                  Actualizar Celular
                </button>
              </form>

              {whatsappFeedback && (
                <p className="text-[11px] text-brand-success font-semibold mt-1">{whatsappFeedback}</p>
              )}
            </div>
          </div>

          {/* Backup operations section */}
          <div className="bg-brand-card border border-gray-850 rounded-2xl p-6 space-y-6">
            <div className="flex items-start gap-4 border-b border-gray-850 pb-4">
              <div className="p-3 bg-brand-success/10 border border-brand-success/25 text-brand-success rounded-xl shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-display font-black text-white">Respaldos & Copias de Seguridad de Base de Datos</h3>
                <p className="text-xs text-gray-400">Resguarda toda la información registrada en el sistema (Clientes, Vehículos, Historial de Lavados, Caja) o restáuralo en cualquier momento.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              
              {/* Export backup panel */}
              <div className="p-5 bg-brand-card-light border border-gray-850 rounded-xl space-y-4">
                <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-brand-success" />
                  Exportar Datos del Sistema (.json)
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  Descarga un archivo local conteniendo de manera íntegra y estructurada todas las colecciones de clientes, vehículos, reservas, catálogo y balances de caja guardados en este lavadero.
                </p>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="bg-brand-success hover:bg-green-700 text-white font-black text-xs py-3 px-5 rounded-xl transition flex items-center gap-2 uppercase tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  Descargar Copia Completa
                </button>
              </div>

              {/* Import backup panel */}
              <div className="p-5 bg-brand-card-light border border-gray-850 rounded-xl space-y-4">
                <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#FFC107]" />
                  Importar & Restaurar Base de Datos
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  Carga un archivo de respaldo previamente descargado para sobrescribir y sincronizar la base de datos de Firestore en la nube de manera automatizada.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupFileChange}
                      className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-card file:text-white hover:file:bg-gray-800"
                    />
                  </div>

                  {backupSummary && (
                    <div className="p-3 bg-[#FFC107]/5 border border-brand-warning/20 text-white rounded-xl space-y-3">
                      <p className="font-bold text-[#FFC107] flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Verificación Exitosa
                      </p>
                      <p className="text-[11px] text-gray-350">{backupSummary}</p>
                      
                      <button
                        type="button"
                        onClick={handleTriggerRestore}
                        disabled={isRestoring}
                        className="w-full bg-brand-red hover:bg-red-800 text-white font-black py-2.5 rounded-xl uppercase tracking-wider transition"
                      >
                        {isRestoring ? 'Cargando Lotes...' : 'Sincronizar Copia en la Nube'}
                      </button>
                    </div>
                  )}

                  {restoreFeedback && (
                    <p className={`p-2 rounded-lg font-semibold ${
                      restoreFeedback.includes('correctamente') || restoreFeedback.includes('éxito')
                        ? 'bg-brand-success/10 text-brand-success' 
                        : 'bg-brand-red/10 text-brand-red'
                    }`}>
                      {restoreFeedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern custom modal for catalog service deleting */}
      {serviceToDelete !== null && (
        <div id="confirm-delete-catalog-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp text-xs sm:text-sm">
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
