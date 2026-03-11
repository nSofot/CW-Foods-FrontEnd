// src/pages/customer/customerPaymentsPage.jsx
import LoadingSpinner from "../../components/loadingSpinner";
import { useCustomerOutstanding } from "../../hooks/useCustomerOutstanding";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import Modal from "react-modal";
import { ToWords } from "to-words";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────── helpers ──────────────────────────── */

/** Normalise the shape of banks.json to → [{ code, name }] */
const normaliseBanks = (raw) => {
    if (Array.isArray(raw)) {
        return raw.map((b) => ({
        code: String(b.ID || b.bankCode || b.code).padStart(4, "0"),
        name: b.name || b.bankName || "",
        }));
    }
    if (raw && typeof raw === "object") {
        return Object.entries(raw).map(([code, name]) => ({
        code: String(code).padStart(4, "0"),
        name,
        }));
    }
    return [];
    };

    /** Normalise branches.json to → [{ bankCode, branchCode, name }] */
    const normaliseBranches = (raw) => {
        if (Array.isArray(raw)) {
            return raw.map((br) => ({
            bankCode: String(br.bankCode || br.BankCode).padStart(4, "0"),
            branchCode: String(br.branchCode || br.ID || br.code).padStart(3, "0"),
            name: br.name || br.branchName || "",
            }));
        }
        if (raw && typeof raw === "object") {
            const out = [];
            for (const [bankCode, list] of Object.entries(raw)) {
            if (Array.isArray(list)) {
                list.forEach((br) =>
                out.push({
                    bankCode: String(bankCode).padStart(4, "0"),
                    branchCode: String(br.branchCode || br.ID || br.code).padStart(
                    3,
                    "0"
                    ),
                    name: br.name || br.branchName || "",
                })
                );
            }
            }
            return out;
        }
        return [];
    };

    /** format 0000‑000‑000000 while typing */
    const formatChequeInput = (digits) => {
        if (digits.length <= 4) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
        return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(
            7,
            13
        )}`;
    };

    /* ─────────────────────────── component ────────────────────────── */

    export default function CustomerPaymentsPage() {
    const navigate = useNavigate();

    /* --------------------- top‑level state --------------------- */
    const [isLoading, setIsLoading] = useState(true);

    const [customers, setCustomers] = useState([]);
    const [customerQuery, setCustomerQuery] = useState("");
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toWords = new ToWords();
    const [amountInWords, setAmountInWords] = useState("");
    const [unsettledAmount, setUnsettledAmount] = useState(0);

    const [accounts, setAccounts] = useState([]);
    const [cashAccounts, setCashAccounts] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    // const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedCashAccount, setSelectedCashAccount] = useState("");
    const [selectedBankAccount, setSelectedBankAccount] = useState("");
    const [selectedCashAcName, setSelectedCashAcName] = useState("");
    const [selectedBankAcName, setSelectedBankAcName] = useState("");
    const [banks, setBanks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [chequeError, setChequeError] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const token = localStorage.getItem("token");

    const [trxDetails, setTrxDetails] = useState({
        customerId: "",
        customerName: "",
        customerAddress: "",
        customerMobile: "",
        customerTitle: "",
        customerBalance: 0,

        receiptDate: new Date().toISOString().split("T")[0],

        cardType: "",
        voucherNumber: "",
        transferredBank: "",

        chequeNumber: "",
        chequeDate: new Date().toISOString().split("T")[0],
        bank: "",
        branch: "",

        bankAccountId: "",

        cashAmount: "",
        cardAmount: "",
        chequeAmount: "",
        bankTransferAmount: "",
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
    const updateAmount = useCallback((field, value) => {
        setTrxDetails((prev) => {
        const upd = { ...prev, [field]: value };
        const total =
            (parseFloat(upd.cashAmount) || 0) +
            (parseFloat(upd.cardAmount) || 0) +
            (parseFloat(upd.chequeAmount) || 0) +
            (parseFloat(upd.bankTransferAmount) || 0);
        return { ...upd, receiptAmount: total };
        });
        setDueData((prev) => ({
        ...prev,
        outstanding: prev.outstanding.map((t) => ({ ...t, paid: 0 })),
        }));
    }, []);

    /* --------------------- fetch customers --------------------- */
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const url = customerQuery.trim()
                    ? `${import.meta.env.VITE_BACKEND_URL}/api/customer/search?query=${customerQuery}`
                    : `${import.meta.env.VITE_BACKEND_URL}/api/customer`;

                const token = localStorage.getItem("token"); // or sessionStorage
                const { data } = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`, // send the token
                    },
                });

                setCustomers(data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch customers.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoading || customerQuery === "") fetchCustomers();
    }, [isLoading, customerQuery]);


    /* ------------------ fetch accounts + bank data ------------- */
    useEffect(() => {
        if (!isLoading) return;

        const fetchAll = async () => {
        try {
            const [accRes, banksRes, branchesRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/accounts`),
            axios.get(
                "https://raw.githubusercontent.com/samma89/Sri-Lanka-Bank-and-Branch-List/master/banks.json"
            ),
            axios.get(
                "https://raw.githubusercontent.com/samma89/Sri-Lanka-Bank-and-Branch-List/master/branches.json"
            ),
            ]);

            setCashAccounts(
                accRes.data.filter(
                    (a) =>
                    a.accountId &&
                    a.accountId.toString().startsWith("105") &&
                    !a.accountId.toString().endsWith("000")
                )
            );
            setBankAccounts(
                accRes.data.filter(
                    (a) =>
                    a.accountId &&
                    a.accountId.toString().startsWith("110") &&
                    !a.accountId.toString().endsWith("000")
                )
            );            
                       
            /* banks & branches normalised regardless of shape */
            setBanks(normaliseBanks(banksRes.data));
            setBranches(normaliseBranches(branchesRes.data));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch accounts / bank data.");
        } finally {
            setIsLoading(false);
        }
        };
        fetchAll();
    }, [isLoading]);

    /* ------------------ amount in words ------------------------ */
    useEffect(() => {
        const amt = parseFloat(trxDetails.receiptAmount);
        setUnsettledAmount(amt);
        if (!isNaN(amt) && amt > 0) {
            const rupees = Math.floor(amt);
            const cents = Math.round((amt - rupees) * 100);
            setAmountInWords(
                `${toWords.convert(rupees)} Rupees${cents ? ` and ${toWords.convert(cents)} Cents` : ""}`
            );
        } else {
            setAmountInWords("");
        }
    }, [trxDetails.receiptAmount]);


    const checkChequeExists = async (chequeNumber) => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/chequeBookInward/${chequeNumber}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return res.data;
        } catch (error) {
            console.error("Error checking cheque existence:", error);
            throw error; // rethrow unknown errors
        }
    };


    /* ───────── add just below other hooks (before return) ───────── */
    const handleSubmit = async () => {
        const errors = {}; // ⭐ collect all failures here

        /* 1️⃣ Basic Required Fields */
        if (!selectedCashAccount)           errors.selectedCashAccount  = true;
        if (!trxDetails.receiptDate)        errors.receiptDate   = true;
        if (!trxDetails.customerId)         errors.customerId    = true;
        if (trxDetails.receiptAmount <= 0)  errors.receiptAmount = true;

        /* 2️⃣ Payment Type Validation */
        const cashAmt   = parseFloat(trxDetails.cashAmount)   || 0;
        const cardAmt   = parseFloat(trxDetails.cardAmount)   || 0;
        const chequeAmt = parseFloat(trxDetails.chequeAmount) || 0;
        const bankAmt   = parseFloat(trxDetails.bankTransferAmount) || 0;

        if (cardAmt > 0) {
            if (!trxDetails.cardType)             errors.cardType      = true;
            if (!trxDetails.voucherNumber.trim()) errors.voucherNumber = true;
        }

        if (chequeAmt > 0) {
            if (!trxDetails.chequeNumber.trim())  errors.chequeNumber = true;
            else if (!trxDetails.bank.trim())     errors.bank         = true;
            else if (!trxDetails.branch.trim())   errors.branch       = true;
            else if (trxDetails.chequeNumber.length !== 15)    errors.chequeNumber = true;
            if (!trxDetails.chequeDate)           errors.chequeDate   = true;
        }

        if (bankAmt > 0 && !selectedBankAccount) errors.selectedBank = true;

        /* 3️⃣ Unsettled Allocation Validation */
        const receiptAmt  = parseFloat(trxDetails.receiptAmount)  || 0;
        const custBalance = parseFloat(trxDetails.customerBalance) || 0;
        const expectedUn  = receiptAmt <= custBalance ? 0 : (receiptAmt - custBalance);

        if (Math.abs(unsettledAmount - expectedUn) > 0.001) {
            errors.unsettled = true;
        }

        /* 4️⃣ Check cheque number already exists */    
        if (chequeAmt > 0) {
            const chequeExists = await checkChequeExists(trxDetails.chequeNumber);
            if (chequeExists !== null) {
                toast.error("Cheque number is already existing in the system");
                errors.chequeNumber = true;
                return;
            }
        }

        /* 4️⃣ Show Field Highlights + Toast */
        setFormErrors(errors);

        if (Object.keys(errors).length) {
            // Prioritized toast messaging for clarity
            if (errors.selectedCashAccount) {
                toast.error("Please select a cash account.");
            } else if (errors.receiptDate) {
                toast.error("Please select a valid receipt date.");
            } else if (errors.customerId) {
                toast.error("Please select a customer before submitting.");
            } else if (errors.receiptAmount) {
                toast.error("Enter a valid receipt amount greater than zero.");
            } else if (errors.cardType || errors.voucherNumber) {
                toast.error("Please complete card payment details.");
            } else if (errors.chequeNumber) {
                toast.error("Enter a valid cheque number.");
            } else if (errors.bank) {
                toast.error("Cheque number is invalid. Please check the first 4 digits of the cheque number.");
            } else if (errors.branch) {
                toast.error("Cheque number is invalid. Please check the second 3 digits of the cheque number.");
            } else if (errors.chequeDate) {
                toast.error("Please provide the cheque date.");
            } else if (errors.selectedBank) {
                toast.error("Select a bank account for the transfer.");
            } else if (errors.unsettled) {
                toast.error("Distribute the payment to one or more overdue transactions.");
            } else {
                toast.error("Please correct the highlighted fields.");
            }
            return; // ⛔ block save
        }

        // ✅ await axios.post(...); 
        try {
            const amount = Number(trxDetails.receiptAmount) || 0;
            const transType = "receipt";
            let latestReceiptId = "";
            if (amount > 0) {
                // 1️⃣ update customer balance
                    const updates = {
                        customerId: trxDetails.customerId,
                        amount
                    };
                    try {
                        await axios.put(
                            `${import.meta.env.VITE_BACKEND_URL}/api/customer/subtractBalance`,
                            { updates: [updates] },
                            { headers: { Authorization: "Bearer " + token } }
                        );
                    }
                    catch (err) {
                        console.error(
                            `1️⃣❌ Failed to update customer balance: ${err.response?.data?.message || err.message}`
                        );
                    }

                // 2️⃣ save customer transaction
                    const relatedIdsArray = dueData.outstanding
                        .filter(trx => trx.paid > 0)
                        .map(trx => trx.trxId);

                    const payload = {
                        customerId: trxDetails.customerId,
                        transactionType: transType,
                        transactionDate: trxDetails.receiptDate,
                        amount: amount,
                        isCredit: true,
                        relatedTransactionIds: relatedIdsArray,
                        description: "",
                        dueAmount: 0
                    };
                    try {
                        await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL}/api/customerTransactions`,
                            payload,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                    } catch (err) {
                        console.error(
                            `2️⃣❌ Failed to save customer transaction: ${err.response?.data?.message || err.message}`
                        );
                    }


                // 3️⃣ Sequentially update customer overdue transactions
                    for (const trx of dueData.outstanding) {
                        if (!trx.paid || trx.paid <= 0) continue;
                        const referenceNumber = trx.trxId;
                        const paidAmount = trx.paid;

                        try {
                             {
                                await axios.put(
                                    `/api/customerTransactions/overdue/${referenceNumber}/pay`,
                                    { paidAmount },
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );
                            }
                        } catch (err) {
                            console.error(
                                `3️⃣❌ Failed to update customer overdue transaction ${referenceNumber}: ${err.response?.data?.message || err.message}`
                            );
                        }
                    }

                    // 4️⃣ get latest customer receipt number directly
                    try {
                        const res = await axios.get(
                            `${import.meta.env.VITE_BACKEND_URL}/api/customerTransactions/latest/${transType}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        latestReceiptId = res.data.referenceNumber;
                    } catch (err) {
                        console.error("4️⃣❌ Failed to get latest receipt number:", err);
                    }

                    // 5️⃣ update Cashbook
                    if (cashAmt > 0) {
                        const accountId = selectedCashAccount
                        const updates = {
                            accountId,
                            amount: parseFloat(cashAmt),
                        };

                        try {
                            // 5️⃣1️⃣🔄 Update cashbook account balance
                            await axios.put(
                                `${import.meta.env.VITE_BACKEND_URL}/api/accounts/add-balance`,
                                { updates: [updates] },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                        } catch (err) {
                            console.error("5️⃣1️⃣❌ Failed to update cashbook balance:", err.response?.data || err.message);
                        }

                        if (latestReceiptId) {
                            const accPayload = {
                                trxId: latestReceiptId,
                                trxDate: trxDetails.receiptDate,
                                transactionType: transType,
                                accountId: selectedCashAccount,
                                description: trxDetails.customerName,                               
                                trxType: "Credit",
                                trxAmount: parseFloat(cashAmt),
                                createdBy: "System",
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

                // 6️⃣ update card details
                    if (cardAmt > 0) {
                        if (latestReceiptId) {
                            const payload = {
                                receiptId: latestReceiptId,
                                attendantId: trxDetails.customerId, 
                                receiptDate: trxDetails.receiptDate,
                                cardType: trxDetails.cardType,
                                referenceNumber: trxDetails.voucherNumber,
                                receiptAmount: parseFloat(cardAmt), 
                            };

                            try {
                                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cardPayment`, payload, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                }
                                });
                            } catch (err) {
                                console.error("6️⃣1️⃣❌ Failed to update card details:", err);
                            }
                        } else {
                            console.warn("6️⃣1️⃣⚠️ Skipped saving card details: missing receipt number.");
                        }
                    }

                // 7️⃣ update cheque details
                    if (chequeAmt > 0) {
                        if (latestReceiptId) {
                            const payload = {
                                receiptId: latestReceiptId,
                                receiptDate: trxDetails.receiptDate,
                                customerId: trxDetails.customerId,
                                chequeNumber: trxDetails.chequeNumber,
                                chequeDate: new Date(trxDetails.chequeDate).toISOString(),
                                chequeAmount: parseFloat(chequeAmt),
                                chequeStatus: "Pending"
                            };

                            try {
                                await axios.post(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/chequeBookInward`,
                                    payload,
                                {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                }
                                }
                            );
                            } catch (err) {
                                console.error("7️⃣❌ Failed to update cheque details:", err.response?.data || err.message);
                            }
                        } else {
                            console.warn("7️⃣⚠️ Skipped saving cheque details: missing receipt number.");
                        }
                    }

                // 8️⃣ update bank transfer
                    if ( bankAmt > 0 ) {  
                        const updates = {
                            accountId: selectedBankAccount,
                            amount: bankAmt
                        };
                        try {
                            // 8️⃣1️⃣ update bank balance
                            await axios.put(
                                `${import.meta.env.VITE_BACKEND_URL}/api/accounts/add-balance`,
                                { updates: [updates] },
                                { headers: { Authorization: "Bearer " + token } }
                            );
                        } catch (err) {
                            console.error("8️⃣1️⃣❌ Failed to update bank balance:", err);
                        }  

                        if (latestReceiptId) {
                            const accPayload = {
                                trxId: latestReceiptId,
                                trxDate: trxDetails.receiptDate,
                                transactionType: transType,
                                accountId: selectedBankAccount,                                                                                               
                                description: trxDetails.customerName,
                                trxType: "Debit",
                                trxAmount: parseFloat(bankAmt),
                                createdBy: "System"
                            };         
                                                                                               
                            try {
                                // 8️⃣2️⃣  save account transaction
                                await axios.post(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/accountTransactions`,
                                    accPayload,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                            } catch (err) {
                                console.error("8️⃣2️⃣❌ Failed to save bank transaction:", err);
                            }     
                        } else {
                            console.warn("8️⃣2️⃣⚠️ Skipped saving bank transaction: missing receipt number.");
                        }                   
                    }    

                // ✅ Submit successful
            }
    
        } 
        catch (err) {
            console.error("Submit failed:", err);
            toast.error("Failed to submit customer receipt. Please try again.");
        }

        toast.success("Payment receipt submitted successfully!");

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

            receiptDate: new Date().toISOString().split("T")[0],

            cardType: "",
            voucherNumber: "",
            transferredBank: "",

            chequeNumber: "",
            chequeDate: new Date().toISOString().split("T")[0],
            bank: "",
            branch: "",

            bankAccountId: "",

            cashAmount: "",
            cardAmount: "",
            chequeAmount: "",
            bankTransferAmount: "",
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
        setSelectedCashAccount("");
        setSelectedBankAccount("");
        setSelectedCashAcName("");
        setSelectedBankAcName("");
        setChequeError("");
        setFormErrors({});
    };  


    /* --------------------------- render ------------------------ */
    return (
        <div className="hidden md:block w-full h-full bg-gray-100 p-6 rounded shadow">
            {/* header */}
            <div className="flex justify-between items-center">
                <div>
                <h1 className="text-xl font-semibold text-gray-800">
                    🧾📥 Customer Payments
                </h1>
                <p className="text-sm text-gray-600">
                    Manage incoming payments and receipts from customers.
                </p>
                </div>

                <div className="w-[40%] flex gap-4">
                    <button
                        className={`w-[300px] px-4 py-2 text-sm font-medium shadow bg-buttonSave text-buttonSaveText rounded 
                                    hover:bg-buttonSaveHover active:bg-buttonSaveActive disabled:opacity-50`}
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
                        className="ml-10 w-[300px] px-4 py-2 text-sm font-medium shadow bg-yellow-400 text-buttonCancelText rounded hover:bg-yellow-500 active:bg-yellow-600"
                        onClick={() => {
                            resetForm();
                        }}
                    >
                        Refresh
                    </button>
  
                    <button
                        onClick={() => navigate("/")}
                        className="w-[300px] px-4 py-2 text-sm font-medium shadow rounded bg-buttonCancel text-buttonCancelText hover:bg-buttonCancelHover active:bg-buttonCancelActive"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* body */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="mt-4 w-full h-[87%] p-4 shadow rounded-lg border border-gray-400 bg-white flex gap-10">
                    {/* left column */}
                    <div className="w-[25%] h-full flex flex-col gap-5">
                        <div className="w-full">
                                <label className="text-sm font-medium block mb-1">Select Cash Account</label>
                                <select
                                    value={selectedCashAccount}
                                    onChange={(e) => {
                                        setSelectedCashAccount(e.target.value);
                                        setSelectedCashAcName(cashAccounts.find(a => a.accountId === e.target.value)?.accountName)
                                    }}
                                    // className="w-full text-sm bg-white border border-gray-400 rounded-md px-4 py-2 focus:outline-blue-500"
                                    className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.selectedCashAccount   ? 'border-red-500' : 'border-gray-400'}`}                                    
                                >
                                    <option value="">-- Select --</option>
                                    {cashAccounts.map((a) => (
                                        <option key={a.accountId} value={a.accountId}>
                                            {a.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>                        
                        {/* date */}
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Receipt Date
                            </label>
                            <input
                                type="date"
                                value={trxDetails.receiptDate}
                                onChange={(e) =>
                                setTrxDetails({ ...trxDetails, receiptDate: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.receiptDate   ? 'border-red-500' : 'border-gray-400'}`}
                            />
                            </div>

                            {/* customer picker */}
                            <div>
                                <div className="flex gap-2">
                                    <label className="text-sm font-medium">Select Customer</label>
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

                            {/* totals */}
                            <div>
                                <label className="text-sm font-medium block">
                                Total Receipt Amount
                                </label>
                                <input
                                    readOnly
                                    tabIndex={-1}
                                    value={`Rs. ${Number(trxDetails.receiptAmount || 0).toLocaleString(
                                    "en-US",
                                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                    )}`}
                                    className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                        ${formErrors.receiptAmount   ? 'border-red-500' : 'border-gray-400'}`}
                                />
                                <p className="mt-1 text-sm text-gray-900">{amountInWords}</p>
                            </div>
                        </div>

                        {/* right column */}
                        <div className="w-[70%] h-full flex flex-col gap-4">
                            {/* amounts row */}
                            <div className="flex justify-between gap-5">
                            {[
                                ["cashAmount", "Cash Amount"],
                                ["cardAmount", "Card Amount"],
                                ["chequeAmount", "Cheque Amount"],
                                ["bankTransferAmount", "Bank Transfer Amount"],
                            ].map(([k, label]) => (
                                <div key={k}>
                                <label className="text-sm font-medium block mb-1">
                                    {label}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={trxDetails[k]}
                                    onChange={(e) => updateAmount(k, e.target.value)}
                                    className="w-full text-sm border border-gray-400 rounded-md px-4 py-2 focus:outline-blue-500"
                                />
                                </div>
                            ))}
                            </div>

                            {/* card / voucher / transfer row */}
                            <div className="flex gap-5">
                            {/* card type */}
                            <div className="w-[25%]">
                                <label className="text-sm font-medium block mb-1">
                                Card Type
                                </label>
                                <select
                                value={trxDetails.cardType}
                                onChange={(e) =>
                                    setTrxDetails({ ...trxDetails, cardType: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.cardType   ? 'border-red-500' : 'border-gray-400'}`}

                                >
                                <option value="">-- Select Card --</option>
                                <option value="visa">Visa</option>
                                <option value="mastercard">Mastercard</option>
                                <option value="lankapay">LankaPay</option>
                                <option value="americanexpress">American Express</option>
                                <option value="unionpay">UnionPay</option>
                                </select>
                            </div>

                            {/* voucher */}
                            <div className="w-[20%]">
                                <label className="text-sm font-medium block mb-1">
                                Voucher #
                                </label>
                                <input
                                type="text"
                                value={trxDetails.voucherNumber}
                                onChange={(e) =>
                                    setTrxDetails({ ...trxDetails, voucherNumber: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.voucherNumber   ? 'border-red-500' : 'border-gray-400'}`}

                                />
                            </div>

                            {/* transferred account */}
                            <div className="flex-1">
                                <label className="text-sm font-medium block mb-1">
                                    Transferred Bank Account
                                </label>
                                <select
                                    value={selectedBankAccount}
                                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                                    className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                        ${formErrors.selectedBank   ? 'border-red-500' : 'border-gray-400'}`}

                                >
                                    <option value="">-- Select Account --</option>
                                    {bankAccounts.map((a) => (
                                        <option key={a.accountId} value={a.accountId}>
                                            {a.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* cheque row */}
                        <div className="flex gap-5">
                            {/* cheque # */}
                            <div className="w-[22%]">
                                <label className="text-sm font-medium block mb-1">
                                Cheque #
                                </label>
                                <input
                                    placeholder="0000-000-000000"
                                    maxLength={17}
                                    value={trxDetails.chequeNumber}
                                    className={`w-full text-sm border ${
                                        chequeError || formErrors.chequeNumber   // ⬅️ combine the flags
                                            ? "border-red-500"
                                            : "border-gray-400"
                                        } rounded-md px-4 py-2 focus:outline-blue-500`}
                                    onChange={(e) => {
                                        /* digits only */
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
                                        const formatted = formatChequeInput(digits);
                                        setTrxDetails((p) => ({ ...p, chequeNumber: formatted }));

                                        /* live lookup */
                                        let bankName = "";
                                        let branchName = "";

                                        if (digits.length >= 4) {
                                        const bankCode = digits.slice(0, 4);
                                        const bank = banks.find((b) => b.code === bankCode);
                                        if (bank) bankName = bank.name;
                                        }
                                        if (digits.length >= 7 && bankName) {
                                        const bankCode = digits.slice(0, 4);
                                        const branchCode = digits.slice(4, 7);
                                        const branch = branches.find(
                                            (br) =>
                                            br.bankCode === bankCode && br.branchCode === branchCode
                                        );
                                        if (branch) branchName = branch.name;
                                        }
                                        if (digits.length < 4) bankName = "";
                                        if (digits.length < 7) branchName = "";

                                        setTrxDetails((p) => ({
                                        ...p,
                                        bank: bankName,
                                        branch: branchName,
                                        }));

                                        if (digits.length === 13) {
                                            if (!bankName)
                                                setChequeError("Unknown bank code.");
                                            else if (!branchName)
                                                setChequeError("Unknown branch code.");
                                            else setChequeError("");
                                        } else setChequeError("");
                                    }}
                                />
                                {chequeError && (
                                <p className="text-xs text-red-500 mt-1">{chequeError}</p>
                                )}
                            </div>

                            {/* cheque date */}
                            <div className="w-[19%]">
                                <label className="text-sm font-medium block mb-1">
                                Cheque Date
                                </label>
                                <input
                                type="date"
                                value={trxDetails.chequeDate}
                                onChange={(e) =>
                                    setTrxDetails({ ...trxDetails, chequeDate: e.target.value })
                                }
                                className={`w-full text-sm border rounded-md px-4 py-2 focus:outline-blue-500
                                    ${formErrors.chequeDate   ? 'border-red-500' : 'border-gray-400'}`}

                                />
                            </div>

                            {/* bank / branch display */}
                            <div className="flex-1">
                                <label className="text-sm font-medium block mb-1">Bank</label>
                                <input
                                readOnly
                                value={trxDetails.bank}
                                className="w-full text-sm border border-gray-400 rounded-md px-4 py-2 bg-gray-100"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium block mb-1">Branch</label>
                                <input
                                readOnly
                                value={trxDetails.branch}
                                className="w-full text-sm border border-gray-400 rounded-md px-4 py-2 bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="w-full flex flex-col">
                            <div className="flex justify-between">                                
                                <label className="text-sm font-medium">Due Transactions</label>
                                <div className="flex justify-end gap-6">
                                    <label className="text-sm">Total Outstaning: <strong>{trxDetails.customerBalance.toFixed(2)}</strong></label>
                                    <label className="text-sm">Unsettled Amount: <strong>{unsettledAmount.toFixed(2)}</strong></label>
                                </div>
                            </div>
                            {/* Header Row */}
                            <div className="grid grid-cols-[35px_90px_110px_170px_100px_100px_100px] text-sm font-medium bg-gray-200 px-2 py-1">
                                <span>Pay</span>
                                <span>Date</span>
                                <span>Trx. No</span>
                                <span>Description</span>
                                <span className="text-right">Trx.Amount</span>
                                <span className="text-right">Due Amount</span>
                                <span className="text-right">Paid</span>
                            </div>
                            {/* Scrollable Data */}
                            <div className="overflow-y-auto h-[calc(26vh-48px)]">
                                {dueData.outstanding.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-4 py-2">No Customer Transaction Records available.</p>
                                ) : (
                                    <div className="text-sm text-gray-800">
                                        {dueData.outstanding.map((b, idx) => (
                                            <div
                                                key={b.trxId || idx}
                                                className="grid grid-cols-[35px_90px_110px_170px_100px_100px_100px] text-sm px-2 py-2 border-b border-gray-300 hover:bg-gray-100"
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

