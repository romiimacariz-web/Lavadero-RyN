/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, Gasto, GastoCategoria } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShoppingBag, 
  Calendar,
  AlertCircle,
  Clock,
  Sparkles
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

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. DAILY (Diario)
  const incomingToday = state.servicios
    .filter(s => s.fecha.startsWith(todayStr))
    .reduce((acc, curr) => acc + curr.precio, 0);

  const outgoingToday = state.gastos
    .filter(g => g.fecha === todayStr)
    .reduce((acc, curr) => acc + curr.monto, 0);

  const netToday = incomingToday - outgoingToday;

  // 2. WEEKLY (Semanal)
  const getWeeklyStats = () => {
    const today = new Date();
    // Get start of week (last Monday)
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
  };

  const weeklyStats = getWeeklyStats();

  // 3. MONTHLY (Mensual)
  const getMonthlyStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthIncomes = state.servicios.filter(s => {
      const sDate = new Date(s.fecha.split(' ')[0]);
      return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
    }).reduce((acc, curr) => acc + curr.precio, 0);

    const monthExpenses = state.gastos.filter(g => {
      const gDate = new Date(g.fecha);
      return gDate.getMonth() === currentMonth && gDate.getFullYear() === currentYear;
    }).reduce((acc, curr) => acc + curr.monto, 0);

    return { Incomes: monthIncomes, Expenses: monthExpenses, Net: monthIncomes - monthExpenses };
  };

  const monthlyStats = getMonthlyStats();

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
            <p className="text-xs text-gray-400">Control de ingresos y egresos para balances netos</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-brand-red hover:bg-red-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto
        </button>
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
                  className="w-full bg-brand-card-light border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none"
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
                    min="10"
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

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {state.gastos
              .sort((a,b) => b.fecha.localeCompare(a.fecha))
              .map(gst => (
                <div key={gst.id} className="p-3 bg-brand-card-light rounded-xl border border-gray-800/80 flex justify-between items-center text-xs hover:border-gray-750 transition">
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
              <p className="text-xs text-center text-gray-550 italic py-6">No se registran egresos operativos cargados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modern custom modal for expense deletion */}
      {gastoToDelete !== null && (
        <div id="confirm-delete-gasto-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-gray-800 p-6 space-y-6 shadow-2xl animate-scaleUp">
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
