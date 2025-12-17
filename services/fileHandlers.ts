import { Invoice, InvoiceFormData } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI, Type } from "@google/genai";

// --- EXPORT LOGIC ---

function escapeCsvCell(cell: any): string {
  const cellStr = String(cell).replace(/"/g, '""');
  return `"${cellStr}"`;
}

export function exportToCsv(invoices: Invoice[], dbName: string) {
  const headers = ['supplier', 'invoiceNumber', 'date', 'amount', 'category', 'status', 'description'];
  const csvRows = [
    headers.join(','),
    ...invoices.map(inv =>
      headers.map(header => escapeCsvCell(inv[header as keyof Invoice])).join(',')
    )
  ];
  
  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDbName = dbName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `invoices_${safeDbName}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Helper to load font for Unicode support
async function loadCustomFont(doc: jsPDF) {
  try {
    // Fetch Roboto-Regular which supports Greek
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    const blob = await response.blob();
    
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          doc.addFileToVFS('Roboto-Regular.ttf', base64data);
          doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
          doc.setFont('Roboto');
          resolve();
        } else {
            reject(new Error("Could not read font file"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Error loading custom font. PDF may not display Greek characters correctly.', error);
  }
}

export async function exportToPdf(invoices: Invoice[], dbName: string, stats: any) {
    const doc = new jsPDF();
    
    // Load font before writing text
    await loadCustomFont(doc);

    const tableColumns = ["Date", "Supplier", "Invoice #", "Category", "Status", "Amount (€)"];
    const tableRows = invoices.map(inv => [
        new Date(inv.date).toLocaleDateString('el-GR'),
        inv.supplier,
        inv.invoiceNumber,
        inv.category,
        STATUS_MAP_EXPORT[inv.status] || inv.status, // Translate status
        inv.amount.toLocaleString('el-GR', { minimumFractionDigits: 2 })
    ]);

    doc.setFontSize(18);
    doc.text(`Invoice Report: ${dbName}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('el-GR')}`, 14, 29);

    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 35,
        headStyles: { fillColor: [22, 160, 133] },
        styles: { 
            fontSize: 8,
            font: 'Roboto', // Critical for table content
            fontStyle: 'normal'
        },
        margin: { top: 30 }
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 35; // Fallback to startY if undefined
    
    // Add some spacing
    finalY += 15;

    // Calculate date range
    let dateRangeText = "";
    if (invoices.length > 0) {
        const timestamps = invoices.map(inv => new Date(inv.date).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const minDate = new Date(minTime).toLocaleDateString('el-GR');
        const maxDate = new Date(maxTime).toLocaleDateString('el-GR');
        dateRangeText = `Period: ${minDate} - ${maxDate}`;
    }

    doc.setFontSize(12);
    doc.setTextColor(0); // Reset to black
    doc.text("Summary", 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Invoices: ${stats.totalCount}`, 14, finalY + 7);
    doc.text(`Total Amount: €${stats.totalAmount.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`, 14, finalY + 14);
    doc.text(`Paid: ${stats.paidCount} | Pending: ${stats.pendingCount} | Overdue: ${stats.overdueCount}`, 14, finalY + 21);
    
    if (dateRangeText) {
        doc.text(dateRangeText, 14, finalY + 28);
    }

    const safeDbName = dbName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`invoices_${safeDbName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

const STATUS_MAP_EXPORT: Record<string, string> = {
  Pending: 'Σε εκκρεμότητα',
  Paid: 'Πληρωμένο',
  Overdue: 'Εκπρόθεσμο',
};


// --- IMPORT LOGIC ---

type ImportedInvoiceData = Omit<InvoiceFormData, 'status'>;

export function importFromCsv(file: File): Promise<ImportedInvoiceData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            return resolve([]);
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['supplier', 'invoiceNumber', 'date', 'amount'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error('CSV file is missing required headers (supplier, invoiceNumber, date, amount).');
        }

        const invoices: ImportedInvoiceData[] = lines.slice(1).map(line => {
          const values = line.split(','); // simple parse, assumes no commas in values
          const entry = headers.reduce((obj, header, index) => {
            obj[header] = values[index]?.replace(/"/g, '').trim() || '';
            return obj;
          }, {} as any);
          
          return {
              supplier: entry.supplier,
              invoiceNumber: entry.invoiceNumber,
              date: new Date(entry.date).toISOString().split('T')[0],
              amount: parseFloat(entry.amount),
              description: entry.description || '',
              category: entry.category || 'Γενικά',
          };
        });
        resolve(invoices.filter(inv => inv.supplier && inv.invoiceNumber && inv.date && inv.amount > 0));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsText(file);
  });
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash';

const CATEGORIES = ['Υλικά', 'Εργατικά', 'Γενικά', 'Πάγια Έξοδα', 'Υπηρεσίες', 'Λογισμικό', 'Ταξίδια'];

const schema = {
  type: Type.OBJECT,
  properties: {
    invoices: {
      type: Type.ARRAY,
      description: "An array of invoice objects extracted from the document.",
      items: {
        type: Type.OBJECT,
        properties: {
          supplier: { type: Type.STRING, description: "The name of the company sending the invoice." },
          invoiceNumber: { type: Type.STRING, description: "The unique identifier for the invoice." },
          date: { type: Type.STRING, description: "The issue date of the invoice in YYYY-MM-DD format." },
          amount: { type: Type.NUMBER, description: "The final total amount of the invoice, including taxes." },
          description: { type: Type.STRING, description: "A brief summary of the items or services." },
          category: { type: Type.STRING, description: `Classify the invoice into one of the following categories: ${CATEGORIES.join(', ')}` },
        },
        required: ["supplier", "invoiceNumber", "date", "amount"]
      }
    }
  }
};

export async function importFromPdf(file: File): Promise<ImportedInvoiceData[]> {
  try {
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze the provided invoice PDF. Extract all relevant invoice details for every invoice in the document. The total amount must be the final amount, including any taxes or VAT. Return the data as a JSON object that strictly follows the provided schema. Ensure the date is in YYYY-MM-DD format.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    if (!response.text) {
        throw new Error("The AI model did not return any text. The invoice might be unreadable.");
    }
    
    // Clean up potential markdown formatting
    const cleanedJson = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    if (!parsed.invoices || !Array.isArray(parsed.invoices)) {
      throw new Error("AI response did not contain a valid 'invoices' array.");
    }
    
    return parsed.invoices.map((inv: any) => ({
        ...inv,
        category: CATEGORIES.includes(inv.category) ? inv.category : 'Γενικά',
    }));

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to process PDF with AI. Please check the console for details.");
  }
}