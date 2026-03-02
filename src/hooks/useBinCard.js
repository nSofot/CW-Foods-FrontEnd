import { useEffect, useState } from 'react';
import axios from 'axios';

export function useBinCard(productId) {
    const [binCard, setBinCard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!productId) return;

        const controller = new AbortController();

        const fetchBinCard = async () => {
            setLoading(true);
            setError(null);
            setBinCard([]);

            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/productTransactions/productId/${productId}`,
                    { signal: controller.signal }
                );

                const transactions = res.data;

                if (!transactions.length) return;

                let runningBalance = 0;

                const formatted = transactions
                    .map((trx) => {
                        const item = trx.products?.find(p => p.productId === productId);
                        const qty = item?.quantity || 0;

                        const qtyIn = trx.isAdded ? qty : 0;
                        const qtyOut = trx.isAdded ? 0 : qty;

                        runningBalance += qtyIn - qtyOut;

                        return {
                            date: new Date(trx.transactionDate).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            }),
                            trxId: trx.referenceId,
                            type: trx.transactionType,
                            qtyIn: qtyIn.toFixed(2),
                            qtyOut: qtyOut.toFixed(2),
                            balance: runningBalance.toFixed(2),
                            createdAt: new Date(trx.createdAt)
                        };
                    })
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setBinCard(formatted);
            } catch (err) {
                if (err.name === 'CanceledError') return;
                console.error("Bin card fetch error:", err);
                setError(err?.response?.data?.message || "Failed to fetch bin card data.");
            } finally {
                setLoading(false);
            }
        };

        fetchBinCard();

        return () => controller.abort();
    }, [productId]);

    return { binCard, loading, error };
}
