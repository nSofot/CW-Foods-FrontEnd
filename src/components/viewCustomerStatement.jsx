import { useCustomerStatement } from "../hooks/useCustomerStatement.js";
import { useCustomerOutstanding } from "../hooks/useCustomerOutstanding.js";
import { useEffect } from "react";

export default function CustomerStatementView({     
        customerId,
        fromDate,
        toDate,
        setStatementData,
        setOverDuesData,
        setFromDate,
        setToDate
    }) {

    useEffect(() => {
        if (!fromDate && setFromDate) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const yyyy = firstDay.getFullYear();
            const mm = String(firstDay.getMonth() + 1).padStart(2, '0');
            const dd = String(firstDay.getDate()).padStart(2, '0');
            const formattedFrom = `${yyyy}-${mm}-${dd}`;
            setFromDate(formattedFrom);
        }

        if (!toDate && setToDate) {
            const today = new Date().toISOString().split("T")[0];
            setToDate(today);
        }
    }, []);

    const { statement, loading, error } = useCustomerStatement(customerId, fromDate, toDate);
    const { outstanding, overDues, loading2, error2 } = useCustomerOutstanding(customerId, toDate);

    useEffect(() => {
        setStatementData && setStatementData(statement);
        setOverDuesData && setOverDuesData(overDues);
    }, [statement, overDues]);

    const validate = (start, end) => {
        if (start && end && new Date(start) > new Date(end)) {
            setError("From Date must be earlier than or equal to To Date");
        }
    };


    return (
        <>
            <div className='w-[30%] gap-6 flex mb-2'>
                <div className="flex-1">
                    <label className="text-sm font-medium block">From Date</label>
                    <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFromDate(val);
                        validate(val, toDate);
                    }}
                    max={toDate || undefined}
                    className="w-full text-sm bg-white border border-gray-400 rounded-md px-4 py-1 focus:outline-blue-500"
                    />
                </div>

                <div className="flex-1">
                    <label className="text-sm font-medium block">To Date</label>
                    <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                        const val = e.target.value;
                        setToDate(val);
                        validate(fromDate, val);
                    }}
                    min={fromDate || undefined}
                    className="w-full text-sm bg-white border border-gray-400 rounded-md px-4 py-1 focus:outline-blue-500"
                    />
                </div>
            </div>


            {loading && <p>Loading...</p>}
            {/* {error && <p>{error}</p>} */}

            <div className="flex text-sm items-center justify-between px-4 py-2">
                <span className="bg-green-600 text-white rounded p-2">
                    <strong>Current:</strong>  {overDues.currentMonth}</span>
                <span className="bg-blue-600 text-white rounded p-2">
                    <strong> 30+ Days:</strong> {overDues.over30days}</span>
                <span className="bg-purple-600 text-white rounded p-2">
                    <strong> 60+ Days:</strong>  {overDues.over60days}</span>
                <span className="bg-orange-400 text-white rounded p-2">
                    <strong> 90+ Days: </strong> {overDues.over90days}</span>
                <span className="bg-red-600 text-white rounded p-2">
                    <strong> 120+ Days: </strong> {overDues.over120days}</span>
                <span className="bg-gray-600 text-white rounded p-2">
                    <strong> Total: </strong> {overDues.overTotal}</span>                    
                <span className="text-xs text-gray-800">{statement.length} Records</span>
            </div>

            <div  className="h-[45vh] overflow-y-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-tableHeader text-tableHeaderText sticky top-0 z-10">
                        <tr className="font-semibold">
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2 text-right">Debit</th>
                            <th className="px-4 py-2 text-right">Credit</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                        </tr>
                    </thead>
                
                    {statement.length === 0 ? (
                        <thead>
                            <tr>
                            <th colSpan="100%" className="text-sm text-gray-500 px-4 py-2">
                                No Customer Transaction Records available.
                            </th>
                            </tr>
                        </thead>                        
                        // <p className="text-sm text-gray-500 px-4 py-2">No Customer Transaction Records available.</p>
                    ) : (
                        <tbody>
                            {statement.map((row, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2">{row.date}</td>
                                    <td className="px-4 py-2">{row.trxId}</td>
                                    <td className="px-4 py-2">{row.trxType}</td>
                                    <td className="px-4 py-2">{row.description}</td>
                                    <td className="px-4 py-2 text-right">{row.debit}</td>
                                    <td className="px-4 py-2 text-right">{row.credit}</td>
                                    <td className="px-4 py-2 text-right">{row.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    )}              
                </table>
            </div>
        </>
    );
}

