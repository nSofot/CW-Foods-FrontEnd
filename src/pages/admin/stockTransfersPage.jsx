import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { Search, ShoppingBasket } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

import ProductSelector from "../../components/productSelector";

export default function StockTransfersPage() {

    const token = localStorage.getItem("token");
    
    const [trxDetails, setTrxDetails] = useState({
        supplierId: "",
        supplierName: "",
        supplierAddress: "",
        trxDate: new Date().toISOString().split("T")[0],
        referenceNumber: "",
        locationFromId: "",
        locationFromName: "",
        locationToId: "",
        locationToName: "",
        trxTotal: 0,
        items: []
    });

    const [showProduct, setShowProduct] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);  
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [locations, setLocations] = useState([]);
    const isFromLocationLocked = trxDetails.items.length > 0;


    useEffect(() => {
        const fetchLocations = async () => {
            try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/locations`,
                {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                }
            );
            setLocations(res.data);
            } catch (err) {
            console.error("Failed to fetch locations", err);
            }
        };

        fetchLocations();
    }, []);


    useEffect(() => {
        const total = trxDetails.items.reduce(
            (sum, item) => sum + (parseFloat(item.amount) || 0),
            0
        );

        setTrxDetails(prev => ({
            ...prev,
            grnTotal: total
        }));
    }, [trxDetails.items]);

    const handleProductSelect = (product) => setSelectedProduct(product);

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...trxDetails.items];
        updatedItems[index][field] = value;

        if (field === "quantity" || field === "rate") {
            const quantity = parseFloat(updatedItems[index].quantity) || 0;
            const rate = parseFloat(updatedItems[index].rate) || 0;
            updatedItems[index].amount = quantity * rate;
        }

        setTrxDetails((prev) => ({ ...prev, items: updatedItems }));
    };

    const addItem = () => {
      if (!selectedProduct) return;

      const exists = trxDetails.items.find(
          (item) => item.productId === selectedProduct.productId
      );

      if (exists) {
          alert("Item already added");
          return;
      }

      setTrxDetails((prev) => ({
          ...prev,
          items: [
            ...prev.items,
            {
                productId: selectedProduct.productId,
                image: selectedProduct.image[0] ? selectedProduct.image[0] : "",
                name: selectedProduct.name,
                categoryName: selectedProduct.categoryName,
                brandName: selectedProduct.brandName,
                quantity: "",
                unit: selectedProduct.uomName,
                rate: selectedProduct.averageCost,
                amount: 0
            }
          ]
        }));

        setSelectedProduct(null);
        setShowProduct(false);
    };

    const removeItem = (index) => {
        const updatedItems = trxDetails.items.filter((_, i) => i !== index);
        setTrxDetails((prev) => ({ ...prev, items: updatedItems }));
    };


    const validateForm = () => {
        const newErrors = {};

        if (!trxDetails.trxDate)
            newErrors.trxDate = "Date is required";

        if (!trxDetails.referenceNumber)
            newErrors.referenceNumber = "Reference number is required";

        if (!trxDetails.locationFromId)
            newErrors.locationFromId = "From location is required";

        if (!trxDetails.locationToId)
            newErrors.locationToId = "To location is required";

        if (
            trxDetails.locationFromId &&
            trxDetails.locationToId &&
            trxDetails.locationFromId === trxDetails.locationToId
        ) {
            newErrors.locationToId =
            "From and To locations cannot be the same";
        }

        if (trxDetails.items.length === 0) {
            newErrors.items = "At least one item is required";
        } else {
            const hasInvalidItems = trxDetails.items.some(item =>
            !item.quantity ||
            isNaN(item.quantity) ||
            parseFloat(item.quantity) <= 0
            );

            if (hasInvalidItems) {
            newErrors.items = "Please correct item quantities";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);
        const toastId = toast.loading("GRN Submitting...");
        const trxType = "grn";
        let newTrxId = null;

        // ✅ await axios.post(...); 
        try {
            // 1️⃣ Add GRN 
            try {
                const grnData = {
                    transactionType: trxType,
                    transactionDate: trxDetails.trxDate,
                    locationId: trxDetails.locationFromId,
                    supplierCustomerId: trxDetails.supplierId,
                    description: trxDetails.referenceNumber,
                    isAdded: true,
                    totalAmount: trxDetails.trxTotal,
                    products : trxDetails.items.map(item => ({
                        productId: item.productId,
                        productName: item.name,
                        image: item.image,
                        quantity: parseFloat(item.quantity),
                        rate: parseFloat(item.rate),
                        amount: parseFloat(item.amount),
                        category: item.categoryName,
                        brand: item.brandName || "",
                        uom: item.unit,
                    }))
                }              
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/stockTransaction`, grnData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
                });
                newTrxId = res.data.trxId;
            }
            catch (err) {
                console.error("1️⃣❌ Failed to add GRN entry");

                if (err.response) {
                    console.error("Status:", err.response.status);
                    console.error("Backend message:", err.response.data?.message);
                    console.error("Backend error:", err.response.data?.error);
                } else {
                    console.error("Axios error:", err.message);
                }
            }
            


            // 2️⃣ Update stock
            try {
                const updates = trxDetails.items
                .map(d => ({
                    productId: d.productId,
                    locationId: trxDetails.locationFromId,
                    quantity: parseFloat(d.quantity) || 0
                }))
                .filter(u => u.quantity > 0);


                if (updates.length > 0) {
                    for (const u of updates) {
                        await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL}/api/products/${u.productFromId}/addStock`,
                            { locationFromId: u.locationId, quantity: u.quantity },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                    }
                }
            } catch (err) {
                console.error("2️⃣❌ Stock update failed:", err);
                toast.error("Failed to update stock. Please try again.");
            }

            // 3️⃣ Prepare supplier updates

            toast.success("✅ GRN submitted successfully!");

        } catch (err) {
            console.error("⚠️ Submit failed:", err);
            toast.error("Failed to submit invoice. Please try again.");        
            return;
        }
        
        // ✅ Submit successful
        setIsSubmitted(true);
        toast.dismiss(toastId);
        resetForm();
    };

    const resetForm = () => {
    setTrxDetails({
        supplierId: "",
        supplierName: "",
        supplierAddress: "",
        trxDate: new Date().toISOString().split("T")[0],
        referenceNumber: "",
        locationFromId: "",        // ✅ restore
        locationFromName: "Main Stores",
        locationToId: "",
        locationToName: "",
        trxTotal: 0,
        items: []
    });

    setSelectedProduct(null);
    setSelectedSupplier(null);
    setErrors({});
    setIsSubmitting(false);
    setIsSubmitted(false);
    };



    const handleCancel = () => {
        setSelectedProduct(null);
        setShowProduct(false);
    };

    const handleCancelSupplier = () => {
        setSelectedSupplier(null);
        setShowSuppliers(false);
    };

    const addSupplier = () => {
        if (!selectedSupplier) {
            alert("Please select a supplier.");
            return;
        }
        setTrxDetails((prev) => ({
            ...prev,
            supplierId: selectedSupplier.supplierId,
            supplierName: selectedSupplier.name,
            supplierAddress: selectedSupplier.address
        }));
        setShowSuppliers(false);
    };

    return (
        <div className="w-full h-full bg-gray-100 p-6 rounded shadow">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">📝 Stock Transfers</h1>
                    <p className="text-sm text-gray-600">Transfer inventory between locations</p>
                </div>

                <div className="w-[50%] flex justify-end gap-4">              
                    {/* Add Item */}
                    <button
                        onClick={() => {
                            setSelectedProduct(null);
                            setShowProduct(true);
                        }}
                        className="mr-20 px-6 py-2 text-sm font-medium shadow rounded-md shadow cursor-pointer bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                        + Add Item
                    </button>

                    <button
                        type="button"
                        disabled={isSubmitting || isSubmitted}
                        onClick={handleSubmit}
                        className="px-6 py-2 text-sm font-medium shadow bg-green-600 text-white rounded
                                    hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
                        >
                        {isSubmitting
                            ? "Submitting..."
                            : isSubmitted
                            ? "Submitted"
                            : "Submit GRN"}
                    </button>



                    <button 
                        onClick={()=> window.history.back()} 
                        className="px-10 py-2 text-sm font-medium rounded-md shadow cursor-pointer bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancel
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-1 w-full bg-gray-300 mb-4">
            </div>

            <div>
                {/* GRN Info */}
                <div className="flex justify-between gap-6 mb-6">
                    {/* Date */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium">GRN Date</label>
                        <input
                          type="date"
                          value={trxDetails.trxDate}
                          onChange={(e) => setTrxDetails({ ...trxDetails, trxDate: e.target.value })}
                          className={`text-sm w-[125px] p-2 border rounded ${errors.trxDate ? "border-red-500" : ""}`}
                        />
                        {errors.trxDate && <p className="text-red-500 text-xs">{errors.trxDate}</p>}
                    </div>

                    {/* Invoice */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium">Referece Number</label>
                        <input
                          type="text"
                          value={trxDetails.referenceNumber}
                          onChange={(e) => setTrxDetails({ ...trxDetails, referenceNumber: e.target.value })}
                          className={`text-sm w-[150px] p-2 border rounded ${errors.referenceNumber ? "border-red-500" : ""}`}
                        />
                        {errors.referenceNumber && <p className="text-red-500 text-xs">{errors.referenceNumber}</p>}
                    </div>     

                    {/* From Location */}
                    <div>
                        <div className="flex justify-start gap-1">
                            <label className="text-sm font-medium"> Location From</label>
                        </div>

                        <div className={`h-10 w-[350px] p-1 flex flex-col border rounded ${errors.supplierName ? "border-red-500" : "border-gray-400"}`}>

                            <div className="flex items-center gap-2">
                                <select
                                    value={trxDetails.locationFromId}
                                    disabled={isFromLocationLocked}
                                    onChange={(e) => {
                                        const selectedLocation = locations.find(
                                        loc => loc.locationId === e.target.value
                                        );

                                        setTrxDetails({
                                        ...trxDetails,
                                        locationFromId: e.target.value,
                                        locationFromName: selectedLocation.locationName
                                        });
                                    }}
                                    className={`w-full p-2 text-sm text-gray-700 
                                        ${isFromLocationLocked ? "bg-gray-200 cursor-not-allowed" : ""}`}
                                    >
                                    <option value="">Select Location</option>
                                    {locations.map((loc) => (
                                        <option key={loc.locationId} value={loc.locationId}>
                                        {loc.locationName}
                                        </option>
                                    ))}
                                </select>

                            </div>              
                        </div>
                        {errors.locationFromName && <p className="text-red-500 text-xs">{errors.locationFromName}</p>}
                    </div>  

                    {/* Location To */}
                    <div>
                        <div className="flex justify-start gap-1">
                            <label className="text-sm font-medium"> Location To</label>
                        </div>

                        <div className={`h-10 w-[350px] p-1 flex flex-col border rounded ${errors.warehouseName ? "border-red-500" : "border-gray-400"}`}>

                            <div className="flex items-center gap-2">
                                <select
                                    value={trxDetails.locationToId}
                                    onChange={(e) => {
                                        const selectedLocation = locations.find(loc => loc.locationId === e.target.value);
                                        setTrxDetails({ ...trxDetails, locationToId: e.target.value, locationToName: selectedLocation.locationName });
                                    }}
                                    className={`w-full p-2 text-sm text-gray-700`}
                                >
                                    <option value="">Select Location</option>
                                    {locations.map((loc) => (
                                    <option key={loc.locationId} value={loc.locationId}>
                                        {loc.locationName}
                                    </option>
                                    ))}
                                </select>
                            </div>              
                        </div>
                        {errors.locationToId && <p className="text-red-500 text-xs">{errors.locationToId}</p>}
                    </div>                  
                </div>
            </div>

            {/* Main Section */}
            <div className="flex justify-between">

                {/* Items List */}
                <div className="w-full bg-white p-4 rounded shadow overflow-y-auto h-[400px] max-h-[400px]">
                    <h2 className="text-xl font-semibold mb-4">Items</h2>
                    {errors.items && <p className="text-red-500 text-sm mb-2">{errors.items}</p>}
                    {trxDetails.items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between border-b py-2"
                    >
                        <img
                            src={item.image}
                            alt="product"
                            className="w-14 h-14 object-cover rounded"
                        />

                        <div className="flex-1 px-4">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.categoryName}</p>
                        <p className="text-xs text-gray-500">{item.brandName} | {item.productId}</p>
                        </div>
                            <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity ?? ""}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            className="w-20 p-1 text-sm border rounded"
                            />

                            <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate ?? ""}
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                            className="w-20 p-1 text-sm border rounded ml-2"
                            />

                        {/* <span className="ml-2 text-sm font-medium">Rs. {item.amount.toFixed(2)}</span> */}
                        <span className="ml-2 text-sm font-medium">Rs. {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

                        <button
                        onClick={() => removeItem(index)}
                        className="ml-4 text-red-600 hover:text-white border border-red-600 rounded p-1 hover:bg-red-600"
                        >
                        <FaTrash />
                        </button>
                    </div>
                    ))}
                </div>
            </div>


            {/* Totals */}
            <div className="mt-4 flex justify-end">
                <div className="w-[250px] flex flex-col gap-2 pr-4">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total: </span>
                        <span>{trxDetails.trxTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>No. of Items: </span>
                        <span>{trxDetails.items.length}</span>
                    </div>
                </div>
            </div>

         

            {/* Modals */}
            {showProduct && (
                <div className="fixed inset-0 bg-[#00000050] bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded w-[500px]">
                        <h2 className="text-lg font-semibold mb-4">Select Product</h2>
                        <ProductSelector onSelect={handleProductSelect} />
                        {selectedProduct && (
                            <div className="mt-4 text-sm">
                            <p><strong>ID:</strong> {selectedProduct.productId}</p>
                            <p><strong>Name:</strong> {selectedProduct.name}</p>
                            <p><strong>Category:</strong> {selectedProduct.categoryName}</p>
                            <p><strong>Brand:</strong> {selectedProduct.brandName}</p>
                            <p><strong>UOM:</strong> {selectedProduct.uomName}</p>
                            <p><strong>Price:</strong> Rs. {selectedProduct.price}</p>
                            </div>
                        )}
                        <div className="mt-4 flex gap-2">
                            <button onClick={addItem} className="bg-blue-600 text-white px-4 py-1 rounded">Select</button>
                            <button onClick={handleCancel} className="bg-gray-200 px-4 py-1 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}