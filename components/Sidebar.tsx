import React from 'react';
import { DatabaseMeta, Invoice } from '../types';
import { Code, Zap, Cpu, Hash, CircleDollarSign, AlertTriangle, BadgeCheck, Clock, Plus, Trash2, BarChart2, PieChart, Info } from 'lucide-react';

interface SidebarStats {
    totalAmount: number;
    totalCount: number;
    pendingCount: number;
    paidCount: number;
    overdueCount: number;
}

interface SidebarProps {
  databases: DatabaseMeta[];
  currentDbId: string;
  onSelectDb: (id: string) => void;
  onDeleteDb: (id: string) => void;
  invoices: Invoice[]; // Still needed for the count in the header for now
  stats: SidebarStats;
  onShowGlobalStats: () => void;
  onShowSystemInfo: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ databases, currentDbId, onSelectDb, onDeleteDb, invoices, stats, onShowGlobalStats, onShowSystemInfo }) => {
  
  const StatItem = ({ icon: Icon, label, value, colorClass = 'text-secondary' }: any) => (
    <li className="flex items-center justify-between text-sm">
      <div className={`flex items-center gap-2 ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-primary">{value}</span>
    </li>
  );
  
  const StatItemWithProgress = ({ icon: Icon, label, count, total, colorClass }: any) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const bgClass = colorClass.replace('text-', 'bg-');

    return (
        <li className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-2 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </div>
                <span className="font-medium text-primary">{`${count} (${percentage}%)`}</span>
            </div>
            <div className="w-full bg-border rounded-full h-1">
                <div className={`${bgClass} h-1 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
            </div>
        </li>
    );
  };


  return (
    <aside className="w-72 min-w-72 h-screen bg-sidebar border-r border-border p-5 flex flex-col gap-8 sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
          <Code className="w-5 h-5" />
        </div>
        <h1 className="font-bold text-xl text-primary">InvoiceStudio</h1>
      </div>

      {/* Database Selector */}
      <div className="space-y-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider">ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ</h2>
        <ul className="space-y-2">
          {databases.map((db, index) => {
            const isActive = db.id === currentDbId;
            const Icon = index % 2 === 0 ? Zap : Cpu;
            return (
              <li key={db.id} className="group relative">
                <button
                  onClick={() => onSelectDb(db.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    isActive ? 'bg-accent/10 border border-accent' : 'hover:bg-border/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-accent' : 'text-secondary'}`} />
                  <div>
                    <h3 className={`font-semibold ${isActive ? 'text-accent' : 'text-primary'}`}>{db.name}</h3>
                    <p className="text-xs text-secondary">
                      {isActive ? 'Ενεργή Βάση Δεδομένων' : 'Κάντε κλικ για εναλλαγή'}
                    </p>
                  </div>
                </button>
                {databases.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDb(db.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-secondary hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Διαγραφή Βάσης Δεδομένων"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <button 
            onClick={() => onSelectDb('new')}
            className="w-full text-left mt-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 flex items-center gap-2 font-medium rounded-lg transition-colors"
        >
            <Plus className="w-4 h-4" />
            Νέα Βάση Δεδομένων
        </button>
      </div>

      {/* Statistics */}
      <div className="space-y-3 flex-grow">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              <span>ΣΤΑΤΙΣΤΙΚΑ</span>
            </h2>
            <button 
              onClick={onShowGlobalStats} 
              className="text-xs text-accent hover:text-white hover:bg-accent/20 px-2 py-1 rounded transition-colors flex items-center gap-1"
              title="Προβολή Αναλυτικών Διαγραμμάτων"
            >
               <PieChart className="w-3 h-3" />
               Ανάλυση
            </button>
        </div>
        <div className="bg-background/50 p-4 rounded-lg border border-border">
          <ul className="space-y-3">
            <StatItem 
              icon={Hash}
              label="Σύνολο Εγγραφών"
              value={stats.totalCount}
            />
            <StatItem 
              icon={CircleDollarSign}
              label="Συνολικό Ποσό"
              value={`€${stats.totalAmount.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`}
            />
            {stats.totalCount > 0 && (
                <>
                  <li className="!my-3 border-t border-border/50"></li>
                  <StatItemWithProgress
                      icon={Clock}
                      label="Σε εκκρεμότητα"
                      count={stats.pendingCount}
                      total={stats.totalCount}
                      colorClass="text-warning"
                  />
                  <StatItemWithProgress
                      icon={BadgeCheck}
                      label="Πληρωμένα"
                      count={stats.paidCount}
                      total={stats.totalCount}
                      colorClass="text-success"
                  />
                  <StatItemWithProgress
                      icon={AlertTriangle}
                      label="Εκπρόθεσμα"
                      count={stats.overdueCount}
                      total={stats.totalCount}
                      colorClass="text-danger"
                  />
                </>
            )}
          </ul>
        </div>
        
        <button 
            onClick={onShowGlobalStats}
            className="w-full mt-2 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 hover:border-accent/50 text-accent rounded-lg p-3 flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(88,166,255,0.1)] group"
        >
            <BarChart2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Πλήρης Αναφορά</span>
        </button>
      </div>

      {/* Footer / System Info Link */}
      <div className="pt-4 border-t border-border mt-auto flex-shrink-0 flex justify-between items-center">
        <span className="text-[10px] text-secondary/40">v1.0.2</span>
        <button 
          onClick={onShowSystemInfo}
          className="flex items-center gap-1.5 text-[10px] text-secondary/20 hover:text-secondary/60 transition-colors"
          title="System Info"
        >
          <Info className="w-3 h-3" />
          <span>dev_sys</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;