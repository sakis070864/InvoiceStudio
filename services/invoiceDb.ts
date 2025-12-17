import { Invoice, DatabaseMeta } from '../types';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const DB_COLLECTION = 'databases';
const INVOICE_COLLECTION = 'invoices';

export const InvoiceDb = {
  // Get list of all available databases
  getDatabases: async (): Promise<DatabaseMeta[]> => {
    try {
      const q = query(collection(db, DB_COLLECTION), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const dbs: DatabaseMeta[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        createdAt: doc.data().createdAt
      }));

      // If no databases exist, create a default one
      if (dbs.length === 0) {
        return [await InvoiceDb.createDatabase('Κύρια Βάση Δεδομένων')];
      }
      
      return dbs;
    } catch (e) {
      console.error("Firestore DB fetch error", e);
      // Fallback for UI if config is wrong
      return [{ id: 'error', name: 'Σφάλμα Σύνδεσης Firebase', createdAt: Date.now() }];
    }
  },

  // Create a new database (metadata)
  createDatabase: async (name: string): Promise<DatabaseMeta> => {
    try {
      const newDbData = {
        name,
        createdAt: Date.now() // using number to match type, or could use serverTimestamp()
      };
      const docRef = await addDoc(collection(db, DB_COLLECTION), newDbData);
      return {
        id: docRef.id,
        ...newDbData
      };
    } catch (e) {
      console.error("Error creating database", e);
      throw e;
    }
  },

  // Get invoices for a specific database ID
  getInvoices: async (dbId: string): Promise<Invoice[]> => {
    try {
      if (!dbId || dbId === 'error') return [];
      
      const q = query(
        collection(db, INVOICE_COLLECTION), 
        where('databaseId', '==', dbId)
      );
      
      const querySnapshot = await getDocs(q);
      const invoices: Invoice[] = [];
      
      querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() } as Invoice);
      });

      // Client-side sort by date desc as default
      return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error(`Firestore invoices fetch error for ${dbId}`, e);
      return [];
    }
  },

  // Add a single invoice
  addInvoice: async (dbId: string, invoice: Omit<Invoice, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, INVOICE_COLLECTION), {
        ...invoice,
        databaseId: dbId
      });
      return { ...invoice, id: docRef.id };
    } catch (e) {
      console.error("Error adding invoice", e);
      throw e;
    }
  },

  // Update a single invoice
  updateInvoice: async (invoiceId: string, data: Partial<Invoice>) => {
    try {
      const invoiceRef = doc(db, INVOICE_COLLECTION, invoiceId);
      // Remove id from data if present to avoid writing it to the doc field
      const { id, ...updateData } = data; 
      await updateDoc(invoiceRef, updateData);
    } catch (e) {
      console.error("Error updating invoice", e);
      throw e;
    }
  },

  // Delete a single invoice
  deleteInvoice: async (invoiceId: string) => {
    try {
      await deleteDoc(doc(db, INVOICE_COLLECTION, invoiceId));
    } catch (e) {
      console.error("Error deleting invoice", e);
      throw e;
    }
  },

  // Batch add invoices (for import)
  batchAddInvoices: async (dbId: string, invoices: Omit<Invoice, 'id'>[]) => {
    try {
      const batch = writeBatch(db);
      
      invoices.forEach(inv => {
        const docRef = doc(collection(db, INVOICE_COLLECTION));
        batch.set(docRef, { ...inv, databaseId: dbId });
      });

      await batch.commit();
    } catch (e) {
      console.error("Batch add error", e);
      throw e;
    }
  },
  
  // Delete a database and its invoices
  deleteDatabase: async (dbId: string) => {
    try {
        // 1. Delete the database metadata
        await deleteDoc(doc(db, DB_COLLECTION, dbId));
        
        // 2. Delete all invoices associated with this DB
        // Note: Client-side deletion of many docs is not recommended for huge datasets,
        // but works for this scale.
        const q = query(
            collection(db, INVOICE_COLLECTION), 
            where('databaseId', '==', dbId)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

    } catch(e) {
        console.error("Delete DB error", e);
        throw e;
    }
  }
};