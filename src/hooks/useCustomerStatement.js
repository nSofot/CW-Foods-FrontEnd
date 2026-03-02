import { useEffect, useState } from 'react';
import axios from 'axios';

export function useCustomerStatement(customerId, fromDate, toDate) {
    const [statement, setStatement] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!customerId || !fromDate || !toDate) return;

        async function fetchStatement() {
            setLoading(true);
            setError(null);
            setStatement([]);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/customerTransaction/customer/${customerId}`
                );
                const rows = transformStatement(response.data, fromDate, toDate);
                setStatement(rows);
            } catch (err) {
                setError("Failed to fetch customer statement data.");
            } finally {
                setLoading(false);
            }
        }
        fetchStatement();
    }, [customerId, fromDate, toDate]);

    function transformStatement(data, fromDate, toDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        const beforeStart = [];
        const inRange = [];

        for (const trx of data) {
            const d = new Date(trx.transactionDate);
            if (d < start) beforeStart.push(trx);
            else if (d <= end) inRange.push(trx);
        }

        const bfAmount = beforeStart.reduce(
            (sum, t) => sum + (t.isCredit === false ? t.amount : -t.amount),
            0
        );

        let rows = [];
        let running = 0;

        // ✅ Only add Balance B/F if non-zero
        if (bfAmount !== 0) {
            const bfRow = makeRow(
                {
                    transactionDate: start,
                    referenceNumber: "B/F",
                    transactionType: "Balance B/F",
                    description: "As At " + start.toLocaleDateString("en-GB"),
                    trxAmount: Math.abs(bfAmount),
                    isCredit: bfAmount < 0,
                    createdAt: start,
                },
                bfAmount
            );
            rows.push(bfRow);
            running = bfAmount;
        }

        const mapped = inRange
            .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
            .map(trx => {
                const amt = trx.amount;
                running += trx.isCredit ? -amt : amt;
                return makeRow({ ...trx, trxAmount: amt }, running);
            });

        return [...rows, ...mapped];
    }
    

    function makeRow(trx, runningBalance) {
        const isCredit = trx.isCredit;

        return {
            date: new Date(trx.transactionDate).toLocaleDateString("en-GB"), // dd/mm/yyyy
            trxId: trx.referenceNumber,
            trxType: trx.transactionType || "",
            description: trx.description || "",
            debit: !isCredit
                ? trx.trxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : "",
            credit: isCredit
                ? trx.trxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : "",
            balance: runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 }),
            createdAt: new Date(trx.createdAt),
        };
    }

    return { statement, loading, error };
}
