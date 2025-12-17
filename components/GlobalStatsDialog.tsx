import React, { useMemo } from 'react';
import { Invoice } from '../types';
import { X, TrendingUp, Activity, PieChart, BarChart3, Award, DollarSign } from 'lucide-react';

interface GlobalStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  dbName: string;
}

const GlobalStatsDialog: React.FC<GlobalStatsDialogProps> = ({ isOpen, onClose, invoices, dbName }) => {
  if (!isOpen) return null;

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices.filter(i => i.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);

    // Strength Meter Score (0-100)
    const paidRatio = totalAmount > 0 ? paidAmount / totalAmount : 0;
    const overdueRatio = totalAmount > 0 ? overdueAmount / totalAmount : 0;
    let healthScore = 50 + (paidRatio * 50) - (overdueRatio * 50);
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Group by Supplier (Normalized for duplicates)
    const supplierStats = invoices.reduce((acc, inv) => {
      const normalizedKey = inv.supplier.trim().toLowerCase();
      if (!normalizedKey) return acc;
      
      if (!acc[normalizedKey]) {
        // Use the original name (trimmed) for display, preferring the one with capital letters if mixed
        acc[normalizedKey] = { name: inv.supplier.trim(), amount: 0 };
      }
      acc[normalizedKey].amount += inv.amount;
      return acc;
    }, {} as Record<string, { name: string; amount: number }>);

    // Convert to array and sort
    const sortedSuppliers = (Object.values(supplierStats) as { name: string; amount: number }[])
      .sort((a, b) => b.amount - a.amount);
      
    const maxSupplierVal = sortedSuppliers.length > 0 ? sortedSuppliers[0].amount : 0;

    const topSuppliers = sortedSuppliers
      .map(item => ({
        ...item,
        percentOfTotal: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
        percentOfMax: maxSupplierVal > 0 ? (item.amount / maxSupplierVal) * 100 : 0
      }));

    // Group by Category
    const categoryMap = invoices.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = (Object.entries(categoryMap) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }));

    return { totalAmount, healthScore, topSuppliers, categoryData, paidAmount, overdueAmount, pendingAmount };
  }, [invoices]);

  // --- Helper Functions ---
  const getBarColor = (index: number, total: number) => {
    // Colors from Smallest (Blue) to Largest (Red)
    const colors = [
        '#3B82F6', // Blue
        '#22C55E', // Green
        '#EAB308', // Yellow
        '#A855F7', // Purple
        '#F97316', // Orange
        '#EC4899', // Pink
        '#EF4444'  // Red
    ];
    
    if (total <= 1) return colors[colors.length - 1];
    
    // index 0 is largest (Red end), index total-1 is smallest (Blue end)
    const position = 1 - (index / (total - 1)); 
    const colorIndex = Math.min(colors.length - 1, Math.max(0, Math.round(position * (colors.length - 1))));
    
    return colors[colorIndex];
  };

  // --- Helper Components ---

  // Gauge / Strength Meter
  const StrengthMeter = ({ score }: { score: number }) => {
    const radius = 80;
    const stroke = 12;
    const normalizedScore = score / 100;
    const circumference = Math.PI * radius; // Semi-circle
    const strokeDashoffset = circumference * (1 - normalizedScore);
    
    // Color logic
    let color = '#3FB950'; // Success
    if (score < 40) color = '#F85149'; // Danger
    else if (score < 70) color = '#D29922'; // Warning

    return (
      <div className="relative flex flex-col items-center justify-center pt-4">
        <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
          {/* Background Arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#30363D" strokeWidth={stroke} strokeLinecap="round" />
          {/* Value Arc */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke={color} 
            strokeWidth={stroke} 
            strokeLinecap="round" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          {/* Needle */}
          <g transform={`translate(100, 100) rotate(${(normalizedScore * 180) - 90})`} className="transition-all duration-1000 ease-out origin-center">
             <path d="M -4 0 L 0 -70 L 4 0 Z" fill="#CDD9E5" />
             <circle cx="0" cy="0" r="6" fill="#CDD9E5" />
          </g>
        </svg>
        <div className="text-center -mt-6">
            <div className="text-3xl font-bold text-primary">{Math.round(score)}/100</div>
            <div className="text-xs text-secondary uppercase tracking-wider">Health Score</div>
        </div>
      </div>
    );
  };

  // Donut Chart
  const DonutChart = ({ data }: { data: { name: string; percent: number; }[] }) => {
    let currentAngle = 0;
    const colors = ['#58A6FF', '#3FB950', '#D29922', '#F85149', '#A371F7', '#F0883E', '#768390'];
    
    const gradientParts = data.map((item, index) => {
      const start = currentAngle;
      const end = currentAngle + item.percent;
      currentAngle = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    });
    
    const gradient = data.length > 0 
        ? `conic-gradient(${gradientParts.join(', ')})` 
        : 'conic-gradient(#30363D 0% 100%)';

    return (
        <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-40 h-40 flex-shrink-0">
                <div 
                    className="w-full h-full rounded-full transition-all duration-1000"
                    style={{ background: gradient }}
                />
                <div className="absolute inset-4 bg-sidebar rounded-full flex items-center justify-center">
                     <PieChart className="w-8 h-8 text-secondary/50" />
                </div>
            </div>
            <div className="flex-1 space-y-2 w-full">
                {data.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                            <span className="text-primary truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="text-secondary font-mono">{item.percent.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-sidebar border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar" 
          onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-sidebar/95 backdrop-blur z-10">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Activity className="w-6 h-6 text-accent" />
                        Οικονομική Επισκόπηση
                    </h2>
                    <p className="text-sm text-secondary mt-1">
                        Αναλυτικά στατιστικά για τη βάση: <span className="text-primary font-medium">{dbName}</span>
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-border rounded-lg text-secondary hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 space-y-8">
                
                {/* Top Row: Cards + Strength Meter */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Key Metrics */}
                    <div className="space-y-4">
                        <div className="bg-background rounded-xl p-5 border border-border shadow-sm">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent/10 rounded-lg text-accent"><DollarSign className="w-5 h-5"/></div>
                                <h3 className="text-sm font-semibold text-secondary uppercase">ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ</h3>
                             </div>
                             <p className="text-3xl font-bold text-primary">€{stats.totalAmount.toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                        </div>
                        <div className="bg-background rounded-xl p-5 border border-border shadow-sm">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-success/10 rounded-lg text-success"><Award className="w-5 h-5"/></div>
                                <h3 className="text-sm font-semibold text-secondary uppercase">ΠΛΗΡΩΜΕΝΑ</h3>
                             </div>
                             <p className="text-2xl font-bold text-success">€{stats.paidAmount.toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                             <p className="text-xs text-secondary mt-1">{(stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount * 100) : 0).toFixed(1)}% του συνόλου</p>
                        </div>
                    </div>

                    {/* Strength Meter */}
                    <div className="bg-background rounded-xl p-5 border border-border shadow-sm flex flex-col items-center justify-center">
                        <h3 className="text-sm font-semibold text-secondary uppercase mb-4 w-full text-left flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Δείκτης Υγείας
                        </h3>
                        <StrengthMeter score={stats.healthScore} />
                        <p className="text-center text-xs text-secondary/70 mt-4 px-4">
                             Βάσει πληρωμών & εκκρεμοτήτων
                        </p>
                    </div>

                    {/* Status Breakdown */}
                     <div className="bg-background rounded-xl p-5 border border-border shadow-sm flex flex-col justify-center gap-4">
                         <h3 className="text-sm font-semibold text-secondary uppercase">ΚΑΤΑΣΤΑΣΗ ΤΙΜΟΛΟΓΙΩΝ</h3>
                         
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span className="text-success font-medium">Πληρωμένα</span>
                                     <span className="text-primary">€{stats.paidAmount.toLocaleString('el-GR')}</span>
                                 </div>
                                 <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                                     <div className="h-full bg-success" style={{ width: `${stats.totalAmount > 0 ? stats.paidAmount / stats.totalAmount * 100 : 0}%` }}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span className="text-warning font-medium">Σε Εκκρεμότητα</span>
                                     <span className="text-primary">€{stats.pendingAmount.toLocaleString('el-GR')}</span>
                                 </div>
                                 <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                                     <div className="h-full bg-warning" style={{ width: `${stats.totalAmount > 0 ? stats.pendingAmount / stats.totalAmount * 100 : 0}%` }}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-sm mb-1">
                                     <span className="text-danger font-medium">Εκπρόθεσμα</span>
                                     <span className="text-primary">€{stats.overdueAmount.toLocaleString('el-GR')}</span>
                                 </div>
                                 <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                                     <div className="h-full bg-danger" style={{ width: `${stats.totalAmount > 0 ? stats.overdueAmount / stats.totalAmount * 100 : 0}%` }}></div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Bottom Row: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Suppliers Horizontal Bar Chart */}
                    <div className="bg-background rounded-xl p-6 border border-border shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2 flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-accent" />
                            Κορυφαίοι Προμηθευτές (βάσει ποσού)
                        </h3>
                        
                        <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
                             <div className="space-y-4">
                                 {stats.topSuppliers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-secondary h-full opacity-50 py-10">
                                        <BarChart3 className="w-12 h-12 mb-2" />
                                        <p className="text-sm">Δεν υπάρχουν δεδομένα</p>
                                    </div>
                                ) : (
                                    stats.topSuppliers.map((supplier, index) => {
                                        const barColor = getBarColor(index, stats.topSuppliers.length);
                                        return (
                                            <div key={supplier.name} className="relative group">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-sm font-medium text-primary truncate max-w-[70%]" title={supplier.name}>
                                                        {supplier.name}
                                                    </span>
                                                    <span className="text-xs font-bold" style={{ color: barColor }}>
                                                        €{supplier.amount.toLocaleString('el-GR', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>

                                                {/* Bar Track */}
                                                <div className="w-full h-2.5 bg-border/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{ 
                                                            width: `${Math.max(1, supplier.percentOfMax)}%`,
                                                            backgroundColor: barColor
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Donut Chart */}
                    <div className="bg-background rounded-xl p-6 border border-border shadow-sm h-[400px] flex flex-col">
                        <h3 className="text-base font-bold text-primary mb-6 flex items-center gap-2 flex-shrink-0">
                            <PieChart className="w-5 h-5 text-accent" />
                            Κατανομή ανά Κατηγορία
                        </h3>
                        <div className="flex-1 flex items-center justify-center">
                            <DonutChart data={stats.categoryData} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default GlobalStatsDialog;