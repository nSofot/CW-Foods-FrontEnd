// src/pages/customer/customerPaymentsPage.jsx
import LoadingSpinner from "../../components/loadingSpinner";
import { useCustomerOutstanding } from "../../hooks/useCustomerOutstanding";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import Modal from "react-modal";
import { toWords } from "number-to-words";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export default function CustomerAdjustmentPage() {
    const navigate = useNavigate();

    /* --------------------- top‑level state --------------------- */
    const [isLoading, setIsLoading] = useState(true);

    const [customers, setCustomers] = useState([]);
    const [customerQuery, setCustomerQuery] = useState("");
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [amountInWords, setAmountInWords] = useState("");
    const [unsettledAmount, setUnsettledAmount] = useState(0);

    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const token = localStorage.getItem("token");
    

    const [trxDetails, setTrxDetails] = useState({
        customerId: "",
        customerName: "",
        customerAddress: "",
        customerMobile: "",
        customerTitle: "",
        customerBalance: 0,

        adjustmentDate: new Date().toISOString().split("T")[0],
        adjustmentType: "",
        notes: "",

        adjustmentAmount: "",
        receiptAmount: 0,
    });

    /* --------------------- outstanding via hook --------------------- */
    const {
        outstanding,
        overDues,
        loading: dueLoading,
        error: dueError,
    } = useCustomerOutstanding(trxDetails.customerId);

    const [dueData, setDueData] = useState({
        outstanding: [],
        overDues: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        const sorted = [...outstanding]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((t) => ({ ...t, paid: 0 }));
        setDueData({
        outstanding: sorted,
        overDues,
        loading: dueLoading,
        error: dueError,
        });
    }, [outstanding, overDues, dueLoading, dueError]);


    // replaces the old handleTogglePaid
    const handleTogglePaid = (rowIdx, checked) => {
        if (trxDetails.adjustmentType !== "Credit Note") return;

        setDueData(prev => {
            const next = [...prev.outstanding];
            const current = next[rowIdx];

            let remaining = unsettledAmount;

            if (checked) {
                if (remaining <= 0) return prev;
                const due = parseFloat(String(current.dueAm).replace(/,/g, '')) || 0;
                const pay = Math.min(due, remaining);
                next[rowIdx] = { ...current, paid: pay };
                remaining -= pay;
            } else {
                remaining += current.paid || 0;
                next[rowIdx] = { ...current, paid: 0 };
            }

            setUnsettledAmount(remaining);
            return { ...prev, outstanding: next };
        });
    };



    /* --------------------- helper: recalc receipt total -------- */
    const updateAmount = useCallback((value) => {
        setTrxDetails(prev => ({
            ...prev,
            adjustmentAmount: value,  // ✅ fix here
            receiptAmount: value      // optional: only if needed
        }));
        setDueData(prev => ({
            ...prev,
            outstanding: prev.outstanding.map(t => ({ ...t, paid: 0 }))
        }));
    }, []);



    /* --------------------- fetch customers --------------------- */
    useEffect(() => {
    const fetchCustomers = async () => {
        try {
        const token = localStorage.getItem("token"); // or sessionStorage, depending on where you store it
        const url = customerQuery.trim()
            ? `${import.meta.env.VITE_BACKEND_URL}/api/customer/search?query=${customerQuery}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/customer`;

        const { data } = await axios.get(url, {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        });

        setCustomers(data);
        } catch (err) {
        console.error("Error fetching customers:", err);
        toast.error("Failed to fetch customers.");
        } finally {
        setIsLoading(false);
        }
    };

    if (isLoading || customerQuery === "") fetchCustomers();
    }, [isLoading, customerQuery]);



    /* ------------------ amount in words ------------------------ */
    useEffect(() => {
        const amt = parseFloat(trxDetails.receiptAmount);
        setUnsettledAmount(amt);
        if (!isNaN(amt) && amt > 0) {
        const rupees = Math.floor(amt);
        const cents = Math.round((amt - rupees) * 100);
        setAmountInWords(
            `${toWords(rupees)} Rupees${cents ? ` and ${toWords(cents)} Cents` : ""}`
        );
        } else setAmountInWords("");
    }, [trxDetails.receiptAmount]);


    /* ───────── add just below other hooks (before return) ───────── */
    const handleSubmit = async () => {
        const errors = {}; // ⭐ collect all failures here

        /* 1️⃣ Basic Required Fields */
        if (!trxDetails.adjustmentDate)         errors.adjustmentDate   = true;
        if (!trxDetails.customerId)             errors.customerId    = true;
        if (!trxDetails.adjustmentType)         errors.adjustmentType = true;
        if (trxDetails.adjustmentAmount <= 0)   errors.adjustmentAmount = true;

        /* 2️⃣ Payment Type Validation */
        

        /* 3️⃣ Unsettled Allocation Validation */
        if (trxDetails.adjustmentType === "Credit Note") {
            const receiptAmt  = parseFloat(trxDetails.adjustmentAmount)  || 0;
            const custBalance = parseFloat(trxDetails.customerBalance) || 0;
            const expectedUn  = receiptAmt <= custBalance ? 0 : (receiptAmt - custBalance);

            if (Math.abs(unsettledAmount - expectedUn) > 0.001) {
                errors.unsettled = true;
            }            
        } 

        /* 4️⃣ Show Field Highlights + Toast */
        setFormErrors(errors);
        if (Object.keys(errors).length) {
            // Prioritized toast messaging for clarity
            if (errors.adjustmentDate) {
                toast.error("Please select a valid date.");
            } else if (errors.adjustmentType) {
                toast.error("Please select a valid adjustment type.");
            } else if (errors.customerId) {
                toast.error("Please select a customer before submitting.");
            } else if (errors.adjustmentAmount) {
                toast.error("Enter a valid adjustment amount greater than zero.");
            } else if (errors.unsettled) {
                toast.error("Distribute the payment to one or more overdue transactions.");
            } else {
                toast.error("Please correct the highlighted fields.");
            }
            return; // ⛔ block save
        }


        // ✅ await axios.post(...); 
        let trxType = "";
        if (trxDetails.adjustmentType === "Credit Note") {
            trxType = "credit_note";
        } else {
            trxType = "debit_note";
        }
        try {
            const amount = Number(trxDetails.adjustmentAmount) || 0;
            let latestReceiptId = ""; 
            if (amount > 0) {
                // 1️⃣ update customer balance
                    const updates = {
                        customerId: trxDetails.customerId,
                        amount
                    };
                    try {
                        if (trxDetails.adjustmentType === "Credit Note") {
                            await axios.put(
                                `${import.meta.env.VITE_BACKEND_URL}/api/customer/subtractBalance`,
                                { updates: [updates] },
                                { headers: { Authorization: "Bearer " + token } }
                            );
                        } else {
                            await axios.put(
                                `${import.meta.env.VITE_BACKEND_URL}/api/customer/addBalance`,
                                { updates: [updates] },
                                { headers: { Authorization: "Bearer " + token } }
                            );
                        }
                    }
                    catch (err) {
                        console.error(
                            `1️⃣❌ Failed to update customer balance: ${err.response?.data?.message || err.message}`
                        );
                    }
                // 2️⃣ save customer transaction
                    const payload = {
                        customerId: trxDetails.customerId,
                        transactionType: trxType,
                        transactionDate: trxDetails.adjustmentDate,
                        amount: trxDetails.adjustmentAmount,
                        isCredit: trxType === "credit_note" ? true : false,
                        relatedTransactionIds: "",
                        description: trxDetails.notes,
                        dueAmount: trxDetails.adjustmentAmount
                    };
                    try {
                        const res = await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL}/api/customerTransactions`,
                            payload,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        latestReceiptId = res.data.referenceNumber
                    }
                    catch (err) {
                        console.error(
                            `2️⃣❌ Failed to save customer transaction: ${err.response?.data?.message || err.message}`
                        );
                    }

                // 3️⃣ Sequentially update customer overdue transactions
                    for (const trx of dueData.outstanding) {
                        if (!trx.paid || trx.paid <= 0) continue;

                        const invoiceId = trx.trxId;
                        const paidAmount = trx.paid;
                        const trxMode = invoiceId.substring(0, 3); // Get first 3 characters

                        try {
                            await axios.put(
                                `/api/customerTransactions/overdue/${invoiceId}/pay`,
                                { paidAmount },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                        } catch (err) {
                            console.error(
                                `3️⃣❌ Failed to update invoice ${invoiceId}: ${err.response?.data?.message || err.message}`
                            );
                        }
                    }


                    // 5️⃣ update Ledger Account
                    if (amount > 0) {
                        const accountId = "115-0001"; // Trade Debtors
                        const updates = {
                            accountId,
                            amount: parseFloat(amount),
                        };

                        try {
                            // 5️⃣1️⃣🔄 Update cashbook account balance
                            if (trxDetails.adjustmentType === "Credit Note") {
                                await axios.put(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/accounts/subtract-balance`,
                                    { updates: [updates] },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );    
                            } else {
                                await axios.put(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/accounts/add-balance`,
                                    { updates: [updates] },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                            }
                        } catch (err) {
                            console.error("5️⃣1️⃣❌ Failed to update cashbook balance:", err.response?.data || err.message);
                        }

                        if (latestReceiptId) {
                            const accPayload = {
                                trxId: latestReceiptId,
                                trxDate: trxDetails.adjustmentDate,
                                transactionType: trxType,
                                accountId: accountId,
                                description: trxDetails.notes,
                                trxType: trxDetails.adjustmentType === "Credit Note" ? "Credit" : "Debit",
                                trxAmount: parseFloat(amount),
                            };
                            try {
                                // 5️⃣2️⃣ Save account transaction entry
                                await axios.post(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/accountTransactions`,
                                    accPayload,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                            } catch (err) {
                                console.error(
                                    "5️⃣2️⃣❌ Failed to save cashbook transaction:",
                                    err.response?.data || err.message
                                );
                            }
                        } else {
                            console.warn("5️⃣2️⃣⚠️ Skipped saving transaction: missing receipt number.");
                        }
                    }

                // ✅ Submit successful
            }
    
        } 
        catch (err) {
            console.error("Submit failed:", err);
            toast.error("Failed to submit customer adjustment. Please try again.");
        }

        toast.success("Customer adjustment submitted successfully!");

        // 9️⃣  reset form
        resetForm();
    };

    const resetForm = () => {
        setTrxDetails({
            customerId: "",
            customerName: "",
            customerAddress: "",
            customerMobile: "",
            customerTitle: "",
            customerBalance: 0,

            adjustmentDate: new Date().toISOString().split("T")[0],

            adjustmentType: "",
            notes: "",

            adjustmentAmount: "",
            receiptAmount: 0,
        });

        setDueData({
            outstanding: [],
            overDues: [],
            loading: false,
            error: null,
        });
  
        setCustomerQuery(""); 
        setIsCustomerModalOpen(false);
        setIsSubmitting(false); 
        setAmountInWords("");
        setUnsettledAmount(0);
        setAccounts([]);
        setSelectedAccount("");
        setFormErrors({});
    };  


    /* --------------------------- render ------------------------ */
    return (
        <div className="hidden md:block w-full h-full bg-gray-100 p-6 rounded shadow">
            {/* header */}
            <div className="flex justify-between items-center">
                <div>
                <h1 className="text-xl font-semibold text-gray-800">
                    🧾📥📤 Customer Adjustments
                </h1>
                <p className="text-sm text-gray-600">
                    Manage credit and debit adjustments for individual customers.
                </p>
                </div>

                <div className="w-[40%] flex gap-4">
                    <button
                        className={`w-[300px] px-4 py-2 text-sm font-medium shadow bg-blue-500 text-white rounded 
                                    hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50`}
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            const id = toast.loading("Payment receipt submitting ....");
                            try {
                                await handleSubmit();
                            } finally {
                                toast.dismiss(id);
                                setIsSubmitting(false);
                            }
                        }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>    

                    <button
                        className="ml-10 w-[300px] px-4 py-2 text-sm font-medium shadow bg-yellow-500 text-buttonCancelText rounded hover:bg-yellow-600 active:bg-yellow-700"
                        onClick={() => {
                            resetForm();
                        }}
                    >
                        Refresh
                    </button>
  
                    <button
                        onClick={() => navigate("/")}
                        className="w-[300px] px-4 py-2 text-sm font-medium shadow rounded bg-gray-500 text-white hover:bg-gray-700 active:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* body */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="mt-4 w-full h-[87%] p-6 shadow rounded-lg border border-gray-400 flex gap-10">
                    {/* left column */}
                    <div className="w-[25%] h-full flex flex-col gap-8">
                        {/* date */}
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={trxDetails.adjustmentDate}
                                onChange={(e) =>
                                setTrxDetails({ ...trxDetails, adjustmentDate: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.adjustmentDate   ? 'border-red-500' : 'border-gray-400'}`}

                            />
                        </div>

                        <div className="w-full">
                            <label className="text-sm font-medium block mb-1">
                            Type
                            </label>
                            <select
                                value={trxDetails.adjustmentType || ""}
                                onChange={(e) => {
                                    const selectedType = e.target.value;
                                    setTrxDetails(prev => ({ ...prev, adjustmentType: selectedType }));

                                    if (selectedType !== "Credit Note") {
                                    setDueData(prev => ({
                                        ...prev,
                                        outstanding: prev.outstanding.map(t => ({ ...t, paid: 0 }))
                                    }));
                                    setUnsettledAmount(parseFloat(trxDetails.adjustmentAmount || 0));
                                    }
                                }}
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.adjustmentType   ? 'border-red-500' : 'border-gray-400'}`}
                                >
                                <option value="">-- Select Adjustment Type --</option>
                                <option value="Credit Note">Credit Note</option>
                                <option value="Debit Note">Debit Note</option>
                            </select>
                        </div>

                            
                        <div>
                            <div className="flex gap-2 mb-1">
                                <label className="text-sm font-medium">Customer</label>
                                <Search
                                className="w-5 h-5 text-blue-700 cursor-pointer rounded-md hover:text-white hover:bg-blue-700 active:bg-blue-900"
                                onClick={() => setIsCustomerModalOpen(true)}
                                />
                            </div>
                            <div                                 
                                className={`w-full min-h-[60px] h-auto text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.customerId   ? 'border-red-500' : 'border-gray-400'}`}
                                >
                                <p className="text-sm font-medium text-gray-600">
                                {trxDetails.customerTitle}
                                {trxDetails.customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                {trxDetails.customerAddress}
                                </p>
                            </div>
                        </div>


                        <div className="flex flex-col">
                            <label className="text-sm font-medium block mb-1">
                                Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={trxDetails.adjustmentAmount}
                                onChange={(e) => updateAmount(e.target.value)}
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.adjustmentAmount   ? 'border-red-500' : 'border-gray-400'}`}                                            
                            />
                        </div>  
                    </div>

                    {/* right column */}
                    <div className="w-[70%] h-full flex flex-col gap-4">
                        <div className="w-full">
                            <label className="text-sm font-medium block mb-1">
                            Notes
                            </label>
                            <textarea
                                value={trxDetails.notes}
                                onChange={(e) =>
                                    setTrxDetails({ ...trxDetails, notes: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.notes ? 'border-red-500' : 'border-gray-400'}`}
                                rows={2}
                            />
                        </div>

                        <div className="w-full flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <input
                                readOnly
                                tabIndex={-1}
                                value={`Rs. ${Number(trxDetails.receiptAmount || 0).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`}
                                className="text-md px-3 py-1 border rounded bg-gray-100 text-gray-800 w-[200px] focus:outline-none"
                                />
                                <p className="text-md font-medium text-gray-700">{amountInWords}</p>
                            </div>
                        </div>

                        {trxDetails.adjustmentType === "Credit Note" && (
                            <div className="w-full flex flex-col">
                                <div className="flex justify-between">                                
                                    <label className="text-sm font-medium">Due Transactions</label>
                                    <div className="flex justify-end gap-6">
                                        <label className="text-sm">Total Outstaning: <strong>{trxDetails.customerBalance.toFixed(2)}</strong></label>
                                        <label className="text-sm">Unsettled Amount: <strong>{unsettledAmount.toFixed(2)}</strong></label>
                                    </div>
                                </div>
                                {/* Header Row */}
                                <div className="grid grid-cols-[35px_90px_110px_160px_100px_100px_100px] text-sm font-medium bg-gray-200 px-2 py-1">
                                    <span>Pay</span>
                                    <span>Date</span>
                                    <span>Trx. No</span>
                                    <span>Description</span>
                                    <span className="text-right">Trx.Amount</span>
                                    <span className="text-right">Due Amount</span>
                                    <span className="text-right">Paid</span>
                                </div>
                            
                                {/* Scrollable Data */}
                                <div className="overflow-y-auto h-[calc(30vh-48px)]">                           
                                    {dueData.outstanding.length === 0  ? (
                                        <p className="text-sm text-gray-500 px-4 py-2">No Customer Transaction Records available.</p>
                                    ) : (
                                        <div className="text-sm text-gray-800">
                                            {dueData.outstanding.map((b, idx) => (
                                                <div
                                                    key={b.trxId || idx}
                                                    className="grid grid-cols-[35px_90px_110px_160px_100px_100px_100px] text-sm px-2 py-2 border-b border-gray-300 hover:bg-gray-100"
                                                >         
                                                    <span>
                                                        <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-blue-600"
                                                        checked={b.paid > 0}
                                                        onChange={e => handleTogglePaid(idx, e.target.checked)}
                                                        />
                                                    </span>

                                                    <span>{b.date}</span>
                                                    <span>{b.trxId}</span>
                                                    <span>{b.reference}</span>
                                                    <span className="text-right">{b.trxAm === "0.00" ? "—" : b.trxAm}</span>
                                                    <span className="text-right">{b.dueAm === "0.00" ? "—" : b.dueAm}</span>
                                                    <span className="text-right">{b.paid}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Customer Search Modal */}
            <Modal
                isOpen={isCustomerModalOpen}
                onRequestClose={() => setIsCustomerModalOpen(false)}
                contentLabel="Search Customers"
                overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
                className="max-w-5xl w-full max-h-[150vh] overflow-y-auto bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold mb-4">👨‍💼 Search Customers</h2>
                    <button
                        className="text-gray-500 hover:text-gray-800"
                        onClick={() => setIsCustomerModalOpen(false)}
                    >
                        ✖
                    </button>
                </div>

                <div className="w-[50%]">
                    <input
                        type="text"
                        placeholder="Search by name, mobile, address, or vehicle..."
                        value={customerQuery}
                        onChange={(e) => {
                            setCustomerQuery(e.target.value)
                            setIsLoading(true);
                        }}
                        className="w-full px-2 py-1 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="h-[400px] border border-gray-400 rounded overflow-y-auto mt-4">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : customers.length === 0 ? (
                        <p className="text-gray-500 text-lg mt-4">No customers found.</p>
                    ) : (
                        <table className="min-w-full table-fixed text-sm text-left rounded-md border border-gray-200">
                            <thead className="bg-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4 w-20">ID</th>
                                    <th className="py-3 px-4 w-50">Name</th>
                                    <th className="py-3 px-4 w-32">Mobile</th>
                                    <th className="py-3 px-4">Address</th>
                                    <th className="py-3 px-4">Vehicles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {customers.map((customer) => (
                                    <tr
                                        key={customer.customerId}
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setIsCustomerModalOpen(false);
                                            setTrxDetails(prev => ({
                                                ...prev,
                                                customerTitle: customer.title,
                                                customerId: customer.customerId,
                                                customerName: customer.businessName,
                                                customerMobile: customer.mobile,
                                                customerAddress: customer.address,
                                                customerBalance: customer.balance
                                            }));
                                        }}
                                    >
                                        <td className="py-3 px-4 w-20 truncate">{customer.customerId}</td>
                                        <td className="py-3 px-4 w-40 truncate">{customer.businessName}</td>
                                        <td className="py-3 px-4 w-32 truncate">{customer.mobile}</td>
                                        <td className="py-3 px-4 w-64 truncate">{customer.address}</td>
                                        <td className="py-3 px-4 w-64 truncate">
                                            {Array.isArray(customer.vehicleNumbers) ? customer.vehicleNumbers.join(", ") : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    )}
                </div>
            </Modal>
        </div>
    )
}

