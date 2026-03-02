import { useCustomerOutstanding } from "../hooks/useCustomerOutstanding.js";
import { useEffect } from "react";

export default function CustomerOutstandingView({ 
        customerId,
        toDate,
        setOutstandingData,
        setOverDuesData,
        setToDate
    }) {

    if (!toDate && setToDate) {
        const today = new Date().toISOString().split("T")[0];
        setToDate(today);
    }

    const { outstanding, overDues, loading, error } = useCustomerOutstanding(customerId, toDate);

    useEffect(() => {
        setOutstandingData && setOutstandingData(outstanding);
        setOverDuesData && setOverDuesData(overDues);
    }, [outstanding, overDues]);



    if (!customerId) {
        return <p className="text-gray-500 px-4 py-2">No customer selected</p>;
    }

    if (loading) return <p className="text-gray-500 px-4 py-2">Loading Statement...</p>;
    if (error) return <p className="text-red-500 px-4 py-2">{error}</p>;

    return (
        <div className="w-full h-full text-sm text-gray-700 rounded bg-gray-50 shadow">
            <div className="flex items-center justify-between px-4 py-2">
                <span className="bg-green-100 text-green-800 rounded p-2">
                    <strong>Current:</strong>  {overDues.currentMonth}</span>
                <span className="bg-blue-100 text-blue-800 rounded p-2">
                    <strong> 30+ Days:</strong> {overDues.over30days}</span>
                <span className="bg-purple-100 text-purple-800 rounded p-2">
                    <strong> 60+ Days:</strong>  {overDues.over60days}</span>
                <span className="bg-orange-100 text-orange-800 rounded p-2">
                    <strong> 90+ Days: </strong> {overDues.over90days}</span>
                <span className="bg-red-100 text-red-800 rounded p-2">
                    <strong> 120+ Days: </strong> {overDues.over120days}</span>
                <span className="bg-gray-300 text-gray-800 rounded p-2">
                    <strong> Total: </strong> {overDues.overTotal}</span>                    
                <span className="text-xs text-gray-800">{outstanding.length} Records</span>
            </div>
            {/* Header Row */}
            <div className="mt-2 grid grid-cols-[100px_130px_150px_240px_110px_110px_80px] font-semibold bg-gray-200 px-4 py-2">
                <span>Date</span>
                <span>Reference No</span>
                <span>Transaction Type</span>
                <span>Reference</span>
                <span className="text-right">Trx.Amount</span>
                <span className="text-right">Due Amount</span>
                <span className="text-right">Overdue</span>
            </div>

            {/* Scrollable Data */}
            <div className="overflow-y-auto h-[calc(52vh-48px)]">
                {outstanding.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4 py-2">No Customer Transaction Records available.</p>
                ) : (
                    <div className="text-sm text-gray-800">
                        {outstanding.map((b, idx) => (
                            <div
                                key={b.trxId || idx}
                                className="grid grid-cols-[100px_130px_150px_240px_110px_110px_80px] px-4 py-2 border-b border-gray-200 hover:bg-gray-100"
                            >
                                <span>{b.date}</span>
                                <span>{b.trxId}</span>
                                <span>{b.type}</span>
                                <span>{b.reference}</span>
                                <span className="text-right">{b.trxAm === "0.00" ? "—" : b.trxAm}</span>
                                <span className="text-right">{b.dueAm === "0.00" ? "—" : b.dueAm}</span>
                                {/* <span className="text-right">{b.overDueDays} days</span> */}
                                <span
                                    className={`text-right ${
                                        b.overDueDays > 120
                                        ? "text-red-600"
                                        : b.overDueDays > 90
                                        ? "text-orange-600"
                                        : b.overDueDays > 60
                                        ? "text-purple-600"
                                        : b.overDueDays > 30
                                        ? "text-blue-600"
                                        : "text-green-600"
                                    }`}
                                    >
                                    {b.overDueDays} days
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
