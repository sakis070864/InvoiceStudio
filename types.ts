export interface Invoice {
  id: string;
  supplier: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  createdAt: number;
}

export interface DatabaseMeta {
  id: string;
  name: string;
  createdAt: number;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'createdAt'>;

export enum SortOption {
  DATE_DESC = 'DATE_DESC',
  DATE_ASC = 'DATE_ASC',
  AMOUNT_DESC = 'AMOUNT_DESC',
  AMOUNT_ASC = 'AMOUNT_ASC',
}

export interface ImportSummary {
  added: number;
  skipped: number;
}