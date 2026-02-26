import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { Search, ShoppingBasket } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

import ProductSelector from "../../components/productSelector";
import CustomerSelector from "../../components/customerSelector";

export default function InvoicePage() {
  const token = localStorage.getItem("token");

  const [trxDetails, setTrxDetails] = useState({
    customerId: "",
    businessName: "",
    address: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    locationId: "",
    locationName: "",
    trxTotal: 0,
    items: [],
  });

  const [locations, setLocations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProduct, setShowProduct] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= FETCH LOCATIONS ================= */
  useEffect(() => {
    const fetchLocations = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/locations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const normalized = (res.data.data || res.data).map(l => ({
        id: String(l.locationId || l.locationId),
        name: l.name || l.locationName,
      }));

      setLocations(normalized);
    };

    fetchLocations();
  }, []);

  /* ================= TOTAL ================= */
  useEffect(() => {
    const total = trxDetails.items.reduce(
      (sum, i) => sum + (parseFloat(i.amount) || 0),
      0
    );
    setTrxDetails(prev => ({ ...prev, trxTotal: total }));
  }, [trxDetails.items]);

  /* ================= ITEMS ================= */
    const addItem = () => {
    if (!selectedProduct) return;

    const exists = trxDetails.items.some(
        i => i.productId === selectedProduct.productId
    );
    if (exists) {
        toast.error("Item already added");
        return;
    }

    // Get stock for the selected warehouse
    const stockAtLocation = selectedProduct.stock?.find(
        s => s.locationId === trxDetails.locationId
    )?.quantity || 0;

    setTrxDetails(prev => ({
        ...prev,
        items: [
        ...prev.items,
        {
            productId: selectedProduct.productId,
            name: selectedProduct.name,
            image: selectedProduct.image?.[0] || "",
            categoryName: selectedProduct.categoryName,
            brandName: selectedProduct.brandName,
            unit: selectedProduct.uomName,
            availableStock: stockAtLocation,
            quantity: "",
            rate: selectedProduct.distributorPrice || 0,
            amount: 0,
        },
        ],
    }));

    setSelectedProduct(null);
    setShowProduct(false);
    };

  const handleItemChange = (index, field, value) => {
    const items = [...trxDetails.items];
    items[index][field] = value;

    const qty = parseFloat(items[index].quantity) || 0;
    const rate = parseFloat(items[index].rate) || 0;
    items[index].amount = qty * rate;

    setTrxDetails(prev => ({ ...prev, items }));
  };

  const removeItem = index => {
    setTrxDetails(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  /* ================= CUSTOMER ================= */
  const addCustomer = () => {
    if (!selectedCustomer) return;

    setTrxDetails(prev => ({
      ...prev,
      customerId: selectedCustomer.customerId,
      businessName: selectedCustomer.businessName,
      address: selectedCustomer.address?.join(", "),
    }));

    setShowCustomers(false);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!trxDetails.invoiceDate) return toast.error("Invoice date is required");
    if (!trxDetails.invoiceNumber) return toast.error("Invoice number is required");
    if (!trxDetails.customerId) return toast.error("Select a customer");
    if (!trxDetails.locationId) return toast.error("Select a warehouse");
    if (trxDetails.items.length === 0) return toast.error("Add at least one item");

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting invoice...");

    try {
      const trxData = {
        transactionType: "invoice",
        transactionDate: trxDetails.invoiceDate,
        locationId: trxDetails.locationId,
        supplierCustomerId: trxDetails.customerId,
        description: trxDetails.invoiceNumber,
        isAdded: false,
        totalAmount: trxDetails.trxTotal,
        items: trxDetails.items.map(item => ({
          productId: item.productId,
          productName: item.name,
          image: item.image,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
          category: item.categoryName,
          brand: item.brandName || "",
          uom: item.unit,
        })),
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/stockTransaction`,
        trxData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const trxId = res.data?.trxId;

      // 🔽 Update stock (reduce)
      for (const item of trxDetails.items) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/${item.productId}/reduceStock`,
          {
            locationId: trxDetails.locationId,
            quantity: Number(item.quantity),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 🔽 Add Customer Balance
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/customer/${trxDetails.customerId}/addBalance`,
        { amount: trxDetails.trxTotal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      

      toast.success("Invoice submitted successfully");
      
      // resetForm(); // optional
    } catch (err) {
      console.error("Invoice submit failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Submit failed");
    } finally {
      toast.dismiss(toastId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="sticky top-0 z-20 bg-gray-100 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShoppingBasket className="text-blue-600" />
              Sales Invoice
            </h1>
            <p className="text-sm text-gray-500">
              Create and manage customer invoices
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ================= FORM ================= */}
      <div className="grid grid-cols-4 gap-6 mb-6">

        {/* Invoice Info */}
        <div className="bg-white p-4 rounded-xl shadow border">
          <label className="text-sm font-medium">Invoice Date</label>
          <input
            type="date"
            value={trxDetails.invoiceDate}
            onChange={e =>
              setTrxDetails({ ...trxDetails, invoiceDate: e.target.value })
            }
            className="mt-1 w-full p-2 border rounded-lg"
          />

          <label className="text-sm font-medium mt-3 block">
            Invoice Number
          </label>
          <input
            value={trxDetails.invoiceNumber}
            onChange={e =>
              setTrxDetails({ ...trxDetails, invoiceNumber: e.target.value })
            }
            className="mt-1 w-full p-2 border rounded-lg"
          />
        </div>

        {/* Customer */}
        <div className="bg-white p-4 rounded-xl shadow border col-span-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Customer</label>
            <Search
              onClick={() => setShowCustomers(true)}
              className="w-5 h-5 text-blue-600 cursor-pointer"
            />
          </div>

          {trxDetails.businessName ? (
            <>
              <p className="font-medium">{trxDetails.businessName}</p>
              <p className="text-xs text-gray-500">{trxDetails.address}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No customer selected</p>
          )}
        </div>

        {/* Warehouse */}
        <div className="bg-white p-4 rounded-xl shadow border">
          <label className="text-sm font-medium">Warehouse</label>
          <select
            value={trxDetails.locationId}
            disabled={trxDetails.items.length > 0}
            onChange={e => {
              const loc = locations.find(l => l.id === e.target.value);
              setTrxDetails({
                ...trxDetails,
                locationId: e.target.value,
                locationName: loc?.name || "",
              });
            }}
            className="mt-1 w-full p-2 border rounded-lg disabled:bg-gray-100"
          >
            <option value="">Select warehouse</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= ITEMS ================= */}
      <div className="bg-white rounded-xl shadow border p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Items</h2>
            <button
                onClick={() => setShowProduct(true)}
                disabled={!trxDetails.locationId}
                className={`px-3 py-1 rounded-lg bg-blue-600 text-white
                    ${!trxDetails.locationId
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 active:bg-blue-800"}
                `}
                >
                + Add Item
            </button>
        </div>

        <div className="grid grid-cols-5 gap-4 text-xs font-semibold border-b pb-2">
            {/* <span>Image</span> */}
            <span>Product</span>
            <span>Qty</span>
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span></span>
        </div>

        {trxDetails.items.map((item, index) => (
        <div
            key={item.productId}
            className="grid grid-cols-5 gap-4 items-center py-2 border-b hover:bg-gray-50"
        >
            {/* Product Image */}
            <div className="flex flex-row gap-2">
            <div className="flex justify-left">
                {item.image ? (
                    <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded border"
                    />
                ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded border">
                    No Image
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div>
                <p className="text-sm font-medium leading-tight">{item.name}</p>
                <p className="text-xs text-gray-500">
                    {item.brandName} | {item.unit}
                </p>
                <p className="text-xs text-gray-500">
                    Stock: {item.availableStock}
                </p>
            </div>
            </div>

            {/* Quantity */}
            <input
                type="number"
                value={item.quantity}
                onChange={e =>
                    handleItemChange(index, "quantity", e.target.value)
                }
                className="p-1 border rounded text-right"
            />

            {/* Rate */}
            <input
                type="number"
                value={item.rate}
                onChange={e =>
                    handleItemChange(index, "rate", e.target.value)
                }
                className="p-1 border rounded text-right"
            />

            {/* Amount */}
            <span className="font-semibold text-right">
                Rs. {item.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </span>

            {/* Delete */}
            <button
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-white hover:bg-red-600 rounded p-2"
                title="Remove item"
                >
                <FaTrash />
            </button>
        </div>
        ))}
      </div>

      {/* ================= TOTAL ================= */}
      <div className="mt-4 flex justify-end">
        <div className="bg-white p-4 rounded-xl shadow border w-[250px]">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-700">
              Rs. {trxDetails.trxTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {showProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <ProductSelector onSelect={setSelectedProduct} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={addItem} className="bg-blue-600 text-white px-4 py-1 rounded">
                Select
              </button>
              <button onClick={() => setShowProduct(false)} className="px-4 py-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomers && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <CustomerSelector onSelect={setSelectedCustomer} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={addCustomer} className="bg-blue-600 text-white px-4 py-1 rounded">
                Select
              </button>
              <button onClick={() => setShowCustomers(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}