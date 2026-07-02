/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Sparkles, Loader2, X, CheckCircle2, AlertTriangle, Info, MessageSquare, Copy, Smartphone } from 'lucide-react';

// --- LOADING SCREEN ---
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-100 bg-[#07070A] flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-14 h-14 bg-brand-red/10 border-2 border-brand-red text-brand-red rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/15"
      >
        <Sparkles className="w-7 h-7" />
      </motion.div>
      <div className="space-y-1.5 text-center">
        <h3 className="font-display font-black text-white text-base tracking-wider uppercase">Lavadero RyN</h3>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-red" />
          <span>Estableciendo conexión segura...</span>
        </div>
      </div>
    </div>
  );
}

// --- SKELETON CARD ---
export function SkeletonCard() {
  return (
    <div className="p-5 bg-brand-card rounded-2xl border border-gray-800/60 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-800 rounded-xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/3 bg-gray-800 rounded"></div>
          <div className="h-2.5 w-1/2 bg-gray-850 rounded"></div>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-2.5 w-full bg-gray-850 rounded"></div>
        <div className="h-2.5 w-5/6 bg-gray-850 rounded"></div>
        <div className="h-2.5 w-4/6 bg-gray-850 rounded"></div>
      </div>
    </div>
  );
}

// --- FORBIDDEN SCREEN ---
interface ForbiddenScreenProps {
  onBackToDashboard: () => void;
}

export function ForbiddenScreen({ onBackToDashboard }: ForbiddenScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 bg-brand-card rounded-3xl border border-gray-800/90 max-w-md mx-auto text-center space-y-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-[#F59E0B] to-brand-red"></div>
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-brand-red/10 border border-brand-red/20 rounded-2xl flex items-center justify-center text-brand-red shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-display font-black text-white">Acceso Restringido (403)</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Su cuenta tiene rol de <strong className="text-brand-red">Empleado</strong>. No cuenta con permisos para ver reportes financieros, modificar tarifas del catálogo o alterar configuraciones críticas del sistema.
        </p>
      </div>

      <button
        type="button"
        onClick={onBackToDashboard}
        className="w-full bg-[#1A1A22] hover:bg-[#252530] text-white border border-gray-800 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
      >
        Regresar al Inicio
      </button>
    </motion.div>
  );
}

// --- CUSTOM MODERN TOASTS SYSTEM ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string | number;
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: {
      bg: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    error: {
      bg: 'bg-red-950/40 border-red-800/60 text-brand-red',
      icon: <ShieldAlert className="w-5 h-5 text-brand-red" />
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-800/60 text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    },
    info: {
      bg: 'bg-blue-950/40 border-blue-800/60 text-blue-400',
      icon: <Info className="w-5 h-5 text-blue-400" />
    }
  };

  const style = config[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3.5 shadow-2xl ${style.bg}`}
    >
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 space-y-0.5 text-left">
        <h4 className="font-bold text-xs text-white">{toast.title}</h4>
        {toast.message && <p className="text-[11px] text-gray-400 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-white transition shrink-0 p-0.5 rounded-lg hover:bg-white/5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// --- REUSABLE WHATSAPP MODAL ---
interface WhatsAppModalProps {
  open: boolean;
  phone: string;
  text: string;
  copySuccess: boolean;
  onChangeText: (text: string) => void;
  onCopy: () => void;
  onClose: () => void;
  onGetWhatsAppHref: (phone: string, text: string) => string;
}

export function WhatsAppModal({
  open,
  phone,
  text,
  copySuccess,
  onChangeText,
  onCopy,
  onClose,
  onGetWhatsAppHref
}: WhatsAppModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-card rounded-2xl border border-gray-800 shadow-2xl p-6 relative space-y-4 text-left font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-card-light text-gray-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
          <div className="p-2.5 bg-[#28A745]/15 border border-[#28A745]/30 text-[#28A745] rounded-xl shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-base">Enviar por WhatsApp</h4>
            <p className="text-[10px] text-gray-400 font-mono">Destinatario: {phone}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Contenido de la plantilla:</label>
          <textarea
            className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-4 py-3 text-white text-xs min-h-[110px] focus:outline-none focus:ring-1 focus:ring-[#28A745] leading-relaxed"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onCopy}
            className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 border border-gray-850 cursor-pointer"
          >
            <Copy className="w-4 h-4 text-brand-warning" />
            <span>{copySuccess ? 'Copiado! ✔' : 'Copiar Texto'}</span>
          </button>

          <a
            href={onGetWhatsAppHref(phone, text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="bg-[#28A745] hover:bg-green-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 text-center"
          >
            <Smartphone className="w-4 h-4" />
            <span>Enviar Directo</span>
          </a>
        </div>

        <p className="text-[10px] text-center text-gray-500">
          * El botón "Enviar Directo" abrirá una nueva pestaña de chat en WhatsApp Web o en tu aplicación móvil con el mensaje pre-cargado.
        </p>
      </div>
    </div>
  );
}
