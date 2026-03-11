import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { HiOutlineHome } from "react-icons/hi";
import { CiSearch } from "react-icons/ci";
import toast from "react-hot-toast";
import Modal from "react-modal";
import LoadingSpinner from "../../components/loadingSpinner";
import Cashbook from "../../components/viewCashbook";



export default function CashRegisterPage() {
    const [accounts, setAccounts] = useState([]);
    const [selectAccount, setSelectAccount] = useState(""); 
    const [accountBalance, setAccountBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
    const [header, setHeader] = useState("");
    const [accountName, setAccountName] = useState("");
    const [activeRecord, setActiveRecord] = useState(null);
    const [query, setQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // const [banks, setBanks]         = useState([]); 
    // const [branches, setBranches]   = useState([]);

    const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
    const [toDate, setToDate]   = useState(new Date().toISOString().split("T")[0],);
    const [error, setError]     = useState("");

    const navigate = useNavigate();

        
    useEffect(() => {
        if (!isLoading) return;

        const fetchAll = async () => {
        try {
            // 1) build the three requests
            const reqAccounts = axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/accounts`
            );
            // const reqBanks = axios.get(
            // "https://raw.githubusercontent.com/samma89/Sri-Lanka-Bank-and-Branch-List/master/banks.json"
            // );
            // const reqBranches = axios.get(
            // "https://raw.githubusercontent.com/samma89/Sri-Lanka-Bank-and-Branch-List/master/branches.json"
            // );
            // 2) fire them in parallel
            const [accRes] = await Promise.all([
                reqAccounts,
                // reqBanks,
                // reqBranches,
            ]);

            // 3) update state
            // const filteredAccunts =
            //     accRes.data.filter(
            //         (a) => a.headerAccountId === "325" || a.headerAccountId === "327"
            //     )
            // setAccounts(filteredAccunts.sort((a, b) => a.accountId.localeCompare(b.accountId)));

            const filteredAccounts = accRes.data.filter(
            (a) =>
                a.accountId &&
                (
                a.accountId.toString().startsWith("105") ||
                a.accountId.toString().startsWith("110")
                ) &&
                !a.accountId.toString().endsWith("000")
            );

            setAccounts(filteredAccounts.sort((a, b) => a.accountId.localeCompare(b.accountId)));
                   
        } catch (err) {
            console.error("Data fetch failed:", err);
            toast.error("Failed to fetch account / bank data.");
        } finally {
            setIsLoading(false);
        }
        };

        fetchAll();
    }, [isLoading]);


    // validate whenever either value changes
    const validate = (start, end) => {
        if (start && end && new Date(start) > new Date(end)) {
        setError("From Date must be earlier than or equal to To Date");
        } else {
        setError("");
        }
    };

    function handleAccountChange(e) {
        const value = e.target.value;                     // id / code
        setSelectAccount(value);

        // Look up the full account object to grab its balance
        const selected = accounts.find(
            a => (a.accountId || a._id) === value
        );

        setAccountBalance(selected?.accountBalance ?? 0);        // or whatever the field is called
    }

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");

        if (!token) return toast.error("Unauthorized. Please log in.");
        if (!header) return toast.error("Please select account type");
        if (accountName === "") return toast.error("Please submit account name.");
        
        let headerAccountId;
        if (header.trim().toLowerCase() === "cash") {
            headerAccountId = "105";
        } else {
            headerAccountId = "110"; // "Bank"
        }

        const payload = {
            accountName: accountName
        };

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/accounts/${headerAccountId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            setIsLoading(true);
            toast.success("Account submitted successfully!");
            setIsAddAccountModalOpen(false);
        } catch (err) {
            console.error("Submit failed:", err);
            toast.error("Failed to submit account. Please try again.");
        }
    };


    return (
        <div className="hidden md:flex w-full h-full flex-col bg-gray-100 rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">💵 Cash Register</h1>
                    <p className="text-sm text-gray-600">View and filter all cash and bank transactions in one place</p>
                </div>
                <div className="w-[30%] flex justify-end gap-6">
                    <button
                        onClick={() => {
                            setIsAddAccountModalOpen(true);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm font-medium shadow rounded-md text-sm font-normalshadow bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition duration-300 ease-in-out"
                    >
                        + Add New Account
                    </button>
                    <Link
                        to="/"
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="Go to Home"
                        >
                        <HiOutlineHome className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2">
                <div className="w-[50%] flex justify-between">
                    <div className="w-[70%] gap-4">
                        <label className="text-sm font-medium block">Account</label>
                        <select
                            value={selectAccount}
                            onChange={handleAccountChange}
                            placeholder="Select account …"
                            className="w-full px-2 py-1 text-sm bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            <option value="">-- Select --</option>

                            {accounts.map((a, idx) => (
                                <option
                                key={a.accountId || a._id || idx}
                                value={a.accountId || a._id}
                                >
                                {a.accountName || a.accountsName}
                                </option>
                            ))}
                        </select>

                    </div>
                    <div className="w-[25%]">
                        <label className="text-sm font-medium block text-right">Current Balance</label>
                        <input
                            type="text"
                            readOnly                 /* blocks typing but keeps normal styling */
                            value={`Rs. ${Number(accountBalance ?? 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`}
                            className="w-full px-2 py-1 text-sm font-medium text-right border border-gray-400 rounded-md bg-white
                                        focus:outline-none focus:ring-2 focus:ring-blue-500
                                        caret-transparent cursor-default"   /* optional extras */
                            tabIndex={-1}            /* remove from tab order if desired */
                        />
                    </div>
                </div>	              


                <div className="flex justify-between items-center w-[30%] space-x-4">
                    {/* From Date */}
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
                        // optional: keep From ≤ To in real time
                        max={toDate || undefined}
                        className="w-full text-sm bg-white border border-gray-400 rounded-md px-4 py-1 focus:outline-blue-500"
                        />
                    </div>

                    {/* To Date */}
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
                        // optional: keep To ≥ From in real time
                        min={fromDate || undefined}
                        className="w-full text-sm bg-white border border-gray-400 rounded-md px-4 py-1 focus:outline-blue-500"
                        />
                    </div>
                    {/* Error message */}
                    {error && (
                        <p className="text-red-600 text-xs mt-2 col-span-2">{error}</p>
                    )}
                </div>
                            
            </div>

            <div className="h-[76%] bg-white shadow rounded-md p-6">
               <Cashbook accountId={selectAccount} fromDate={fromDate} toDate={toDate} />
            </div>

            <Modal
                isOpen={isAddAccountModalOpen}
                onRequestClose={() => setIsAddAccountModalOpen(false)}
                contentLabel="Add New Account"
                overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
                className="max-w-3xl w-full max-h-[97vh] overflow-y-auto bg-white p-10 rounded-lg shadow-2xl border-4 border-gray-400"
            >

                    <div className="space-y-4">
                        <div className="w-full flex justify-between items-center pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">📒 Add New Accounts</h2>
                            <button
                                className="text-gray-500 hover:text-gray-800"
                                onClick={() => setIsAddAccountModalOpen(false)}
                            >
                                ✖
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="w-[150px]">
                                <label className="text-gray-600 font-semibold">Account Type</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={header}
                                    onChange={(e) => setHeader(e.target.value)}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Cash">Cash in Hand</option>
                                    <option value="Bank">Bank Accounts</option>
                                </select>
                            </div>
                            <div className="w-full">
                                <label className="text-gray-600 font-semibold">Account Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                />
                            </div>
                        </div>
                      
                        <button
                            disabled={isSubmitting}
                            onClick={async() => {
                                if (!header) {
                                    toast.error("Please select account type.");
                                } else if (accountName === "") {
                                    toast.error("Please submit account name.");
                                } else {
                                    if (isSubmitting) return;
                                    setIsSubmitting(true);
                                    const id = toast.loading("Account submiting ....");
                                    await handleSubmit();
                                    toast.dismiss(id);
                                    setIsSubmitting(false);
                                }
                            }}

                                className={`px-10 py-2 text-sm font-medium shadow bg-buttonSave text-buttonSaveText rounded-md 
                                    hover:bg-buttonSaveHover active:bg-buttonSaveActive disabled:opacity-50`}
                            >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>

                    </div>

            </Modal>

        </div>
    );
}
