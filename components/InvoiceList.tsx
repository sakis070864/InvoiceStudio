import React, { useState, useRef, useEffect } from 'react';
import { Invoice, SortOption, ImportSummary } from '../types';
import { Search, FileText, Trash2, Edit3, Upload, Download, FileSpreadsheet, FileJson, Loader2, Info, X, Calendar, Filter, ArrowUp, ArrowDown, BarChart3, ArrowUpDown } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onSelect: (invoice: Invoice) => void;
  selectedId?: string;
  highlightedId?: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  originalInvoiceCount: number;
  onImport: (file: File) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  isImporting: boolean;
  importSummary: ImportSummary | null;
  onClearImportSummary: () => void;
  onShowStats: (supplier: string) => void;
}

const CATEGORIES = ['Υλικά', 'Εργατικά', 'Γενικά', 'Πάγια Έξοδα', 'Υπηρεσίες', 'Λογισμικό', 'Ταξίδια'];

const STATUS_MAP: Record<Invoice['status'], string> = {
  Pending: 'Σε εκκρεμότητα',
  Paid: 'Πληρωμένο',
  Overdue: 'Εκπρόθεσμο',
};

interface SortButtonProps {
    value: SortOption;
    isActive: boolean;
    onClick: (value: SortOption) => void;
    children: React.ReactNode;
}

const SortButton: React.FC<SortButtonProps> = ({ value, isActive, onClick, children }) => (
    <button 
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
        isActive 
          ? 'bg-accent text-white shadow-md shadow-accent/20' 
          : 'bg-sidebar hover:bg-border text-secondary hover:text-primary border border-border/50'
      }`}
    >
      {children}
    </button>
);

const InvoiceList: React.FC<InvoiceListProps> = (props) => {
  const { 
    invoices, onDelete, onSelect, selectedId, highlightedId, searchTerm, onSearchChange, 
    dateRange, onDateRangeChange, selectedCategory, onCategoryChange,
    selectedStatus, onStatusChange,
    sortOption, onSortChange, originalInvoiceCount, onImport, onExport,
    isImporting, importSummary, onClearImportSummary, onShowStats
  } = props;

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to scroll to highlighted invoice
  useEffect(() => {
    if (highlightedId) {
      const element = document.getElementById(`invoice-item-${highlightedId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };
  
  const getStatusClasses = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'bg-success/10 text-success border-success/20';
        case 'Pending': return 'bg-warning/10 text-warning border-warning/20';
        case 'Overdue': return 'bg-danger/10 text-danger border-danger/20';
        default: return 'bg-secondary/10 text-secondary border-secondary/20';
    }
  };

  if (originalInvoiceCount === 0 && !isImporting) {
    return (
      <div className="bg-sidebar rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center">
        <FileText className="w-12 h-12 text-secondary/50 mb-4" />
        <h3 className="text-lg font-medium text-primary">Η βάση δεδομένων είναι άδεια</h3>
        <p className="text-secondary mt-1">Προσθέστε το πρώτο σας τιμολόγιο ή <button onClick={handleImportClick} className="text-accent font-semibold hover:underline">κάντε εισαγωγή</button> από αρχείο.</p>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv,.pdf"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-sidebar p-4 rounded-xl border border-border space-y-4">
        
        {/* Row 1: Search and Dropdown Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                    type="text"
                    placeholder="Αναζήτηση..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
                 <div className="relative group flex-1 lg:flex-none">
                    <select
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full lg:w-auto pl-3 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-secondary focus:text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none min-w-[160px]"
                    >
                        <option value="">Όλες οι Κατηγορίες</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                        <Filter className="w-4 h-4" />
                    </div>
                </div>

                <div className="relative group flex-1 lg:flex-none">
                    <select
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full lg:w-auto pl-3 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-secondary focus:text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none min-w-[160px]"
                    >
                        <option value="">Όλες οι Καταστάσεις</option>
                        {Object.entries(STATUS_MAP).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                        <Filter className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>

        {/* Row 2: Dates and Actions */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
             {/* Dates */}
             <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
                 <div className="relative group flex-1 sm:flex-none">
                    <input 
                        type="date" 
                        value={dateRange.from}
                        onChange={(e) => onDateRangeChange({...dateRange, from: e.target.value})}
                        className="w-full sm:w-auto pl-3 pr-2 py-2 bg-background border border-border rounded-lg text-sm text-secondary focus:text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none min-w-[130px]"
                        title="Ημερομηνία Από"
                    />
                     {!dateRange.from && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-secondary/50 pointer-events-none hidden sm:block">Από</span>}
                </div>
                <div className="relative group flex-1 sm:flex-none">
                    <input 
                        type="date" 
                        value={dateRange.to}
                        onChange={(e) => onDateRangeChange({...dateRange, to: e.target.value})}
                        className="w-full sm:w-auto pl-3 pr-2 py-2 bg-background border border-border rounded-lg text-sm text-secondary focus:text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none min-w-[130px]"
                        title="Ημερομηνία Έως"
                    />
                     {!dateRange.to && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-secondary/50 pointer-events-none hidden sm:block">Έως</span>}
                </div>
                {(dateRange.from || dateRange.to) && (
                     <button 
                        onClick={() => onDateRangeChange({from: '', to: ''})}
                        className="p-2 text-secondary hover:text-danger border border-border rounded-lg hover:bg-border transition-colors flex-shrink-0"
                        title="Καθαρισμός φίλτρων ημερομηνίας"
                     >
                         <X className="w-4 h-4" />
                     </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto ml-auto xl:ml-0">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".csv,.pdf"
                />
                <button onClick={handleImportClick} disabled={isImporting} className="p-2 text-secondary bg-background border border-border rounded-lg hover:bg-border hover:text-primary disabled:opacity-50 disabled:cursor-wait" title="Εισαγωγή αρχείου">
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
                <div className="relative">
                    <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="p-2 text-secondary bg-background border border-border rounded-lg hover:bg-border hover:text-primary" title="Εξαγωγή λίστας">
                        <Download className="w-4 h-4" />
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-sidebar border border-border rounded-lg shadow-xl z-10 p-1.5">
                        <button onClick={() => { onExport('csv'); setIsExportMenuOpen(false); }} className="w-full text-left text-sm flex items-center gap-2 px-3 py-1.5 rounded-md text-primary hover:bg-border">
                            <FileSpreadsheet className="w-4 h-4 text-secondary" />
                            <span>CSV</span>
                        </button>
                        <button onClick={() => { onExport('pdf'); setIsExportMenuOpen(false); }} className="w-full text-left text-sm flex items-center gap-2 px-3 py-1.5 rounded-md text-primary hover:bg-border">
                            <FileJson className="w-4 h-4 text-secondary" />
                            <span>PDF</span>
                        </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Row 3: Sorting (New Section) */}
        <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider mr-2 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Ταξινόμηση:
            </span>
            <div className="flex flex-wrap gap-2">
              <SortButton value={SortOption.DATE_DESC} isActive={sortOption === SortOption.DATE_DESC} onClick={onSortChange}>Νεότερα</SortButton>
              <SortButton value={SortOption.DATE_ASC} isActive={sortOption === SortOption.DATE_ASC} onClick={onSortChange}>Παλαιότερα</SortButton>
              <SortButton value={SortOption.AMOUNT_DESC} isActive={sortOption === SortOption.AMOUNT_DESC} onClick={onSortChange}>Μεγαλύτερο Ποσό</SortButton>
              <SortButton value={SortOption.AMOUNT_ASC} isActive={sortOption === SortOption.AMOUNT_ASC} onClick={onSortChange}>Μικρότερο Ποσό</SortButton>
            </div>
        </div>

        {importSummary && (
          <div className="bg-accent/10 border border-accent/20 text-accent text-sm rounded-lg p-3 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>
                  Επιτυχής εισαγωγή! <strong>{importSummary.added}</strong> εγγραφές προστέθηκαν, <strong>{importSummary.skipped}</strong> διπλότυπα παραλείφθηκαν.
                </span>
             </div>
             <button onClick={onClearImportSummary} className="p-1 rounded-full hover:bg-accent/20"><X className="w-4 h-4"/></button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
        {invoices.map((invoice) => {
            const isSelected = invoice.id === selectedId;
            const isHighlighted = invoice.id === highlightedId;
            return (
              <div 
                key={invoice.id}
                id={`invoice-item-${invoice.id}`}
                className={`group p-4 rounded-lg border transition-all duration-300 ${
                    isHighlighted ? 'bg-warning/10 border-warning ring-1 ring-warning shadow-[0_0_15px_rgba(210,153,34,0.3)]' :
                    isSelected ? 'bg-accent/5 border-accent' : 'bg-sidebar border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusClasses(invoice.status)}`}>
                                {STATUS_MAP[invoice.status]}
                            </span>
                            <span className="text-sm text-secondary">
                                {new Date(invoice.date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 group/supplier">
                            <span className="font-semibold text-primary truncate">
                                {invoice.supplier}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShowStats(invoice.supplier);
                                }}
                                className="p-1 text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
                                title={`Προβολή στατιστικών για ${invoice.supplier}`}
                            >
                               <BarChart3 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-secondary truncate font-mono">
                            #{invoice.invoiceNumber} &bull; {invoice.category}
                        </p>
                        {invoice.description && (
                            <p className="text-xs text-secondary/80 truncate mt-1 italic">
                                {invoice.description}
                            </p>
                        )}
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col justify-between items-end">
                        <div className="font-bold text-primary text-lg">
                            €{invoice.amount.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                             <button
                                onClick={() => onSelect(invoice)}
                                className="p-1.5 text-secondary hover:text-warning hover:bg-warning/10 rounded-md"
                                title="Επεξεργασία Τιμολογίου" aria-label="Επεξεργασία Τιμολογίου"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(invoice.id)}
                                className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded-md"
                                title="Διαγραφή Τιμολογίου" aria-label="Διαγραφή Τιμολογίου"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )
        })}
        {invoices.length === 0 && (searchTerm || dateRange.from || dateRange.to || selectedCategory || selectedStatus) && (
            <div className="text-center py-10">
                <p className="text-secondary">
                    Δεν βρέθηκαν αποτελέσματα 
                    {searchTerm && <span> για "{searchTerm}"</span>}
                    {selectedCategory && <span> στην κατηγορία "{selectedCategory}"</span>}
                    {selectedStatus && <span> με κατάσταση "{STATUS_MAP[selectedStatus as keyof typeof STATUS_MAP]}"</span>}
                    {(dateRange.from || dateRange.to) && <span> στην επιλεγμένη περίοδο</span>}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;