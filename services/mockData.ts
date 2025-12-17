import { Invoice } from '../types';

const SUPPLIERS = [
  'Web Supplies Co.',
  'Service Pro',
  'Creative Designs',
  'Tech Solutions',
  'Office Supplies Inc.',
  'Logistics Hellas',
  'Digital Marketing Experts',
  'Cloud Services Ltd.',
];

const CATEGORIES = ['Υλικά', 'Εργατικά', 'Γενικά', 'Πάγια Έξοδα', 'Υπηρεσίες', 'Λογισμικό', 'Ταξίδια'];

const DESCRIPTIONS = [
  'Ανανέωση συνδρομής λογισμικού',
  'Αγορά εξοπλισμού γραφείου',
  'Υπηρεσίες συντήρησης ιστοσελίδας',
  'Έξοδα μετακίνησης για συνάντηση',
  'Πληρωμή διαφημιστικής καμπάνιας',
  'Αγορά αναλωσίμων',
  'Σχεδιασμός λογοτύπου και εταιρικής ταυτότητας',
  'Μηνιαία χρέωση cloud hosting',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

export const generateMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const startDate = new Date('2023-10-01');
  const endDate = new Date();
  const usedSuppliers: string[] = [];

  // Ensure some suppliers are repeated
  usedSuppliers.push(SUPPLIERS[0]);
  usedSuppliers.push(SUPPLIERS[0]);
  usedSuppliers.push(SUPPLIERS[1]);
  usedSuppliers.push(SUPPLIERS[1]);
  usedSuppliers.push(SUPPLIERS[1]);
  usedSuppliers.push(SUPPLIERS[2]);
  usedSuppliers.push(SUPPLIERS[3]);
  usedSuppliers.push(SUPPLIERS[3]);

  while (usedSuppliers.length < 20) {
    usedSuppliers.push(getRandomElement(SUPPLIERS));
  }
  
  // Shuffle the suppliers array to make it random
  usedSuppliers.sort(() => Math.random() - 0.5);

  for (let i = 0; i < 20; i++) {
    const date = getRandomDate(startDate, endDate);
    const invoiceDate = new Date(date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(endDate.getDate() - 30);
    
    let status: Invoice['status'] = 'Paid';
    if (invoiceDate > thirtyDaysAgo) {
      status = 'Pending';
    } else if (invoiceDate > new Date(endDate.getTime() - 60 * 24 * 60 * 60 * 1000) && Math.random() > 0.6) {
      status = 'Overdue';
    }
    
    // Older invoices are more likely to be paid
    if (invoiceDate < thirtyDaysAgo) {
        if(Math.random() > 0.2) status = 'Paid';
        else status = 'Overdue';
    }

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      supplier: usedSuppliers[i],
      invoiceNumber: `INV-${2024 - Math.floor(i / 15)}-${1001 + i}`,
      date: date,
      amount: parseFloat((Math.random() * (1500 - 50) + 50).toFixed(2)),
      description: getRandomElement(DESCRIPTIONS),
      category: getRandomElement(CATEGORIES),
      status: status,
      createdAt: new Date(date).getTime(),
    };
    invoices.push(invoice);
  }

  return invoices;
};