/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DatabaseState, Reserva, Cliente, Vehiculo, ReservaEstado, ServicioRealizado } from '../types';
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
  MessageSquare,
  Search,
  Lock,
  Tag,
  DollarSign,
  Share2,
  Copy,
  ExternalLink,
  History,
  Phone,
  MapPin,
  RefreshCw,
  LogOut
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
  ) => Promise<Reserva>;
  onTriggerWhatsApp: (phone: string, text: string) => void;
  onExit: () => void;
  isPublicRoute?: boolean;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Helper to normalize phone numbers for matching (removes symbols, spaces, prefixes)
function normalizePhone(val: string): string {
  return (val || '').replace(/[^0-9]/g, '');
}

// Helper to extract query parameters from either window.location.search or window.location.hash
function getUrlParameter(key: string): string | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get(key);
    if (fromSearch) return fromSearch;

    const hash = window.location.hash;
    if (hash.includes('?')) {
      const hashQuery = hash.substring(hash.indexOf('?') + 1);
      const hashParams = new URLSearchParams(hashQuery);
      const fromHash = hashParams.get(key);
      if (fromHash) return fromHash;
    }
  } catch (e) {
    console.warn('Error reading URL param:', e);
  }
  return null;
}

export default function SelfService({ 
  state, 
  onAddBooking, 
  onTriggerWhatsApp, 
  onExit,
  isPublicRoute = false
}: SelfServiceProps) {
  // Top-level portal views: 'turnos' (wizard) | 'consulta' (my vehicles/turns) | 'catalogo' (prices)
  const [activePortalTab, setActivePortalTab] = useState<'turnos' | 'consulta' | 'catalogo'>('turnos');

  // Customer verification and identified session state (Privacy Protection)
  const [identifiedClient, setIdentifiedClient] = useState<Cliente | null>(null);
  const [identifiedPhone, setIdentifiedPhone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // WIZARD STATE (Step 1..5)
  const [step, setStep] = useState<number>(1);
  const [successBooking, setSuccessBooking] = useState<Reserva | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hidden backdoor modal for employees on shared device
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
  const [quiereRetiro, setQuiereRetiro] = useState(false);
  const [direccionRetiro, setDireccionRetiro] = useState('');

  // Auto-default dynamic package choice when catalog loads
  useEffect(() => {
    if (!servicioSol && state.serviciosCatalogo && state.serviciosCatalogo.length > 0) {
      setServicioSol(state.serviciosCatalogo[0].tipo);
    }
  }, [state.serviciosCatalogo, servicioSol]);

  // Read URL parameters on mount to automatically identify the customer securely
  useEffect(() => {
    const paramPhone = getUrlParameter('phone') || getUrlParameter('telefono') || getUrlParameter('tel');
    const paramToken = getUrlParameter('token') || getUrlParameter('t');
    const paramReserva = getUrlParameter('reserva') || getUrlParameter('id');
    const paramPlate = getUrlParameter('matricula') || getUrlParameter('patente');
    const paramTab = getUrlParameter('tab');

    if (paramTab === 'consulta' || paramTab === 'misturnos') {
      setActivePortalTab('consulta');
    } else if (paramTab === 'catalogo' || paramTab === 'precios') {
      setActivePortalTab('catalogo');
    }

    // Try finding client by token, phone or reservation
    if (paramPhone || paramToken || paramReserva || paramPlate) {
      let matchedClient: Cliente | undefined;

      if (paramToken) {
        matchedClient = state.clientes.find(c => c.id === paramToken || c.telefono === paramToken);
      }
      if (!matchedClient && paramPhone) {
        const cleanP = normalizePhone(paramPhone);
        matchedClient = state.clientes.find(c => {
          const normTel = normalizePhone(c.telefono);
          const normWpp = normalizePhone(c.whatsapp);
          return (normTel && (normTel.includes(cleanP) || cleanP.includes(normTel))) ||
                 (normWpp && (normWpp.includes(cleanP) || cleanP.includes(normWpp)));
        });
      }
      if (!matchedClient && paramReserva) {
        const res = state.reservas.find(r => r.id === paramReserva);
        if (res) {
          matchedClient = state.clientes.find(c => c.id === res.clienteId);
        }
      }
      if (!matchedClient && paramPlate) {
        const cleanPlate = paramPlate.toUpperCase().replace(/\s+/g, '');
        const veh = state.vehiculos.find(v => v.matricula.toUpperCase() === cleanPlate);
        if (veh) {
          matchedClient = state.clientes.find(c => c.id === veh.clienteId);
        }
      }

      if (matchedClient) {
        setIdentifiedClient(matchedClient);
        setIdentifiedPhone(matchedClient.telefono);
        setNombre(matchedClient.nombre);
        setTelefono(matchedClient.telefono);
        setActivePortalTab('consulta');
      } else if (paramPhone) {
        setSearchQuery(paramPhone);
        setActivePortalTab('consulta');
      } else if (paramPlate) {
        setSearchQuery(paramPlate);
        setActivePortalTab('consulta');
      }
    }
  }, [state.clientes, state.reservas, state.vehiculos]);

  // Customer verification search handler (Privacy Shield)
  const handlePerformClientSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('Por favor ingrese su número de teléfono o la patente de su auto.');
      return;
    }
    setSearchError(null);
    setHasSearched(true);

    const normQuery = normalizePhone(query);
    const upperQuery = query.toUpperCase().replace(/\s+/g, '');

    // 1. Search by phone / WhatsApp
    let matchedClient = state.clientes.find(c => {
      const normTel = normalizePhone(c.telefono);
      const normWpp = normalizePhone(c.whatsapp);
      return (normTel.length >= 6 && normQuery.length >= 6 && (normTel.includes(normQuery) || normQuery.includes(normTel))) ||
             (normWpp.length >= 6 && normQuery.length >= 6 && (normWpp.includes(normQuery) || normQuery.includes(normWpp)));
    });

    // 2. Search by plate
    if (!matchedClient) {
      const matchingVeh = state.vehiculos.find(v => v.matricula.toUpperCase() === upperQuery);
      if (matchingVeh) {
        matchedClient = state.clientes.find(c => c.id === matchingVeh.clienteId);
      }
    }

    // 3. Search by reservation ID
    if (!matchedClient) {
      const matchingRes = state.reservas.find(r => r.id.toLowerCase() === query.toLowerCase());
      if (matchingRes) {
        matchedClient = state.clientes.find(c => c.id === matchingRes.clienteId);
      }
    }

    if (matchedClient) {
      setIdentifiedClient(matchedClient);
      setIdentifiedPhone(matchedClient.telefono);
      setNombre(matchedClient.nombre);
      setTelefono(matchedClient.telefono);
      setSearchError(null);
    } else {
      setIdentifiedClient(null);
      setSearchError('No encontramos registros con este teléfono o patente. Podés agendar tu turno online en 4 pasos.');
    }
  };

  // Pre-fill vehicle in wizard when license plate is entered
  // PRIVACY: Only autofills technical car specs (make/model/color/year), NEVER exposes other owners' private phone/name
  const handleMatriculaBlur = () => {
    const cleanPlate = matricula.toUpperCase().replace(/\s+/g, '');
    if (!cleanPlate) return;

    const existingVeh = state.vehiculos.find(v => v.matricula.toUpperCase() === cleanPlate);
    if (existingVeh) {
      if (!marca) setMarca(existingVeh.marca);
      if (!modelo) setModelo(existingVeh.modelo);
      if (!color) setColor(existingVeh.color);
      if (!anio) setAnio(existingVeh.anio);
    }
  };

  // Check taken slots on selected date
  const takenSlots = useMemo(() => {
    return state.reservas
      .filter(r => r.fecha === fecha && r.estado !== 'Cancelado')
      .map(r => r.hora);
  }, [state.reservas, fecha]);

  // Identified customer's related entities
  const clientVehiculos = useMemo(() => {
    if (!identifiedClient) return [];
    return state.vehiculos.filter(v => v.clienteId === identifiedClient.id);
  }, [state.vehiculos, identifiedClient]);

  const clientReservas = useMemo(() => {
    if (!identifiedClient) return [];
    return state.reservas
      .filter(r => r.clienteId === identifiedClient.id)
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  }, [state.reservas, identifiedClient]);

  const clientServicios = useMemo(() => {
    if (!identifiedClient) return [];
    return state.servicios
      .filter(s => s.clienteId === identifiedClient.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [state.servicios, identifiedClient]);

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

  const handleSelectCarForBooking = (veh: Vehiculo) => {
    setMatricula(veh.matricula);
    setMarca(veh.marca);
    setModelo(veh.modelo);
    setColor(veh.color);
    setAnio(veh.anio);
    setActivePortalTab('turnos');
    setStep(3); // jump directly to service & date selection!
  };

  const handleSelectServiceFromCatalog = (serviceTipo: string) => {
    setServicioSol(serviceTipo);
    setActivePortalTab('turnos');
    if (!nombre || !telefono) {
      setStep(1);
    } else if (!matricula) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleConfirmOrder = async () => {
    if (!nombre.trim() || !telefono.trim() || !matricula.trim() || !fecha || !hora) {
      setErrorText('Por favor complete todos los datos necesarios.');
      return;
    }
    if (quiereRetiro && !direccionRetiro.trim()) {
      setErrorText('Por favor ingrese la dirección para el retiro a domicilio.');
      return;
    }
    setErrorText(null);
    setIsSubmitting(true);

    try {
      let finalObservaciones = observaciones.trim();
      if (quiereRetiro) {
        const retiroInfo = `🏠 RETIRO EN DOMICILIO SOLICITADO\n📍 Dirección: ${direccionRetiro.trim()}`;
        finalObservaciones = finalObservaciones 
          ? `${retiroInfo}\n📝 Obs: ${finalObservaciones}`
          : retiroInfo;
      }

      const created = await onAddBooking(
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
        finalObservaciones || undefined
      );

      setSuccessBooking(created);
      
      // Auto-identify client in session so they can inspect their turn immediately
      const matched = state.clientes.find(c => c.id === created.clienteId);
      if (matched) {
        setIdentifiedClient(matched);
        setIdentifiedPhone(matched.telefono);
      }

      setStep(5);
    } catch (err) {
      console.error('Error reserving turn: ', err);
      setErrorText('Hubo un inconveniente al agendar el turno. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    if (!identifiedClient) {
      setNombre('');
      setTelefono('');
    }
    setMatricula('');
    setMarca('');
    setModelo('');
    setColor('');
    setAnio(new Date().getFullYear());
    setFecha(new Date().toISOString().split('T')[0]);
    setHora('');
    setObservaciones('');
    setQuiereRetiro(false);
    setDireccionRetiro('');
    setSuccessBooking(null);
    setStep(1);
  };

  const personalTrackingLink = useMemo(() => {
    const origin = window.location.origin;
    if (identifiedClient) {
      return `${origin}/#/autoservicio?phone=${encodeURIComponent(identifiedClient.telefono)}&token=${encodeURIComponent(identifiedClient.id)}`;
    }
    if (successBooking) {
      return `${origin}/#/autoservicio?reserva=${encodeURIComponent(successBooking.id)}&phone=${encodeURIComponent(telefono)}`;
    }
    return `${origin}/#/autoservicio`;
  }, [identifiedClient, successBooking, telefono]);

  const sendTicketToCustomer = () => {
    if (!successBooking) return;
    const client = state.clientes.find(c => c.id === successBooking.clienteId);
    const textPhone = client ? client.whatsapp : telefono;
    
    let retiroMsg = '';
    if (quiereRetiro) {
      retiroMsg = `🏠 *Retiro a Domicilio:* SÍ\n📍 *Dirección:* ${direccionRetiro.trim()}\n`;
    }

    const textMsg = `*LAVADERO RyN - MI RESERVA* 🚙🧼\n\n` +
      `¡Hola *${nombre}*! Registramos tu turno solicitado de forma online:\n\n` +
      `📅 *Fecha:* ${successBooking.fecha}\n` +
      `⏰ *Hora:* ${successBooking.hora} hs\n` +
      `🚗 *Vehículo:* ${marca} ${modelo} (${matricula.toUpperCase()})\n` +
      `✨ *Servicio:* ${successBooking.servicioSol}\n` +
      retiroMsg +
      `📌 *Estado:* ${successBooking.estado}\n\n` +
      `🔗 *Seguimiento de tu turno en tiempo real:*\n${personalTrackingLink}\n\n` +
      (quiereRetiro 
        ? `Iremos a buscar tu vehículo en el domicilio y horario acordados. ¡Muchas gracias por elegirnos!` 
        : `Te esperamos en la sucursal. ¡Muchas gracias por elegirnos!`);

    onTriggerWhatsApp(textPhone, textMsg);
  };

  const sendTicketToBusiness = () => {
    if (!successBooking) return;
    const textPhone = state.businessWhatsapp || '5491123456789';
    
    let retiroMsg = '';
    if (quiereRetiro) {
      retiroMsg = `🏠 *Retiro a Domicilio:* SÍ\n📍 *Dirección:* ${direccionRetiro.trim()}\n`;
    }

    const textMsg = `*NUEVO TURNO AUTOSERVICIO - LAVADERO RyN* 🚙🧼\n\n` +
      `Hola Lavadero RyN, he reservado un turno online:\n\n` +
      `👤 *Cliente:* ${nombre}\n` +
      `📱 *Celular:* ${telefono}\n` +
      `📅 *Fecha:* ${successBooking.fecha}\n` +
      `⏰ *Hora:* ${successBooking.hora} hs\n` +
      `🚗 *Vehículo:* ${marca} ${modelo} (${matricula.toUpperCase()})\n` +
      `✨ *Servicio:* ${successBooking.servicioSol}\n` +
      retiroMsg +
      `📝 *Obs:* ${observaciones || 'S/D'}\n\n` +
      `🔗 Link seguimiento cliente: ${personalTrackingLink}`;

    onTriggerWhatsApp(textPhone, textMsg);
  };

  const getStatusBadge = (estado: ReservaEstado) => {
    switch (estado) {
      case 'Reservado':
        return { label: 'Reservado', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Turno confirmado. Te esperamos el día pactado.' };
      case 'Recibido':
        return { label: 'Vehículo Recibido', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'El vehículo ya está en el predio del lavadero.' };
      case 'Lavando':
        return { label: 'En Lavado Activo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse', desc: 'Tu auto está siendo lavado en este momento.' };
      case 'Secando':
        return { label: 'Secado y Detalles', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Aspirado, secado y terminación estética.' };
      case 'Finalizado':
        return { label: '¡Listo para Retirar!', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm font-black', desc: 'El trabajo está completado. Podés venir a retirarlo.' };
      case 'Entregado':
        return { label: 'Entregado', color: 'bg-gray-800 text-gray-400 border-gray-700', desc: 'Vehículo entregado al cliente.' };
      case 'Cancelado':
        return { label: 'Cancelado', color: 'bg-red-500/15 text-red-400 border-red-500/30', desc: 'Turno cancelado.' };
      default:
        return { label: estado, color: 'bg-gray-800 text-gray-300 border-gray-700', desc: '' };
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(personalTrackingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 my-4 select-none pb-16 font-sans">
      
      {/* TOP HEADER: BRANDING & ROLE SEPARATION */}
      <header className="p-5 sm:p-6 bg-brand-card rounded-3xl border border-white/[0.06] shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
          <img 
            src={state.logoUrl || "/src/assets/images/lavadero_ryn_logo_1782222462483.jpg"} 
            alt="Lavadero RyN Logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-brand-red/30 shadow-lg shadow-black/50"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-black tracking-wider flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                PORTAL CLIENTES
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {state.horarios || 'Lun a Sáb 08:00 - 20:00'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-wide">
              {state.nombreNegocio || 'LAVADERO RyN'}
            </h1>
            <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span>{state.direccionNegocio || 'Av. San Martín 1500'}</span>
            </p>
          </div>
        </div>

        {/* Quick action buttons for the customer / employee exit */}
        <div className="flex flex-col sm:items-end gap-2.5 z-10 w-full sm:w-auto">
          {state.businessWhatsapp && (
            <a
              href={`https://wa.me/${state.businessWhatsapp}?text=${encodeURIComponent('Hola Lavadero RyN, tengo una consulta sobre sus servicios.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Lavadero</span>
            </a>
          )}

          {/* Switch to Employee/Admin Login */}
          <button
            type="button"
            onClick={onExit}
            className="text-[11px] text-gray-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.04] px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Ingreso protegido para administradores y empleados"
          >
            <Lock className="w-3 h-3 text-brand-red" />
            <span>Acceso Personal / Admin</span>
          </button>
        </div>
      </header>

      {/* PORTAL NAVIGATION TABS: SACAR TURNO | MIS TURNOS Y VEHICULOS | PRECIOS */}
      <nav className="grid grid-cols-3 bg-[#111118] p-1.5 rounded-2xl border border-white/[0.06] shadow-xl">
        <button
          type="button"
          onClick={() => setActivePortalTab('turnos')}
          className={`py-3 px-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'turnos'
              ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Sacar Turno Online</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePortalTab('consulta')}
          className={`py-3 px-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'consulta'
              ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Car className="w-4 h-4 shrink-0" />
          <span>Mis Turnos y Autos</span>
          {identifiedClient && clientReservas.length > 0 && (
            <span className="hidden sm:inline bg-emerald-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none">
              {clientReservas.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActivePortalTab('catalogo')}
          className={`py-3 px-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'catalogo'
              ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Tag className="w-4 h-4 shrink-0" />
          <span>Precios y Servicios</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: WIZARD DE RESERVA ONLINE (4 PASOS + VOUCHER)
          ========================================================================= */}
      {activePortalTab === 'turnos' && (
        <section className="space-y-6">
          {/* Stepper Header */}
          <div className="p-5 bg-brand-card rounded-2xl border border-white/[0.04] text-center space-y-3 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-display font-black text-white">RESERVAR TURNO DE LAVADO</h2>
            <p className="text-xs text-gray-400">Completá tus datos en 4 simples pasos para agendar tu horario</p>

            {step <= 4 && (
              <div className="flex items-center justify-center gap-2 pt-1 max-w-sm mx-auto">
                {[1, 2, 3, 4].map(s => (
                  <React.Fragment key={s}>
                    <div 
                      className={`w-7 h-7 rounded-full text-xs font-bold leading-none flex items-center justify-center transition-all ${
                        step === s 
                          ? 'bg-brand-red text-white ring-4 ring-brand-red/30 scale-110 font-black' 
                          : step > s 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#181822] text-gray-500 border border-white/[0.06]'
                      }`}
                    >
                      {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                    {s < 4 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-gray-800'}`}></div>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Main Wizard Form Card */}
          <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-2xl min-h-[420px] flex flex-col justify-between">
            
            {/* STEP 1: CONTACT DETAILS */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-red" />
                    Paso 1: Tus Datos de Contacto
                  </h3>
                  {identifiedClient && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cliente Identificado
                    </span>
                  )}
                </div>

                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Tu Nombre y Apellido *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Número de WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 1155443322 (con código de área)"
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-red"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                    <p className="text-[11px] text-gray-400">
                      Te enviaremos la confirmación directa y avisos de cuando tu vehículo esté listo.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.06]">
                  <button
                    type="submit"
                    disabled={!nombre.trim() || !telefono.trim()}
                    className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <span>Siguiente Paso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VEHICLE DETAILS */}
            {step === 2 && (
              <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                    <Car className="w-5 h-5 text-brand-red" />
                    Paso 2: Datos de tu Vehículo
                  </h3>
                  {clientVehiculos.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      O elegí uno de tus autos guardados
                    </span>
                  )}
                </div>

                {/* Quick selection if client has registered cars */}
                {clientVehiculos.length > 0 && (
                  <div className="p-3 bg-[#181822]/60 rounded-2xl border border-white/[0.04] space-y-2">
                    <p className="text-[10px] font-mono uppercase text-gray-400 font-bold">Tus autos registrados:</p>
                    <div className="flex flex-wrap gap-2">
                      {clientVehiculos.map(v => (
                        <button
                          key={v.matricula}
                          type="button"
                          onClick={() => {
                            setMatricula(v.matricula);
                            setMarca(v.marca);
                            setModelo(v.modelo);
                            setColor(v.color);
                            setAnio(v.anio);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer ${
                            matricula.toUpperCase() === v.matricula.toUpperCase()
                              ? 'bg-brand-red text-white border-brand-red shadow-md'
                              : 'bg-[#181822] text-gray-300 border-white/[0.08] hover:border-white/[0.2]'
                          }`}
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>{v.matricula} ({v.marca} {v.modelo})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Patente / Matrícula del Auto *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ej: AA123BC o KLO456"
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                      onBlur={handleMatriculaBlur}
                    />
                    <p className="text-[10px] text-gray-400">Si tu auto ya vino anteriormente, recuperamos sus especificaciones técnicas de forma automática.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Toyota, Ford, Volkswagen..."
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Hilux, Gol, Fiesta..."
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Color</label>
                    <input
                      type="text"
                      placeholder="Ej: Gris plata, Blanco, Negro..."
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Año Aprox.</label>
                    <input
                      type="number"
                      min="1960"
                      max={new Date().getFullYear() + 1}
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                      value={anio}
                      onChange={(e) => setAnio(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-[#242430] hover:bg-white/[0.06] text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!matricula.trim() || !marca.trim() || !modelo.trim()}
                    className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <span>Siguiente Paso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SERVICE PACKAGE & APPOINTMENT SLOT */}
            {step === 3 && (
              <form onSubmit={handleNextStep} className="space-y-5 animate-fadeIn">
                <h3 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                  <Calendar className="w-5 h-5 text-brand-red" />
                  Paso 3: Elegir Servicio y Horario
                </h3>

                <div className="space-y-4">
                  {/* Service list selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Seleccioná el tipo de lavado:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {state.serviciosCatalogo.map(opt => (
                        <div 
                          key={opt.id} 
                          onClick={() => setServicioSol(opt.tipo)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                            servicioSol === opt.tipo 
                              ? 'bg-brand-red/15 border-brand-red shadow-md' 
                              : 'bg-[#181822] border-white/[0.06] hover:border-white/[0.15]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-sm text-white capitalize">{opt.tipo}</span>
                            <span className="font-mono text-emerald-400 font-extrabold text-sm whitespace-nowrap">
                              ${opt.precio.toLocaleString('es-AR')}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">{opt.descripcion || 'Servicio especializado.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date & dynamic hour block selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Día de la Cita *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={fecha}
                        onChange={(e) => { setFecha(e.target.value); setHora(''); }}
                        className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Horarios Disponibles *</label>
                      <div className="grid grid-cols-4 gap-1.5 max-h-[120px] overflow-y-auto p-1.5 bg-[#181822] rounded-xl border border-white/[0.06]">
                        {TIME_SLOTS.map(slot => {
                          const isTaken = takenSlots.includes(slot);
                          const isSelected = hora === slot;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isTaken}
                              onClick={() => setHora(slot)}
                              className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                                isTaken 
                                  ? 'bg-black/40 text-gray-600 border border-transparent cursor-not-allowed opacity-30 line-through' 
                                  : isSelected
                                    ? 'bg-brand-red text-white border border-brand-red'
                                    : 'bg-[#111118] hover:bg-white/[0.06] text-gray-300 border border-white/[0.04]'
                              }`}
                            >
                              <span>{slot}</span>
                              <span className="text-[8px] mt-0.5 leading-none block font-semibold">
                                {isTaken ? 'Ocupado' : 'Libre'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RETIRO A DOMICILIO OPTION */}
                  <div className="p-4 bg-[#181822]/80 border border-white/[0.06] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">🏠 ¿Querés retiro en domicilio?</span>
                        <span className="text-[11px] text-gray-400 block">Buscamos y devolvemos tu vehículo puerta a puerta</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={quiereRetiro} 
                          onChange={(e) => {
                            setQuiereRetiro(e.target.checked);
                            if (!e.target.checked) setDireccionRetiro('');
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {quiereRetiro && (
                      <div className="space-y-1.5 pt-1 animate-fadeIn">
                        <label className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Dirección de Retiro * (Calle, número, departamento, timbre...)</label>
                        <input
                          type="text"
                          required={quiereRetiro}
                          placeholder="Ej: Av. San Martín 1550, Timbre 2"
                          className="w-full bg-[#111118] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                          value={direccionRetiro}
                          onChange={(e) => setDireccionRetiro(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Optional notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Observaciones / Indicaciones Especiales</label>
                    <textarea
                      placeholder="Ej: Cuidado con llantas, aspirar bien baúl..."
                      className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-2 text-xs text-white min-h-[55px] focus:outline-none"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-[#242430] hover:bg-white/[0.06] text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!fecha || !hora}
                    className="bg-brand-red disabled:opacity-40 hover:bg-red-800 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <span>Revisar y Confirmar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: REVIEW & CONFIRMATION */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Paso 4: Confirmar Turno
                </h3>

                <div className="p-5 bg-[#181822] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05] text-xs space-y-1">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Titular:</span>
                    <span className="font-bold text-white text-sm">{nombre}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Teléfono:</span>
                    <span className="font-mono text-white">{telefono}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Patente:</span>
                    <span className="font-mono bg-white text-black px-2 py-0.5 rounded font-black tracking-wide">{matricula.toUpperCase()}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Vehículo:</span>
                    <span className="font-semibold text-white capitalize">{marca} {modelo} ({color})</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Servicio Solicitado:</span>
                    <span className="text-amber-400 font-extrabold capitalize">{servicioSol}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 uppercase font-mono tracking-widest text-[10px]">Retiro a Domicilio:</span>
                    <span className={`font-bold ${quiereRetiro ? 'text-brand-red' : 'text-gray-400'}`}>
                      {quiereRetiro ? `SÍ (${direccionRetiro})` : 'NO (asiste el cliente)'}
                    </span>
                  </div>
                  <div className="py-3 flex justify-between bg-black/40 px-3 rounded-xl my-2 border border-white/[0.08]">
                    <span className="text-gray-300 font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-red shrink-0" />
                      Fecha y Hora:
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {fecha} a las {hora} hs
                    </span>
                  </div>
                </div>

                {errorText && (
                  <div className="p-3.5 bg-red-500/15 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2.5 text-xs text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorText}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-[#242430] hover:bg-white/[0.06] text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Modificar</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmOrder}
                    className="bg-brand-red disabled:opacity-50 hover:bg-red-800 text-white font-black text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-xl shadow-brand-red/30 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    )}
                    <span>{isSubmitting ? 'CONFIRMANDO...' : 'CONFIRMAR Y AGENDAR TURNO'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESS VOUCHER TICKET */}
            {step === 5 && successBooking && (
              <div className="space-y-6 text-center py-4 animate-scaleUp">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-black text-white">¡TURNO AGENDADO EXITOSAMENTE!</h3>
                  <p className="text-xs text-gray-400">Tu turno está agendado y registrado formalmente en Lavadero RyN.</p>
                </div>

                {/* Simulated Voucher Ticket */}
                <div className="p-5 max-w-sm mx-auto bg-[#14141E] rounded-3xl border border-white/[0.08] shadow-2xl relative text-xs space-y-3 text-left">
                  <div className="text-center border-b border-white/[0.06] pb-2.5">
                    <span className="font-display font-black text-sm text-white tracking-widest uppercase">COMPROBANTE DE TURNO</span>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">CÓDIGO: {successBooking.id}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Cliente:</span> 
                      <span className="font-bold text-white">{nombre}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Patente:</span> 
                      <span className="font-mono bg-white text-black px-1.5 py-0.2 rounded font-black">{matricula.toUpperCase()}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Auto:</span> 
                      <span className="font-semibold text-white capitalize">{marca} {modelo}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Servicio:</span> 
                      <span className="text-amber-400 font-bold capitalize">{servicioSol}</span>
                    </p>
                    <p className="flex justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-gray-400">Día y Hora:</span> 
                      <span className="font-bold text-emerald-400 font-mono">{successBooking.fecha} - {successBooking.hora} hs</span>
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="max-w-md mx-auto flex flex-col gap-2.5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={sendTicketToBusiness}
                      className="bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Notificar al Lavadero</span>
                    </button>

                    <button
                      type="button"
                      onClick={sendTicketToCustomer}
                      className="bg-[#181822] border border-white/[0.08] hover:bg-white/[0.04] text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Guardar en mi WhatsApp</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePortalTab('consulta')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Car className="w-4 h-4 shrink-0" />
                    <span>Ver Mis Turnos y Vehículos en Tiempo Real</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetWizard}
                    className="text-gray-400 hover:text-white text-xs py-2 transition cursor-pointer"
                  >
                    Agendar otro turno
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 2: CONSULTA DE MIS TURNOS, VEHÍCULOS Y SERVICIOS (REQUISITOS 4 Y 5)
          ========================================================================= */}
      {activePortalTab === 'consulta' && (
        <section className="space-y-6">
          {/* Identified session banner OR phone search form */}
          {identifiedClient ? (
            <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-brand-card border border-emerald-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg font-black shrink-0">
                  {identifiedClient.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h3 className="text-lg font-display font-black text-white">
                      Hola, {identifiedClient.nombre}
                    </h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      Acceso Seguro
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono mt-0.5">
                    Teléfono: {identifiedClient.telefono} &bull; {clientVehiculos.length} {clientVehiculos.length === 1 ? 'vehículo registrado' : 'vehículos registrados'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-[#181822] hover:bg-white/[0.04] border border-white/[0.08] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Copiar enlace para ingresar directamente en el futuro"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar mi Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifiedClient(null);
                    setIdentifiedPhone('');
                    setSearchQuery('');
                  }}
                  className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                  title="Consultar con otro número de teléfono"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.06] shadow-xl text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-black text-white">Consultá el Estado de tu Vehículo</h3>
                <p className="text-xs text-gray-400">
                  Ingresá tu número de teléfono celular o la patente de tu auto para ver tus turnos activos, tus vehículos e historial:
                </p>
              </div>

              <form onSubmit={handlePerformClientSearch} className="space-y-3 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej: 1155443322 o AA123BC"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#181822] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-red text-center font-bold"
                  />
                </div>

                {searchError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl text-left flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-brand-red hover:bg-red-800 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>CONSULTAR MIS TURNOS Y AUTOS</span>
                </button>

                <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Protección de privacidad: sólo se mostrarán datos asociados a tu número o patente.</span>
                </p>
              </form>
            </div>
          )}

          {/* If customer is identified, show their real-time reservations, vehicles, and services */}
          {identifiedClient && (
            <div className="space-y-6">
              
              {/* 1. SECCIÓN TURNOS ACTIVOS Y HISTORIAL */}
              <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-red" />
                    <h3 className="text-lg font-display font-black text-white">Tus Turnos y Estado en Vivo</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetWizard();
                      setActivePortalTab('turnos');
                    }}
                    className="bg-brand-red hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Nuevo Turno</span>
                  </button>
                </div>

                {clientReservas.length === 0 ? (
                  <div className="p-8 text-center space-y-3 bg-[#181822]/40 rounded-2xl border border-white/[0.04]">
                    <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
                    <p className="text-xs text-gray-400">No tenés turnos programados en este momento.</p>
                    <button
                      type="button"
                      onClick={() => {
                        resetWizard();
                        setActivePortalTab('turnos');
                      }}
                      className="bg-brand-red hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Sacar Turno Ahora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientReservas.map(res => {
                      const badge = getStatusBadge(res.estado);
                      return (
                        <div 
                          key={res.id}
                          className="p-4 sm:p-5 bg-[#181822] rounded-2xl border border-white/[0.06] space-y-3 hover:border-white/[0.12] transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono bg-white text-black px-2 py-0.5 rounded-md font-black text-xs tracking-wider">
                                {res.vehiculoMatricula}
                              </span>
                              <span className="font-display font-bold text-white text-sm">
                                {res.servicioSol}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-3 py-1 rounded-full border font-bold ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          {/* Progress Stepper for Lavadero pipeline */}
                          {res.estado !== 'Cancelado' && (
                            <div className="pt-2">
                              <div className="grid grid-cols-5 text-center text-[10px] font-mono text-gray-500 uppercase font-bold gap-1">
                                <span className={['Reservado', 'Recibido', 'Lavando', 'Secando', 'Finalizado', 'Entregado'].includes(res.estado) ? 'text-emerald-400 font-black' : ''}>
                                  1. Reservado
                                </span>
                                <span className={['Recibido', 'Lavando', 'Secando', 'Finalizado', 'Entregado'].includes(res.estado) ? 'text-emerald-400 font-black' : ''}>
                                  2. Recibido
                                </span>
                                <span className={['Lavando', 'Secando', 'Finalizado', 'Entregado'].includes(res.estado) ? 'text-amber-400 font-black' : ''}>
                                  3. Lavando
                                </span>
                                <span className={['Secando', 'Finalizado', 'Entregado'].includes(res.estado) ? 'text-cyan-400 font-black' : ''}>
                                  4. Secando
                                </span>
                                <span className={['Finalizado', 'Entregado'].includes(res.estado) ? 'text-emerald-400 font-black' : ''}>
                                  5. ¡Listo!
                                </span>
                              </div>
                              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1 flex">
                                <div className={`h-full ${
                                  res.estado === 'Reservado' ? 'w-1/5 bg-blue-500' :
                                  res.estado === 'Recibido' ? 'w-2/5 bg-purple-500' :
                                  res.estado === 'Lavando' ? 'w-3/5 bg-amber-500' :
                                  res.estado === 'Secando' ? 'w-4/5 bg-cyan-500' :
                                  'w-full bg-emerald-500'
                                } transition-all duration-500`}></div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-white/[0.04]">
                            <div className="space-y-1">
                              <p className="text-gray-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-brand-red" />
                                <span>Fecha: <strong className="text-white font-mono">{res.fecha}</strong> a las <strong className="text-white font-mono">{res.hora} hs</strong></span>
                              </p>
                              {res.observaciones && (
                                <p className="text-[11px] text-gray-300 italic">
                                  "{res.observaciones}"
                                </p>
                              )}
                            </div>

                            <div className="sm:text-right flex sm:flex-col sm:items-end justify-between items-center gap-2">
                              <p className="text-[11px] text-gray-400">{badge.desc}</p>
                              {state.businessWhatsapp && (
                                <a
                                  href={`https://wa.me/${state.businessWhatsapp}?text=${encodeURIComponent(`Hola Lavadero RyN, consulto por mi turno del auto ${res.vehiculoMatricula} (${res.fecha} a las ${res.hora} hs)`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#25D366] hover:underline flex items-center gap-1 font-bold"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Consultar por WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. SECCIÓN TUS VEHÍCULOS REGISTRADOS */}
              <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-brand-red" />
                    <h3 className="text-lg font-display font-black text-white">Tus Vehículos Registrados</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {clientVehiculos.length} {clientVehiculos.length === 1 ? 'auto' : 'autos'}
                  </span>
                </div>

                {clientVehiculos.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tenés autos registrados aún.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clientVehiculos.map(veh => (
                      <div 
                        key={veh.matricula}
                        className="p-4 bg-[#181822] rounded-2xl border border-white/[0.06] flex items-center justify-between gap-3 hover:border-white/[0.12] transition"
                      >
                        <div className="space-y-1">
                          <span className="font-mono bg-white text-black px-2 py-0.5 rounded font-black text-xs tracking-wider">
                            {veh.matricula}
                          </span>
                          <h4 className="text-sm font-display font-bold text-white capitalize">
                            {veh.marca} {veh.modelo}
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Color: {veh.color} &bull; Año: {veh.anio}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCarForBooking(veh)}
                          className="bg-brand-red hover:bg-red-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Turno</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. SECCIÓN HISTORIAL DE SERVICIOS REALIZADOS Y PRECIOS */}
              <div className="p-6 bg-brand-card rounded-3xl border border-white/[0.04] shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                  <History className="w-5 h-5 text-brand-red" />
                  <h3 className="text-lg font-display font-black text-white">Historial de Servicios Realizados y Precios</h3>
                </div>

                {clientServicios.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay servicios anteriores facturados aún para este cliente.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-gray-400 font-mono uppercase text-[10px]">
                          <th className="pb-2.5">Fecha</th>
                          <th className="pb-2.5">Vehículo</th>
                          <th className="pb-2.5">Servicio</th>
                          <th className="pb-2.5">Pago</th>
                          <th className="pb-2.5 text-right">Precio Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {clientServicios.map(srv => (
                          <tr key={srv.id} className="hover:bg-white/[0.02] transition">
                            <td className="py-3 font-mono text-gray-300">{srv.fecha}</td>
                            <td className="py-3 font-mono font-bold text-white">{srv.vehiculoMatricula}</td>
                            <td className="py-3 font-semibold text-white capitalize">{srv.tipo}</td>
                            <td className="py-3 text-gray-400">{srv.formaPago}</td>
                            <td className="py-3 font-mono font-extrabold text-emerald-400 text-right">
                              ${srv.precio.toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 3: PRECIOS Y CATÁLOGO DE SERVICIOS (REQUISITO 4)
          ========================================================================= */}
      {activePortalTab === 'catalogo' && (
        <section className="space-y-6">
          <div className="p-5 bg-brand-card rounded-2xl border border-white/[0.04] text-center space-y-2 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-display font-black text-white">PRECIOS Y CATÁLOGO DE SERVICIOS</h2>
            <p className="text-xs text-gray-400">Tarifas transparentes vigentes en Lavadero RyN con productos de primera calidad</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.serviciosCatalogo.map(srv => (
              <div 
                key={srv.id}
                className="p-5 bg-brand-card rounded-3xl border border-white/[0.06] shadow-xl hover:border-brand-red/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-display font-black text-white capitalize">{srv.tipo}</h3>
                    <span className="text-lg font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl whitespace-nowrap">
                      ${srv.precio.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {srv.descripcion || 'Servicio completo garantizado.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectServiceFromCatalog(srv.tipo)}
                  className="w-full bg-brand-red hover:bg-red-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reservar este Servicio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Guarantee and Payment Methods Info */}
          <div className="p-5 bg-[#181822]/80 rounded-2xl border border-white/[0.06] text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Aceptamos Efectivo, Transferencia Bancaria, Tarjetas de Débito/Crédito y Mercado Pago.</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePortalTab('turnos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              Pedir Turno Online
            </button>
          </div>
        </section>
      )}

      {/* Hidden backdoor logout panel to exit customer self-service mode for employees */}
      {!isPublicRoute && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              setExitPassword('');
              setExitError(null);
              setShowExitModal(true);
            }}
            className="text-[10px] text-gray-600 hover:text-gray-400 underline transition duration-200 uppercase tracking-widest font-mono py-1.5 px-3 rounded-full hover:bg-white/[0.04]"
          >
            &bull; Salir del Modo Autoservicio &bull;
          </button>
        </div>
      )}

      {/* Dynamic secure administration exit dialog */}
      {showExitModal && (
        <div id="self-service-exit-modal" className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
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
                  className="w-full bg-[#181822] border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-red"
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
                className="flex-1 bg-[#242430] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
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
                className="flex-1 bg-brand-red hover:bg-red-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
