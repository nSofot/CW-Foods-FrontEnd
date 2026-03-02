import { useEffect, useState } from 'react';
import axios from 'axios';

// ✅ Reusable fetch function for use outside React components
export async function fetchSupplierOutstanding(supplierId) {  
    try { 
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/SupplierTransactions/supplier/pending/${supplierId}`);
        const today = new Date();
        
        let current = 0;
        let over30 = 0;
        let over60 = 0;
        let over90 = 0;
        let over120 = 0;

        const invoices = response.data;

        invoices.forEach(inv => {
            const invoiceDate = new Date(inv.transactionDate);
            const diffTime = today - invoiceDate;
            const overDueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const due = Number(inv.dueAmount || 0);

            if (due > 0) {
                if (overDueDays > 120) over120 += due;
                else if (overDueDays > 90) over90 += due;
                else if (overDueDays > 60) over60 += due;
                else if (overDueDays > 30) over30 += due;
                else current += due;
            }
        });

        return {
            current,
            over30,
            over60,
            over90,
            over120,
            total: current + over30 + over60 + over90 + over120
        };
    } catch (error) {
        // console.error(`❌ Failed to fetch outstanding for customer ${customerId}:`, error);
        return {
            current: 0,
            over30: 0,
            over60: 0,
            over90: 0,
            over120: 0,
            total: 0
        };
    }
}

// ✅ React hook for usage in customer profile or statement page
export function useSupplierOutstanding(supplierId) {
    const [outstanding, setOutstanding] = useState([]);
    const [overDues, setOverDues] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supplierId) return;

        async function fetchData() {
            setLoading(true);
            setError(null);
            setOutstanding([]);

            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/supplierTransactions/supplier/pending/${supplierId}`);
                const invoices = res.data;
                const today = new Date();

                let currentMonth = 0;
                let over30days = 0;
                let over60days = 0;
                let over90days = 0;
                let over120days = 0;
                if (invoices.length === 0) {
                    setOutstanding([]);
                    return;
                }
                const invoiceData = invoices.map((inv) => {
                    const invoiceDate = new Date(inv.transactionDate);
                    const diffTime = today - invoiceDate;
                    const overDueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const due = inv.dueAmount || 0;

                    if (due > 0) {
                        if (overDueDays > 120) over120days += due;
                        else if (overDueDays > 90) over90days += due;
                        else if (overDueDays > 60) over60days += due;
                        else if (overDueDays > 30) over30days += due;
                        else currentMonth += due;
                    }

                    return {
                        date: invoiceDate.toISOString(),
                        trxId: inv.referenceNumber,
                        type: inv.transactionType,
                        reference: inv.description,
                        trxAm: inv.amount,
                        dueAm: inv.dueAmount,
                        balance: 0,
                        overDueDays,
                        createdAt: inv.createdAt
                    };
                });

                const merged = [...invoiceData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                let runningBalance = 0;

                const processed = merged.map(entry => {
                    const dueAm = Number(entry.dueAm) || 0;
                    runningBalance += dueAm;

                    return {
                        ...entry,
                        balance: runningBalance
                    };
                });

                processed.forEach(entry => {
                    entry.date = new Date(entry.date).toLocaleDateString('en-US');
                    entry.trxAm = Number(entry.trxAm).toLocaleString('en-US', { minimumFractionDigits: 2 });
                    entry.dueAm = Number(entry.dueAm).toLocaleString('en-US', { minimumFractionDigits: 2 });
                    entry.balance = Number(entry.balance).toLocaleString('en-US', { minimumFractionDigits: 2 });
                });

                setOutstanding(processed);
                setOverDues({
                    currentMonth: currentMonth.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    over30days: over30days.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    over60days: over60days.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    over90days: over90days.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    over120days: over120days.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    overTotal: (currentMonth + over30days + over60days + over90days + over120days).toLocaleString('en-US', { minimumFractionDigits: 2 })
                });
            } catch (err) {
                // setError("Failed to fetch customer statement data."+{customerId});
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [supplierId]);

    return { outstanding, overDues, loading, error };
}