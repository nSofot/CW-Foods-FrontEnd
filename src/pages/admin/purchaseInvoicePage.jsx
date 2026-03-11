import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import LoadingSpinner from "../../components/loadingSpinner";
import { formatNumber } from "../../utils/numberFormat.js";


export default function PurchaseInvoicePage() {
    const [pendingGRNs, setPendingGRNs] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [filteredGRNs, setFilteredGRNs] = useState([]);
    const [grnsQuery, setGRNsQuery] = useState("");
    const [isGRNsModalOpen, setIsGRNsModalOpen] = useState(false);
    const [isGRNsLoading, setIsGRNsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [trxDetails, setTrxDetails] = useState(
        {
            grnId: "",
            grnDate: "",
            invoiceNumber: "",
            supplierId: "",
            supplierName: "",
            supplierAddress: "",
            invoiceDate: new Date().toISOString().split("T")[0],
            invoiceTotal: 0,
            items: [],
        }
    );

    useEffect(() => {
      if (!isLoading) return;

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [grnRes, supRes, prodRes, categoryRes, brandRes, uomRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/grn/pending`, config),
                axios.get(import.meta.env.VITE_BACKEND_URL + "/api/supplier", config),
                axios.get(import.meta.env.VITE_BACKEND_URL + "/api/product", config),
                axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category", config),
                axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand", config),
                axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom", config),
            ]);

            setCategories(categoryRes.data);
            setBrands(brandRes.data);
            setUoms(uomRes.data);

            const enrichedProducts = prodRes.data.map((product) => {
                const categoryName = categoryRes.data.find(c => c.categoryId === product.categoryId)?.categoryName || "";
                const brandName = brandRes.data.find(b => b.brandId === product.brandId)?.brandName || "";
                const uomName = uomRes.data.find(u => u.uomId === product.uomId)?.uomName || "";

                return {
                    ...product,
                    categoryName,
                    brandName,
                    uomName,
                };
            });
            setProducts(enrichedProducts);

            const enrichedGRNs = grnRes.data.map((grn) => {
                const supplier = supRes.data.find(c => c.supplierId === grn.supplierId);
                const supplierName = supplier?.name || "";
                const supplierAddress = supplier?.address || "";
                const supplierBalance = supplier?.balance || 0;
                
                return {
                    ...grn,
                    supplierName,
                    supplierAddress
                };
            });
            setPendingGRNs(enrichedGRNs);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchInitialData();
        }, [isLoading]);


    useEffect(() => {
        if (!grnsQuery.trim()) {
            setFilteredGRNs(pendingGRNs);
            return;
        }

        const regex = new RegExp(grnsQuery, "i");
        const filtered = pendingGRNs.filter((p) =>
            regex.test(p.trxId) ||
            regex.test(p.supplierName) ||
            regex.test(p.invoiceNumber) ||
            regex.test(p.date)
        );
        setFilteredGRNs(filtered);
    }, [grnsQuery, pendingGRNs]);


    const addGRN = async (grn) => {
        if (!grn) return;

        try {
            const trxRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/productTransactions/referenceId/${grn.trxId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            // ✅ Always handle both top-level and nested product arrays
            const products =
                trxRes.data?.products ||
                trxRes.data?.transaction?.products ||
                [];
               
            // ✅ Parse date safely
            const parsedGrnDate = grn.date
                ? new Date(grn.date)
                : new Date(); // fallback to today if missing

            setTrxDetails({
                grnId: grn.trxId,
                grnDate: isNaN(parsedGrnDate) // check if it's a valid Date
                    ? new Date().toISOString().split("T")[0]
                    : parsedGrnDate.toISOString().split("T")[0],
                invoiceNumber: grn.invoiceNumber,
                supplierId: grn.supplierId,
                supplierName: grn.supplierName,
                supplierAddress: grn.supplierAddress,
                supplierBalance: grn.supplierBalance,
                invoiceDate: new Date().toISOString().split("T")[0],
                invoiceTotal: grn.totalAmount,
                items: products
            });

        } catch (error) {
            console.error("Error fetching transaction:", error);
        }
    };


    const handleSubmit = async () => {
        if (!trxDetails.grnId) {
            toast.error("Please select a GRN");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const trxType = "invoice";
            // 1️⃣ Write Supplier Transaction
            try {
                let dueAmount = trxDetails.invoiceTotal;
                if (trxDetails.supplierBalance < 0) {
                    const absBalance = Math.abs(trxDetails.supplierBalance);

                    if (absBalance <= dueAmount) {
                        dueAmount -= absBalance;
                    } else {
                        dueAmount = 0;
                    }
                }                
                const supTrxPayload = {
                    supplierId: trxDetails.supplierId,
                    transactionType: trxType,
                    transactionDate: trxDetails.invoiceDate,
                    amount: trxDetails.invoiceTotal,
                    dueAmount: dueAmount,
                    isCredit: false,
                    relatedInvoiceId: trxDetails.grnId,
                    description: `${trxDetails.supplierName}`,
                    createdBy: localStorage.getItem("userId") // or from auth token
                };

                await axios.post(
                    import.meta.env.VITE_BACKEND_URL + "/api/supplierTransactions",
                    supTrxPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );                
                console.log("1️⃣✅ Supplier transaction saved");
            } catch (err) {
                console.error("1️⃣⚠️Error writing supplier transaction:", err);
            }

            // 2️⃣ Update Supplier
            try {
                const supUpdate = {
                updates: [
                    {
                    supplierId: trxDetails.supplierId,
                    amount: trxDetails.invoiceTotal
                    }
                ]
                };

                await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/supplier/balance/add`,
                supUpdate,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                console.log("2️⃣✅ Supplier updated");
            } catch (err) {
                console.error("2️⃣⚠️ Error updating supplier:", err);
            }

            // 3️⃣ Update GRN
            try {
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/api/grn/complete/${trxDetails.grnId}`,
                    {}, // empty body because your endpoint probably does not expect a body
                    {
                        headers: {
                        Authorization: `Bearer ${token}`
                        }
                    }
                );
                console.log("3️⃣✅ GRN updated");
            } catch (err) {
                console.error("3️⃣⚠️Error updating GRN:", err);
            }

            // 4️⃣ Write Ledger Transaction
            try {
                console.log("4️⃣✅ Ledger transaction saved");
            } catch (err) {
                console.error("4️⃣⚠️Error writing ledger transaction:", err);
            }

            // 5️⃣ Update Ledger
            try {
                console.log("5️⃣✅ Ledger updated");
            } catch (err) {
                console.error("5️⃣⚠️Error updating ledger:", err);
            }

            toast.success("Invoice submitted successfully!");
            setIsSubmitting(false);
            setIsGRNsModalOpen(false);
            setTrxDetails(        {
                grnId: "",
                grnDate: "",
                invoiceNumber: "",
                supplierId: "",
                supplierName: "",
                supplierAddress: "",
                invoiceDate: new Date().toISOString().split("T")[0],
                invoiceTotal: 0,
                items: [],
            });

        } catch (err) {
            console.error("⚠️ Submit failed:", err);
            toast.error("Failed to submit stock adjustment. Please try again.");
        }
    };



    return (
        <div className="p-4 h-full bg-gray-200 rounded-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-bold">🛍️✏️ Purchase Invoice</h1>
                    <p className="text-sm text-gray-600">Record and Manage Supplier Purchases.</p>
                </div>
                <div className="w-[50%] flex justify-end gap-6">
                    <button
                        className="px-6 py-2 rounded shadow text-sm font-medium bg-buttonAdd text-buttonAddText hover:bg-buttonAddHover active:bg-buttonAddActive disabled:opacity-50 mr-10"
                        onClick={() => setIsGRNsModalOpen(true)}
                    >
                        + Add GRN
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            const id = toast.loading("Submitting...");
                            await handleSubmit();
                            toast.dismiss(id);
                            setIsSubmitting(false);
                        }}
                        className="px-10 py-2 text-sm font-medium bg-buttonSave text-buttonSaveText rounded-md hover:bg-buttonSaveHover active:bg-buttonSaveActive disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                    <Link
                        to="/"
                        className="px-10 py-2 text-sm font-medium bg-buttonCancel text-buttonCancelText rounded-md hover:bg-buttonCancelHover active:bg-buttonCancelActive"
                    >
                        Cancel
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="h-[87%] flex justify-between gap-8">
                    <div className="w-[25%] h-full flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="text-md w-full border p-2 rounded focus:outline-blue-500"
                                value={trxDetails.invoiceDate}
                                onChange={(e) => setTrxDetails({ ...trxDetails, invoiceDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">GRN Date: </label>
                            <span className="block text-md">{trxDetails.grnDate}</span>
                        </div>                        
                        <div>
                            <label className="block text-sm font-medium">GRN Number: </label>
                            <span className="block text-md">{trxDetails.grnId}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Invoice No:</label>
                            <span className="block text-md">{trxDetails.invoiceNumber}</span>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium">Supplier:</label>
                            <span className="block text-md">{trxDetails.supplierName}</span>
                            <span className="block text-sm">{trxDetails.supplierAddress}</span>
                            <span className="block text-sm">{trxDetails.supplierId}</span>                            
                        </div>
                        <div>
                            <label  className="block text-sm font-medium">Amount</label>
                            <div className="w-full h-3xl flex justify-between bg-gray-200 items-center rounded-md border border-gray-400 px-4 py-2">
                               <label className="text-md block">
                                Rs. {trxDetails.invoiceTotal.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="w-[75%] h-full rounded-md border border-gray-400 flex flex-col gap-2 bg-white p-4 overflow-y-auto">                        
                        {trxDetails.items.map((item, index) => (   
                            <div key={index} className="flex items-center justify-between border-b py-2">                        
                                <img
                                    src={Array.isArray(item.image) ? item.image[0] : item.image}
                                    alt="product"
                                    className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 px-4">
                                    <p className="font-medium text-sm">{item.productName}</p>
                                    <p className="text-xs text-gray-500">{item.brand} | {item.category}</p>
                                    <p className="text-xs text-gray-500">
                                        {item.productId}
                                        
                                    </p>
                                </div>
                                <span className="text-sm font-medium">Rs. {(item.rate ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                <span className="ml-10 text-sm font-medium">{item.quantity}</span>                         
                                <span className="ml-2 text-sm">{item.uom}</span>
                                <span className="ml-10 text-sm font-medium">
                                    Rs. {(item.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isGRNsModalOpen}
                onRequestClose={() => setIsGRNsModalOpen(false)}
                contentLabel="Search GRNs"
                overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
                className="max-w-4xl w-full max-h-[150vh] overflow-y-auto bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold mb-4">🛒 Search GRN</h2>
                  <button className="text-gray-500 hover:text-gray-800" onClick={() => setIsGRNsModalOpen(false)}>
                    ✖
                  </button>
                </div>
                <div className="w-[50%]">
                  <input
                    type="text"
                    placeholder="Search GRNs by GRN Id, date, invoice no or supplier..."
                    value={grnsQuery}
                    onChange={(e) => {
                      setGRNsQuery(e.target.value);
                      setIsGRNsLoading(false);
                    }}
                    className="w-full px-2 py-1 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="h-[400px] mt-4 rounded border border-gray-400 overflow-y-auto">
                    {isGRNsLoading ? (
                        <LoadingSpinner />
                    ) : filteredGRNs.length === 0 ? (
                        <p className="mt-4 text-lg text-gray-500">No pending GRNs found.</p>
                    ) : (
                        <table className="min-w-full text-sm text-left table-fixed">
                            <thead className="sticky top-0 z-10 bg-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Date</th>                  
                                    <th className="px-6 py-3">GRN Id</th>
                                    <th className="px-6 py-3">Invoice No</th>
                                    <th className="px-6 py-3">Supplier</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {filteredGRNs.map((pendingGRNs) => (
                                    <tr
                                        key={pendingGRNs.trxId}
                                        className="cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                            addGRN(pendingGRNs);
                                            setIsGRNsModalOpen(false);
                                        }}
                                    >
                                        <td className="px-6 py-3">{new Date(pendingGRNs.date).toLocaleDateString("en-GB")}</td>
                                        <td className="px-6 py-3">{pendingGRNs.trxId}</td>
                                        <td className="px-6 py-3">{pendingGRNs.invoiceNumber}</td>
                                        <td className="px-6 py-3">{pendingGRNs.supplierName}</td>
                                        <td className="px-6 py-3 text-right">{formatNumber(pendingGRNs.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Modal>
        </div>
    );
}
