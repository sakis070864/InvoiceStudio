import React, { useState, useEffect } from 'react';
import { InvoiceFormData, Invoice } from '../types';
import { AlertCircle, CheckCircle2, Plus, Building2, Tag, CreditCard, Save, X, RefreshCw } from 'lucide-react';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  existingInvoices: Invoice[];
  editingInvoice?: Invoice | null;
  onCancel: () => void;
  onDuplicateFound?: (id: string | null) => void;
}

const CATEGORIES = ['Υλικά', 'Εργατικά', 'Γενικά', 'Πάγια Έξοδα', 'Υπηρεσίες', 'Λογισμικό', 'Ταξίδια'];
const STATUS_MAP: Record<Invoice['status'], string> = {
  Pending: 'Σε εκκρεμότητα',
  Paid: 'Πληρωμένο',
  Overdue: 'Εκπρόθεσμο',
};
const STATUS_KEYS = Object.keys(STATUS_MAP) as Array<keyof typeof STATUS_MAP>;


const INITIAL_DATA: InvoiceFormData = {
  supplier: '',
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  description: '',
  category: 'Υλικά',
  status: 'Pending'
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, existingInvoices, editingInvoice, onCancel, onDuplicateFound }) => {
  const [formData, setFormData] = useState<InvoiceFormData>(INITIAL_DATA);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editingInvoice) {
      setFormData({
        supplier: editingInvoice.supplier,
        invoiceNumber: editingInvoice.invoiceNumber,
        date: editingInvoice.date,
        amount: editingInvoice.amount,
        description: editingInvoice.description,
        category: editingInvoice.category,
        status: editingInvoice.status,
      });
      setTouched({});
    } else {
      setFormData(INITIAL_DATA);
      setTouched({});
    }
  }, [editingInvoice]);

  useEffect(() => {
    if (formData.invoiceNumber) {
      const duplicate = existingInvoices.find(
        inv => 
          inv.invoiceNumber.toLowerCase() === formData.invoiceNumber.trim().toLowerCase() &&
          inv.id !== editingInvoice?.id
      );
      
      const hasDuplicate = !!duplicate;
      setIsDuplicate(hasDuplicate);

      if (onDuplicateFound) {
        onDuplicateFound(duplicate ? duplicate.id : null);
      }
    } else {
      setIsDuplicate(false);
      if (onDuplicateFound) {
        onDuplicateFound(null);
      }
    }
  }, [formData.invoiceNumber, existingInvoices, editingInvoice, onDuplicateFound]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleReset = () => {
    setFormData({
      ...INITIAL_DATA,
      date: new Date().toISOString().split('T')[0]
    });
    setTouched({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;
    
    if (!formData.supplier || !formData.invoiceNumber || formData.amount <= 0) {
      setTouched({
        supplier: true,
        invoiceNumber: true,
        amount: true,
        date: true,
        description: true,
        category: true,
        status: true
      });
      return;
    }

    onSubmit(formData);
    if (!editingInvoice) {
      setFormData({
        ...INITIAL_DATA,
        date: new Date().toISOString().split('T')[0]
      });
      setTouched({});
      setIsDuplicate(false);
    }
  };

  const inputClasses = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border bg-background text-primary transition-all duration-200 outline-none appearance-none
    placeholder:text-secondary/60
    ${hasError 
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20' 
      : 'border-border focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-secondary'}
  `;

  return (
    <div className={`bg-sidebar rounded-xl border p-6 transition-all ${editingInvoice ? 'border-accent/50' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-3">
          {editingInvoice ? <Save className="w-5 h-5 text-warning" /> : <Plus className="w-5 h-5 text-accent" />}
          {editingInvoice ? 'Επεξεργασία Τιμολογίου' : 'Προσθήκη Τιμολογίου'}
        </h2>
        
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleReset}
                className="p-2 text-secondary hover:text-primary hover:bg-border rounded-md transition-colors"
                title="Καθαρισμός Πεδίων"
            >
                <RefreshCw className="w-4 h-4" />
            </button>

            {editingInvoice && (
              <button 
                onClick={onCancel}
                className="text-sm text-secondary hover:text-danger flex items-center gap-1.5 px-3 py-1 rounded-md hover:bg-danger/10 transition-colors"
              >
                <X className="w-4 h-4" />
                Ακύρωση
              </button>
            )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">Προμηθευτής</label>
            <input
              type="text" name="supplier" value={formData.supplier}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="π.χ. Web Supplies, Service Co"
              className={inputClasses(touched.supplier && !formData.supplier)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Αριθμός Τιμολογίου</label>
            <div className="relative">
              <input
                type="text" name="invoiceNumber" value={formData.invoiceNumber}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="π.χ. ΤΙΜ-2024-001"
                className={inputClasses(isDuplicate || (touched.invoiceNumber && !formData.invoiceNumber))}
              />
              {isDuplicate && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger animate-pulse">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {isDuplicate && (
              <p className="text-xs text-danger font-medium flex items-center gap-1 pt-1">
                <AlertCircle className="w-3 h-3" />
                Ο αριθμός τιμολογίου υπάρχει ήδη
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Ημερομηνία</label>
            <input
              type="date" name="date" value={formData.date}
              onChange={handleChange} onBlur={handleBlur}
              className={inputClasses(false)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Ποσό</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-medium">€</span>
              <input
                type="number" name="amount" min="0" step="0.01" value={formData.amount || ''}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="0.00"
                className={`${inputClasses(touched.amount && formData.amount <= 0)} pl-7`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Κατηγορία</label>
            <div className="relative">
                <select name="category" value={formData.category} onChange={handleChange} className={inputClasses(false)}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
          </div>

           <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Κατάσταση</label>
             <div className="relative">
                <select name="status" value={formData.status} onChange={handleChange} className={inputClasses(false)}>
                  {STATUS_KEYS.map(key => <option key={key} value={key}>{STATUS_MAP[key]}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary">Περιγραφή</label>
          <textarea
            name="description" value={formData.description} onChange={handleChange}
            rows={2} placeholder="Λεπτομέρειες για τα προϊόντα ή τις υπηρεσίες..."
            className={inputClasses(false)}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isDuplicate || !formData.invoiceNumber || !formData.supplier}
            className={`w-full px-6 py-2.5 rounded-lg font-semibold text-white 
              flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
              ${isDuplicate || !formData.invoiceNumber || !formData.supplier
                ? 'bg-secondary/40 cursor-not-allowed' 
                : editingInvoice 
                    ? 'bg-amber-600 hover:bg-amber-500' 
                    : 'bg-accent hover:bg-blue-500'
              }`}
          >
            {editingInvoice ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {editingInvoice ? 'Ενημέρωση Τιμολογίου' : 'Προσθήκη στη Βάση'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;