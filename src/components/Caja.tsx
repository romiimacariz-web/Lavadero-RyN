/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DatabaseState, Gasto, GastoCategoria, FormaPago } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Calendar,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  Share2,
  Copy,
  Printer,
  ChevronDown
} from 'lucide-react';

interface CajaProps {
  state: DatabaseState;
  onAddGasto: (gasto: Omit<Gasto, 'id'>) => void;
  onDeleteGasto: (id: string) => void;
}

const CATEGORIAS_GASTO: GastoCategoria[] = [
  'Productos de limpieza',
  'Combustible',
  'Herramientas',
  'Mantenimiento',
  'Otros'
];

export default function Caja({ 
  state, 
  onAddGasto, 
  onDeleteGasto 
 }: CajaProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<Gasto | null>(null);
  const [categoria, setCategoria] = useState<GastoCategoria>('Productos de limpieza');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState<number>(1000);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Daily Closing Modal States
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. DAILY (Diario)
  const incomingToday = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.precio, 0);
  }, [state.servicios, todayStr]);

  const outgoingToday = useMemo(() => {
    return state.gastos
      .filter(g => g.fecha === todayStr)
      .reduce((acc, curr) => acc + curr.monto, 0);
  }, [state.gastos, todayStr]);

  const netToday = useMemo(() => incomingToday - outgoingToday, [incomingToday, outgoingToday]);

  // Payment method breakdown for Today
  const paymentMethodsToday = useMemo(() => {
    return state.servicios
      .filter(s => s.fecha.startsWith(todayStr))
      .reduce((acc, curr) => {
        const method = curr.formaPago || 'Otro';
        acc[method] = (acc[method] || 0) + curr.precio;
        return acc;
      }, {} as Record<string, number>);
  }, [state.servicios, todayStr]);

  // Payment method breakdown for Month
  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const paymentMethodsMonth = useMemo(() => {
    return state.servicios
      .filter(s => {
        const sDate = new Date(s.fecha.split(' ')[0]);
        return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => {
        const method = curr.formaPago || 'Otro';
        acc[method] = (acc[method] || 0) + curr.precio;
        return acc;
      }, {} as Record<string, number>);
  }, [state.servicios, currentMonth, currentYear]);

  // 2. WEEKLY (Semanal)
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0,0,0,0);

    const weekIncomes = state.servicios.filter(s => {
      const sDate = new Date(s.fecha.split(' ')[0]);
      return sDate >= startOfWeek;
    }).reduce((acc, curr) => acc + curr.precio, 0);

    const weekExpenses = state.gastos.filter(g => {
      const gDate = new Date(g.fecha);
      return gDate >= startOfWeek;
    }).reduce((acc, curr) => acc + curr.monto, 0);

    return { Incomes: weekIncomes, Expenses: weekExpenses, Net: weekIncomes - weekExpenses };
  }, [state.servicios, state.gastos]);

  // 3. MONTHLY (Mensual)
  const monthlyStats = useMemo(() => {
    const monthIncomes = state.servicios.filter(s => {
      const sDate = new Date(s.fecha.split(' ')[0]);
      return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
    }).reduce((acc, curr) => acc + curr.precio, 0);

    const monthExpenses = state.gastos.filter(g => {
      const gDate = new Date(g.fecha);
      return gDate.getMonth() === currentMonth && gDate.getFullYear() === currentYear;
    }).reduce((acc, curr) => acc + curr.monto, 0);

    return { Incomes: monthIncomes, Expenses: monthExpenses, Net: monthIncomes - monthExpenses };
  }, [state.servicios, state.gastos, currentMonth, currentYear]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion || !monto) return;

    onAddGasto({
      fecha,
      categoria,
      descripcion: descripcion.trim(),
      monto: Number(monto)
    });

    setIsAdding(false);
    setDescripcion('');
    setMonto(1000);
  };

  // Generate closing receipt text
  const generateClosingText = () => {
    const nowStr = new Date().toLocaleString('es-AR');
    let text = `=================================\n`;
    text += `   CIERRE DE CAJA - LAVADERO RyN   \n`;
    text += `=================================\n`;
    text += `Fecha de Cierre: ${nowStr}\n`;
    text += `---------------------------------\n`;
    text += `INGRESOS TOTALES (HOY): $${incomingToday.toLocaleString('es-AR')}\n`;
    text += `EGRESOS TOTALES (HOY):  $${outgoingToday.toLocaleString('es-AR')}\n`;
    text += `GANANCIA NETA DIARIA:   $${netToday.toLocaleString('es-AR')}\n`;
    text += `---------------------------------\n`;
    text += `DETALLE DE PAGOS RECIBIDOS:\n`;
    
    const methods: FormaPago[] = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Mercado Pago', 'Otro'];
    methods.forEach(m => {
      const total = paymentMethodsToday[m] || 0;
      if (total > 0) {
        text += `• ${m}: $${total.toLocaleString('es-AR')}\n`;
      }
    });

    text += `---------------------------------\n`;
    text += `DETALLE DE GASTOS HOY:\n`;
    const todayExpenses = state.gastos.filter(g => g.fecha === todayStr);
    if (todayExpenses.length === 0) {
      text += `Sin egresos registrados.\n`;
    } else {
      todayExpenses.forEach(g => {
        text += `• ${g.descripcion} (${g.categoria}): $${g.monto.toLocaleString('es-AR')}\n`;
      });
    }
    text += `=================================\n`;
    text += `¡Cierre del día realizado con éxito!`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateClosingText();
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSendClosingWhatsApp = () => {
    const formattedText = encodeURIComponent(generateClosingText());
    window.open(`https://wa.me/?text=${formattedText}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Caja Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-brand-card rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">Flujos de Caja Operativa</h2>
            <p className="text-xs text-gray-400">Control de ingresos, egresos y arqueo de caja diario</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowClosingModal(true)}
            className="bg-brand-success/15 hover:bg-brand-success/25 border border-brand-success/40 text-brand-success font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Cierre de Caja
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-brand-red hover:bg-red-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Auto Calculation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Stats Card */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <span className="font-display font-bold text-white text-sm">BALANCE DIARIO (Hoy)</span>
            <span className="text-[10px] font-mono text-gray-500">{todayStr}</span>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-success" /> Ingresos:</span>
              <span className="font-mono text-white font-semibold">${incomingToday.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-brand-red" /> Gastos del Día:</span>
              <span className="font-mono text-white font-semibold">${outgoingToday.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between border-t border-gray-850 pt-2 text-base font-bold">
              <span>Ganancia Neta:</span>
              <span className={`font-mono ${netToday >= 0 ? 'text-[#FFC107]' : 'text-brand-red'}`}>
                ${netToday.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Stats Card */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <span className="font-display font-bold text-white text-sm">BALANCE SEMANAL</span>
            <span className="text-[10px] bg-brand-red/10 text-brand-red font-semibold px-2 py-0.5 rounded-full">Esta Semana</span>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-success" /> Ingresos:</span>
              <span className="font-mono text-white font-semibold">${weeklyStats.Incomes.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-brand-red" /> Gastos:</span>
              <span className="font-mono text-white font-semibold">${weeklyStats.Expenses.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between border-t border-gray-850 pt-2 text-base font-bold">
              <span>Ganancia Neta:</span>
              <span className={`font-mono ${weeklyStats.Net >= 0 ? 'text-[#FFC107]' : 'text-brand-red'}`}>
                ${weeklyStats.Net.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Stats Card */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <span className="font-display font-bold text-white text-sm">BALANCE MENSUAL</span>
            <span className="text-[10px] bg-brand-red/10 text-brand-red font-semibold px-2 py-0.5 rounded-full">Mes en curso</span>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-success" /> Ingresos:</span>
              <span className="font-mono text-white font-semibold">${monthlyStats.Incomes.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-brand-red" /> Gastos:</span>
              <span className="font-mono text-white font-semibold">${monthlyStats.Expenses.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between border-t border-gray-850 pt-2 text-base font-bold">
              <span>Ganancia Neta:</span>
              <span className={`font-mono ${monthlyStats.Net >= 0 ? 'text-[#FFC107]' : 'text-brand-red'}`}>
                ${monthlyStats.Net.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Income Breakdown by Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Daily Breakdown */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2 border-b border-gray-850 pb-2">
            <Layers className="w-4 h-4 text-brand-red" />
            Métodos de Pago - Facturación de Hoy
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Mercado Pago', 'Otro'].map(method => {
              const total = paymentMethodsToday[method] || 0;
              return (
                <div key={method} className="p-3 bg-brand-card-light rounded-xl border border-gray-850 flex justify-between items-center">
                  <span className="text-gray-400 font-medium">{method}</span>
                  <span className="font-mono text-white font-bold">${total.toLocaleString('es-AR')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2 border-b border-gray-850 pb-2">
            <Layers className="w-4 h-4 text-brand-red" />
            Métodos de Pago - Facturación Mensual
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Mercado Pago', 'Otro'].map(method => {
              const total = paymentMethodsMonth[method] || 0;
              return (
                <div key={method} className="p-3 bg-brand-card-light rounded-xl border border-gray-850 flex justify-between items-center">
                  <span className="text-gray-400 font-medium">{method}</span>
                  <span className="font-mono text-white font-bold">${total.toLocaleString('es-AR')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Register Expense collapsible form */}
        {isAdding && (
          <div className="lg:col-span-5 p-5 bg-brand-card rounded-2xl border border-brand-red/30 space-y-4">
            <h3 className="text-base font-display font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red shrink-0" />
              Nuevo Registro de Egreso
            </h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Procedimiento / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Insumos de cera, mantenimiento bomba..."
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Categoría del Gasto *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as GastoCategoria)}
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {CATEGORIAS_GASTO.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto gastado..."
                    className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-brand-red font-mono font-bold focus:outline-none"
                    value={monto}
                    onChange={(e) => setMonto(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Fecha del Movimiento *</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-1/2 bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-red hover:bg-red-800 text-white font-semibold py-2 rounded-xl"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses List Ledger */}
        <div className={`p-5 bg-brand-card rounded-2xl border border-gray-800 ${isAdding ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <h3 className="text-base font-display font-extrabold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            Egresos Operativos Registrados ({state.gastos.length})
          </h3>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 text-xs">
            {state.gastos
              .sort((a,b) => b.fecha.localeCompare(a.fecha))
              .map(gst => (
                <div key={gst.id} className="p-3 bg-brand-card-light rounded-xl border border-gray-850 flex justify-between items-center hover:border-gray-800 transition">
                  <div className="space-y-1">
                    <p className="font-semibold text-white text-sm">{gst.descripcion}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-400">
                      <span className="bg-brand-red/10 text-brand-red font-mono px-1.5 py-0.5 rounded border border-brand-red/20">
                        {gst.categoria}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {gst.fecha}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-brand-red font-extrabold text-sm">
                      -${gst.monto.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => setGastoToDelete(gst)}
                      className="p-1.5 bg-brand-card hover:bg-brand-red/10 text-brand-red/70 hover:text-brand-red border border-gray-800 rounded-lg hover:border-brand-red/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {state.gastos.length === 0 && (
              <p className="text-xs text-center text-gray-500 italic py-6">No se registran egresos operativos cargados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Closing Dialog Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-gray-850 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-success" />
                <h3 className="text-lg font-display font-black text-white">Arqueo & Cierre de Caja Diario</h3>
              </div>
              <button 
                onClick={() => setShowClosingModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Receipt visualization */}
            <div className="bg-black/40 border border-gray-850 rounded-xl p-4 font-mono text-gray-300 space-y-1 text-xs whitespace-pre-wrap select-all">
              {generateClosingText()}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex-1 bg-brand-card border border-gray-750 hover:border-brand-red/40 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-4 h-4 text-brand-red" />
                {hasCopied ? '¡Copiado!' : 'Copiar Reporte'}
              </button>
              <button
                type="button"
                onClick={handleSendClosingWhatsApp}
                className="flex-1 bg-brand-success hover:bg-green-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4" />
                Mandar por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setShowClosingModal(false)}
                className="flex-1 bg-brand-card-light border border-gray-800 text-gray-400 hover:text-white font-bold text-xs py-3 rounded-xl transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {gastoToDelete !== null && (
        <div id="confirm-delete-gasto-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-white">¿Eliminar Gasto?</h3>
              <p className="text-xs text-gray-400">
                ¿Seguro que deseas eliminar el gasto operativo <span className="font-bold text-white">"{gastoToDelete.descripcion}"</span> por un monto de <span className="font-bold text-brand-red font-mono">${gastoToDelete.monto.toLocaleString('es-AR')}</span>?
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setGastoToDelete(null)}
                className="flex-1 bg-[#2B2B2B] hover:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGasto(gastoToDelete.id);
                  setGastoToDelete(null);
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
