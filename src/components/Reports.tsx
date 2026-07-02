/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DatabaseState, ServicioRealizado, Gasto, Cliente } from '../types';
import { 
  BarChart4, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Search,
  PieChart,
  Calendar,
  Sparkles,
  Users,
  Percent,
  TrendingUp as TrendUpIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie as RechartsPie 
} from 'recharts';

interface ReportsProps {
  state: DatabaseState;
}

export default function Reports({ state }: ReportsProps) {
  const [selectedReportMonth, setSelectedReportMonth] = useState<number>(new Date().getMonth());

  // 1. SERVICES AGGREGATION (Most Sold Services)
  const servicesStats = useMemo(() => {
    const counts: { [tipo: string]: { count: number; totalRev: number } } = {};
    state.servicios.forEach(s => {
      const type = s.tipo || 'Lavado básico';
      if (!counts[type]) {
        counts[type] = { count: 0, totalRev: 0 };
      }
      counts[type].count += 1;
      counts[type].totalRev += s.precio;
    });

    return Object.entries(counts).map(([tipo, data]) => ({
      name: tipo,
      count: data.count,
      revenue: data.totalRev
    })).sort((a,b) => b.count - a.count);
  }, [state.servicios]);

  // 2. FREQUENT CUSTOMERS LEADERBOARD
  const frequentCustomers = useMemo(() => {
    const records: { [cid: string]: { count: number; totalSpent: number } } = {};
    state.servicios.forEach(s => {
      if (!records[s.clienteId]) {
        records[s.clienteId] = { count: 0, totalSpent: 0 };
      }
      records[s.clienteId].count += 1;
      records[s.clienteId].totalSpent += s.precio;
    });

    return Object.entries(records).map(([cid, data]) => {
      const client = state.clientes.find(c => c.id === cid);
      return {
        id: cid,
        nombre: client?.nombre || 'Consumidor Final',
        telefono: client?.telefono || '',
        count: data.count,
        totalSpent: data.totalSpent
      };
    }).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [state.servicios, state.clientes]);

  // 3. EXPENSES BY CATEGORY
  const expenseCategories = useMemo(() => {
    const categories: { [cat: string]: number } = {
      'Productos de limpieza': 0,
      'Combustible': 0,
      'Herramientas': 0,
      'Mantenimiento': 0,
      'Otros': 0
    };

    state.gastos.forEach(g => {
      if (g.categoria in categories) {
        categories[g.categoria] += g.monto;
      } else {
        categories['Otros'] += g.monto;
      }
    });

    const totalExp = Object.values(categories).reduce((a,b) => a+b, 0);

    return Object.entries(categories).map(([cat, total]) => ({
      name: cat,
      monto: total,
      pct: totalExp > 0 ? Math.round((total / totalExp) * 100) : 0
    })).sort((a,b) => b.monto - a.monto);
  }, [state.gastos]);

  // 4. WEEK/DAY SALES CURVATURE (Sales over previous 7 days)
  const dailySales = useMemo(() => {
    const list: { [date: string]: number } = {};
    // Populate past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      list[str] = 0;
    }

    state.servicios.forEach(s => {
      const sDay = s.fecha.split(' ')[0];
      if (sDay in list) {
        list[sDay] += s.precio;
      }
    });

    return Object.entries(list).map(([date, total]) => {
      const parts = date.split('-');
      const label = `${parts[2]}/${parts[1]}`; // DD/MM format
      return { date, label, total };
    });
  }, [state.servicios]);

  // 5. MONTHLY MARGIN SUMMARY
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyMargin = useMemo(() => {
    const summary: { [monthStr: string]: { incomes: number; expenses: number } } = {};
    
    // Process services for past months
    state.servicios.forEach(s => {
      const parts = s.fecha.split(' ')[0].split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
        if (!summary[key]) summary[key] = { incomes: 0, expenses: 0 };
        summary[key].incomes += s.precio;
      }
    });

    // Process expenses for past months
    state.gastos.forEach(g => {
      const parts = g.fecha.split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
        if (!summary[key]) summary[key] = { incomes: 0, expenses: 0 };
        summary[key].expenses += g.monto;
      }
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    return Object.entries(summary).map(([key, data]) => {
      const [year, monthIdx] = key.split('-');
      const label = `${monthNames[Number(monthIdx) - 1]} ${year.substring(2)}`;
      return {
        key,
        label,
        "Ingresos": data.incomes,
        "Gastos": data.expenses,
        "Ganancia": data.incomes - data.expenses
      };
    }).sort((a,b) => a.key.localeCompare(b.key));
  }, [state.servicios, state.gastos]);

  // 6. SPREADSHEET EXPORTER (EXCEL ENGINE USING UTF-8 CSV WITH MULTI-SHEET DECORATOR)
  const handleExportExcel = () => {
    let csvContent = "\ufeff"; // BOM for excel to recognize Spanish accent characters properly

    csvContent += "=== LAVADERO RyN - REPORTE DE GESTION OPERATIVA ===\n";
    csvContent += `Fecha de extraccion: ,${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}\n\n`;

    csvContent += "--- SHEET: REGISTRO DE CLIENTES ---\n";
    csvContent += "ID,Nombre,Telefono,WhatsApp,Direccion,Observaciones,Fecha Registro\n";
    state.clientes.forEach(c => {
      csvContent += `"${c.id}","${c.nombre}","${c.telefono}","${c.whatsapp}","${c.direccion || ''}","${c.observaciones || ''}","${c.fechaRegistro}"\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: HISTORIAL DE TRABAJOS (INGRESOS) ---\n";
    csvContent += "ID,Fecha,Cliente ID,Matricula,Tipo Servicio,Precio,Forma Pago,Observaciones\n";
    state.servicios.forEach(s => {
      csvContent += `"${s.id}","${s.fecha}","${s.clienteId}","${s.vehiculoMatricula}","${s.tipo}",${s.precio},"${s.formaPago}","${s.observaciones || ''}"\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: CONTABILIDAD DE EGRESOS (GASTOS) ---\n";
    csvContent += "ID,Fecha,Categoria,Monto,Descripcion\n";
    state.gastos.forEach(g => {
      csvContent += `"${g.id}","${g.fecha}","${g.categoria}",${g.monto},"${g.descripcion}"\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: VEHICULOS REGISTRADOS ---\n";
    csvContent += "Patente/Matricula,Marca,Modelo,Color,Anio,Cliente ID,Kilometros,Proximo Mantenimiento\n";
    state.vehiculos.forEach(v => {
      csvContent += `"${v.matricula}","${v.marca}","${v.modelo}","${v.color}",${v.anio},"${v.clienteId}",${v.kilometros || '0'},"${v.proximoMantenimiento || ''}"\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: SERVICIOS MAS VENDIDOS ---\n";
    csvContent += "Servicio,Cantidad Vendida,Total Recaudado\n";
    servicesStats.forEach(ss => {
      csvContent += `"${ss.name}",${ss.count},${ss.revenue}\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: CLIENTES FRECUENTES ---\n";
    csvContent += "Nombre,Telefono,Cantidad de Visitas,Total Invertido\n";
    frequentCustomers.forEach(fc => {
      csvContent += `"${fc.nombre}","${fc.telefono}",${fc.count},${fc.totalSpent}\n`;
    });
    csvContent += "\n";

    csvContent += "--- SHEET: HISTORIAL DE MARGENES MENSUALES ---\n";
    csvContent += "Mes/Anio,Ingresos Totales,Gastos Totales,Ganancia Neta\n";
    monthlyMargin.forEach(mm => {
      csvContent += `"${mm.label}",${mm.Ingresos},${mm.Gastos},${mm.Ganancia}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_General_Lavadero_RyN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerPrintPDF = () => {
    window.print();
  };

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">
      
      {/* Report Header Panel */}
      <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl">
            <BarChart4 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">Tablero de Reportes Financieros</h2>
            <p className="text-xs text-gray-400">Auditoría en tiempo real y descarga de balances contables</p>
          </div>
        </div>

        {/* Dual export pathways */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="bg-[#2B2B2B] hover:bg-gray-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-success" />
            Descargar Excel (.csv)
          </button>
          <button
            onClick={handleTriggerPrintPDF}
            className="bg-brand-red hover:bg-red-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Exportar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Main Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales by Day interactive Recharts Curve */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-brand-success" />
              Facturación Diaria (Últimos 7 días)
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Recharts Activo</span>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsColorFacturacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="label" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }} 
                  formatter={(val: any) => [`$${val.toLocaleString('es-AR')}`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#reportsColorFacturacion)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-brand-red" />
              Gastos por Categoría
            </h3>
            <span className="text-[10px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-bold">Porcentaje</span>
          </div>

          <div className="h-44 w-full flex justify-center items-center">
            {expenseCategories.reduce((sum, item) => sum + item.monto, 0) === 0 ? (
              <p className="text-xs text-gray-500 italic">No hay egresos registrados</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsPie
                    data={expenseCategories.filter(item => item.monto > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="monto"
                  >
                    {expenseCategories.filter(item => item.monto > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPie>
                  <Tooltip formatter={(val: any) => [`$${val.toLocaleString('es-AR')}`, 'Monto']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {expenseCategories.map((ec, idx) => (
              <div key={ec.name} className="flex justify-between text-[11px] text-gray-300">
                <span className="capitalize font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  {ec.name}
                </span>
                <span className="font-mono text-gray-400">
                  ${ec.monto.toLocaleString('es-AR')} ({ec.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Most popular Service Packages volume sold */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-brand-warning" />
              Servicios Más Vendidos
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">Volumen</span>
          </div>

          <div className="space-y-3">
            {servicesStats.slice(0, 5).map((ss, idx) => {
              const maxSells = Math.max(...servicesStats.map(s => s.count), 1);
              const barWidthPct = (ss.count / maxSells) * 100;
              return (
                <div key={ss.name} className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span className="font-medium text-white capitalize">{ss.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {ss.count} ventas | ${ss.revenue.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="w-full bg-brand-card-light h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${barWidthPct}%` }}
                      className="h-full bg-brand-warning rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              );
            })}

            {servicesStats.length === 0 && (
              <p className="text-xs text-center text-gray-500 italic py-6">No se registran datos disponibles.</p>
            )}
          </div>
        </div>

        {/* Regular repetitive customers board table */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-brand-red" />
              Clientes Frecuentes
            </h3>
            <span className="text-[10px] text-gray-450 font-semibold font-mono">Top 5</span>
          </div>

          <div className="space-y-2.5">
            {frequentCustomers.map((fc, idx) => (
              <div key={fc.id} className="p-2.5 bg-brand-card-light rounded-xl border border-gray-850 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red font-bold flex items-center justify-center font-display text-[11px] shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white">{fc.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{fc.telefono}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-white text-[11px] font-bold block">{fc.count} visitas</span>
                  <span className="text-[10px] text-brand-success font-mono font-medium">${fc.totalSpent.toLocaleString()}</span>
                </div>
              </div>
            ))}

            {frequentCustomers.length === 0 && (
              <p className="text-xs text-center text-gray-500 italic py-6">No se registran valoraciones de visitas.</p>
            )}
          </div>
        </div>

        {/* Monthly margin summaries comparison visual curves */}
        <div className="p-5 bg-brand-card rounded-2xl border border-gray-800 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850 pb-2">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
              <DollarSign className="w-4.5 h-4.5 text-[#FFC107]" />
              Facturación Mensual
            </h3>
            <span className="text-[10px] text-gray-550 font-mono">Arqueo Neto</span>
          </div>

          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {monthlyMargin.map(mm => (
              <div key={mm.key} className="p-2.5 bg-brand-card-light rounded-xl border border-gray-850 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white text-[13px]">{mm.label}</span>
                  <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                    <span>Ing: ${mm.Ingresos.toLocaleString()}</span>
                    <span>Gas: ${mm.Gastos.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono text-sm font-extrabold ${mm.Ganancia >= 0 ? 'text-[#FFC107]' : 'text-brand-red'}`}>
                    ${mm.Ganancia.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-500 block">Neto</span>
                </div>
              </div>
            ))}

            {monthlyMargin.length === 0 && (
              <p className="text-xs text-center text-gray-500 italic py-6">Datos insuficientes para históricos por mes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
