import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Invoice, InvoiceFormData, DatabaseMeta, SortOption, ImportSummary } from './types';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import Sidebar from './components/Sidebar';
import LoginDialog from './components/LoginDialog';
import SupplierStatsDialog from './components/SupplierStatsDialog';
import GlobalStatsDialog from './components/GlobalStatsDialog';
import SystemInfoDialog from './components/SystemInfoDialog';
import { InvoiceDb } from './services/invoiceDb';
import { Database, Loader2 } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import { exportToCsv, exportToPdf, importFromCsv, importFromPdf } from './services/fileHandlers';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('is_authenticated') === 'true';
  });

  const [databases, setDatabases] = useState<DatabaseMeta[]>([]);
  const [currentDbId, setCurrentDbId] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null);
  
  const [statsSupplier, setStatsSupplier] = useState<string | null>(null);
  const [isGlobalStatsOpen, setIsGlobalStatsOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('is_authenticated', 'true');
    }
  };

  // Load Databases
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDbs = async () => {
      setIsLoading(true);
      const dbs = await InvoiceDb.getDatabases();
      setDatabases(dbs);
      if (dbs.length > 0) {
        setCurrentDbId(dbs[0].id);
      }
      setIsLoading(false);
    };
    loadDbs();
  }, [isAuthenticated]);

  // Load Invoices when DB changes
  useEffect(() => {
    if (!isAuthenticated) return;

    if (currentDbId) {
      const fetchInvoices = async () => {
         setIsLoading(true);
         const data = await InvoiceDb.getInvoices(currentDbId);
         setInvoices(data);
         setSelectedInvoice(null);
         setSearchTerm('');
         setDateRange({ from: '', to: '' });
         setSelectedCategory('');
         setSelectedStatus('');
         setImportSummary(null);
         setHighlightedInvoiceId(null);
         setIsLoading(false);
      };
      fetchInvoices();
    }
  }, [currentDbId, isAuthenticated]);

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];
    
    // Date Filtering
    if (dateRange.from) {
      result = result.filter(inv => inv.date >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter(inv => inv.date <= dateRange.to);
    }

    // Category Filtering
    if (selectedCategory) {
      result = result.filter(inv => inv.category === selectedCategory);
    }

    // Status Filtering
    if (selectedStatus) {
      result = result.filter(inv => inv.status === selectedStatus);
    }

    // Search Filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.supplier.toLowerCase().includes(lowerTerm) ||
        inv.invoiceNumber.toLowerCase().includes(lowerTerm) ||
        inv.description.toLowerCase().includes(lowerTerm) ||
        inv.category.toLowerCase().includes(lowerTerm)
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case SortOption.DATE_DESC: return new Date(b.date).getTime() - new Date(a.date).getTime();
        case SortOption.DATE_ASC: return new Date(a.date).getTime() - new Date(b.date).getTime();
        case SortOption.AMOUNT_DESC: return b.amount - a.amount;
        case SortOption.AMOUNT_ASC: return a.amount - b.amount;
        default: return 0;
      }
    });
    return result;
  }, [invoices, searchTerm, dateRange, selectedCategory, selectedStatus, sortOption]);

  const handleSaveInvoice = useCallback(async (data: InvoiceFormData) => {
    if (!currentDbId) return;

    try {
        if (selectedInvoice) {
            // Update existing
            const updatedInvoice: Invoice = { ...selectedInvoice, ...data };
            await InvoiceDb.updateInvoice(selectedInvoice.id, updatedInvoice);
            
            // Optimistic Update
            setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv));
        } else {
            // Create new
            const newInvoicePayload = {
                ...data,
                createdAt: Date.now(),
            };
            // Note: addInvoice returns the object with the new generated ID
            const newInvoice = await InvoiceDb.addInvoice(currentDbId, newInvoicePayload);
            
            setInvoices(prev => [newInvoice as Invoice, ...prev]);
        }
        
        setSelectedInvoice(null);
        setHighlightedInvoiceId(null);
    } catch (error) {
        alert("Failed to save invoice. Please check your connection.");
        console.error(error);
    }
  }, [currentDbId, selectedInvoice]);

  const handleSelectInvoice = useCallback((invoice: Invoice) => {
    if (selectedInvoice?.id !== invoice.id) {
      setSelectedInvoice(invoice);
      setHighlightedInvoiceId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedInvoice]);

  const handleCancelEdit = useCallback(() => {
    setSelectedInvoice(null);
    setHighlightedInvoiceId(null);
  }, []);

  const handleInitiateDelete = useCallback((id: string) => {
    setDeletingInvoiceId(id);
    setIsConfirmOpen(true);
  }, []);
  
  const handleConfirmDelete = useCallback(async () => {
    if (!currentDbId || !deletingInvoiceId) return;

    try {
        await InvoiceDb.deleteInvoice(deletingInvoiceId);
        
        setInvoices(prev => prev.filter(inv => inv.id !== deletingInvoiceId));
        
        if (selectedInvoice?.id === deletingInvoiceId) {
          setSelectedInvoice(null);
        }

        setIsConfirmOpen(false);
        setDeletingInvoiceId(null);
    } catch (error) {
        alert("Failed to delete invoice.");
        console.error(error);
    }
  }, [currentDbId, selectedInvoice, deletingInvoiceId]);

  const handleCancelDelete = useCallback(() => {
    setIsConfirmOpen(false);
    setDeletingInvoiceId(null);
  }, []);

  const handleDeleteDatabase = useCallback(async (dbId: string) => {
    if (databases.length <= 1) {
      alert("Δεν μπορείτε να διαγράψετε την τελευταία βάση δεδομένων.");
      return;
    }
    if (window.confirm("Είστε σίγουροι; Αυτή η ενέργεια θα διαγράψει οριστικά όλα τα τιμολόγια σε αυτήν τη βάση δεδομένων.")) {
      try {
          await InvoiceDb.deleteDatabase(dbId);
          // Refresh List
          const remainingDbs = await InvoiceDb.getDatabases();
          setDatabases(remainingDbs);
          
          if (currentDbId === dbId) {
            setCurrentDbId(remainingDbs[0]?.id || '');
          }
      } catch (error) {
          alert("Failed to delete database.");
          console.error(error);
      }
    }
  }, [databases, currentDbId]);

  const handleSelectDb = useCallback(async (dbId: string) => {
    if (dbId === 'new') {
        const name = window.prompt("Εισαγάγετε όνομα για τη νέα βάση δεδομένων (π.χ., 'Έξοδα 2025'):");
        if (name) {
            try {
                const newDb = await InvoiceDb.createDatabase(name);
                setDatabases(prev => [...prev, newDb]);
                setCurrentDbId(newDb.id);
            } catch (error) {
                console.error(error);
                alert("Failed to create database.");
            }
        }
    } else {
        setCurrentDbId(dbId);
    }
  }, []);

  const handleExport = (format: 'csv' | 'pdf') => {
    const dbName = databases.find(db => db.id === currentDbId)?.name || 'export';
    if (format === 'csv') {
      exportToCsv(filteredAndSortedInvoices, dbName);
    } else {
      const stats = {
        totalAmount: filteredAndSortedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        totalCount: filteredAndSortedInvoices.length,
        pendingCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Pending').length,
        paidCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Paid').length,
        overdueCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Overdue').length,
      };
      exportToPdf(filteredAndSortedInvoices, dbName, stats);
    }
  };

  const handleImport = async (file: File) => {
    if (!currentDbId) return;
    setIsImporting(true);
    setImportSummary(null);

    try {
      let imported: Omit<InvoiceFormData, 'status'>[] = [];
      if (file.type === 'text/csv') {
        imported = await importFromCsv(file);
      } else if (file.type === 'application/pdf') {
        imported = await importFromPdf(file);
      } else {
        throw new Error('Unsupported file type');
      }

      const existingInvoiceNumbers = new Set(invoices.map(inv => inv.invoiceNumber.toLowerCase()));
      let addedCount = 0;
      
      const newInvoicesPayload: any[] = [];

      imported.forEach(data => {
        const { status, ...restOfData } = data as any;
        const isDuplicate = existingInvoiceNumbers.has(restOfData.invoiceNumber.toLowerCase());
        
        if (!isDuplicate) {
            addedCount++;
            newInvoicesPayload.push({
                ...restOfData,
                createdAt: Date.now(),
                status: 'Pending',
            });
        }
      });

      if (newInvoicesPayload.length > 0) {
        await InvoiceDb.batchAddInvoices(currentDbId, newInvoicesPayload);
        // Refresh invoices from server to get generated IDs
        const updated = await InvoiceDb.getInvoices(currentDbId);
        setInvoices(updated);
      }

      setImportSummary({
        added: addedCount,
        skipped: imported.length - addedCount,
      });

    } catch (error) {
      console.error("Import failed:", error);
      alert(`Η εισαγωγή απέτυχε: ${error instanceof Error ? error.message : String(error)}`);
      setImportSummary(null);
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleDuplicateFound = useCallback((id: string | null) => {
    setHighlightedInvoiceId(id);
  }, []);
  
  const handleShowSupplierStats = useCallback((supplier: string) => {
    setStatsSupplier(supplier);
  }, []);

  const currentDbName = databases.find(db => db.id === currentDbId)?.name || 'Φόρτωση...';
  const sidebarStats = useMemo(() => {
    return {
      totalAmount: filteredAndSortedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalCount: filteredAndSortedInvoices.length,
      pendingCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Pending').length,
      paidCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Paid').length,
      overdueCount: filteredAndSortedInvoices.filter(inv => inv.status === 'Overdue').length,
    }
  }, [filteredAndSortedInvoices]);

  if (!isAuthenticated) {
    return <LoginDialog onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        databases={databases}
        currentDbId={currentDbId}
        onSelectDb={handleSelectDb}
        onDeleteDb={handleDeleteDatabase}
        invoices={filteredAndSortedInvoices}
        stats={sidebarStats}
        onShowGlobalStats={() => setIsGlobalStatsOpen(true)}
        onShowSystemInfo={() => setIsSystemInfoOpen(true)}
      />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <section aria-labelledby="form-section-title">
              <InvoiceForm
                onSubmit={handleSaveInvoice}
                existingInvoices={invoices}
                editingInvoice={selectedInvoice}
                onCancel={handleCancelEdit}
                onDuplicateFound={handleDuplicateFound}
              />
            </section>
            
            <section aria-labelledby="invoice-list-title">
                <div className="mb-4 flex items-center gap-3">
                    <h2 id="invoice-list-title" className="text-xl font-semibold text-primary flex items-center gap-2">
                        <Database className="w-5 h-5 text-secondary" />
                        <span>Εγγραφές: <span className="text-accent">{currentDbName}</span></span>
                    </h2>
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin text-accent" />}
                </div>
                <InvoiceList
                    invoices={filteredAndSortedInvoices}
                    onDelete={handleInitiateDelete}
                    onSelect={handleSelectInvoice}
                    selectedId={selectedInvoice?.id}
                    highlightedId={highlightedInvoiceId}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                    originalInvoiceCount={invoices.length}
                    onImport={handleImport}
                    onExport={handleExport}
                    isImporting={isImporting}
                    importSummary={importSummary}
                    onClearImportSummary={() => setImportSummary(null)}
                    onShowStats={handleShowSupplierStats}
                />
            </section>
        </div>
      </main>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Επιβεβαίωση Διαγραφής"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε οριστικά αυτό το τιμολόγιο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
      />
      
      <SupplierStatsDialog 
          isOpen={!!statsSupplier} 
          onClose={() => setStatsSupplier(null)} 
          supplierName={statsSupplier || ''} 
          invoices={invoices.filter(inv => inv.supplier === statsSupplier)}
      />

      <GlobalStatsDialog 
          isOpen={isGlobalStatsOpen}
          onClose={() => setIsGlobalStatsOpen(false)}
          invoices={invoices}
          dbName={currentDbName}
      />
      
      <SystemInfoDialog
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
};

export default App;