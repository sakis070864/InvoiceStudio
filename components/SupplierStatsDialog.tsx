import React from 'react';
import { Invoice } from '../types';
import { X, TrendingUp, CheckCircle2, Clock, AlertCircle, PieChart, BarChart3 } from 'lucide-react';

interface SupplierStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  invoices: Invoice[];
}

const SupplierStatsDialog: React.FC<SupplierStatsDialogProps> = ({ isOpen, onClose, supplierName, invoices }) => {
  if (!isOpen) return null;

  // Calculations
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const count = invoices.length;
  const avgAmount = count > 0 ? totalAmount / count : 0;
  
  const paid = invoices.filter(i => i.status === 'Paid');
  const pending = invoices.filter(i => i.status === 'Pending');
  const overdue = invoices.filter(i => i.status === 'Overdue');

  const categories = invoices.reduce((acc, inv) => {
    acc[inv.category] = (acc[inv.category] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = (Object.entries(categories) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-sidebar border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" 
          onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-sidebar/95 backdrop-blur z-10">
                <div>
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-accent" />
                        {supplierName}
                    </h2>
                    <p className="text-sm text-secondary mt-1 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Ανάλυση Προμηθευτή
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-border rounded-lg text-secondary hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background rounded-lg p-4 border border-border hover:border-primary/20 transition-colors">
                        <p className="text-xs font-medium text-secondary uppercase tracking-wider">Συνολικό Ποσό</p>
                        <p className="text-2xl font-bold text-primary mt-1">€{totalAmount.toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="bg-background rounded-lg p-4 border border-border hover:border-primary/20 transition-colors">
                        <p className="text-xs font-medium text-secondary uppercase tracking-wider">Πλήθος Τιμολογίων</p>
                        <p className="text-2xl font-bold text-primary mt-1">{count}</p>
                    </div>
                    <div className="bg-background rounded-lg p-4 border border-border hover:border-accent/20 transition-colors group">
                        <p className="text-xs font-medium text-secondary uppercase tracking-wider">Μέσος Όρος / Τιμολ.</p>
                        <p className="text-2xl font-bold text-accent mt-1 group-hover:scale-105 transition-transform origin-left">€{avgAmount.toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div>
                    <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Κατάσταση Πληρωμών
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/10 hover:bg-success/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-success" />
                                <span className="text-sm text-primary font-medium">Πληρωμένα</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-success">€{paid.reduce((s, i) => s + i.amount, 0).toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                                <p className="text-xs text-secondary">{paid.length} τιμολόγια</p>
                            </div>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/10 hover:bg-warning/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-warning" />
                                <span className="text-sm text-primary font-medium">Σε εκκρεμότητα</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-warning">€{pending.reduce((s, i) => s + i.amount, 0).toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                                <p className="text-xs text-secondary">{pending.length} τιμολόγια</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-danger/5 rounded-lg border border-danger/10 hover:bg-danger/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-danger" />
                                <span className="text-sm text-primary font-medium">Εκπρόθεσμα</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-danger">€{overdue.reduce((s, i) => s + i.amount, 0).toLocaleString('el-GR', {minimumFractionDigits: 2})}</p>
                                <p className="text-xs text-secondary">{overdue.length} τιμολόγια</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Top Categories */}
                {sortedCategories.length > 0 && (
                    <div className="border-t border-border pt-6">
                         <h3 className="text-sm font-semibold text-primary mb-3">Κύριες Κατηγορίες Εξόδων</h3>
                         <div className="flex flex-wrap gap-2">
                            {sortedCategories.map(([cat, amt]) => (
                                <div key={cat} className="bg-background border border-border rounded-full px-4 py-1.5 text-sm flex items-center gap-2">
                                    <span className="text-secondary">{cat}</span>
                                    <span className="font-medium text-primary">€{amt.toLocaleString('el-GR', {maximumFractionDigits: 0})}</span>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
export default SupplierStatsDialog;