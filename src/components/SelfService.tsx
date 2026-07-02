/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseState, Reserva, Cliente, Vehiculo } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface SelfServiceProps {
  state: DatabaseState;
  onAddBooking: (
    clienteNombre: string,
    clienteTelefono: string,
    vehiculoMatricula: string,
    vehiculoMarca: string,
    vehiculoModelo: string,
    vehiculoColor: string,
    vehiculoAnio: number,
    fecha: string,
    hora: string,
    servicioSol: string,
    observaciones?: string
  ) => Reserva;
  onTriggerWhatsApp: (phone: string, text: string) => void;
  onExit: () => void;
  isPublicRoute?: boolean;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function SelfService({ 
  state, 
  onAddBooking, 
  onTriggerWhatsApp, 
  onExit,
  isPublicRoute = false
}: SelfServiceProps) {
  const [step, setStep] = useState<number>(1);
  const [successBooking, setSuccessBooking] = useState<Reserva | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [exitError, setExitError] = useState<string | null>(null);

  // STEP 1 Form: Owner
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  // STEP 2 Form: Vehicle
  const [matricula, setMatricula] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  // STEP 3 Form: Service & Slot
  const [servicioSol, setServicioSol] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Auto-default dynamic package choice when catalog loads or matches
  useEffect(() => {
    if (!servicioSol && state.serviciosCatalogo && state.serviciosCatalogo.length > 0) {
      setServicioSol(state.serviciosCatalogo[0].tipo);
    }
  }, [state.serviciosCatalogo, servicioSol]);

  // Look up existing customer/car when license plate is entered to auto-complete
  const handleMatriculaBlur = () => {
    const cleanPlate = matricula.toUpperCase().replace(/\s+/g, '');
    if (!cleanPlate) return;

    // Search matches
    const existingVeh = state.vehiculos.find(v => v.matricula.toUpperCase() === cleanPlate);
    if (existingVeh) {
      setMarca(existingVeh.marca);
      setModelo(existingVeh.modelo);
      setColor(existingVeh.color);
      setAnio(existingVeh.anio);

      // Also look up owner
      const owner = state.clientes.find(c => c.id === existingVeh.clienteId);
      if (owner) {
        if (!nombre) setNombre(owner.nombre);
        if (!telefono) setTelefono(owner.telefono);
      }
    }
  };

  // Check taken slots on selected date
  const getTakenSlotsForDate = (dateStr: string) => {
    return state.reservas
      .filter(r => r.fecha === dateStr && r.estado !== 'Cancelado')
      .map(r => r.hora);
  };

  const takenSlots = getTakenSlotsForDate(fecha);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmOrder = () => {
    if (!nombre.trim() || !telefono.trim() || !matricula.trim() || !fecha || !hora) {
      setErrorText('Por favor complete todos los datos necesarios.');
      return;
    }
    setErrorText(null);

    const created = onAddBooking(
      nombre.trim(),
      telefono.trim(),
      matricula.toUpperCase().replace(/\s+/g, ''),
      marca.trim() || 'Desconocida',
      modelo.trim() || 'S/D',
      color.trim() || 'S/D',
      Number(anio) || new Date().getFullYear(),
      fecha,
      hora,
      servicioSol,
      observaciones.trim() || undefined
    );

    setSuccessBooking(created);
    setStep(5);
  };

  const resetWizard = () => {
    setNombre('');
    setTelefono('');
    setMatricula('');
    setMarca('');
    setModelo('');
    setColor('');
    setAnio(new Date().getFullYear());
    setServicioSol('Lavado básico');
    setFecha(new Date().toISOString().split('T')[0]);
    setHora('');
    setObservaciones('');
    setSuccessBooking(null);
    setStep(1);
  };

  const sendTicketToCustomer = () => {
    if (!successBooking) return;
    const client = state.clientes.find(c => c.id === successBooking.clienteId);
    const textPhone = client ? client.whatsapp : telefono;
    
    const textMsg = `*LAVADERO RyN - MI RESERVA* 🚙🧼\n\n` +
      `¡Hola *${nombre}*! Registramos tu turno solicitado de forma online:\n\n` +
      `📅 *Fecha:* ${successBooking.fecha}\n` +
      `⏰ *Hora:* ${successBooking.hora} hs\n` +
      `🚗 *Vehículo:* ${marca} ${modelo} (${matricula.toUpperCase()})\n` +
      `✨ *Servicio:* ${successBooking.servicioSol}\n` +
      `📌 *Estado:* ${successBooking.estado}\n\n` +
      `Te esperamos en la sucursal. ¡Muchas gracias por elegirnos!`;

    onTriggerWhatsApp(textPhone, textMsg);
  };

  const sendTicketToBusiness = () => {
    if (!successBooking) return;
    const textPhone = state.businessWhatsapp || '5491123456789';
    
    const textMsg = `*NUEVO TURNO AUTOSERVICIO - LAVADERO RyN* 🚙🧼\n\n` +
      `Hola Lavadero RyN, he reservado un turno online:\n\n` +
      `👤 *Cliente:* ${nombre}\n` +
      `📱 *Celular:* ${telefono}\n` +
      `📅 *Fecha:* ${successBooking.fecha}\n` +
      `⏰ *Hora:* ${successBooking.hora} hs\n` +
      `🚗 *Vehículo:* ${marca} ${modelo} (${matricula.toUpperCase()})\n` +
      `✨ *Servicio:* ${successBooking.servicioSol}\n` +
      `📝 *Obs:* ${observaciones || 'S/D'}`;

    onTriggerWhatsApp(textPhone, textMsg);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-4 select-none pb-12">
      {/* Top Banner Branding */}
      <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 text-center space-y-2.5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-brand-red/10 text-brand-red text-[10px] font-bold py-1 px-4 rounded-bl-xl border-l border-b border-gray-850">
          MÓDULO AUTOSERVICIO
        </div>

        <img 
          src="/src/assets/images/lavadero_ryn_logo_1782222462483.jpg" 
          alt="Lavadero RyN Logo" 
          className="w-16 h-16 object-cover mx-auto rounded-2xl border border-brand-red/30 shadow-lg"
          referrerPolicy="no-referrer"
        />

        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-wide">SOLICITAR TURNO ONLINE</h2>
          <p className="text-xs text-gray-400">Ingresa tus datos y agenda tu lavado fácil en 4 simples pasos</p>
        </div>

        {/* Form Stepper circles */}
        {step <= 4 && (
          <div className="flex items-center justify-center gap-2 pt-2.5">
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div 
                  className={`w-7 h-7 rounded-full text-xs font-bold leading-none flex items-center justify-center transition-all ${
                    step === s 
                      ? 'bg-brand-red text-white ring-4 ring-red-900/45 scale-110' 
                      : step > s 
                        ? 'bg-brand-success text-white' 
                        : 'bg-brand-card-light text-gray-500 border border-gray-800'
                  }`}
                >
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 4 && <div className={`w-10 h-0.5 ${step > s ? 'bg-brand-success' : 'bg-gray-800'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Main wizard sheet */}
      <div className="p-6 bg-brand-card rounded-2xl border border-gray-800 shadow-xl min-h-[380px] flex flex-col justify-between">
        
        {/* STEP 1: CLIENT DETAILS */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 border-b border-gray-850 pb-2">
              <User className="w-5 h-5 text-brand-red" />
              Paso 1: Tus Datos de Contacto
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Número de Whatsapp / Celular *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +5491155443322 (con código de área)"
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-red"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
                <p className="text-[10px] text-gray-500">Es importante para poder enviarte avisos y el ticket de confirmación.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-855">
              <button
                type="submit"
                disabled={!nombre.trim() || !telefono.trim()}
                className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition"
              >
                Siguiente Paso
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VEHICLE DETAILS */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 border-b border-gray-855 pb-2">
              <Car className="w-5 h-5 text-brand-red" />
              Paso 2: Datos de tu Vehículo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Patente / Matrícula *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: AA123BC o KLO456"
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                  onBlur={handleMatriculaBlur}
                />
                <p className="text-[10px] text-gray-500">Si tu patente ya está en nuestro sistema, recuperaremos tus datos al salir de este campo.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Toyota, Ford..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Corolla, Hilux..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Color</label>
                <input
                  type="text"
                  placeholder="Ej: Rojo, Gris perlado..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Año</label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-855">
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <button
                type="submit"
                disabled={!matricula.trim() || !marca.trim() || !modelo.trim()}
                className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition"
              >
                Siguiente Paso
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SERVICE PACKAGE & APPOINTMENT SLOT */}
        {step === 3 && (
          <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 border-b border-gray-855 pb-2">
              <Calendar className="w-5 h-5 text-brand-red" />
              Paso 3: Elegir Paquete de Lavado y Turno
            </h3>

            <div className="space-y-4">
              {/* Service list selector radios */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Seleccione el Servicio:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {state.serviciosCatalogo.map(opt => (
                    <label 
                      key={opt.id} 
                      onClick={() => setServicioSol(opt.tipo)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        servicioSol === opt.tipo 
                          ? 'bg-brand-red/10 border-brand-red' 
                          : 'bg-brand-card-light border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-white capitalize">{opt.tipo}</span>
                        <span className="font-mono text-brand-success font-extrabold text-sm">${opt.precio.toLocaleString('es-AR')}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-xs">{opt.descripcion || 'Sin descripción adicional.'}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date & dynamic hour block selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Fecha deseada:</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={fecha}
                    onChange={(e) => { setFecha(e.target.value); setHora(''); }}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Hora deseada:</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-[110px] overflow-y-auto p-1.5 bg-brand-card-light rounded-xl border border-gray-800">
                    {TIME_SLOTS.map(slot => {
                      const isTaken = takenSlots.includes(slot);
                      const isSelected = hora === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isTaken}
                          onClick={() => setHora(slot)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition flex flex-col items-center justify-center ${
                            isTaken 
                              ? 'bg-brand-black text-gray-600 border border-transparent cursor-not-allowed opacity-30 line-through' 
                              : isSelected
                                ? 'bg-brand-red text-white border border-brand-red'
                                : 'bg-brand-card hover:bg-gray-750 text-gray-300 border border-gray-800'
                          }`}
                        >
                          <span>{slot}</span>
                          <span className="text-[7px] mt-0.5 leading-none block font-semibold">
                            {isTaken ? 'Ocupado' : 'Libre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest block">¿Alguna indicación particular? (Opcional)</label>
                <textarea
                  placeholder="Ej: Limpiar bien manijas, rayones mínimos, etc..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-2 text-xs text-white min-h-[50px] focus:outline-none"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-855">
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <button
                type="submit"
                disabled={!fecha || !hora}
                className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition animate-pulse"
              >
                Siguiente Paso
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: REVIEW & CONFIRMATION GAUGE */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 border-b border-gray-855 pb-2">
              <ShieldCheck className="w-5 h-5 text-brand-success" />
              Paso 4: Confirmar tu Turno de Lavado
            </h3>

            <div className="p-4 bg-brand-card-light rounded-xl border border-gray-800 divide-y divide-gray-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Cliente:</span>
                <span className="font-bold text-white text-sm">{nombre}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Celular:</span>
                <span className="font-mono text-white">{telefono}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Patente:</span>
                <span className="font-mono bg-white text-brand-black px-1.5 py-0.5 rounded font-black tracking-wide">{matricula.toUpperCase()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Vehículo:</span>
                <span className="font-semibold text-white capitalize">{marca} {modelo} ({color})</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Servicio Solicitado:</span>
                <span className="text-brand-warning font-extrabold capitalize">{servicioSol}</span>
              </div>
              <div className="py-2.5 flex justify-between bg-black/30 px-2 rounded-lg my-1.5 border border-dashed border-gray-800">
                <span className="text-gray-300 font-bold flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-brand-red shrink-0" />
                  Agenda Confirmada:
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} a las {hora} hs
                </span>
              </div>
            </div>

            {errorText && (
              <div className="p-3.5 bg-brand-red/10 border border-brand-red/40 text-brand-red rounded-xl flex items-center gap-2.5 text-[11px] text-left animate-shake">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span className="font-bold">{errorText}</span>
              </div>
            )}

            <div className="p-3 bg-brand-red/5 border border-brand-red/20 rounded-xl flex gap-2.5 text-[11px] text-gray-300 text-left">
              <Info className="w-4.5 h-4.5 text-brand-red shrink-0" />
              <p>
                Recomendamos asistir 5 minutos antes. Puedes cancelar o reprogramar tu cita contactando al lavadero RyN directamente
                {state.businessWhatsapp ? (
                  <>
                    {' '}vía WhatsApp al{' '}
                    <a
                      href={`https://wa.me/${state.businessWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-success hover:underline font-bold font-mono"
                    >
                      +{state.businessWhatsapp}
                    </a>.
                  </>
                ) : '.'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-855">
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                className="bg-brand-red hover:bg-red-800 text-white font-black text-xs px-7 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-red-950 transition-all scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                SOLICITAR TURNO AHORA
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: BOOKING SUCCESS TICKET */}
        {step === 5 && successBooking && (
          <div className="space-y-6 text-center py-4 animate-scaleUp">
            <div className="w-16 h-16 bg-brand-success/20 border border-brand-success/40 text-brand-success mx-auto rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-display font-extrabold text-white tracking-tight">¡TURNO AGENDADO EXITOSAMENTE!</h3>
              <p className="text-xs text-gray-400">Tu turno ha quedado guardado formalmente y garantizado en la agenda RyN</p>
            </div>

            {/* Simulated Printed Voucher ticket aesthetics */}
            <div className="p-5 max-w-sm mx-auto bg-[#1A1A1A] rounded-2xl border border-gray-800/80 shadow-2xl relative text-xs space-y-3.5 before:absolute before:inset-x-0 before:-top-2 before:h-4 before:bg-[radial-gradient(circle,transparent_8px,#1A1A1A_10px)] before:bg-[length:20px_20px] after:absolute after:inset-x-0 after:-bottom-2 after:h-4 after:bg-[radial-gradient(circle,transparent_8px,#1A1A1A_10px)] after:bg-[length:20px_20px] overflow-hidden">
              <div className="text-center border-b border-gray-850 pb-2.5">
                <span className="font-display font-black text-sm text-white tracking-widest uppercase">TICKET DE CONFIRMACIÓN</span>
                <p className="text-[9px] font-mono text-gray-500 mt-0.5">RESERVA ID: {successBooking.id}</p>
              </div>

              <div className="space-y-2 text-left">
                <p className="flex justify-between">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Titular:</span> 
                  <span className="font-bold text-white">{nombre}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Vehículo:</span> 
                  <span className="font-semibold text-white capitalize">{marca} {modelo}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Matrícula:</span> 
                  <span className="font-mono bg-white text-black px-1 rounded text-[10px] font-bold">{matricula.toUpperCase()}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Concepto:</span> 
                  <span className="text-brand-warning font-semibold capitalize">{servicioSol}</span>
                </p>
                <p className="flex justify-between pt-2 border-t border-gray-850">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Día Agendado:</span> 
                  <span className="font-bold text-white">{successBooking.fecha}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400 font-mono uppercase tracking-wider text-[9px]">Rango Horario:</span> 
                  <span className="font-bold text-brand-success font-mono text-[13px]">{successBooking.hora} hs</span>
                </p>
              </div>

              <div className="text-center pt-2.5 border-t border-gray-850 text-[9px] text-[#FFC107] font-mono leading-relaxed">
                🚨 Recuerda llegar 5 minutos antes con llave en mano 🚨
              </div>
            </div>

            {/* Quick outbound sharing action selectors */}
            <div className="max-w-md mx-auto flex flex-col gap-2.5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={sendTicketToBusiness}
                  className="bg-[#28A745] hover:bg-green-700 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/20 uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  Enviar al Lavadero
                </button>

                <button
                  onClick={sendTicketToCustomer}
                  className="bg-brand-card-light border border-gray-850 hover:bg-brand-card text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-brand-success shrink-0" />
                  Enviar a mi Celular
                </button>
              </div>

              <button
                type="button"
                onClick={resetWizard}
                className="bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
              >
                <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                Agendar Otro Turno
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Hidden backdoor logout panel to exit customer self-service mode for employees */}
      {!isPublicRoute && (
        <>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                setExitPassword('');
                setExitError(null);
                setShowExitModal(true);
              }}
              className="text-[10px] text-gray-600 hover:text-gray-400 underline transition duration-200 uppercase tracking-widest font-mono py-1.5 px-3 rounded-full hover:bg-brand-card-light"
            >
              &bull; Salir del Modo Autoservicio &bull;
            </button>
          </div>

          {/* Dynamic secure administration exit dialog */}
          {showExitModal && (
            <div id="self-service-exit-modal" className="fixed inset-0 z-55 bg-black/90 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp text-left">
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-black text-white">Panel de Seguridad</h3>
                  <p className="text-xs text-gray-400">
                    Ingrese la clave de administrador para salir del modo de autoservicio y regresar al panel de gestión principal:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Clave de Seguridad (Pista: ryn123)</label>
                    <input
                      type="password"
                      value={exitPassword}
                      onChange={(e) => {
                        setExitPassword(e.target.value);
                        setExitError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const correctPassword = state.adminPassword || 'ryn123';
                          if (exitPassword === correctPassword) {
                            onExit();
                            setShowExitModal(false);
                          } else {
                            setExitError('Clave incorrecta. Modo Autoservicio permanece activo.');
                          }
                        }
                      }}
                      className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-red"
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>

                  {exitError && (
                    <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs rounded-xl font-semibold">
                      {exitError}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const correctPassword = state.adminPassword || 'ryn123';
                      if (exitPassword === correctPassword) {
                        onExit();
                        setShowExitModal(false);
                      } else {
                        setExitError('Clave incorrecta. Modo Autoservicio permanece activo.');
                      }
                    }}
                    className="flex-1 bg-brand-red hover:bg-red-800 text-white font-black text-xs py-3 rounded-xl transition"
                  >
                    Ingresar Panel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
