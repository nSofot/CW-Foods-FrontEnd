import { useCashbook } from "../hooks/useCashbook";

export default function ViewCashbook({ accountId, fromDate, toDate }) {
    const { cashbook, loading, error } = useCashbook(accountId, fromDate, toDate);

    if (!accountId) {
        return <p className="text-gray-500 px-4 py-2">No account selected</p>;
    }

    if (loading) return <p className="text-gray-500 px-4 py-2">Loading cash book...</p>;
    if (error) return <p className="text-red-500 px-4 py-2">{error}</p>;

    return (
        <div className="w-full h-full text-sm text-gray-700 rounded bg-gray-50 shadow">
            {/* Header Row */}
            <div className="grid grid-cols-[40px_100px_120px_120px_280px_120px_120px_120px] font-semibold bg-gray-200 px-4 py-2">
                <span>Idx.</span>
                <span>Date</span>
                <span>Reference</span>
                <span>Type</span>
                <span>Description</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span className="text-right">Balance</span>
            </div>

            {/* Scrollable Data */}
            <div className="overflow-y-auto h-[calc(60vh-48px)]">
                {cashbook.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4 py-2">No Transaction Records available.</p>
                ) : (
                    <div className="text-sm text-gray-800">
                        {cashbook.map((b, idx) => (
                            <div
                                key={b.trxId || idx}
                                className="grid grid-cols-[40px_100px_120px_120px_280px_120px_120px_120px] px-4 py-2 border-b border-gray-200 hover:bg-gray-100"
                            >
                                <span>{idx+1}</span>
                                <span>{b.date}</span>
                                <span>{b.trxId}</span>
                                <span>{b.trxType}</span>
                                <span>{b.description}</span>
                                <span className="text-right">{b.debit === "0.00" ? "—" : b.debit}</span>
                                <span className="text-right">{b.credit === "0.00" ? "—" : b.credit}</span>
                                <span className="text-right">{b.balance}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
